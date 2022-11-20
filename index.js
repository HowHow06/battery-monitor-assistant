const arguments = require("minimist")(process.argv.slice(2));
const { pushNote } = require("./src/api/pushBullet");
const { BATTERY_LEVEL_STATUS } = require("./src/constants/variables");
const {
  getBatteryLevel,
  getBatteryLevelStatus,
} = require("./src/helpers/batteryInfo");
const {
  turnOffCharger,
  turnOnCharger,
} = require("./src/helpers/googleDeviceManager");
const { getNotificationDetail } = require("./src/helpers/notification");
const { initializeServer } = require("./src/helpers/server");
const { delay } = require("./src/helpers/system");

if (arguments.list || arguments.l) {
  console.log("available options:");
  console.log(" --charger=<charger name> Default is 'my charger' ");
  return;
}

const { charger: chargerName = "my charger" } = arguments;
let sendUpdateCounter = 3;
global.assistants = {};

function performActionTowardBatteryLevel(batteryLevelStatus, chargerName) {
  if (batteryLevelStatus === BATTERY_LEVEL_STATUS.STOP_CHARGE) {
    turnOffCharger({
      charger: chargerName,
      user: "Me",
    });
  }
  if (
    batteryLevelStatus === BATTERY_LEVEL_STATUS.TO_CHARGE ||
    batteryLevelStatus === BATTERY_LEVEL_STATUS.EXTREME_LOW
  ) {
    turnOnCharger({
      charger: chargerName,
      user: "Me",
    });
  }

  // follow up status after 30sec, send update via pushbullet
}

async function main(chargerName) {
  await initializeServer();
  while (true) {
    let batteryInfo = {};
    sendUpdateCounter += 1;
    let isToPushNotification = true;

    try {
      const batteryInfoString = await getBatteryLevel();
      batteryInfo = JSON.parse(batteryInfoString.toString());
    } catch (error) {
      console.log("Error:", error.message);
    }

    console.log("Battery info: ", batteryInfo);
    const {
      batteryPercentage,
      isPowerPlugged,
      remainingTime,
      batteryDieAtString,
    } = batteryInfo;
    const batteryLevelStatus = getBatteryLevelStatus(
      batteryPercentage,
      isPowerPlugged
    );

    const notificationDetail = getNotificationDetail({
      batteryLevelStatus,
      batteryPercentage,
      isPowerPlugged,
      remainingTime,
      batteryDieAtString,
    });

    if (batteryLevelStatus === BATTERY_LEVEL_STATUS.NORMAL) {
      isToPushNotification = sendUpdateCounter > 3;
    }

    if (isToPushNotification) {
      console.log("NOTIFICATION PUSH! STATUS: ", batteryLevelStatus);
      pushNote({
        title: notificationDetail.title,
        body: notificationDetail.message,
      });
    }

    performActionTowardBatteryLevel(batteryLevelStatus, chargerName);

    await delay(1000 * 60 * 10);
  }
}

main(chargerName);
