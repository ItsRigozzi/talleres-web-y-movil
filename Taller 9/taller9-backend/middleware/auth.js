// Middleware de autenticación.

// 5: Importar jsonwebtoken.
const jwt = require("jsonwebtoken");

// 5: Crear el middleware verificarToken.
const verificarToken = (req, res, next) => {
  const autorizacion = req.get("Authorization");

  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = autorizacion.replace("Bearer ", "");
  req.usuario = jwt.verify(token, process.env.JWT_SECRET);
  next();
};

// 5: Exportar el middleware.
module.exports = verificarToken;
