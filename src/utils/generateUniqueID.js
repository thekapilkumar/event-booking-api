const crypto = require("crypto");

exports.generateUniqueId = () => {
  const id = crypto.randomBytes(5).toString("hex");
  return id.substring(0, 10);
};
