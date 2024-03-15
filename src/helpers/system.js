const fs = require("fs");
const path = require("path");

exports.delay = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

// Function to load credentials from the specified JSON file
exports.loadJsonFromFile = (filePath) => {
  const content = fs.readFileSync(path.resolve(filePath));
  return JSON.parse(content);
};
