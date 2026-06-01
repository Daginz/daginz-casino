#!/usr/bin/env bash
# Start a Hardhat node, wait until it answers, deploy the contracts once, then
# keep the node running in the foreground (it owns PID 1 so the container lives).
set -euo pipefail

echo "[hardhat] starting node on 0.0.0.0:8545…"
npx hardhat node --hostname 0.0.0.0 --port 8545 &
NODE_PID=$!

# Wait for the JSON-RPC to accept connections.
echo "[hardhat] waiting for RPC…"
for i in $(seq 1 60); do
  if curl -s -X POST http://127.0.0.1:8545 \
      -H 'content-type: application/json' \
      -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
      | grep -q '"result"'; then
    echo "[hardhat] RPC up after ${i}s"
    break
  fi
  sleep 1
done

# Deploy once. On a fresh chain the addresses are deterministic; if the node was
# restarted with persisted state the deploy is idempotent enough for a dev demo.
echo "[hardhat] deploying contracts…"
npx hardhat run scripts/deploy.ts --network localhost || {
  echo "[hardhat] deploy failed" >&2
  exit 1
}
echo "[hardhat] deploy complete — node staying up"

# Hand the node process the foreground so the container stays alive.
wait "$NODE_PID"
