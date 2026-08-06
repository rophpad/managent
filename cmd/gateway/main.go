package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rophpad/managent/internal/app"
	"github.com/rophpad/managent/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	runtime, err := app.New(context.Background(), cfg)
	if err != nil {
		slog.Error("failed to initialize runtime", "error", err)
		os.Exit(1)
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	serverErr := make(chan error, 1)
	go func() {
		serverErr <- runtime.StartHTTP()
	}()

	select {
	case err := <-serverErr:
		runtime.Logger().Error("gateway stopped", "error", err)
		os.Exit(1)
	case sig := <-stop:
		runtime.Logger().Info("received shutdown signal", "signal", sig.String())
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		if err := runtime.Shutdown(ctx); err != nil {
			runtime.Logger().Error("shutdown failed", "error", err)
			os.Exit(1)
		}
	}
}
