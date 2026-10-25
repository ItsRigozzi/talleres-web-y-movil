// Rutas de autenticación con GitHub (OAuth). Se montan en servidor.js en "/api/auth".

const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const usuarios = require("../datos/usuarios");

const router = express.Router();

// Valores state pendientes, cada uno con su code_verifier (PKCE) y su expiración.
// Clave: state → Valor: { codeVerifier, expira }
const estados = new Map();
const DIEZ_MINUTOS = 10 * 60 * 1000;

// desafio 2 Limpieza periódica con setInterval que elimina los state expirados cada minuto
setInterval(() => {
  const ahora = Date.now();
  for (const [state, datos] of estados.entries()) {
    if (datos.expira < ahora) {
      estados.delete(state);
    }
  }
}, 60 * 1000);

// Elige un nombre de usuario que no exista (ya está listo).
// Si "ana" ya existe, prueba "ana-github", luego "ana-github2", etc.
const nombreDisponible = (login) => {
  let nombre = login;
  let intento = 1;
  while (usuarios.some((u) => u.username === nombre)) {
    nombre = intento === 1 ? `${login}-github` : `${login}-github${intento}`;
    intento++;
  }
  return nombre;
};

// 3: Crear la ruta GET "/github/url" que genere el state y el PKCE,
//    y responda con la URL de autorización de GitHub.
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

// 4: Crear la ruta POST "/github" que reciba { code, state }, verifique el state,
//    intercambie el código con GitHub, obtenga el perfil y responda con NUESTRO JWT.
router.post("/github", async (req, res) => {
  const datos = req.body;
  if (!datos || !datos.code || !datos.state) {
    return res.status(400).json({ error: "Debes enviar code y state" });
  }

  const guardado = estados.get(datos.state);
  estados.delete(datos.state);
  if (!guardado || guardado.expira < Date.now()) {
    return res.status(400).json({ error: "El parámetro state no es válido o expiró. Vuelve a ingresar con GitHub." });
  }

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

  const respuestaPerfil = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${datosToken.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "taller10-ingenieria-web"
    }
  });
  if (!respuestaPerfil.ok) {
    return res.status(502).json({ error: "No se pudo obtener el perfil de GitHub" });
  }
  const perfil = await respuestaPerfil.json();

  let usuario = usuarios.find((u) => u.githubId === perfil.id);
  if (!usuario) {
    // desafio 1 Guardar la foto de perfil del usuario de GitHub al crearlo
    usuario = {
      id: Math.max(...usuarios.map((u) => u.id)) + 1,
      username: nombreDisponible(perfil.login),
      githubId: perfil.id,
      avatarUrl: perfil.avatar_url
    };
    usuarios.push(usuario);
  } else if (!usuario.avatarUrl && perfil.avatar_url) {
    // desafio 1 Asignar foto si el usuario ya existía
    usuario.avatarUrl = perfil.avatar_url;
  }

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRA || "1h" }
  );

  res.json({ token, id: usuario.id, username: usuario.username });
});

module.exports = router;
