package gateway

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/rophpad/managent/internal/config"
)

type Server struct {
	cfg    *config.Config
	logger *slog.Logger
	http   *http.Server
	mux    *http.ServeMux
}

func New(cfg *config.Config, logger *slog.Logger) *Server {
	mux := http.NewServeMux()
	s := &Server{
		cfg:    cfg,
		logger: logger,
		mux:    mux,
		http: &http.Server{
			Addr:         cfg.Gateway.Addr(),
			Handler:      mux,
			ReadTimeout:  30 * time.Second,
			WriteTimeout: 30 * time.Second,
			IdleTimeout:  120 * time.Second,
		},
	}
	s.registerRoutes()
	return s
}

func (s *Server) registerRoutes() {
	s.mux.HandleFunc("/health", s.handleHealth)
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"status":"ok","service":"managent-gateway"}`)
}

func (s *Server) RegisterHandler(pattern string, handler http.Handler) {
	s.mux.Handle(pattern, handler)
}

func (s *Server) Start() error {
	s.logger.Info("Starting Managent Gateway", "addr", s.cfg.Gateway.Addr())
	if err := s.http.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("http server error: %w", err)
	}
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("Shutting down gateway")
	return s.http.Shutdown(ctx)
}
