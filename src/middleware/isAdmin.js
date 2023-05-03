const { responseFormat } = require("../utils/responseFormat");

exports.isAdmin = (req, res, next) => {
  if (req.userData.isAdmin) {
    next();
  } else {
    res.status(403).json(responseFormat(false,"Not authorized",{}));
  }
};
