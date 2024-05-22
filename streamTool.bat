cd front
start yarn dev
cd ../
python -u gamepad/gamepad.py | ts-node comment/src/index.ts | ts-node hub/src/index.ts | python voicepeak/jyashin.py