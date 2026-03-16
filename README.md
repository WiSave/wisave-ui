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

```bash
docker compose up --build
```

The container serves the app on `http://localhost:4200`.

You can point the UI at another backend without rebuilding:

```bash
API_BASE_URL=http://localhost:5100/api docker compose up --build
```

## Remote OrbStack deploy

The repository includes a deployment script for a remote Mac running OrbStack over SSH.

Default target:
- Host: `192.168.1.100`
- User: `server`
- Remote dir: `~/apps/wisave-ui`
- Public URL: `http://192.168.1.100:4200`

Example:

```bash
./scripts/deploy-orbstack.sh --api-base-url http://192.168.1.50:5100/api
```

The script:
- uploads the repository to the remote Mac
- checks whether remote port `4200` is free or already used by the previous `wisave-ui` container
- rebuilds the Docker image there
- starts the stack with `docker compose up -d --build`

You can override defaults with flags or environment variables:

```bash
DEPLOY_HOST=192.168.1.100 \
API_BASE_URL=http://192.168.1.50:5100/api \
./scripts/deploy-orbstack.sh
```

## Runtime config

The frontend reads its backend base URL from `window.__env.API_BASE_URL`, served from `/env.js`.

- Local default: `http://localhost:5100/api`
- Docker default: `http://localhost:5100/api`
- Kubernetes-ready: override `API_BASE_URL` with an environment-specific public backend URL
