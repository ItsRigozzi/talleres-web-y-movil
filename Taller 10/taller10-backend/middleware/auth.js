// Middleware de autenticación (Taller 9).

const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  const autorizacion = req.get("Authorization");

  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = autorizacion.replace("Bearer ", "");
  req.usuario = jwt.verify(token, process.env.JWT_SECRET);
  next();
};

module.exports = verificarToken;
