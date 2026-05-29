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

For local development, the frontend calls the backend through `/api`; `nx serve wisave-ui` uses the development proxy configuration to forward requests to the portal.

## Nx workspace topology

This repository is an Nx workspace.

- `apps/wisave-ui` contains the deployable Angular app shell, bootstrap/config, root routes, global styles, theme, and app-level tests.
- `apps/wisave-ui/public` contains browser assets copied into the app build.
- `libs/shared/*` contains cross-domain model and reusable UI primitives.
- `libs/platform/*` contains runtime platform services such as auth, config, shell/layout, and SignalR.
- Domain features are split by bounded area under `libs/<domain>/*`, for example `libs/expenses/*`, `libs/incomes/*`, `libs/stock/*`, `libs/settings/*`, and `libs/auth/feature`.
- Domains with multiple routed slices expose a shell library as the app-facing entry point. For expenses, the app imports `@wisave/expenses/shell`, and that shell composes `@wisave/expenses/list`, `@wisave/expenses/budget`, and `@wisave/expenses/accounts`.

Common workspace commands:

```bash
yarn lint   # run all Nx lint targets
yarn test   # run all Nx test targets
yarn build  # build the deployable wisave-ui app
```

`yarn build` writes the browser output to `dist/apps/wisave-ui/browser`, which is the path copied by the Docker image.

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

- Local default: `/api`
- Docker default: `/api`
- Recommended public deployment: keep the backend disabled by default and only enable the internal `/api` reverse proxy when `BACKEND_UPSTREAM` is explicitly set

## Antiforgery troubleshooting

If mutating requests return `400 Antiforgery token validation failed`, verify:

- `window.__env.API_BASE_URL` is `/api` or omitted so the runtime fallback resolves to `/api`
- the Angular dev server proxy is active
- `GET /api/auth/antiforgery-token` sets the `XSRF-TOKEN` cookie
- the browser sends `X-XSRF-TOKEN` on `POST`, `PUT`, `DELETE`, and `PATCH`

Angular does not send `X-XSRF-TOKEN` on `GET` requests, and it skips automatic XSRF header injection for absolute or cross-origin API URLs such as `http://localhost:5100/api`.

## Session storage requirements

The portal stores auth tickets server-side. For local development and deployment:

- Redis-backed ticket storage is the intended runtime configuration
- process-local in-memory ticket storage is acceptable only for tests or deliberate single-process local debugging
- if the portal falls back to process-local ticket storage and you restart the process or hop between instances, refresh can look like a logout because the cookie only contains a ticket key
