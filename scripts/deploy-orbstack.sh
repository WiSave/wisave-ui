#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Deploy WiSave UI to a remote OrbStack host over SSH.

Usage:
  bash scripts/deploy-orbstack.sh [options]

Options:
  --host HOST                  Remote host or IP address (default: 192.168.1.100)
  --user USER                  SSH user (default: server)
  --port PORT                  SSH port (default: 22)
  --dir DIR                    Remote deployment directory (default: ~/apps/wisave-ui)
  --api-base-url URL           Frontend runtime API base URL (default: /api)
  --backend-upstream URL       Backend origin proxied internally by NGINX (default: disabled)
  --tunnel-token-file PATH     Local file containing the Cloudflare Tunnel token (default: ./.cloudflared-token)
  --help                       Show this help

Environment variable fallbacks:
  DEPLOY_HOST
  DEPLOY_USER
  DEPLOY_PORT
  DEPLOY_DIR
  API_BASE_URL
  BACKEND_UPSTREAM
  CLOUDFLARE_TUNNEL_TOKEN_FILE
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "Missing required file: $1" >&2
    exit 1
  fi
}

DEPLOY_HOST="${DEPLOY_HOST:-192.168.1.100}"
DEPLOY_USER="${DEPLOY_USER:-server}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DIR="${DEPLOY_DIR:-~/apps/wisave-ui}"
API_BASE_URL="${API_BASE_URL:-/api}"
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-}"
CLOUDFLARE_TUNNEL_TOKEN_FILE="${CLOUDFLARE_TUNNEL_TOKEN_FILE:-}"
EMPTY_BACKEND_SENTINEL="__WISAVE_EMPTY_BACKEND__"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      DEPLOY_HOST="$2"
      shift 2
      ;;
    --user)
      DEPLOY_USER="$2"
      shift 2
      ;;
    --port)
      DEPLOY_PORT="$2"
      shift 2
      ;;
    --dir)
      DEPLOY_DIR="$2"
      shift 2
      ;;
    --api-base-url)
      API_BASE_URL="$2"
      shift 2
      ;;
    --backend-upstream)
      BACKEND_UPSTREAM="$2"
      shift 2
      ;;
    --tunnel-token-file)
      CLOUDFLARE_TUNNEL_TOKEN_FILE="$2"
      shift 2
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo >&2
      show_help >&2
      exit 1
      ;;
  esac
done

require_command ssh
require_command scp
require_command tar

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [[ -z "${CLOUDFLARE_TUNNEL_TOKEN_FILE}" ]]; then
  CLOUDFLARE_TUNNEL_TOKEN_FILE="${ROOT_DIR}/.cloudflared-token"
fi

require_file "${CLOUDFLARE_TUNNEL_TOKEN_FILE}"

SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
PUBLIC_URL="https://wisave.app"
TMP_DIR="$(mktemp -d -t wisave-ui-deploy)"
TMP_ARCHIVE="${TMP_DIR}/wisave-ui-deploy.tar.gz"
REMOTE_ARCHIVE="/tmp/wisave-ui-deploy-${DEPLOY_USER}-$$.tar.gz"
REMOTE_TOKEN_FILE="/tmp/wisave-ui-token-${DEPLOY_USER}-$$"
SSH_CONTROL_SOCKET="/tmp/wisave-ui-ssh-%C"
SSH_OPTIONS=(
  -p "${DEPLOY_PORT}"
  -o ControlMaster=auto
  -o ControlPersist=10m
  -o ControlPath="${SSH_CONTROL_SOCKET}"
)
SCP_OPTIONS=(
  -P "${DEPLOY_PORT}"
  -o ControlMaster=auto
  -o ControlPersist=10m
  -o ControlPath="${SSH_CONTROL_SOCKET}"
)

cleanup() {
  ssh "${SSH_OPTIONS[@]}" -O exit "${SSH_TARGET}" >/dev/null 2>&1 || true
  rm -rf "${TMP_DIR}"
}

trap cleanup EXIT

echo "Deploying to ${SSH_TARGET}:${DEPLOY_DIR}"
echo "Expected public URL: ${PUBLIC_URL}"
echo "Using API_BASE_URL=${API_BASE_URL}"
echo "Using BACKEND_UPSTREAM=${BACKEND_UPSTREAM}"

ssh "${SSH_OPTIONS[@]}" -MNf "${SSH_TARGET}"

ssh "${SSH_OPTIONS[@]}" "${SSH_TARGET}" "bash -s" -- "${DEPLOY_DIR}" <<'EOF'
set -euo pipefail

deploy_dir="$1"
expanded_deploy_dir="${deploy_dir/#\~/$HOME}"
parent_dir="$(dirname "${expanded_deploy_dir}")"

mkdir -p "${parent_dir}"
rm -rf "${expanded_deploy_dir}"
mkdir -p "${expanded_deploy_dir}"
EOF

tar \
  --exclude='.git' \
  --exclude='.idea' \
  --exclude='.vscode' \
  --exclude='.angular' \
  --exclude='.cloudflared-token' \
  --exclude='coverage' \
  --exclude='dist' \
  --exclude='node_modules' \
  --exclude='storybook-static' \
  --exclude='tmp' \
  --exclude='.DS_Store' \
  -czf "${TMP_ARCHIVE}" \
  -C "${ROOT_DIR}" \
  .

scp "${SCP_OPTIONS[@]}" -q "${TMP_ARCHIVE}" "${SSH_TARGET}:${REMOTE_ARCHIVE}"
scp "${SCP_OPTIONS[@]}" -q "${CLOUDFLARE_TUNNEL_TOKEN_FILE}" "${SSH_TARGET}:${REMOTE_TOKEN_FILE}"

remote_backend_upstream="${BACKEND_UPSTREAM}"
if [[ -z "${remote_backend_upstream}" ]]; then
  remote_backend_upstream="${EMPTY_BACKEND_SENTINEL}"
fi

ssh "${SSH_OPTIONS[@]}" "${SSH_TARGET}" "bash -s" -- "${DEPLOY_DIR}" "${API_BASE_URL}" "${remote_backend_upstream}" "${REMOTE_ARCHIVE}" "${REMOTE_TOKEN_FILE}" <<'EOF'
set -euo pipefail

deploy_dir="$1"
api_base_url="$2"
backend_upstream="$3"
remote_archive="$4"
remote_token_file="$5"
expanded_deploy_dir="${deploy_dir/#\~/$HOME}"

if [[ "${backend_upstream}" == "__WISAVE_EMPTY_BACKEND__" ]]; then
  backend_upstream=""
fi

export PATH="$HOME/.orbstack/bin:/Applications/OrbStack.app/Contents/MacOS/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

find_docker_bin() {
  local candidate

  for candidate in \
    "${HOME}/.orbstack/bin/docker" \
    "/Applications/OrbStack.app/Contents/MacOS/bin/docker" \
    "/opt/homebrew/bin/docker" \
    "/usr/local/bin/docker" \
    "docker"
  do
    if command -v "${candidate}" >/dev/null 2>&1; then
      command -v "${candidate}"
      return 0
    fi
  done

  return 1
}

if ! DOCKER_BIN="$(find_docker_bin)"; then
  echo "Remote host does not expose docker in standard OrbStack/macOS locations." >&2
  exit 1
fi

cd "${expanded_deploy_dir}"
tar -xzf "${remote_archive}" -C "${expanded_deploy_dir}"
rm -f "${remote_archive}"
install -m 600 "${remote_token_file}" "${expanded_deploy_dir}/.cloudflared-token"
rm -f "${remote_token_file}"

if ! "${DOCKER_BIN}" compose version >/dev/null 2>&1; then
  echo "Remote docker CLI does not provide 'docker compose'." >&2
  exit 1
fi

API_BASE_URL="${api_base_url}" \
BACKEND_UPSTREAM="${backend_upstream}" \
"${DOCKER_BIN}" compose up -d --build --remove-orphans

"${DOCKER_BIN}" compose ps
EOF

echo "Deployment finished."
