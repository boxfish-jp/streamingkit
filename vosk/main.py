#!/usr/bin/env python3

# prerequisites: as described in https://alphacephei.com/vosk/install and also python module `sounddevice` (simply run command `pip install sounddevice`)
# Example usage using Dutch (nl) recognition model: `python test_microphone.py -m nl`
# For more help run: `python test_microphone.py -h`

import argparse
import queue
import sys
import sounddevice as sd
import threading
import io
import pygame
import codecs
import requests
from urllib.parse import urlencode
import time
import json

from vosk import Model, KaldiRecognizer

q = queue.Queue()


def readPipe():
    for line in io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8"):
        print(line.strip())
        sys.stdout.flush()


rpipe = threading.Thread(target=readPipe)

rpipe.start()

pygame.init()
pygame.joystick.init()
joys = pygame.joystick.Joystick(0)
joys.init()


def int_or_str(text):
    """Helper function for argument parsing."""
    try:
        return int(text)
    except ValueError:
        return text


def callback(indata, frames, time, status):
    """This is called (from a separate thread) for each audio block."""
    if status:
        print(status, file=sys.stderr)
    q.put(bytes(indata))


def sendRequest(message: str, who: str):
    param = {"text": message, "key": int(time.time() * 1000), "who": "hugu"}
    try:
        response = requests.get("http://192.168.68.110:8888?" + urlencode(param))
        response.raise_for_status()
        print(message)
    except requests.exceptions.RequestException as e:
        pass


parser = argparse.ArgumentParser(add_help=False)
parser.add_argument(
    "-l",
    "--list-devices",
    action="store_true",
    help="show list of audio devices and exit",
)
args, remaining = parser.parse_known_args()
if args.list_devices:
    print(sd.query_devices())
    parser.exit(0)
parser = argparse.ArgumentParser(
    description=__doc__,
    formatter_class=argparse.RawDescriptionHelpFormatter,
    parents=[parser],
)
parser.add_argument(
    "-f",
    "--filename",
    type=str,
    metavar="FILENAME",
    help="audio file to store recording to",
)
parser.add_argument(
    "-d", "--device", type=int_or_str, help="input device (numeric ID or substring)"
)
parser.add_argument("-r", "--samplerate", type=int, help="sampling rate")
parser.add_argument(
    "-m",
    "--model",
    type=str,
    help="language model; e.g. en-us, fr, nl; default is en-us",
)
args = parser.parse_args(remaining)

try:
    if args.samplerate is None:
        device_info = sd.query_devices(args.device, "input")
        # soundfile expects an int, sounddevice provides a float:
        args.samplerate = int(device_info["default_samplerate"])

    model = Model(model_path="E:\\purograming\\streamingKit\\vosk\\model")

    if args.filename:
        dump_fn = open(args.filename, "wb")
    else:
        dump_fn = None

    with sd.RawInputStream(
        samplerate=args.samplerate,
        blocksize=8000,
        device=args.device,
        dtype="int16",
        channels=1,
        callback=callback,
    ):
        print("#" * 80)
        print("Press Ctrl+C to stop the recording")
        print("#" * 80)

        rec = KaldiRecognizer(model, args.samplerate)
        push = False
        results = []

        noiseWords = ["えーと", "えっとー", "えっと", "えーっとー", "えーっと"]

        while True:
            eventlist = pygame.event.get()
            data = q.get()

            if rec.AcceptWaveform(data):
                result: json = json.loads(rec.Result())
                text = result["text"].replace(" ", "")
                for noiseWord in noiseWords:
                    text = text.replace(noiseWord, "")
                if text != "":
                    results.append(text)
                    print(text)
            if dump_fn is not None:
                dump_fn.write(data)

            if len(eventlist) > 0:
                if eventlist[0].type == pygame.JOYBUTTONDOWN:
                    if eventlist[0].button == 2 and len(results) > 0:
                        sendRequest(results[-1], "hugu")


except KeyboardInterrupt:
    print("\nDone")
    parser.exit(0)
except Exception as e:
    parser.exit(type(e).__name__ + ": " + str(e))
