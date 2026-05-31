// Package clock provides a real Clock implementation of the app.Clock port.
package clock

import "time"

// System is a Clock backed by the wall clock.
type System struct{}

// Now returns the current UTC time.
func (System) Now() time.Time { return time.Now().UTC() }
