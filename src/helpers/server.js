const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("./bin/config.json");

const Assistant = require("google-assistant/components/assistant");
const { setCredentials } = require("./auth");
const FileWriter = require("wav").FileWriter;

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

exports.outputFileStream = function (conversation, fileName) {
  return new FileWriter(`bin/audio-responses/${fileName}.wav`, {
    sampleRate: conversation.audio.sampleRateOut,
    channels: 1,
  });
};

exports.getTextFromAudioResponse = function (fileName) {
  return new Promise(function (resolve, reject) {
    const process = require("process");
    const currentDirectory = process.cwd();
    const spawn = require("child_process").spawn;

    const pythonProcess = spawn("py", [
      `${currentDirectory}/src/python/wavToText.py`,
      `--file`,
      `${currentDirectory}\\bin\\audio-responses\\${fileName}.wav`,
    ]);

    pythonProcess.stdout.on("data", function (data) {
      resolve(data);
    });

    pythonProcess.stderr.on("data", (data) => {
      reject({ message: data.toString() });
    });
  });
};
