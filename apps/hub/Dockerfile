FROM node:24 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update && apt-get install -y \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

FROM base AS dev
WORKDIR /app-dev
ENV NODE_ENV=development

FROM base AS prepare
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune hub effect todo_viewer --docker

FROM base AS builder
WORKDIR /app
ENV CI=true
COPY --from=prepare /app/out/json/ .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=prepare /app/out/full/ .
COPY --from=prepare /app/tsconfig.package-build.json ./
COPY --from=prepare /app/tsconfig.develop.json ./
RUN pnpm turbo build 
RUN mkdir -p /app/apps/hub/static && cp -r /app/apps/todo_viewer/dist/* /app/apps/hub/static/ && cp /app/apps/effect/dist/index.html /app/apps/hub/static/index.html
ENV NODE_ENV=production
WORKDIR /app/apps/hub
CMD ["node", "dist/index.js"]
