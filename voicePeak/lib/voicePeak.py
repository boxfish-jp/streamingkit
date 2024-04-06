import win32api
import win32con
import win32gui
import time
from .watchPlay import nowPlaying


def sendVoicePeak(message):
    # ウインドウハンドルを取得
    VoicePeak = win32gui.FindWindow(
        None, "VOICEPEAK"
    )  # voicepeakのウインドウハンドルを取得
    JUCE = win32gui.FindWindow(
        None, "JUCEWindow"
    )  # voicepeak(juce)のウインドウハンドルを取得
    time.sleep(0.05)
    # メッセージを入力
    win32gui.SendMessage(JUCE, win32con.WM_ACTIVATE, 2, 0)  # ウインドウをアクティブ化
    win32gui.SendMessage(
        VoicePeak, win32con.WM_SETFOCUS, 0, 0
    )  # テキストエリアにフォーカスする
    for s in message:
        print(s)
        win32gui.SendMessage(
            VoicePeak, win32con.WM_CHAR, ord(s), 0
        )  # 読み上げたい文字を送信
        time.sleep(0.05)
    win32gui.SendMessage(
        VoicePeak, win32con.WM_KILLFOCUS, 0, 0
    )  # テキストエリアのフォーカスを外す

    time.sleep(0.8)
    # 再生
    win32gui.SendMessage(
        VoicePeak, win32con.WM_CHAR, 32, 0
    )  # スペースを送信して、読み上げを実行
    nowPlaying()

    # 入力した文字を削除
    win32gui.SendMessage(
        VoicePeak, win32con.WM_SETFOCUS, 0, 0
    )  # テキストエリアにフォーカスする
    for s in message:
        win32gui.SendMessage(
            VoicePeak, win32con.WM_KEYDOWN, 0x27, 0
        )  # 右矢印キーを入力
        win32gui.SendMessage(
            VoicePeak, win32con.WM_KEYDOWN, 8, 0
        )  # バックスペースを入力
        time.sleep(0.05)
    win32gui.SendMessage(VoicePeak, win32con.WM_KILLFOCUS, 0, 0)


def setupVoicePeak():
    VoicePeak = win32gui.FindWindow(
        None, "VOICEPEAK"
    )  # voicepeakのウインドウハンドルを取得
    rect = win32gui.GetWindowRect(VoicePeak)
    nowPos = win32api.GetCursorPos()
    win32api.SetCursorPos((rect[0] + 161, rect[1] + 167))
    win32api.mouse_event(
        win32con.MOUSEEVENTF_LEFTDOWN, rect[0] + 161, rect[1] + 167, 0, 0
    )
    win32api.mouse_event(
        win32con.MOUSEEVENTF_LEFTUP, rect[0] + 161, rect[1] + 167, 0, 0
    )
    win32api.SetCursorPos(nowPos)
    sendVoicePeak("邪神ちゃんですの")


def preventQuiet():
    VoicePeak = win32gui.FindWindow(
        None, "VOICEPEAK"
    )  # voicepeakのウインドウハンドルを取得
    JUCE = win32gui.FindWindow(
        None, "JUCEWindow"
    )  # voicepeak(juce)のウインドウハンドルを取得
    time.sleep(0.05)
    # メッセージを入力
    win32gui.SendMessage(JUCE, win32con.WM_ACTIVATE, 2, 0)  # ウインドウをアクティブ化
    win32gui.SendMessage(
        VoicePeak, win32con.WM_SETFOCUS, 0, 0
    )  # テキストエリアにフォーカスする
    time.sleep(0.05)
    win32gui.SendMessage(
        VoicePeak, win32con.WM_KILLFOCUS, 0, 0
    )  # テキストエリアのフォーカスを外す
