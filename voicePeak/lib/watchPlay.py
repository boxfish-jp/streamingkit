import subprocess
import time
import sys

proc = subprocess.Popen(
    ["voicePeak\lib\Release\injectioncode.exe"], stdout=subprocess.PIPE
)
pipeMess = ["NotChange"]

interrupt = True


# 邪神ちゃんが読み上げ中かどうかを判別するために実行するプログラムの立ち上げとログの記録
def Startlogging():
    global pipeMess
    for line in iter(proc.stdout.readline, b""):
        if not interrupt:
            break
        out = line.decode("utf-8")
        pipeMess.append(out.replace("\r\n", ""))


# 邪神ちゃんが読み上げが終わるまで、終了しない(待つ)関数
def nowPlaying():
    while True:
        if pipeMess[-1] == "WM_PAINT":
            while 1:
                logSum = len(pipeMess)
                time.sleep(0.3)
                if (
                    len(pipeMess) == logSum
                ):  # 0.3秒経ってもログが更新されなかったら、関数を終了
                    return
        else:
            time.sleep(0.5)


# 記録されたログの一番最後のメッセージを返す関数
def checkLog():
    return pipeMess[-1]


def close():
    global flag
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        flag = False
        sys.exit
