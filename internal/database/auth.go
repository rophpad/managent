package database

import (
	"context"
	"fmt"
	"net/mail"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/rophpad/managent/internal/authz"
	"golang.org/x/crypto/bcrypt"
)

type UserRecord struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	CreatedAt time.Time `json:"createdAt"`
}

func (s *Store) CreateUser(ctx context.Context, email, password string) (UserRecord, error) {
	normalized, err := normalizeEmail(email)
	if err != nil {
		return UserRecord{}, err
	}
	if len(password) < 8 {
		return UserRecord{}, fmt.Errorf("password must be at least 8 characters")
	}
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return UserRecord{}, err
	}
	var (
		id        int64
		createdAt time.Time
	)
	if err := s.pool.QueryRow(ctx, `
		insert into users (email, password_hash)
		values ($1, $2)
		returning id, created_at
	`, normalized, string(passwordHash)).Scan(&id, &createdAt); err != nil {
		return UserRecord{}, err
	}
	return UserRecord{ID: fmt.Sprintf("%d", id), Email: normalized, CreatedAt: createdAt}, nil
}

func (s *Store) AuthenticateUser(ctx context.Context, email, password string) (UserRecord, error) {
	normalized, err := normalizeEmail(email)
	if err != nil {
		return UserRecord{}, err
	}
	var (
		id           int64
		passwordHash string
		createdAt    time.Time
	)
	if err := s.pool.QueryRow(ctx, `
		select id, password_hash, created_at
		from users
		where email = $1
	`, normalized).Scan(&id, &passwordHash, &createdAt); err != nil {
		if err == pgx.ErrNoRows {
			return UserRecord{}, fmt.Errorf("invalid email or password")
		}
		return UserRecord{}, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return UserRecord{}, fmt.Errorf("invalid email or password")
	}
	return UserRecord{ID: fmt.Sprintf("%d", id), Email: normalized, CreatedAt: createdAt}, nil
}

func (s *Store) CreateUserSession(ctx context.Context, userID string, duration time.Duration) (string, time.Time, error) {
	if duration <= 0 {
		duration = 7 * 24 * time.Hour
	}
	parsedUserID, err := strconv.ParseInt(userID, 10, 64)
	if err != nil {
		return "", time.Time{}, err
	}
	token, err := authz.GenerateSessionToken()
	if err != nil {
		return "", time.Time{}, err
	}
	expiresAt := time.Now().UTC().Add(duration)
	if _, err := s.pool.Exec(ctx, `
		insert into user_sessions (user_id, token_hash, expires_at)
		values ($1, $2, $3)
	`, parsedUserID, authz.HashKey(token), expiresAt); err != nil {
		return "", time.Time{}, err
	}
	return token, expiresAt, nil
}

func (s *Store) ValidateUserSession(ctx context.Context, rawToken string) (UserRecord, bool, error) {
	var (
		id        int64
		email     string
		createdAt time.Time
	)
	if err := s.pool.QueryRow(ctx, `
		select u.id, u.email, u.created_at
		from user_sessions us
		join users u on u.id = us.user_id
		where us.token_hash = $1 and us.expires_at > now()
	`, authz.HashKey(rawToken)).Scan(&id, &email, &createdAt); err != nil {
		if err == pgx.ErrNoRows {
			return UserRecord{}, false, nil
		}
		return UserRecord{}, false, err
	}
	_, _ = s.pool.Exec(ctx, `update user_sessions set last_used_at = now() where token_hash = $1`, authz.HashKey(rawToken))
	return UserRecord{ID: fmt.Sprintf("%d", id), Email: email, CreatedAt: createdAt}, true, nil
}

func normalizeEmail(email string) (string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return "", fmt.Errorf("email is required")
	}
	parsed, err := mail.ParseAddress(email)
	if err != nil {
		return "", fmt.Errorf("invalid email")
	}
	return strings.ToLower(parsed.Address), nil
}
