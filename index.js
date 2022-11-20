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
  getChargerStatus,
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

async function performActionTowardBatteryLevel(
  batteryLevelStatus,
  chargerName
) {
  const response = {};
  let isGetChargerStatus = false;
  let conversation = "";

  if (batteryLevelStatus === BATTERY_LEVEL_STATUS.STOP_CHARGE) {
    isGetChargerStatus = true;
    conversation = await turnOffCharger({
      charger: chargerName,
      user: "Me",
    });
  }

  if (
    batteryLevelStatus === BATTERY_LEVEL_STATUS.TO_CHARGE ||
    batteryLevelStatus === BATTERY_LEVEL_STATUS.EXTREME_LOW
  ) {
    isGetChargerStatus = true;
    conversation = await turnOnCharger({
      charger: chargerName,
      user: "Me",
    });
  }

  // end conversation
  if (isGetChargerStatus) {
    conversation.on("ended", async (error, continueConversation) => {
      if (error) {
        response.success = false;
        response.error = error;
        console.error(
          "Turn on or off charger conversation Ended Error:",
          error
        );
      } else {
        response.success = true;
        console.log("Turn on or off charger conversation Completed");
      }
      conversation.end();
    });
  }

  // follow up status after 10sec, send update via pushbullet
  // if (isGetChargerStatus) {
  //   console.log("preparing to get status...");
  //   await delay(1000 * 10);
  //   console.log("getting status");
  //   const chargerConversation = await getChargerStatus({
  //     charger: chargerName,
  //     user: "Me",
  //   });
  //   chargerConversation
  //     .on("audio-data", async (data) => {
  //       // fileStream.write(data);
  //       // response.audio = `/server/audio?v=${timestamp}`;
  //     })
  //     .on("response", (text) => {
  //       console.log("the text is", text);
  //       response.response = text;
  //     })
  //     .on("ended", async (error, continueConversation) => {
  //       if (error) {
  //         response.success = false;
  //         response.error = error;
  //         console.error("Get charger status Ended Error:", error);
  //       } else {
  //         console.log("Get charger status Complete");
  //         response.success = true;
  //       }
  //       chargerConversation.end();
  //       if (response.success) {
  //         pushNote({
  //           title: "Charger status update",
  //           body: response.response,
  //         });
  //       }
  //     });
  // }
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

    console.log("===============================");
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
      isToPushNotification = sendUpdateCounter >= 3;
    }

    if (isToPushNotification) {
      sendUpdateCounter = 0;
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
