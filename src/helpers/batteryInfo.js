const { BATTERY_LEVEL_STATUS } = require("../constants/variables");

exports.getBatteryLevel = function () {
  return new Promise(function (resolve, reject) {
    const process = require("process");
    const currentDirectory = process.cwd();
    const spawn = require("child_process").spawn;

    const pythonProcess = spawn("py", [
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

exports.getBatteryLevelStatus = function (batterPercentage, isPowerPlugged) {
  // TODO: get percentage from env or config
  const isBatteryLow = batterPercentage < 25;
  const isBatteryExtremeLow = batterPercentage < 10;
  const isBatteryHigh = batterPercentage > 85;

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
