const express = require("express");
const cors = require("cors");

const app = express();

//app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  console.log("Llegó:", req.method, req.url);
  next();
});

let posts = [
  { userId: 1, id: 1, title: "Bienvenidos al Taller 5", body: "En este taller crearemos y levantaremos nuestro primer servidor con Node.js y Express." },
  { userId: 1, id: 2, title: "¿Qué es un backend?", body: "Es la parte de la aplicación que se ejecuta en el servidor y responde a las peticiones de los clientes." },
  { userId: 2, id: 3, title: "Métodos HTTP", body: "GET permite obtener datos, POST crear, PUT actualizar y DELETE eliminar." },
  { userId: 2, id: 4, title: "Formato JSON", body: "Los clientes y el servidor se comunican enviando y recibiendo datos en formato JSON." },
  { userId: 3, id: 5, title: "Postman", body: "Postman es una herramienta que permite enviar peticiones HTTP y revisar las respuestas del servidor." }
];

app.get("/", (req, res) => {
  res.send("¡Hola desde mi primer servidor con Express!");
});

app.get("/saludo/:nombre", (req, res) => {
  res.send(`¡Hola, ${req.params.nombre}!`);
});

app.get("/api/posts", (req, res) => {
  const userId = req.query.userId;
  if (userId) {
    const filtrados = posts.filter((p) => p.userId === Number(userId));
    return res.json(filtrados);
  }
  res.json(posts);
});

app.get("/api/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: "Publicación no encontrada" });
  }
});

app.post("/api/posts", (req, res) => {
  const datos = req.body;
  if (!datos || !datos.title || !datos.body) {
    return res.status(400).json({ error: "Debes enviar title y body" });
  }
  const nuevoPost = {
    userId: datos.userId || 1,
    id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
    title: datos.title,
    body: datos.body
  };
  posts.push(nuevoPost);
  res.status(201).json(nuevoPost);
});

//colocar antes de error 404 sino da el error 404
app.delete("/api/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  
  posts = posts.filter((p) => p.id !== id);
  
  res.json({ mensaje: "Publicación eliminada" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
