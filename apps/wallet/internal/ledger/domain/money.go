// Package domain holds the pure ledger model — no I/O, no framework imports.
// This is the heart of the wallet bounded context.
package domain

import "errors"

// ErrNegativeAmount is returned when an Amount would be negative.
var ErrNegativeAmount = errors.New("amount must not be negative")

// PlayerID is a branded identifier — distinct from any other string ID.
type PlayerID string

// Amount is a value object: integer minor units (testnet credits).
// Immutable; construct via NewAmount.
type Amount struct {
	minorUnits int64
}

// NewAmount constructs a non-negative Amount.
func NewAmount(minorUnits int64) (Amount, error) {
	if minorUnits < 0 {
		return Amount{}, ErrNegativeAmount
	}
	return Amount{minorUnits: minorUnits}, nil
}

// MinorUnits returns the raw integer value.
func (a Amount) MinorUnits() int64 { return a.minorUnits }

// Add returns a new Amount; the receiver is unchanged.
func (a Amount) Add(b Amount) Amount { return Amount{minorUnits: a.minorUnits + b.minorUnits} }

// Sub returns a new Amount, erroring if the result would be negative.
func (a Amount) Sub(b Amount) (Amount, error) {
	return NewAmount(a.minorUnits - b.minorUnits)
}
