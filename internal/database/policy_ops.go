package database

import (
	"context"
	"strconv"

	"github.com/jackc/pgx/v5"
)

func (s *Store) ReorderPolicies(ctx context.Context, workspaceID int64, ids []string) error {
	return withTx(ctx, s.pool, func(tx pgx.Tx) error {
		for index, id := range ids {
			parsedID, err := strconv.ParseInt(id, 10, 64)
			if err != nil {
				return err
			}
			if _, err := tx.Exec(ctx, `
				update policies set precedence = $3
				where workspace_id = $1 and id = $2
			`, workspaceID, parsedID, index+1); err != nil {
				return err
			}
		}
		return nil
	})
}
