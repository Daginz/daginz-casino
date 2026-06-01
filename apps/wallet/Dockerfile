# Go ledger service. Migrations are embedded in the binary (go:embed), so the
# final image needs nothing but the binary.
FROM golang:1.26-bookworm AS build
WORKDIR /src

# Cache deps first.
COPY apps/wallet/go.mod apps/wallet/go.sum ./
RUN go mod download

COPY apps/wallet/ ./
# Static build so it runs on a tiny base.
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/wallet ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/wallet /wallet
EXPOSE 4100
# DATABASE_URL / WALLET_PORT / WALLET_STORE come from compose env.
ENTRYPOINT ["/wallet"]
