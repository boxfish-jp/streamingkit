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

FROM base AS builder
COPY . /temp
WORKDIR /temp
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install 
RUN pnpm run -r build
RUN pnpm deploy --filter stream_orchestrator /app --legacy

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app ./
CMD ["node", "dist/index.js"]
