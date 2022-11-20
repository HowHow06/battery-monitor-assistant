const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./bin/config.json");
const Conversation = require("google-assistant/components/conversation");

exports.turnOffCharger = function ({ charger, user }) {
  exports.sendTextInput(`Turn off the ${charger}`, user);
};

exports.turnOnCharger = function ({ charger, user }) {
  exports.sendTextInput(`Turn on the ${charger}`, user);
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
      reject(e);
    }
  });
};
