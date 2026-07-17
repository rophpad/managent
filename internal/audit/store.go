package audit

import (
	"context"

	"github.com/rophpad/managent/internal/database"
)

type Store struct {
	db *database.Store
}

func NewStore(db *database.Store) *Store {
	return &Store{db: db}
}

func (s *Store) Write(ctx context.Context, record Record) error {
	return s.db.CreateAuditLog(ctx, database.AuditLogRecord{
		WorkspaceID:    record.WorkspaceID,
		AgentID:        record.AgentID,
		ToolID:         record.ToolID,
		Tool:           record.Tool,
		Action:         record.Action,
		PayloadSummary: record.PayloadSummary,
		Request:        record.Request,
		Response:       record.Response,
		Decision:       record.Decision,
		DecidedBy:      record.DecidedBy,
		LatencyMS:      record.LatencyMS,
		CreatedAt:      record.Timestamp,
	})
}
