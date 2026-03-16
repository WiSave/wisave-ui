FROM node:22-alpine AS build

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

RUN corepack enable && yarn install --immutable

COPY . .

RUN yarn build

FROM nginx:1.29.6-alpine-slim

WORKDIR /usr/share/nginx/html

RUN apk upgrade --no-cache

COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/entrypoint/40-env-config.sh /docker-entrypoint.d/40-env-config.sh
COPY --from=build /app/dist/WiSaveUI/browser ./

RUN chmod +x /docker-entrypoint.d/40-env-config.sh

ENV API_BASE_URL=http://localhost:5100/api

EXPOSE 80
