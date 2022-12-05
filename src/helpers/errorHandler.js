const { pushNote } = require("../api/pushBullet");

exports.handleError = ({ processName = "", errorMessage, event }) => {
  pushNote({
    title: "ERROR",
    body: `Error occur in running ${processName}: ${errorMessage}`,
  });
};
