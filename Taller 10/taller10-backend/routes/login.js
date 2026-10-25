// Ruta de inicio de sesión con contraseña (Taller 9). Se monta en servidor.js en "/api/login".

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usuarios = require("../datos/usuarios");

const router = express.Router();

router.post("/", async (req, res) => {
  const datos = req.body;
  if (!datos || !datos.username || !datos.password) {
    return res.status(400).json({ error: "Debes enviar username y password" });
  }

  const usuario = usuarios.find((u) => u.username === datos.username);
  // 2: Los usuarios que ingresan con GitHub no tienen passwordHash: la contraseña
  //    solo debe compararse si el usuario existe Y tiene passwordHash.
  const passwordCorrecta =
    usuario && usuario.passwordHash ? await bcrypt.compare(datos.password, usuario.passwordHash) : false;

  if (!passwordCorrecta) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRA || "1h" }
  );

  res.json({ token, id: usuario.id, username: usuario.username });
});

module.exports = router;
