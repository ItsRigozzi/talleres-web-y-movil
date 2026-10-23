// Taller 9: Autenticación, autorización y JWT
// Este es el servidor del Taller 8 (ya completo). Sigue los pasos del README
// y completa cada sección marcada con un número.

// 1: Verificar que exista la variable de entorno JWT_SECRET.
if (!process.env.JWT_SECRET) {
  console.error("Falta la variable de entorno JWT_SECRET. Revisa el archivo .env");
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const postsRouter = require("./routes/posts");
// 3: Importar el router de usuarios.
const usuariosRouter = require("./routes/usuarios");
// 4: Importar el router de login.
const loginRouter = require("./routes/login");

const app = express();

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("¡Hola desde mi primer servidor con Express!");
});

app.get("/saludo/:nombre", (req, res) => {
  res.send(`¡Hola, ${req.params.nombre}!`);
});

app.use("/api/posts", postsRouter);
// 3: Montar el router de usuarios en "/api/usuarios".
app.use("/api/usuarios", usuariosRouter);
// 4: Montar el router de login en "/api/login".
app.use("/api/login", loginRouter);

const endpointDesconocido = (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
};

app.use(endpointDesconocido);

const manejadorErrores = (error, req, res, next) => {
  console.error(error.message);

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
  }

  // 6: Responder 401 cuando el token no es válido o expiró.
  if (error.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expirado" });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Token inválido" });
  }

  res.status(500).json({ error: "Error interno del servidor" });
};

app.use(manejadorErrores);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
