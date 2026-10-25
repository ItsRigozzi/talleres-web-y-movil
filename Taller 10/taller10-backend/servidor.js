// Taller 10: OAuth con GitHub
// Este es el servidor del Taller 9 (ya completo). Sigue los pasos del README
// y completa cada sección marcada con un número.

// 1: Reemplazar esta verificación por una que revise también las variables de GitHub.
const variablesRequeridas = ["JWT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_REDIRECT_URI"];
const faltantes = variablesRequeridas.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno: ${faltantes.join(", ")}. Revisa el archivo .env`);
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const postsRouter = require("./routes/posts");
const usuariosRouter = require("./routes/usuarios");
const loginRouter = require("./routes/login");
// 3: Importar el router de autenticación con GitHub.
const authRouter = require("./routes/auth");

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
app.use("/api/usuarios", usuariosRouter);
app.use("/api/login", loginRouter);
// 3: Montar el router de autenticación en "/api/auth".
app.use("/api/auth", authRouter);

const endpointDesconocido = (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
};

app.use(endpointDesconocido);

const manejadorErrores = (error, req, res, next) => {
  console.error(error.message);

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
  }

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
