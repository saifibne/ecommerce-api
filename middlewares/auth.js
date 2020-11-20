const jwt = require("jsonwebtoken");

exports.auth = (req, res, next) => {
  const bearerToken = req.get("Authorization");
  if (!bearerToken) {
    return res.status(300).json({
      message: "Please attach the token.",
    });
  }
  const token = bearerToken.split(" ")[1];
  let decodedToken;
  if (!token) {
    return res.status(300).json({
      message: "please attach the token.",
      status: 300,
    });
  }
  try {
    decodedToken = jwt.verify(token, "someSuperSecret");
  } catch (error) {
    return res.status(400).json({
      message: "can't verify token.",
      errorData: error,
    });
  }
  if (!decodedToken) {
    return res.status(300).json({
      message: "can't get token or it expired",
      status: 300,
    });
  }
  req.userId = decodedToken.userId;
  next();
};
