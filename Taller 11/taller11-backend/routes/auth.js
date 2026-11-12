// Rutas de autenticación con GitHub (OAuth). Se montan en servidor.js en "/api/auth".

const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const usuarios = require("../datos/usuarios");
const { nombreDisponible } = require("../utils/usuarios");

const router = express.Router();

// Valores state pendientes, cada uno con su code_verifier (PKCE) y su expiración.
// Clave: state → Valor: { codeVerifier, expira }
const estados = new Map();
const DIEZ_MINUTOS = 10 * 60 * 1000;

router.get("/github/url", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  estados.set(state, { codeVerifier, expira: Date.now() + DIEZ_MINUTOS });

  const parametros = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_REDIRECT_URI,
    scope: "read:user",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });

  res.json({ url: `https://github.com/login/oauth/authorize?${parametros}` });
});

router.post("/github", async (req, res) => {
  const datos = req.body;
  if (!datos || !datos.code || !datos.state) {
    return res.status(400).json({ error: "Debes enviar code y state" });
  }

  // 1. Verificar el state: debe existir, no haber expirado y se usa una sola vez.
  const guardado = estados.get(datos.state);
  estados.delete(datos.state);
  if (!guardado || guardado.expira < Date.now()) {
    return res.status(400).json({ error: "El parámetro state no es válido o expiró. Vuelve a ingresar con GitHub." });
  }

  // 2. Intercambiar el código por un token de acceso de GitHub.
  const respuestaToken = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code: datos.code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
      code_verifier: guardado.codeVerifier
    })
  });
  const datosToken = await respuestaToken.json();
  if (!respuestaToken.ok || datosToken.error) {
    return res.status(401).json({
      error: `GitHub rechazó el código: ${datosToken.error_description || datosToken.error}`
    });
  }

  // 3. Consultar a GitHub quién es el usuario.
  const respuestaPerfil = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${datosToken.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "taller11-ingenieria-web"
    }
  });
  if (!respuestaPerfil.ok) {
    return res.status(502).json({ error: "No se pudo obtener el perfil de GitHub" });
  }
  const perfil = await respuestaPerfil.json();

  // 4. Buscar el usuario local por su githubId; si no existe, crearlo (sin contraseña).
  let usuario = usuarios.find((u) => u.githubId === perfil.id);
  if (!usuario) {
    usuario = {
      id: Math.max(...usuarios.map((u) => u.id)) + 1,
      username: nombreDisponible(perfil.login, usuarios),
      githubId: perfil.id
    };
    usuarios.push(usuario);
  }

  // 5. Emitir NUESTRO JWT, igual que en routes/login.js.
  const token = jwt.sign(
    { id: usuario.id, username: usuario.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRA || "1h" }
  );

  res.json({ token, id: usuario.id, username: usuario.username });
});

module.exports = router;
