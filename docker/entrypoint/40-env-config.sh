#!/bin/sh
set -eu

cat <<EOF >/usr/share/nginx/html/env.js
window.__env = {
  API_BASE_URL: "${API_BASE_URL:-http://localhost:5100/api}"
};
EOF
