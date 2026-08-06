package database

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
)

var dashboardKinds = map[string]bool{
	"agent": true, "resource": true, "policy": true, "audit-entry": true,
}

func validDashboardKind(kind string) error {
	if !dashboardKinds[kind] {
		return fmt.Errorf("unsupported dashboard entity kind %q", kind)
	}
	return nil
}

func (s *Store) ListDashboardEntities(ctx context.Context, workspaceID int64, kind string) ([]json.RawMessage, error) {
	if err := validDashboardKind(kind); err != nil {
		return nil, err
	}
	rows, err := s.pool.Query(ctx, `select document from dashboard_entities where workspace_id=$1 and kind=$2 order by created_at, id`, workspaceID, kind)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]json.RawMessage, 0)
	for rows.Next() {
		var item json.RawMessage
		if err := rows.Scan(&item); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) GetDashboardEntity(ctx context.Context, workspaceID int64, kind, id string) (json.RawMessage, error) {
	if err := validDashboardKind(kind); err != nil {
		return nil, err
	}
	var item json.RawMessage
	err := s.pool.QueryRow(ctx, `select document from dashboard_entities where workspace_id=$1 and kind=$2 and id=$3`, workspaceID, kind, id).Scan(&item)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return item, err
}

func (s *Store) PutDashboardEntity(ctx context.Context, workspaceID int64, kind, id string, document json.RawMessage) (json.RawMessage, error) {
	if err := validDashboardKind(kind); err != nil {
		return nil, err
	}
	if strings.TrimSpace(id) == "" {
		return nil, errors.New("id is required")
	}
	if !json.Valid(document) {
		return nil, errors.New("document must be valid JSON")
	}
	_, err := s.pool.Exec(ctx, `
        insert into dashboard_entities (workspace_id, kind, id, document)
        values ($1,$2,$3,$4)
        on conflict (workspace_id,kind,id) do update set document=excluded.document, updated_at=now()
    `, workspaceID, kind, id, document)
	if err != nil {
		return nil, err
	}
	return s.GetDashboardEntity(ctx, workspaceID, kind, id)
}

func (s *Store) DeleteDashboardEntity(ctx context.Context, workspaceID int64, kind, id string) (bool, error) {
	if err := validDashboardKind(kind); err != nil {
		return false, err
	}
	result, err := s.pool.Exec(ctx, `delete from dashboard_entities where workspace_id=$1 and kind=$2 and id=$3`, workspaceID, kind, id)
	return result.RowsAffected() > 0, err
}

type dashboardAgentGrant struct {
	GatewayAgentID string `json:"gatewayAgentId"`
	Name           string `json:"name"`
	Scopes         []struct {
		ResourceID string `json:"resourceId"`
		Permission string `json:"permission"`
	} `json:"scopes"`
}

// AgentHasToolPermission checks the persisted dashboard grant on every call.
// The federated tool name is <resource namespace>.<permission>.
func (s *Store) AgentHasToolPermission(ctx context.Context, agentID, agentName, tool string) (bool, string, error) {
	separator := strings.Index(tool, ".")
	if separator <= 0 || separator == len(tool)-1 {
		return false, "tool is not associated with a resource", nil
	}
	namespace, permission := tool[:separator], tool[separator+1:]

	rows, err := s.pool.Query(ctx, `select document from dashboard_entities where kind='agent' and workspace_id=(select workspace_id from agents where id=$1)`, agentID)
	if err != nil {
		return false, "", err
	}
	defer rows.Close()

	var grant *dashboardAgentGrant
	for rows.Next() {
		var raw json.RawMessage
		if err := rows.Scan(&raw); err != nil {
			return false, "", err
		}
		var candidate dashboardAgentGrant
		if err := json.Unmarshal(raw, &candidate); err != nil {
			return false, "", err
		}
		if candidate.GatewayAgentID == agentID ||
			(candidate.GatewayAgentID == "" && strings.EqualFold(strings.TrimSpace(candidate.Name), strings.TrimSpace(agentName))) {
			grant = &candidate
			break
		}
	}
	if err := rows.Err(); err != nil {
		return false, "", err
	}
	if grant == nil {
		return false, "agent has no dashboard permission record", nil
	}

	resourceID := namespace
	var resourceRaw json.RawMessage
	err = s.pool.QueryRow(ctx, `
		select de.document
		from dashboard_entities de
		left join mcps m
		  on m.workspace_id = de.workspace_id
		 and lower(coalesce(nullif(m.configuration->>'namespace', ''), m.name)) = lower($2)
		where de.kind='resource'
		  and de.workspace_id=(select workspace_id from agents where id=$1)
		  and (
		    lower(de.id)=lower($2)
		    or lower(de.document->>'name')=lower($2)
		    or lower(coalesce(de.document->>'runtimeNamespace', ''))=lower($2)
		    or (
		      m.id is not null
		      and coalesce(de.document->>'command', '') <> ''
		      and de.document->>'command' in (m.endpoint, m.configuration->>'command', m.configuration->>'url')
		    )
		  )
		limit 1
	`, agentID, namespace).Scan(&resourceRaw)
	if err == nil {
		var resource struct {
			ID string `json:"id"`
		}
		if json.Unmarshal(resourceRaw, &resource) == nil && resource.ID != "" {
			resourceID = resource.ID
		}
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return false, "", err
	}

	for _, scope := range grant.Scopes {
		if strings.EqualFold(scope.ResourceID, resourceID) &&
			(scope.Permission == "*" || strings.EqualFold(scope.Permission, permission)) {
			return true, "permission granted", nil
		}
	}
	return false, fmt.Sprintf("%s is not granted on %s", permission, resourceID), nil
}
