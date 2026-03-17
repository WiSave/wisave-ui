# WiSave UI

Extracted Angular frontend from the `wisave` modular monolith. This copy is intended to be the first step toward a separate UI deployable that can later sit in front of microservices.

## Current repo analysis

- Backend architecture in the source solution is already a modular monolith with separated modules and a single bootstrapper host.
- The frontend is self-contained in the original `ui/` workspace.
- The main coupling found during extraction was a hardcoded API URL for the incomes endpoints.

## Local development

```bash
corepack enable
yarn install
yarn start
```

The app runs on `http://localhost:4200`.

By default it calls the backend at `http://localhost:5100/api`.

## Docker

Docker now uses Cloudflare Tunnel as the public entrypoint for `wisave.app`, which works behind CGNAT and does not require inbound port forwarding. The backend stays private on your LAN and is reverse-proxied internally by NGINX under `/api`.

Create a local tunnel token file first:

```bash
printf '%s' 'your-token' > .cloudflared-token
chmod 600 .cloudflared-token
```

```bash
docker compose up --build
```

Expected public URL:
- `https://wisave.app`

By default:
- frontend runtime API base URL inside the container is `/api`
- NGINX returns `404` for `/api/*` until `BACKEND_UPSTREAM` is set
- `cloudflared` connects outbound to Cloudflare and publishes the app without exposing local ports

You can point the internal reverse proxy at another backend without rebuilding:

```bash
BACKEND_UPSTREAM=http://192.168.1.50:5100 docker compose up --build
```

## Remote OrbStack deploy

The repository includes a deployment script for a remote Mac running OrbStack over SSH.

Default target:
- Host: `192.168.1.100`
- User: `server`
- Remote dir: `~/apps/wisave-ui`
- Public URL: `https://wisave.app`

Example:

```bash
bash scripts/deploy-orbstack.sh --backend-upstream http://192.168.1.50:5100
```

The script:
- uploads the repository to the remote Mac
- rebuilds the Docker image there
- starts the stack with `docker compose up -d --build`

You can override defaults with flags or environment variables:

```bash
DEPLOY_HOST=192.168.1.100 \
API_BASE_URL=/api \
BACKEND_UPSTREAM=http://192.168.1.50:5100 \
CLOUDFLARE_TUNNEL_TOKEN_FILE=.cloudflared-token \
bash scripts/deploy-orbstack.sh
```

Cloudflare requirements outside the repo:
1. Add `wisave.app` to Cloudflare and switch the domain to Cloudflare nameservers at Name.com.
2. Create a remote-managed Cloudflare Tunnel.
3. Add public hostnames in the Cloudflare Zero Trust dashboard:
   - `wisave.app` -> `wisave-ui:80`
4. Save the tunnel token to `.cloudflared-token` and keep that file out of git.

This setup does not require:
- public IPv4 on your router
- port forwarding on `80/443`
- direct exposure of the OrbStack host to the internet
- a separate public `api.wisave.app` hostname for the backend

## Runtime config

The frontend reads its backend base URL from `window.__env.API_BASE_URL`, served from `/env.js`.

- Local default: `http://localhost:5100/api`
- Docker default: `/api`
- Recommended public deployment: keep the backend disabled by default and only enable the internal `/api` reverse proxy when `BACKEND_UPSTREAM` is explicitly set
