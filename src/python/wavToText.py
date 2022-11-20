import speech_recognition as sr
import argparse
import sys

parser = argparse.ArgumentParser()
parser.add_argument('--file', dest='file', type=str, help='Audio file path')
args = parser.parse_args()

filePath = args.file

r = sr.Recognizer()

audio = False

with sr.AudioFile(filePath) as source:
    audio = r.record(source)
try:
    s = r.recognize_google(audio)
    print(s)
except Exception as e:
    print("Exception: "+str(e))
sys.stdout.flush()