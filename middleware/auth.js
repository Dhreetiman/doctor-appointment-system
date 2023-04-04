const JWT = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    let token = req.headers["authorization"];
    if (!token) {
      return res
        .status(400)
        .send({ status: false, message: "Token must be Present" });
    }
    token = token.slice(7); //removing Bearer with one whitespace from token

    JWT.verify(token, process.env.JWT_SECRET, function (error, decodedToken) {
      if (error) {
        return res
          .status(401)
          .send({ status: false, message: "Invalid Token." });
      } else {
        req.id = decodedToken.id;
        // console.log(req.id);
        next();
      }
    });
  } catch (error) {
    res.status(500).send({ status: false, error: error.message });
  }
};
