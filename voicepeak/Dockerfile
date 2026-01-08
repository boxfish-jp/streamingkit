FROM linuxserver/webtop:ubuntu-xfce

RUN apt-get update && \
    apt-get install -y curl gnupg unzip

RUN curl -L -o voicepeak_jashinchan_freetrial.zip "https://download.dreamtonics.com/voicepeak-jashinchan-trial/voicepeak_jashinchan_freetrial.zip"
RUN unzip -O cp932 voicepeak_jashinchan_freetrial.zip && \
    unzip -O cp932 "/VOICEPEAK 邪神ちゃん 無料お試し版/Linux/Voicepeak-linux64.zip" && \
    chmod 777 /Voicepeak/voicepeak && \
    chmod -R 777 /Voicepeak
