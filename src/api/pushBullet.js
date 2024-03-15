const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync("./bin/config.json");
const axios = require("axios");

exports.pushNote = async function ({ title, body }) {
  try {
    const db = await low(adapter);
    const pushBulletKey = db.get("pushBulletKey").value();
    if (pushBulletKey === undefined) {
      console.log("No pushbullet key found, aborting push notification...");
      return;
    }
    const response = await axios.post(
      "https://api.pushbullet.com/v2/pushes",
      {
        type: "note",
        title: title,
        body: body,
      },
      {
        headers: {
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
