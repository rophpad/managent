package database

import (
	"context"
	"database/sql"
	"encoding/json"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
)

func (s *Store) ListApprovalIntegrations(ctx context.Context, workspaceID int64) ([]ApprovalIntegrationRecord, error) {
	rows, err := s.pool.Query(ctx, `
		select id, workspace_id, provider, status, coalesce(default_channel, ''), coalesce(credential_ref, ''), config, created_at, updated_at
		from approval_integrations
		where workspace_id = $1
		order by provider asc
	`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]ApprovalIntegrationRecord, 0)
	for rows.Next() {
		var (
			id, wsID int64
			provider, status, defaultChannel, credentialRef string
			configRaw []byte
			createdAt, updatedAt time.Time
		)
		if err := rows.Scan(&id, &wsID, &provider, &status, &defaultChannel, &credentialRef, &configRaw, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		config := map[string]any{}
		if len(configRaw) > 0 {
			_ = json.Unmarshal(configRaw, &config)
		}
		out = append(out, ApprovalIntegrationRecord{
			ID:             strconv.FormatInt(id, 10),
			WorkspaceID:    strconv.FormatInt(wsID, 10),
			Provider:       provider,
			Status:         status,
			DefaultChannel: defaultChannel,
			CredentialRef:  credentialRef,
			Config:         config,
			CreatedAt:      createdAt,
			UpdatedAt:      updatedAt,
		})
	}
	return out, rows.Err()
}

func (s *Store) UpsertApprovalIntegration(ctx context.Context, workspaceID int64, provider, defaultChannel string, config map[string]any, secrets map[string]string) (ApprovalIntegrationRecord, error) {
	configJSON, err := json.Marshal(config)
	if err != nil {
		return ApprovalIntegrationRecord{}, err
	}
	record := ApprovalIntegrationRecord{}
	err = withTx(ctx, s.pool, func(tx pgx.Tx) error {
		var id int64
		var createdAt, updatedAt time.Time
		credentialRef := "vault://approval/" + provider + "/access_token"
		if err := tx.QueryRow(ctx, `
			insert into approval_integrations (workspace_id, provider, status, default_channel, credential_ref, signing_secret_ref, config, updated_at)
			values ($1, $2, 'connected', nullif($3, ''), $4, 'vault://approval/' || $2 || '/signing_secret', $5, now())
			on conflict (workspace_id, provider)
			do update set status = 'connected', default_channel = excluded.default_channel, credential_ref = excluded.credential_ref, signing_secret_ref = excluded.signing_secret_ref, config = excluded.config, updated_at = now()
			returning id, created_at, updated_at
		`, workspaceID, provider, defaultChannel, credentialRef, configJSON).Scan(&id, &createdAt, &updatedAt); err != nil {
			return err
		}
		if err := s.replaceApprovalSecretsTx(ctx, tx, id, secrets); err != nil {
			return err
		}
		record = ApprovalIntegrationRecord{
			ID:             strconv.FormatInt(id, 10),
			WorkspaceID:    strconv.FormatInt(workspaceID, 10),
			Provider:       provider,
			Status:         "connected",
			DefaultChannel: defaultChannel,
			CredentialRef:  credentialRef,
			Config:         config,
			CreatedAt:      createdAt,
			UpdatedAt:      updatedAt,
		}
		return nil
	})
	return record, err
}

func (s *Store) GetApprovalIntegration(ctx context.Context, workspaceID int64, provider string) (ApprovalIntegrationRecord, map[string]string, error) {
	var (
		id int64
		status, defaultChannel, credentialRef string
		configRaw []byte
		createdAt, updatedAt time.Time
	)
	if err := s.pool.QueryRow(ctx, `
		select id, status, coalesce(default_channel, ''), coalesce(credential_ref, ''), config, created_at, updated_at
		from approval_integrations
		where workspace_id = $1 and provider = $2
	`, workspaceID, provider).Scan(&id, &status, &defaultChannel, &credentialRef, &configRaw, &createdAt, &updatedAt); err != nil {
		return ApprovalIntegrationRecord{}, nil, err
	}
	config := map[string]any{}
	if len(configRaw) > 0 {
		_ = json.Unmarshal(configRaw, &config)
	}
	secrets, err := s.listApprovalSecrets(ctx, id)
	if err != nil {
		return ApprovalIntegrationRecord{}, nil, err
	}
	return ApprovalIntegrationRecord{
		ID:             strconv.FormatInt(id, 10),
		WorkspaceID:    strconv.FormatInt(workspaceID, 10),
		Provider:       provider,
		Status:         status,
		DefaultChannel: defaultChannel,
		CredentialRef:  credentialRef,
		Config:         config,
		CreatedAt:      createdAt,
		UpdatedAt:      updatedAt,
	}, secrets, nil
}

func (s *Store) CreatePendingApproval(ctx context.Context, record PendingApprovalRecord) (PendingApprovalRecord, error) {
	workspaceID, err := strconv.ParseInt(record.WorkspaceID, 10, 64)
	if err != nil {
		return PendingApprovalRecord{}, err
	}
	agentID, err := strconv.ParseInt(record.AgentID, 10, 64)
	if err != nil {
		return PendingApprovalRecord{}, err
	}
	payloadJSON, err := json.Marshal(record.PayloadSummary)
	if err != nil {
		return PendingApprovalRecord{}, err
	}
	var id int64
	var requestedAt time.Time
	var decidedAt sql.NullTime
	if err := s.pool.QueryRow(ctx, `
		insert into pending_approvals (
			workspace_id, agent_id, tool_id, tool_name, action, payload_summary, policy_id, policy_name, channel, provider, status, decided_by, decision_reason, message_id, requested_at, decided_at
		) values ($1, $2, $3, $4, $5, $6, nullif($7, '')::bigint, nullif($8, ''), nullif($9, ''), nullif($10, ''), $11, nullif($12, ''), nullif($13, ''), nullif($14, ''), now(), null)
		returning id, requested_at, decided_at
	`, workspaceID, agentID, record.ToolID, record.ToolName, record.Action, payloadJSON, record.PolicyID, record.PolicyName, record.Channel, record.Provider, record.Status, record.DecidedBy, record.DecisionReason, record.MessageID).Scan(&id, &requestedAt, &decidedAt); err != nil {
		return PendingApprovalRecord{}, err
	}
	record.ID = strconv.FormatInt(id, 10)
	record.RequestedAt = requestedAt
	if decidedAt.Valid {
		record.DecidedAt = &decidedAt.Time
	}
	return record, nil
}

func (s *Store) UpdatePendingApproval(ctx context.Context, record PendingApprovalRecord) error {
	approvalID, err := strconv.ParseInt(record.ID, 10, 64)
	if err != nil {
		return err
	}
	_, err = s.pool.Exec(ctx, `
		update pending_approvals
		set provider = nullif($2, ''),
			channel = nullif($3, ''),
			message_id = nullif($4, ''),
			status = $5,
			decided_by = nullif($6, ''),
			decision_reason = nullif($7, ''),
			decided_at = $8
		where id = $1
	`, approvalID, record.Provider, record.Channel, record.MessageID, record.Status, record.DecidedBy, record.DecisionReason, record.DecidedAt)
	return err
}

func (s *Store) ResolvePendingApproval(ctx context.Context, id string, status, decidedBy, reason string) (PendingApprovalRecord, bool, error) {
	approvalID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return PendingApprovalRecord{}, false, err
	}
	now := time.Now().UTC()
	row := s.pool.QueryRow(ctx, `
		update pending_approvals
		set status = $2, decided_by = nullif($3, ''), decision_reason = nullif($4, ''), decided_at = $5
		where id = $1 and status = 'pending'
		returning workspace_id, agent_id, tool_id, tool_name, action, payload_summary, coalesce(policy_id::text, ''), coalesce(policy_name, ''), coalesce(channel, ''), coalesce(provider, ''), status, coalesce(decided_by, ''), coalesce(decision_reason, ''), coalesce(message_id, ''), requested_at, decided_at
	`, approvalID, status, decidedBy, reason, now)
	record, err := scanPendingApproval(row)
	if err == pgx.ErrNoRows {
		return PendingApprovalRecord{}, false, nil
	}
	return record, err == nil, err
}

func (s *Store) GetPendingApproval(ctx context.Context, id string) (PendingApprovalRecord, error) {
	approvalID, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		return PendingApprovalRecord{}, err
	}
	row := s.pool.QueryRow(ctx, `
		select workspace_id, agent_id, tool_id, tool_name, action, payload_summary, coalesce(policy_id::text, ''), coalesce(policy_name, ''), coalesce(channel, ''), coalesce(provider, ''), status, coalesce(decided_by, ''), coalesce(decision_reason, ''), coalesce(message_id, ''), requested_at, decided_at
		from pending_approvals
		where id = $1
	`, approvalID)
	record, err := scanPendingApproval(row)
	record.ID = id
	return record, err
}

type pendingScanner interface {
	Scan(dest ...any) error
}

func scanPendingApproval(row pendingScanner) (PendingApprovalRecord, error) {
	var (
		workspaceID, agentID int64
		toolID, toolName, action, policyID, policyName, channel, provider, status, decidedBy, decisionReason, messageID string
		payloadRaw []byte
		requestedAt time.Time
		decidedAt sql.NullTime
	)
	if err := row.Scan(&workspaceID, &agentID, &toolID, &toolName, &action, &payloadRaw, &policyID, &policyName, &channel, &provider, &status, &decidedBy, &decisionReason, &messageID, &requestedAt, &decidedAt); err != nil {
		return PendingApprovalRecord{}, err
	}
	payload := map[string]any{}
	if len(payloadRaw) > 0 {
		_ = json.Unmarshal(payloadRaw, &payload)
	}
	record := PendingApprovalRecord{
		WorkspaceID:    strconv.FormatInt(workspaceID, 10),
		AgentID:        strconv.FormatInt(agentID, 10),
		ToolID:         toolID,
		ToolName:       toolName,
		Action:         action,
		PayloadSummary: payload,
		PolicyID:       policyID,
		PolicyName:     policyName,
		Channel:        channel,
		Provider:       provider,
		Status:         status,
		DecidedBy:      decidedBy,
		DecisionReason: decisionReason,
		MessageID:      messageID,
		RequestedAt:    requestedAt,
	}
	if decidedAt.Valid {
		record.DecidedAt = &decidedAt.Time
	}
	return record, nil
}

func (s *Store) replaceApprovalSecretsTx(ctx context.Context, tx pgx.Tx, integrationID int64, values map[string]string) error {
	if _, err := tx.Exec(ctx, `delete from approval_integration_secrets where integration_id = $1`, integrationID); err != nil {
		return err
	}
	for key, value := range values {
		if value == "" {
			continue
		}
		encrypted, err := s.encrypt(value)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			insert into approval_integration_secrets (integration_id, name, value)
			values ($1, $2, $3)
		`, integrationID, key, encrypted); err != nil {
			return err
		}
	}
	return nil
}

func (s *Store) listApprovalSecrets(ctx context.Context, integrationID int64) (map[string]string, error) {
	rows, err := s.pool.Query(ctx, `select name, value from approval_integration_secrets where integration_id = $1`, integrationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make(map[string]string)
	for rows.Next() {
		var name, encrypted string
		if err := rows.Scan(&name, &encrypted); err != nil {
			return nil, err
		}
		value, err := s.decrypt(encrypted)
		if err != nil {
			return nil, err
		}
		out[name] = value
	}
	return out, rows.Err()
}
