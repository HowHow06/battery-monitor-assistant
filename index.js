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
const {
  initializeServer,
  outputFileStream,
  getTextFromAudioResponse,
} = require("./src/helpers/server");
const { delay } = require("./src/helpers/system");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./bin/config.json");
const moment = require("moment");
const { askQuestion } = require("./src/helpers/input");
const { auth, processTokens, revokeToken } = require("./src/helpers/auth");
const open = require("open");

const defaultUserName = "Me";

if (arguments.list || arguments.l) {
  console.log("available options:");
  console.log(" --charger=<charger name>: Default is 'my charger' ");
  console.log(" --noAction: Do not send command to google assistant");
  console.log(" --reAuth: Reauthenticate account");
  return;
}

if (arguments["reAuth"]) {
  reAuth();
  return;
}

const { charger: chargerName = "my charger", noAction = false } = arguments;
let sendUpdateCounter = 3;
global.assistants = {};

async function reAuth() {
  const db = await low(adapter);
  const secret = db.get("users").find({ name: defaultUserName }).value().secret;
  if (secret) {
    await revokeToken(defaultUserName);
    console.log("token revoked!");

    const url = await auth(secret);
    console.log("url for auth is:", url);
    open(url);
    const oauthCode = await askQuestion("Please enter the auth code:");
    const client = await processTokens(oauthCode, defaultUserName);
    console.log("Reauthenticated user!: ", oauthCode);
  }
}

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
      user: defaultUserName,
    });
  }

  if (
    batteryLevelStatus === BATTERY_LEVEL_STATUS.TO_CHARGE ||
    batteryLevelStatus === BATTERY_LEVEL_STATUS.EXTREME_LOW
  ) {
    isGetChargerStatus = true;
    conversation = await turnOnCharger({
      charger: chargerName,
      user: defaultUserName,
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
  if (isGetChargerStatus) {
    console.log("Preparing to get status...");
    await delay(1000 * 7);
    console.log("Getting status...");
    const db = await low(adapter);
    const convoData = db.get("conversation").value();
    const timestamp = moment(new Date()).format("YYYYMMDD-HHmmss");
    const fileName = `status-${timestamp}`;
    const fileStream = outputFileStream(convoData, fileName);

    const chargerConversation = await getChargerStatus({
      charger: chargerName,
      user: defaultUserName,
    });
    chargerConversation
      .on("audio-data", async (data) => {
        fileStream.write(data);
      })
      .on("response", (text) => {
        response.response = text;
      })
      .on("ended", async (error, continueConversation) => {
        if (error) {
          response.success = false;
          response.error = error;
          console.error("Get charger status Ended Error:", error);
        } else {
          console.log("Get charger status Complete");
          response.success = true;
        }
        fileStream.end();
        chargerConversation.end();

        let responseText = "";
        let hasStatusError = false;
        try {
          responseText = await getTextFromAudioResponse(fileName);
          responseText = responseText.toString();
        } catch (error) {
          hasStatusError = true;
          console.log("Error in getting text from audio:", error.message);
        }

        if (response.success && responseText && !hasStatusError) {
          pushNote({
            title: "Charger status update",
            body: responseText,
          });
        }
      });
  }
}

async function main(chargerName) {
  await initializeServer();
  if (!noAction) {
    console.log(`Charger Name: ${chargerName}`);
  }

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
    const batteryLevelStatus = await getBatteryLevelStatus(
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

    if (!noAction) {
      performActionTowardBatteryLevel(batteryLevelStatus, chargerName);
    }

    await delay(1000 * 60 * 10);
  }
}

main(chargerName);
