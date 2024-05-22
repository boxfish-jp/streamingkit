import time
import threading
import sys
import io
import pygame
import codecs


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

while True:
    eventlist = pygame.event.get()
    if len(eventlist) > 0:
        if eventlist[0].type == pygame.JOYBUTTONDOWN:
            if eventlist[0].button == 1:
                print("interupt")
    time.sleep(0.5)
