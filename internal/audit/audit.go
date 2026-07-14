package audit

import (
	"context"
	"log/slog"
	"time"
)

type Record struct {
	Timestamp   time.Time      `json:"timestamp"`
	WorkspaceID string         `json:"workspace_id,omitempty"`
	Tool        string         `json:"tool"`
	Request     map[string]any `json:"request,omitempty"`
	Response    map[string]any `json:"response,omitempty"`
	Decision    string         `json:"decision"`
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
