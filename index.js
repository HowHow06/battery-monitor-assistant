const arguments = require("minimist")(process.argv.slice(2));
const { pushNote } = require("./src/api/pushBullet");
const { BATTERY_LEVEL_STATUS } = require("./src/constants/variables");
const {
  getBatteryLevel,
  getBatteryLevelStatus,
} = require("./src/helpers/batteryInfo");
const { getNotificationDetail } = require("./src/helpers/notification");
const { delay } = require("./src/helpers/system");

if (arguments.list || arguments.l) {
  console.log("available options:");
  console.log(" --charger=<charger name> Default is 'my charger' ");
  return;
}

const { charger: chargerName = "my charger" } = arguments;
let sendUpdateCounter = 3;

async function main(chargerName) {
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
    await delay(60 * 10);
  }
}

main(chargerName);
