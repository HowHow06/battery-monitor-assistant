const { BATTERY_LEVEL_STATUS } = require("../constants/variables");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./bin/config.json");

exports.getBatteryLevel = function () {
  return new Promise(function (resolve, reject) {
    const process = require("process");
    const currentDirectory = process.cwd();
    const spawn = require("child_process").spawn;

    const pythonProcess = spawn("python", [
      `${currentDirectory}/src/python/getBatteryLevel.py`,
    ]);

    pythonProcess.stdout.on("data", function (data) {
      resolve(data);
    });

    pythonProcess.stderr.on("data", (data) => {
      reject({ message: data.toString() });
    });
  });
};

exports.getBatteryLevelStatus = async function (
  batterPercentage,
  isPowerPlugged
) {
  const db = await low(adapter);
  const batteryLevel = db.get("batteryLevel").value();
  const isBatteryLow = batterPercentage < batteryLevel.low;
  const isBatteryExtremeLow = batterPercentage < batteryLevel.extremeLow;
  const isBatteryHigh = batterPercentage > batteryLevel.high;

  if (isBatteryExtremeLow && !isPowerPlugged) {
    return BATTERY_LEVEL_STATUS.EXTREME_LOW;
  }

  if (isBatteryLow && !isPowerPlugged) {
    return BATTERY_LEVEL_STATUS.TO_CHARGE;
  }
  if (isBatteryHigh && isPowerPlugged) {
    return BATTERY_LEVEL_STATUS.STOP_CHARGE;
  }
  return BATTERY_LEVEL_STATUS.NORMAL;
};
