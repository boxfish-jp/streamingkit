FROM linuxserver/webtop:ubuntu-xfce

# Node.js 20.x と pnpm のインストール
RUN apt-get update && \
    apt-get install -y curl gnupg unzip && \
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g pnpm

RUN curl -L -o voicepeak_jashinchan_freetrial.zip "https://download.dreamtonics.com/voicepeak-jashinchan-trial/voicepeak_jashinchan_freetrial.zip" && \
    unzip -O cp932 voicepeak_jashinchan_freetrial.zip && \
    unzip -O cp932 "VOICEPEAK 邪神ちゃん 無料お試し版/Linux/Voicepeak-linux64.zip" && \
    chmod +x ./Voicepeak/voicepeak

# ワークスペースの準備
WORKDIR /app

# Next.js用のポート（例: 3001）を明示的に公開
EXPOSE 3001
