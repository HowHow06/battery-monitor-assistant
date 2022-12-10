const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./bin/config.json");
const Conversation = require("google-assistant/components/conversation");
const { handleError } = require("./errorHandler");

exports.getChargerStatus = async function ({ charger, user }) {
  return exports.sendTextInput(`Is the ${charger} turned off?`, user);
};

exports.turnOffCharger = async function ({ charger, user }) {
  console.log("Turning off!");
  return exports.sendTextInput(`Turn off the ${charger}`, user);
};

exports.turnOnCharger = async function ({ charger, user }) {
  console.log("Turning on!");
  return exports.sendTextInput(`Turn on the ${charger}`, user);
};

exports.sendTextInput = function (text, name) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await low(adapter);
      const conversationConfig = await db.get("conversation").value();
      const users = await db.get("users").value();

      let nameToUse;
      conversationConfig.textQuery = text;

      if (users.length > 0) {
        if (!name) nameToUse = users[0].name;
        else nameToUse = name;
        const conversation = new Conversation(
          global.assistants[nameToUse],
          conversationConfig
        );
        resolve(conversation);
      }
      resolve();
    } catch (e) {
      handleError({
        errorMessage: `${e.response?.data?.error}: ${e.response?.data?.error_description}`,
        event: e,
        processName: `Send text input-${text}`,
      });
      reject(e);
    }
  });
};
