const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const postsRouter = require("./routes/posts");
const usuariosRouter = require("./routes/usuarios");
const loginRouter = require("./routes/login");
const authRouter = require("./routes/auth");

const app = express();

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("tiny"));
}
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

module.exports = app;
