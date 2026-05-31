package domain

import "errors"

// Sentinel errors for matchable ledger conditions (errors.Is at the boundary).
var (
	ErrAccountNotFound  = errors.New("account not found")
	ErrInsufficientFund = errors.New("insufficient funds")
	ErrDuplicateOp      = errors.New("duplicate idempotency key")
)
