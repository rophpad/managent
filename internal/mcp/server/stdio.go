package server

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

type StdioServer struct {
	handler *Handler
	logger  *slog.Logger
}

func NewStdioServer(handler *Handler, logger *slog.Logger) *StdioServer {
	return &StdioServer{handler: handler, logger: logger}
}

func (s *StdioServer) Serve(ctx context.Context, stdin io.Reader, stdout io.Writer) error {
	scanner := bufio.NewScanner(stdin)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	writer := bufio.NewWriter(stdout)
	defer writer.Flush()

	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		var req protocol.Request
		if err := json.Unmarshal(scanner.Bytes(), &req); err != nil {
			if err := writeLine(writer, protocol.Response{JSONRPC: "2.0", Error: &protocol.Error{Code: protocol.ErrParseError, Message: err.Error()}}); err != nil {
				return err
			}
			continue
		}

		resp, notification := s.handler.Process(ctx, &req)
		if notification {
			continue
		}
		if err := writeLine(writer, *resp); err != nil {
			return err
		}
	}

	if err := scanner.Err(); err != nil {
		s.logger.Error("stdio server scan failed", "error", err)
		return err
	}
	return nil
}

func writeLine(writer *bufio.Writer, resp protocol.Response) error {
	payload, err := json.Marshal(resp)
	if err != nil {
		return err
	}
	if _, err := fmt.Fprintf(writer, "%s\n", payload); err != nil {
		return err
	}
	return writer.Flush()
}
