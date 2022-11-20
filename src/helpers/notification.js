const { BATTERY_LEVEL_STATUS } = require("../constants/variables");

exports.getNotificationDetail = function ({
  batteryLevelStatus,
  batteryPercentage,
  isPowerPlugged,
  remainingTime,
  batteryDieAtString,
}) {
  let title = "";
  let message = "";
  const timestamp = new Date().toLocaleString();
  switch (batteryLevelStatus) {
    case BATTERY_LEVEL_STATUS.EXTREME_LOW:
      title = `EXTREME LOW! Please charge your device!`;
      message = `Time: ${timestamp}\nBattery Level: ${batteryPercentage}% \nRemainingTime: ${remainingTime}\nBattery will die at: ${batteryDieAtString}`;
      break;
    case BATTERY_LEVEL_STATUS.TO_CHARGE:
      title = `Please charge your device!`;
      message = `Time: ${timestamp}\nBattery Level: ${batteryPercentage}% \nRemainingTime: ${remainingTime}\nBattery will die at: ${batteryDieAtString}`;
      break;
    case BATTERY_LEVEL_STATUS.STOP_CHARGE:
      title = `Stop charging! `;
      message = `Time: ${timestamp}\nBattery Level: ${batteryPercentage}% \n Is Plugged In: ${isPowerPlugged}`;
      break;
    default:
      title = `Battery Level Update`;
      message = `Time: ${timestamp}\nBattery Level: ${batteryPercentage}%\nPlugged in: ${isPowerPlugged}\nRemainingTime: ${remainingTime}\nBattery will die at: ${batteryDieAtString}`;
      break;
  }
  return { title, message };
};
