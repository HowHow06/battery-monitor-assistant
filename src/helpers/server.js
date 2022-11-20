const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("./bin/config.json");

const Assistant = require("google-assistant/components/assistant");
const { setCredentials } = require("./auth");

exports.initializeServer = function () {
  return new Promise(async (resolve, reject) => {
    const db = await low(adapter);
    await db
      .defaults({
        muteStartup: false,
        conversation: {
          audio: {
            encodingIn: "LINEAR16",
            sampleRateIn: 16000,
            encodingOut: "LINEAR16",
            sampleRateOut: 24000,
          },
          lang: "en-US",
          screen: {
            isOn: false,
          },
        },
        users: [],
        responses: [],
        devices: [],
      })
      .write();
    const size = db.get("users").size().value();
    const users = db.get("users").value();

    const muted = await exports.isStartupMuted();
    const promises = [];

    if (size > 0) {
      users.forEach((user) => {
        promises.push(
          new Promise(async (resolve, rej) => {
            const client = await setCredentials(user.name);
            global.assistants[user.name] = new Assistant(client);
            resolve();
          })
        );
      });
      await Promise.all(promises);
    }

    // TODO: change message here
    console.log("App Initialized");
    return resolve();
  });
};

exports.isStartupMuted = function () {
  return new Promise(async (resolve, rej) => {
    const db = await low(adapter);
    const muteStartup = db.get("muteStartup").value();
    if (muteStartup) return resolve(true);
    return resolve(false);
  });
};
