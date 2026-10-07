package database

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/rophpad/managent/internal/authz"
)

func (s *Store) ListAgents(ctx context.Context, workspaceID int64) ([]AgentRecord, error) {
	rows, err := s.pool.Query(ctx, `
		select id, workspace_id, name, owner, tags, status, created_at, last_seen_at
		from agents
		where workspace_id = $1
		order by created_at desc
	`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]AgentRecord, 0)
	for rows.Next() {
		var (
			id, wsID      int64
			name, owner   string
			tagsRaw       []byte
			status        string
			createdAt     time.Time
			lastSeenAtRaw sql.NullTime
		)
		if err := rows.Scan(&id, &wsID, &name, &owner, &tagsRaw, &status, &createdAt, &lastSeenAtRaw); err != nil {
			return nil, err
		}
		tags, err := decodeTags(tagsRaw)
		if err != nil {
			return nil, err
		}
		record := AgentRecord{
			ID:          strconv.FormatInt(id, 10),
			WorkspaceID: strconv.FormatInt(wsID, 10),
			Name:        name,
			Owner:       owner,
			Tags:        tags,
			Status:      status,
			CreatedAt:   createdAt,
		}
		if lastSeenAtRaw.Valid {
			record.LastSeenAt = &lastSeenAtRaw.Time
		}
		out = append(out, record)
	}
	return out, rows.Err()
}

func (s *Store) GetAgent(ctx context.Context, workspaceID int64, id string) (AgentRecord, error) {
	agentID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return AgentRecord{}, err
	}
	var (
		name, owner string
		tagsRaw     []byte
		status      string
		createdAt   time.Time
		lastSeenAt  sql.NullTime
	)
	if err := s.pool.QueryRow(ctx, `
		select name, owner, tags, status, created_at, last_seen_at
		from agents
		where workspace_id = $1 and id = $2
	`, workspaceID, agentID).Scan(&name, &owner, &tagsRaw, &status, &createdAt, &lastSeenAt); err != nil {
		return AgentRecord{}, err
	}
	tags, err := decodeTags(tagsRaw)
	if err != nil {
		return AgentRecord{}, err
	}
	record := AgentRecord{
		ID:          id,
		WorkspaceID: strconv.FormatInt(workspaceID, 10),
		Name:        name,
		Owner:       owner,
		Tags:        tags,
		Status:      status,
		CreatedAt:   createdAt,
	}
	if lastSeenAt.Valid {
		record.LastSeenAt = &lastSeenAt.Time
	}
	return record, nil
}

func (s *Store) CreateAgent(ctx context.Context, workspaceID int64, name, owner string, tags []string) (AgentCreateResult, error) {
	rawToken, err := authz.GenerateAPIKey()
	if err != nil {
		return AgentCreateResult{}, err
	}
	last4 := rawToken
	if len(last4) > 4 {
		last4 = last4[len(last4)-4:]
	}
	tagsJSON, err := json.Marshal(normalizeTags(tags))
	if err != nil {
		return AgentCreateResult{}, err
	}
	result := AgentCreateResult{}
	err = withTx(ctx, s.pool, func(tx pgx.Tx) error {
		var agentID int64
		var createdAt time.Time
		if err := tx.QueryRow(ctx, `
			insert into agents (workspace_id, name, owner, tags, status)
			values ($1, $2, $3, $4, 'active')
			returning id, created_at
		`, workspaceID, strings.TrimSpace(name), strings.TrimSpace(owner), tagsJSON).Scan(&agentID, &createdAt); err != nil {
			return err
		}
		var keyID int64
		var keyCreatedAt time.Time
		if err := tx.QueryRow(ctx, `
			insert into agent_keys (agent_id, hash, last4, status)
			values ($1, $2, $3, 'active')
			returning id, created_at
		`, agentID, authz.HashKey(rawToken), last4).Scan(&keyID, &keyCreatedAt); err != nil {
			return err
		}
		result = AgentCreateResult{
			Agent: AgentRecord{
				ID:          strconv.FormatInt(agentID, 10),
				WorkspaceID: strconv.FormatInt(workspaceID, 10),
				Name:        strings.TrimSpace(name),
				Owner:       strings.TrimSpace(owner),
				Tags:        normalizeTags(tags),
				Status:      "active",
				CreatedAt:   createdAt,
			},
			Key: AgentKeyRecord{
				ID:        strconv.FormatInt(keyID, 10),
				AgentID:   strconv.FormatInt(agentID, 10),
				Last4:     last4,
				Status:    "active",
				CreatedAt: keyCreatedAt,
			},
			RawToken: rawToken,
		}
		return nil
	})
	return result, err
}

func (s *Store) ListAgentKeys(ctx context.Context, workspaceID int64, agentID string) ([]AgentKeyRecord, error) {
	parsedAgentID, err := strconv.ParseInt(agentID, 10, 64)
	if err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `
		select ak.id, ak.agent_id, ak.last4, ak.status, ak.created_at, ak.revoked_at
		from agent_keys ak
		join agents a on a.id = ak.agent_id
		where a.workspace_id = $1 and ak.agent_id = $2
		order by ak.created_at desc
	`, workspaceID, parsedAgentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]AgentKeyRecord, 0)
	for rows.Next() {
		var (
			id, agentRef  int64
			last4, status string
			createdAt     time.Time
			revokedAt     sql.NullTime
		)
		if err := rows.Scan(&id, &agentRef, &last4, &status, &createdAt, &revokedAt); err != nil {
			return nil, err
		}
		record := AgentKeyRecord{
			ID:        strconv.FormatInt(id, 10),
			AgentID:   strconv.FormatInt(agentRef, 10),
			Last4:     last4,
			Status:    status,
			CreatedAt: createdAt,
		}
		if revokedAt.Valid {
			record.RevokedAt = &revokedAt.Time
		}
		out = append(out, record)
	}
	return out, rows.Err()
}

func (s *Store) CreateAgentKey(ctx context.Context, workspaceID int64, agentID string) (AgentKeyRecord, string, error) {
	parsedAgentID, err := strconv.ParseInt(agentID, 10, 64)
	if err != nil {
		return AgentKeyRecord{}, "", err
	}
	var exists bool
	if err := s.pool.QueryRow(ctx, `select exists(select 1 from agents where id = $1 and workspace_id = $2)`, parsedAgentID, workspaceID).Scan(&exists); err != nil {
		return AgentKeyRecord{}, "", err
	}
	if !exists {
		return AgentKeyRecord{}, "", pgx.ErrNoRows
	}
	rawToken, err := authz.GenerateAPIKey()
	if err != nil {
		return AgentKeyRecord{}, "", err
	}
	last4 := rawToken[len(rawToken)-4:]
	var id int64
	var createdAt time.Time
	if err := s.pool.QueryRow(ctx, `
		insert into agent_keys (agent_id, hash, last4, status)
		values ($1, $2, $3, 'active')
		returning id, created_at
	`, parsedAgentID, authz.HashKey(rawToken), last4).Scan(&id, &createdAt); err != nil {
		return AgentKeyRecord{}, "", err
	}
	return AgentKeyRecord{
		ID:        strconv.FormatInt(id, 10),
		AgentID:   agentID,
		Last4:     last4,
		Status:    "active",
		CreatedAt: createdAt,
	}, rawToken, nil
}

func (s *Store) RevokeAgentKey(ctx context.Context, workspaceID int64, agentID, keyID string) error {
	return s.updateAgentKeyStatus(ctx, workspaceID, agentID, keyID, "revoked")
}

func (s *Store) RotateAgentKey(ctx context.Context, workspaceID int64, agentID, keyID string) (AgentKeyRecord, string, error) {
	if err := s.RevokeAgentKey(ctx, workspaceID, agentID, keyID); err != nil {
		return AgentKeyRecord{}, "", err
	}
	return s.CreateAgentKey(ctx, workspaceID, agentID)
}

func (s *Store) UpdateAgentStatus(ctx context.Context, workspaceID int64, agentID, status string) error {
	parsedAgentID, err := strconv.ParseInt(agentID, 10, 64)
	if err != nil {
		return err
	}
	if _, err := s.pool.Exec(ctx, `
		update agents set status = $3 where workspace_id = $1 and id = $2
	`, workspaceID, parsedAgentID, status); err != nil {
		return err
	}
	if status == "suspended" || status == "revoked" {
		_, err = s.pool.Exec(ctx, `
			update agent_keys set status = 'revoked', revoked_at = now()
			where agent_id = $1 and status = 'active'
		`, parsedAgentID)
	}
	return err
}

func (s *Store) updateAgentKeyStatus(ctx context.Context, workspaceID int64, agentID, keyID, status string) error {
	parsedAgentID, err := strconv.ParseInt(agentID, 10, 64)
	if err != nil {
		return err
	}
	parsedKeyID, err := strconv.ParseInt(keyID, 10, 64)
	if err != nil {
		return err
	}
	commandTag, err := s.pool.Exec(ctx, `
		update agent_keys ak
		set status = $4, revoked_at = case when $4 = 'revoked' then now() else revoked_at end
		from agents a
		where ak.id = $2 and ak.agent_id = $3 and a.id = ak.agent_id and a.workspace_id = $1
	`, workspaceID, parsedKeyID, parsedAgentID, status)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return fmt.Errorf("agent key not found")
	}
	return nil
}

func decodeTags(raw []byte) ([]string, error) {
	if len(raw) == 0 {
		return []string{}, nil
	}
	var tags []string
	if err := json.Unmarshal(raw, &tags); err != nil {
		return nil, err
	}
	if tags == nil {
		return []string{}, nil
	}
	return tags, nil
}

func normalizeTags(tags []string) []string {
	set := make(map[string]struct{}, len(tags))
	out := make([]string, 0, len(tags))
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		if _, ok := set[tag]; ok {
			continue
		}
		set[tag] = struct{}{}
		out = append(out, tag)
	}
	return out
}
