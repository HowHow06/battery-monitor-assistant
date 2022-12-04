exports.isValidURL = (value) => {
  try {
    return Boolean(new URL(value));
  } catch (e) {
    return false;
  }
};
