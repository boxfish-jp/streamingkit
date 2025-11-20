FROM linuxserver/webtop:ubuntu-xfce AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update && \
    apt-get install -y curl gnupg unzip && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs
RUN npm install -g pnpm
RUN curl -L -o voicepeak_jashinchan_freetrial.zip "https://download.dreamtonics.com/voicepeak-jashinchan-trial/voicepeak_jashinchan_freetrial.zip" && \
    unzip -O cp932 voicepeak_jashinchan_freetrial.zip && \
    unzip -O cp932 "VOICEPEAK 邪神ちゃん 無料お試し版/Linux/Voicepeak-linux64.zip" && \
    chmod +x ./Voicepeak/voicepeak

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
