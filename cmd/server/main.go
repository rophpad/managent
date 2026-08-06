package main

import (
	"context"
	"log/slog"
	"os"

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

	if err := runtime.ServeStdio(context.Background(), os.Stdin, os.Stdout); err != nil {
		runtime.Logger().Error("stdio server exited", "error", err)
		os.Exit(1)
	}
}
