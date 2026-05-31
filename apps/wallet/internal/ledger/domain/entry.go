package domain

import "time"

// Direction of a ledger entry in the double-entry journal.
type Direction string

const (
	Debit  Direction = "DEBIT"
	Credit Direction = "CREDIT"
)

// Entry is an immutable double-entry journal record.
// Balance is always derived from the sum of entries, never edited in place.
type Entry struct {
	IdempotencyKey string
	PlayerID       PlayerID
	Direction      Direction
	Amount         Amount
	Reference      string
	CreatedAt      time.Time
}
