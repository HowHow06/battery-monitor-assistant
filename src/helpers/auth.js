const { OAuth2Client } = require("google-auth-library");

const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const { handleError } = require("./errorHandler");
const adapter = new FileSync("./bin/config.json");

// TODO: modify
exports.auth = async function (keyData) {
  try {
    const key = keyData.installed || keyData.web;
    const oauthClient = new OAuth2Client(
      key.client_id,
      key.client_secret,
      key.redirect_uris[0]
    );
    return oauthClient.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/assistant-sdk-prototype"],
    });
  } catch (e) {
    console.error(e);
    handleError({
      errorMessage: `${e.response?.data?.error}: ${e.response?.data?.error_description}`,
      event: e,
      processName: "authentication",
    });
  }
};

// TODO: modify
exports.revokeToken = async function (name) {
  try {
    const db = await low(adapter);
    const user = await db.get("users").find({ name }).value();
    const key = user.secret.installed || user.secret.web;
    const oauthClient = new OAuth2Client(
      key.client_id,
      key.client_secret,
      key.redirect_uris[0]
    );
    const token = user.tokens?.access_token;
    if (!token) {
      return;
    }
    await oauthClient.revokeToken(token);
    await db
      .get("users")
      .chain()
      .find({ name: name })
      .assign({ tokens: {} })
      .write();
    return oauthClient;
  } catch (e) {
    console.error(e);
    if (e.response?.data?.error_description === "Token expired or revoked") {
      db.get("users")
        .chain()
        .find({ name: name })
        .assign({ tokens: {} })
        .write();
    }
    handleError({
      errorMessage: `${e.response?.data?.error}: ${e.response?.data?.error_description}`,
      event: e,
      processName: "revoke token",
    });
  }
};

// TODO: modify
exports.processTokens = async function (oauthCode, name) {
  try {
    const db = await low(adapter);
    const user = await db.get("users").find({ name }).value();
    const key = user.secret.installed || user.secret.web;
    const oauthClient = new OAuth2Client(
      key.client_id,
      key.client_secret,
      key.redirect_uris[0]
    );
    const r = await oauthClient.getToken(oauthCode);
    oauthClient.setCredentials(r.tokens);
    await db
      .get("users")
      .chain()
      .find({ name: name })
      .assign({ tokens: r.tokens })
      .write();
    return oauthClient;
  } catch (e) {
    console.error(e);
    handleError({
      errorMessage: `${e.response?.data?.error}: ${e.response?.data?.error_description}`,
      event: e,
      processName: "process token from auth code",
    });
  }
};

exports.setCredentials = async function (name) {
  try {
    const db = await low(adapter);
    const user = await db.get("users").find({ name }).value();
    const key = user.secret.installed || user.secret.web;
    const oauthClient = new OAuth2Client(
      key.client_id,
      key.client_secret,
      key.redirect_uris[0]
    );
    oauthClient.setCredentials(user.tokens);
    return oauthClient;
  } catch (e) {
    console.error(e);
    handleError({
      errorMessage: `${e.response?.data?.error}: ${e.response?.data?.error_description}`,
      event: e,
      processName: "set credential",
    });
  }
};
