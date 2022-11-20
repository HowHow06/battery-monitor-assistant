const low = require("lowdb");
const FileSync = require("lowdb/adapters/filesync");
const adapter = new FileSync("./bin/config.json");
const axios = require("axios");

exports.pushNote = async function ({ title, body }) {
  try {
    const db = await low(adapter);
    const pushBulletKey = db.get("pushBulletKey").value();
    const response = await axios.post(
      "https://api.pushbullet.com/v2/pushes",
      {
        type: "note",
        title: title,
        body: body,
      },
      {
        headers: {
          // TODO: move key to config.json, or env
          Authorization: `Bearer ${pushBulletKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (error) {
    console.error(error);
    return { success: false, errors: [error] };
  }
};
