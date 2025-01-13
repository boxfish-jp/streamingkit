import time
import threading
import lib.watchPlay as watchPlay
from lib.voicePeak import VoicePeak
import sys
import io


def preventSleep():
    while True:
        time.sleep(1000 * 15)
        watchPlay.preventSleep()


def setup():
    print("wait")
    time.sleep(3)
    prelog = ""
    while True:
        nowLog = watchPlay.checkLog()
        if nowLog != prelog:
            prelog = nowLog
            if nowLog == "WM_PAINT":
                print(nowLog)
            if nowLog == "UPLINK":
                print("start")
                break
    voicePeak = VoicePeak()
    voicePeak.setupVoicePeak()
    for line in io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8"):
        voicePeak.sendVoicePeak(line.strip())


log = threading.Thread(target=watchPlay.Startlogging)
prevent = threading.Thread(target=preventSleep)

log.start()
prevent.start()
setup()
