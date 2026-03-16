#!/usr/bin/env bash
set -euo pipefail

show_help() {
  cat <<'EOF'
Deploy WiSave UI to a remote OrbStack host over SSH.

Usage:
  ./scripts/deploy-orbstack.sh [options]

Options:
  --host HOST              Remote host or IP address (default: 192.168.1.100)
  --user USER              SSH user (default: server)
  --port PORT              SSH port (default: 22)
  --dir DIR                Remote deployment directory (default: ~/apps/wisave-ui)
  --app-port PORT          Public app port on the remote host (default: 4200)
  --api-base-url URL       API base URL injected into the container
  --help                   Show this help

Environment variable fallbacks:
  DEPLOY_HOST
  DEPLOY_USER
  DEPLOY_PORT
  DEPLOY_DIR
  APP_PORT
  CONTAINER_NAME
  API_BASE_URL
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

DEPLOY_HOST="${DEPLOY_HOST:-192.168.1.100}"
DEPLOY_USER="${DEPLOY_USER:-server}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"
DEPLOY_DIR="${DEPLOY_DIR:-~/apps/wisave-ui}"
APP_PORT="${APP_PORT:-4200}"
CONTAINER_NAME="${CONTAINER_NAME:-wisave-ui}"
API_BASE_URL="${API_BASE_URL:-http://localhost:5100/api}"

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
    --app-port)
      APP_PORT="$2"
      shift 2
      ;;
    --api-base-url)
      API_BASE_URL="$2"
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
SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
PUBLIC_URL="http://${DEPLOY_HOST}:${APP_PORT}"
TMP_DIR="$(mktemp -d -t wisave-ui-deploy)"
TMP_ARCHIVE="${TMP_DIR}/wisave-ui-deploy.tar.gz"
REMOTE_ARCHIVE="/tmp/wisave-ui-deploy-${DEPLOY_USER}-$$.tar.gz"
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

ssh "${SSH_OPTIONS[@]}" -MNf "${SSH_TARGET}"

ssh "${SSH_OPTIONS[@]}" "${SSH_TARGET}" "bash -s" -- "${DEPLOY_DIR}" "${APP_PORT}" "${CONTAINER_NAME}" <<'EOF'
set -euo pipefail

deploy_dir="$1"
app_port="$2"
container_name="$3"
expanded_deploy_dir="${deploy_dir/#\~/$HOME}"
parent_dir="$(dirname "${expanded_deploy_dir}")"

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

published_container="$("${DOCKER_BIN}" ps --filter "publish=${app_port}" --format '{{.Names}}' | head -n 1)"

if [[ -n "${published_container}" && "${published_container}" != "${container_name}" ]]; then
  echo "Remote port ${app_port} is already used by another container: ${published_container}" >&2
  exit 1
fi

if [[ -z "${published_container}" ]] && command -v lsof >/dev/null 2>&1; then
  if lsof -nP -iTCP:"${app_port}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Remote port ${app_port} is already occupied by a non-target process." >&2
    lsof -nP -iTCP:"${app_port}" -sTCP:LISTEN >&2 || true
    exit 1
  fi
fi

if [[ -n "${published_container}" ]]; then
  echo "Remote port ${app_port} is occupied by previous ${container_name} container. Deployment will replace it."
fi

mkdir -p "${parent_dir}"
rm -rf "${expanded_deploy_dir}"
mkdir -p "${expanded_deploy_dir}"
EOF

tar \
  --exclude='.git' \
  --exclude='.idea' \
  --exclude='.vscode' \
  --exclude='.angular' \
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

ssh "${SSH_OPTIONS[@]}" "${SSH_TARGET}" "bash -s" -- "${DEPLOY_DIR}" "${API_BASE_URL}" "${CONTAINER_NAME}" "${REMOTE_ARCHIVE}" <<'EOF'
set -euo pipefail

deploy_dir="$1"
api_base_url="$2"
container_name="$3"
remote_archive="$4"
expanded_deploy_dir="${deploy_dir/#\~/$HOME}"

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

if ! "${DOCKER_BIN}" compose version >/dev/null 2>&1; then
  echo "Remote docker CLI does not provide 'docker compose'." >&2
  exit 1
fi

if "${DOCKER_BIN}" ps -a --format '{{.Names}}' | grep -Fx "${container_name}" >/dev/null 2>&1; then
  "${DOCKER_BIN}" rm -f "${container_name}" >/dev/null
fi

API_BASE_URL="${api_base_url}" "${DOCKER_BIN}" compose up -d --build --remove-orphans
"${DOCKER_BIN}" compose ps
EOF

echo "Deployment finished."
