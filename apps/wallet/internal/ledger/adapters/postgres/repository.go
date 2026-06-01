package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/casino/wallet/internal/ledger/domain"
)

// Repository is a pgx-backed LedgerRepository.
// It implements the domain.LedgerRepository port; the domain never sees pgx.
type Repository struct {
	pool *pgxpool.Pool
}

// New returns a Postgres ledger repository.
func New(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

// Balance derives a player's balance as SUM(credits) - SUM(debits), floored at 0.
func (r *Repository) Balance(ctx context.Context, playerID domain.PlayerID) (domain.Amount, error) {
	const q = `
		SELECT COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE -amount END), 0)
		FROM ledger_entries
		WHERE player_id = $1`
	var total int64
	if err := r.pool.QueryRow(ctx, q, string(playerID)).Scan(&total); err != nil {
		return domain.Amount{}, fmt.Errorf("querying balance: %w", err)
	}
	if total < 0 {
		total = 0
	}
	return domain.NewAmount(total)
}

// HasOp reports whether an idempotency key was already applied.
func (r *Repository) HasOp(ctx context.Context, idempotencyKey string) (bool, error) {
	const q = `SELECT EXISTS(SELECT 1 FROM ledger_entries WHERE idempotency_key = $1)`
	var exists bool
	if err := r.pool.QueryRow(ctx, q, idempotencyKey).Scan(&exists); err != nil {
		return false, fmt.Errorf("checking idempotency key: %w", err)
	}
	return exists, nil
}

// FindByKey returns the entry with the given idempotency key, if present.
func (r *Repository) FindByKey(ctx context.Context, idempotencyKey string) (domain.Entry, bool, error) {
	const q = `
		SELECT idempotency_key, player_id, direction, amount, reference, created_at
		FROM ledger_entries
		WHERE idempotency_key = $1`
	var (
		key, playerID, direction, reference string
		amount                              int64
		createdAt                           pgtype.Timestamptz
	)
	err := r.pool.QueryRow(ctx, q, idempotencyKey).Scan(&key, &playerID, &direction, &amount, &reference, &createdAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Entry{}, false, nil
	}
	if err != nil {
		return domain.Entry{}, false, fmt.Errorf("finding entry by key: %w", err)
	}
	amt, amtErr := domain.NewAmount(amount)
	if amtErr != nil {
		return domain.Entry{}, false, fmt.Errorf("mapping amount: %w", amtErr)
	}
	return domain.Entry{
		IdempotencyKey: key,
		PlayerID:       domain.PlayerID(playerID),
		Direction:      domain.Direction(direction),
		Amount:         amt,
		Reference:      reference,
		CreatedAt:      createdAt.Time,
	}, true, nil
}

// Append persists a new immutable entry. Maps a unique-violation to ErrDuplicateOp.
func (r *Repository) Append(ctx context.Context, e domain.Entry) error {
	const q = `
		INSERT INTO ledger_entries (idempotency_key, player_id, direction, amount, reference, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.pool.Exec(ctx, q,
		e.IdempotencyKey, string(e.PlayerID), string(e.Direction),
		e.Amount.MinorUnits(), e.Reference, e.CreatedAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return domain.ErrDuplicateOp
		}
		return fmt.Errorf("inserting ledger entry: %w", err)
	}
	return nil
}

// isUniqueViolation reports whether err is a Postgres unique_violation (23505).
func isUniqueViolation(err error) bool {
	var pgErr interface{ SQLState() string }
	if errors.As(err, &pgErr) {
		return pgErr.SQLState() == "23505"
	}
	return false
}

// Connect opens a pgx pool. Caller owns Close.
func Connect(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("opening pgx pool: %w", err)
	}
	if pingErr := pool.Ping(ctx); pingErr != nil {
		pool.Close()
		return nil, fmt.Errorf("pinging postgres: %w", pingErr)
	}
	return pool, nil
}
