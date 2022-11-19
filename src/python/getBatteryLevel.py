import psutil
from datetime import datetime, timedelta
import json
import sys

def convertTime(seconds):
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return "%d:%02d:%02d" % (hours, minutes, seconds)

battery = psutil.sensors_battery()
isPowerPlugged = battery.power_plugged
batteryPercentage = battery.percent
remainingTime = convertTime(battery.secsleft)

now = datetime.now()
current_dateTime = now.strftime("%Y-%m-%d %H:%M:%S")
batteryDieAtString = (now + timedelta(seconds=battery.secsleft)).strftime("%Y-%m-%d %H:%M:%S") if str(battery.secsleft).isnumeric() else "Not applicable"

batteryReport = {
    "currentDateTime": current_dateTime,
    "batteryPercentage": batteryPercentage,
    "isPowerPlugged": isPowerPlugged,
    "remainingTime": remainingTime,
    "batteryDieAtString": batteryDieAtString,
}

print(json.dumps(batteryReport))
sys.stdout.flush()