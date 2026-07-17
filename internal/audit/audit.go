package audit

import (
	"context"
	"log/slog"
	"time"
)

type Record struct {
	Timestamp      time.Time      `json:"timestamp"`
	WorkspaceID    string         `json:"workspace_id,omitempty"`
	AgentID        string         `json:"agent_id,omitempty"`
	ToolID         string         `json:"tool_id,omitempty"`
	Tool           string         `json:"tool"`
	Action         string         `json:"action,omitempty"`
	PayloadSummary map[string]any `json:"payload_summary,omitempty"`
	Request        map[string]any `json:"request,omitempty"`
	Response       map[string]any `json:"response,omitempty"`
	Decision       string         `json:"decision"`
	DecidedBy      string         `json:"decided_by,omitempty"`
	LatencyMS      int64          `json:"latency_ms,omitempty"`
}

type Writer interface {
	Write(context.Context, Record) error
}

type Logger struct {
	slog  *slog.Logger
	store Writer
}

func NewLogger(logger *slog.Logger, store Writer) *Logger {
	return &Logger{slog: logger, store: store}
}

func (l *Logger) Write(ctx context.Context, record Record) {
	if record.Timestamp.IsZero() {
		record.Timestamp = time.Now().UTC()
	}
	if l.store != nil {
		if err := l.store.Write(ctx, record); err != nil {
			l.slog.Error("failed to persist audit log", "error", err)
		}
	}
	l.slog.Info("audit log", "tool", record.Tool, "workspace", record.WorkspaceID, "decision", record.Decision)
}
