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
const { delay, loadJsonFromFile } = require("./src/helpers/system");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./bin/config.json");
const moment = require("moment");
const { askQuestion } = require("./src/helpers/input");
const { auth, processTokens, revokeToken } = require("./src/helpers/auth");
const open = require("open");
const { isValidURL } = require("./src/helpers/validator");
const { handleError } = require("./src/helpers/errorHandler");

const defaultUserName = "Me";

if (arguments.list || arguments.l) {
  console.log(`available options:`);
  console.log(` --charger=<charger name>: Default is 'my charger' `);
  console.log(` --noAction: Do not send command to google assistant`);
  console.log(` --auth: Authenticate account for the first time`);
  console.log(` --reAuth: Reauthenticate account`);
  console.log(
    ` --noRevoke: Do not revoke token when reauthenticating account. Used together with --reAuth`
  );
  console.log(` --revoke: Revoke token only`);
  console.log(` --test: Test send command to google assitant.`);
  console.log(` --testOn: Test send command to google assitant.`);
  console.log(` --noNoti: Do not send notification to push bullet`);
  console.log(` --credential='<path>': Path to the credential json file. `);
  return;
}

const {
  charger: chargerName = "my charger",
  noAction = false,
  noRevoke = false,
  revoke = false,
  test = false,
  noNoti = false,
  testOn = false,
  credential: credentialPath = undefined,
} = arguments;
let sendUpdateCounter = 3;
global.assistants = {}; // initialize global variable for assistant

if (arguments["auth"]) {
  initialAuth().then((isAuthInitialized) => {
    if (isAuthInitialized) processAuth(false, true);
  });
  return;
}

if (arguments["reAuth"]) {
  processAuth(true, noRevoke);
  return;
}

if (revoke) {
  revokeAuth();
  return;
}

if (test) {
  testCommand();
  return;
}

if (testOn) {
  testCommand(true);
  return;
}

async function testCommand(isTurnOn = false) {
  await initializeServer();

  if (isTurnOn) {
    const conversation = await turnOnCharger({
      charger: chargerName,
      user: defaultUserName,
    });
    console.log("Tested turn on command");
    return;
  }

  const conversation = await turnOffCharger({
    charger: chargerName,
    user: defaultUserName,
  });

  console.log("Tested turn off command");
}

async function revokeAuth() {
  await revokeToken(defaultUserName);
  console.log("token revoked!");
}

async function initialAuth() {
  const db = await low(adapter);
  const userFound =
    (await db.get("users").find({ name: defaultUserName }).size().value()) > 0;

  if (credentialPath === undefined) {
    console.error(
      "No credential is passed for the initial authentication. Please pass the --credential argument."
    );
    return false;
  }

  try {
    const retrievedSecret = loadJsonFromFile(credentialPath);
    if (!userFound) {
      await db
        .get("users")
        .push({
          name: defaultUserName,
          secret: retrievedSecret,
        })
        .write();
    } else {
      await db
        .get("users")
        .chain()
        .find({ name: defaultUserName })
        .assign({ secret: retrievedSecret })
        .write();
    }
    return true;
  } catch (error) {
    console.error("Error loading credential file:", error.message);
    return false;
  }
}

async function processAuth(isReAuth = false, noRevoke = false) {
  const db = await low(adapter);
  const secret = db.get("users").find({ name: defaultUserName }).value().secret;

  if (secret) {
    if (!noRevoke) {
      await revokeToken(defaultUserName);
      console.log("token revoked!");
    }

    const url = await auth(secret);
    console.log("url for auth is:", url);
    open(url);
    const input = await askQuestion("Please enter the auth code or auth url:");
    let oauthCode = input;
    if (isValidURL(input)) {
      const urlObject = new URL(input);
      const params = new URLSearchParams(urlObject.search);
      const code = params.get("code");
      oauthCode = code ? code : input;
    }
    const client = await processTokens(oauthCode, defaultUserName);
    if (isReAuth) {
      console.log("Reauthenticated user!: ", oauthCode);
    } else {
      console.log("Authenticated user!: ", oauthCode);
    }
  } else {
    console.log(secret);
    console.log("No credential is passed.");
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
    try {
      isGetChargerStatus = true;
      conversation = await turnOffCharger({
        charger: chargerName,
        user: defaultUserName,
      });
    } catch (error) {
      handleError({
        errorMessage: `Error in turning off charger, please re-auth and test`,
        event: e,
        processName: `turning off`,
      });
    }
  }

  if (
    batteryLevelStatus === BATTERY_LEVEL_STATUS.TO_CHARGE ||
    batteryLevelStatus === BATTERY_LEVEL_STATUS.EXTREME_LOW
  ) {
    try {
      isGetChargerStatus = true;
      conversation = await turnOnCharger({
        charger: chargerName,
        user: defaultUserName,
      });
    } catch (error) {
      handleError({
        errorMessage: `Error in turning on charger, please re-auth and test`,
        event: e,
        processName: `turning on charger`,
      });
    }
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
    await delay(1000 * 20);
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

    if (isToPushNotification && !noNoti) {
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
