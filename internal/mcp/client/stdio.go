package client

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"os/exec"
	"sync"
	"sync/atomic"

	"github.com/rophpad/managent/internal/mcp/protocol"
)

type StdioClient struct {
	cmd    string
	args   []string
	env    map[string]string
	logger *slog.Logger

	mu      sync.Mutex
	proc    *exec.Cmd
	stdin   io.WriteCloser
	scanner *bufio.Scanner

	nextID  atomic.Int64
	pending map[int64]chan *protocol.Response
	pendMu  sync.Mutex
}

func NewStdio(cmd string, args []string, env map[string]string, logger *slog.Logger) *StdioClient {
	return &StdioClient{
		cmd:     cmd,
		args:    args,
		env:     env,
		logger:  logger,
		pending: make(map[int64]chan *protocol.Response),
	}
}

func (c *StdioClient) Initialize(ctx context.Context) error {
	c.mu.Lock()
	if c.proc != nil {
		c.mu.Unlock()
		return nil
	}

	proc := exec.CommandContext(ctx, c.cmd, c.args...)
	proc.Env = os.Environ()
	for key, value := range c.env {
		proc.Env = append(proc.Env, key+"="+value)
	}
	stdin, err := proc.StdinPipe()
	if err != nil {
		c.mu.Unlock()
		return fmt.Errorf("stdin pipe: %w", err)
	}
	stdout, err := proc.StdoutPipe()
	if err != nil {
		c.mu.Unlock()
		return fmt.Errorf("stdout pipe: %w", err)
	}
	proc.Stderr = os.Stderr
	if err := proc.Start(); err != nil {
		c.mu.Unlock()
		return fmt.Errorf("start process: %w", err)
	}

	scanner := bufio.NewScanner(stdout)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)

	c.proc = proc
	c.stdin = stdin
	c.scanner = scanner
	c.mu.Unlock()

	go c.readLoop()

	_, err = c.call(ctx, protocol.MethodInitialize, protocol.InitializeParams{
		ProtocolVersion: "2024-11-05",
		Capabilities:    map[string]any{},
		ClientInfo:      protocol.ClientInfo{Name: "managent", Version: "0.1.0"},
	})
	if err != nil {
		_ = c.Close()
		return err
	}
	return nil
}

func (c *StdioClient) ListTools(ctx context.Context) ([]protocol.Tool, error) {
	resp, err := c.call(ctx, protocol.MethodToolsList, map[string]any{})
	if err != nil {
		return nil, err
	}
	raw, _ := json.Marshal(resp)
	var result protocol.ToolsListResult
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, fmt.Errorf("decode tools: %w", err)
	}
	return result.Tools, nil
}

func (c *StdioClient) CallTool(ctx context.Context, req protocol.ToolCallParams) (*protocol.ToolCallResult, error) {
	resp, err := c.call(ctx, protocol.MethodToolsCall, req)
	if err != nil {
		return nil, err
	}
	raw, _ := json.Marshal(resp)
	var result protocol.ToolCallResult
	if err := json.Unmarshal(raw, &result); err != nil {
		return nil, fmt.Errorf("decode tool result: %w", err)
	}
	return &result, nil
}

func (c *StdioClient) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.stdin != nil {
		_ = c.stdin.Close()
	}
	if c.proc != nil {
		err := c.proc.Wait()
		c.proc = nil
		c.stdin = nil
		c.scanner = nil
		return err
	}
	return nil
}

func (c *StdioClient) call(ctx context.Context, method string, params any) (any, error) {
	id := c.nextID.Add(1)
	ch := make(chan *protocol.Response, 1)

	c.pendMu.Lock()
	c.pending[id] = ch
	c.pendMu.Unlock()
	defer func() {
		c.pendMu.Lock()
		delete(c.pending, id)
		c.pendMu.Unlock()
	}()

	line, err := json.Marshal(protocol.Request{JSONRPC: "2.0", ID: id, Method: method, Params: params})
	if err != nil {
		return nil, err
	}

	c.mu.Lock()
	_, err = fmt.Fprintf(c.stdin, "%s\n", line)
	c.mu.Unlock()
	if err != nil {
		return nil, fmt.Errorf("write to subprocess: %w", err)
	}

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	case resp := <-ch:
		if resp == nil {
			return nil, fmt.Errorf("stdio client closed")
		}
		if resp.Error != nil {
			return nil, fmt.Errorf("mcp error %d: %s", resp.Error.Code, resp.Error.Message)
		}
		return resp.Result, nil
	}
}

func (c *StdioClient) readLoop() {
	for c.scanner.Scan() {
		var resp protocol.Response
		if err := json.Unmarshal(c.scanner.Bytes(), &resp); err != nil {
			c.logger.Warn("received unreadable stdio payload", "raw", string(c.scanner.Bytes()))
			continue
		}
		id, ok := normalizeID(resp.ID)
		if !ok {
			continue
		}
		c.pendMu.Lock()
		ch := c.pending[id]
		c.pendMu.Unlock()
		if ch != nil {
			ch <- &resp
		}
	}

	if err := c.scanner.Err(); err != nil {
		c.logger.Warn("stdio client read loop exited", "error", err)
	}

	c.pendMu.Lock()
	for _, ch := range c.pending {
		close(ch)
	}
	c.pending = make(map[int64]chan *protocol.Response)
	c.pendMu.Unlock()
}

func normalizeID(id any) (int64, bool) {
	switch value := id.(type) {
	case float64:
		return int64(value), true
	case int64:
		return value, true
	case int:
		return int64(value), true
	default:
		return 0, false
	}
}
