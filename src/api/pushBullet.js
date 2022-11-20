const axios = require("axios");

exports.pushNote = async function ({ title, body }) {
  try {
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
          Authorization: `Bearer o.wiv4UNCCMU6KJxExKhMHB9yAxEMzTZcn`,
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
