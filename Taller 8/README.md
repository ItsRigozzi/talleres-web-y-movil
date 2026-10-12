# Taller 8: CRUD completo con Express + Ionic

**Nota**: Durante todos nuestros talleres utilizaremos el editor de código Visual Studio Code. Para dudas respecto a la interfaz del editor puedes consultar la documentación oficial en: https://code.visualstudio.com/docs/editing/getting-started

## Algunos comandos útiles para VSCode
```text
Nota: Los siguientes comandos fueron probados en Windows.

Alt + Shift + F - comando para indentar el código.
Control + J - comando para abrir o cerrar la terminal.
Control + S - comando para guardar el archivo actual.
Control + C - (dentro de la terminal) detiene el servidor que se está ejecutando.
F12 - (en el navegador) abre las herramientas de desarrollo y la consola.
```

## Objetivo del Taller 8

Completar las operaciones **CRUD** de nuestra API (crear, leer, actualizar y eliminar), ordenar el servidor con **middlewares** y **rutas en archivos separados**, y utilizar la API desde una **aplicación Ionic** que lista, crea, edita y elimina publicaciones.

En este taller trabajaremos con:

- Los métodos `PUT` y `DELETE`, y los códigos `200`, `204`, `400` y `404`.
- Las propiedades de los métodos HTTP: **seguro** e **idempotente**.
- Middlewares: `morgan`, rutas inexistentes y manejo de errores.
- `express.Router` para organizar las rutas en archivos separados.
- `fetch()` con distintos métodos, y cómo detectar respuestas de error con `response.ok`.

## ¿Qué cambia respecto al taller anterior?

En el Taller 7 la aplicación Ionic era un **probador**: enviaba siempre las mismas 9 peticiones y mostraba la respuesta. Ahora la aplicación **utiliza** la API como lo haría una aplicación real.

Para eso, nuestro servidor necesita poder **actualizar** y **eliminar** publicaciones, operaciones que todavía no existen.

## 1. Archivos del taller

Descarga la carpeta del Taller 8. Contiene dos proyectos:

```text
Taller 8/
├── Taller8.postman_collection.json  → peticiones para probar la API en Postman
├── taller8-backend/                 → el servidor del Taller 7 (con cors)
│   ├── package.json
│   └── servidor.js                  → aquí completarás los pasos 1 al 6
└── taller8-frontend/                → la aplicación Ionic + React
    └── src/
        ├── components/
        │   └── FormularioPublicacion.tsx   → formulario para crear y editar (ya está listo)
        ├── pages/
        │   └── PublicacionesPage.tsx       → la página principal (ya está lista)
        └── services/
            └── api.ts                      → aquí completarás los pasos 7, 8 y 9
```

Importa `Taller8.postman_collection.json` en Postman (botón **Import**). Contiene las peticiones que utilizaremos para probar cada paso.

***Nota:*** El servidor ya incluye `app.use(cors())`, la solución del Taller 7.

## 2. Levantar los proyectos

Como en el Taller 7, utilizaremos dos terminales.

**Terminal 1 (backend):**

```bash
npm config set ignore-scripts true
Explicación: Bloqueamos la ejecución automática de scripts por motivos de seguridad.

cd taller8-backend
npm install
npm run dev
Explicación: Instala las dependencias y levanta el servidor en http://localhost:3000.
```

**Terminal 2 (frontend):**

```bash
cd taller8-frontend
npm install
ionic serve
Explicación: Instala las dependencias y abre la aplicación en http://localhost:8100. 
Recuerda ignorar la sugerencia de actualizaciones para las versiones de las dependencias.
```

***Nota 1:*** El frontend utiliza Ionic 9, React 19 y React Router 6. **No actualices `react-router-dom` a la versión 7**: Ionic 9 requiere la versión 6.

***Nota 2:*** Si el comando `ionic` no es reconocido, instala la interfaz de línea de comandos de Ionic: `npm install -g @ionic/cli`.

---
# Parte 1: Completar la API (backend)

## 3. CRUD y métodos HTTP

CRUD son las cuatro operaciones básicas sobre los datos: **C**rear (*Create*), **L**eer (*Read*), **A**ctualizar (*Update*) y **E**liminar (*Delete*). En una API REST, cada operación corresponde a un método HTTP:

| Operación | Método | Ruta | ¿Existe? |
|---|---|---|---|
| Leer todas | `GET` | `/api/posts` | ✓ (Taller 6) |
| Leer una | `GET` | `/api/posts/:id` | ✓ (Taller 6) |
| Crear | `POST` | `/api/posts` | ✓ (Taller 6) |
| Actualizar | `PUT` | `/api/posts/:id` | Paso 2 |
| Eliminar | `DELETE` | `/api/posts/:id` | Paso 1 |

Observa que la **misma ruta** (`/api/posts/:id`) se utiliza para leer, actualizar y eliminar. Lo que cambia es el **método**.

Antes de comenzar, envía desde Postman la petición **Eliminar publicación**. El servidor responde `404` con `{ "error": "Ruta no encontrada" }`: la ruta todavía no existe.

## 4. Eliminar una publicación (Paso 1)

En `servidor.js`, en el comentario del paso 1, agrega:

```javascript
app.delete("/api/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const existe = posts.some((p) => p.id === id);

  if (!existe) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }

  posts = posts.filter((p) => p.id !== id);
  res.status(204).end();
});
```
**Explicación del fragmento de código anterior:**
```text
some()       → devuelve true si al menos una publicación cumple la condición.
filter()     → crea un nuevo arreglo con todas las publicaciones EXCEPTO la eliminada.
status(204)  → "No Content": la operación funcionó, pero no hay datos que devolver.
end()        → termina la respuesta sin enviar contenido.
```

Prueba **Eliminar publicación** en Postman (`204`) y luego **Todas las publicaciones**: la publicación 2 ya no aparece.

***Nota:*** Por eso declaramos `posts` con `let`: `filter()` crea un arreglo nuevo que reemplaza al anterior. Recuerda que los datos están en memoria; al reiniciar el servidor vuelven a su estado original.

## 5. Actualizar una publicación (Paso 2)

`PUT` **reemplaza** una publicación completa con los datos enviados en el body. En el comentario del paso 2, agrega:

```javascript
app.put("/api/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }

  const datos = req.body;
  if (!datos || !datos.title || !datos.body) {
    return res.status(400).json({ error: "Debes enviar title y body" });
  }

  const actualizado = {
    userId: datos.userId || post.userId,
    id: post.id,
    title: datos.title,
    body: datos.body
  };

  posts = posts.map((p) => (p.id === id ? actualizado : p));
  res.json(actualizado);
});
```

**Explicación del fragmento de código anterior:**
```text
id: post.id                   → el id NO se toma del body: una publicación no puede cambiar su id.
datos.userId || post.userId   → si no se envía userId, se mantiene el que tenía.
map()                         → crea un nuevo arreglo donde la publicación con ese id se reemplaza.
res.json(actualizado)         → responde 200 con la publicación actualizada.
```

Prueba en Postman las tres peticiones de actualización: **Actualizar publicación** (`200`), **Actualizar publicación sin título** (`400`) y **Actualizar publicación inexistente** (`404`).

***Nota:*** Existe también el método `PATCH`, que actualiza **solo una parte** de un recurso (por ejemplo, solo el título). Lo dejaremos como parte del desafío de este taller.

## 6. Experimento: ¿qué pasa si repito una petición?

Realiza el siguiente experimento en Postman y revisa el resultado con **Todas las publicaciones** después de cada punto:

1. Envía **Actualizar publicación** tres veces seguidas.
2. Envía **Crear publicación** tres veces seguidas.
3. Envía **Eliminar publicación** dos veces seguidas.

Observarás que:

- Tres `PUT` iguales dejan la publicación **exactamente igual** que uno solo.
- Tres `POST` iguales crean **tres publicaciones** distintas.
- El primer `DELETE` responde `204` y el segundo `404`, pero el resultado en el servidor es **el mismo**: la publicación no existe.

El estándar HTTP define dos propiedades de los métodos:

| Método | Seguro | Idempotente |
|---|---|---|
| `GET` | ✓ | ✓ |
| `PUT` | ✗ | ✓ |
| `DELETE` | ✗ | ✓ |
| `POST` | ✗ | ✗ |

**Explicación:**
```text
Seguro       → no modifica nada en el servidor; solo consulta.
Idempotente  → repetir la petición deja el servidor en el mismo estado que enviarla una sola vez.
               (Lo que importa es el estado del servidor, no el código de la respuesta.)
```

> Esto tiene consecuencias prácticas: si una petición `PUT` falla por un problema de conexión, se puede reintentar sin riesgo. Si falla un `POST`, reintentarlo podría crear un duplicado.

## 7. Middlewares y `morgan` (Paso 3)

Un **middleware** es una función que se ejecuta entre que llega la petición y que se envía la respuesta. Ya utilizamos varios en los talleres anteriores: `express.json()`, `cors()` y el log manual del Taller 7. Express los ejecuta **en el orden en que se registran**:

En lugar de escribir nuestro propio log, utilizaremos `morgan` (https://www.npmjs.com/package/morgan), un middleware muy utilizado para registrar las peticiones. Detén el servidor (Ctrl+C) e instálalo:

```bash
npm view morgan
npm install morgan
npm run dev
```

En `servidor.js` (paso 3), impórtalo y regístralo como el **primer** middleware:

```javascript
const morgan = require("morgan");
```

```javascript
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
```

Envía algunas peticiones desde Postman. Si configuraste `morgan` correctamente, en la terminal verás una línea por cada petición que llega al servidor:

```text
GET /api/posts 200 765 - 3.490 ms
PUT /api/posts/3 200 78 - 9.158 ms
DELETE /api/posts/2 204 - - 0.338 ms
```

```text
GET /api/posts   → método y ruta
200              → código de estado de la respuesta
765              → tamaño de la respuesta (en bytes)
3.490 ms         → tiempo que tardó el servidor en responder
```

¿Por qué `morgan` debe ir primero? La explicación la veremos en el paso 5.

## 8. Rutas inexistentes con nombre (Paso 4)

El middleware que responde `404` a las rutas inexistentes es una función anónima. Darle un nombre hace el código más fácil de leer. Reemplázalo por:

```javascript
const endpointDesconocido = (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
};

app.use(endpointDesconocido);
```

Recuerda que debe ir **después de todas las rutas**: solo se ejecuta si ninguna ruta respondió antes.

## 9. Manejo de errores (Paso 5)

Envía desde Postman la petición **JSON malformado**. Su body tiene un error (sobra la coma del final).

```json
{
  "title": "JSON con un error",
  "body": "Sobra la coma del final",
}
```

Express responde `400`, pero con una **página HTML** que contiene el detalle del error, incluidas **las rutas de las carpetas de tu computador** (por ejemplo, `.../taller8-backend/node_modules/body-parser/...`). Esto es un problema:

- El cliente espera JSON y recibe HTML.
- Se expone información interna del servidor, útil para un atacante.

Para controlar los errores, Express utiliza un **middleware de errores**, una función con **cuatro parámetros**, donde el primero es el error. En el paso 5, **después** de `app.use(endpointDesconocido)`, agrega el siguiente fragmento de código:

```javascript
const manejadorErrores = (error, req, res, next) => {
  console.error(error.message);

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
  }

  res.status(500).json({ error: "Error interno del servidor" });
};

app.use(manejadorErrores);
```

**Explicación del fragmento de código anterior:**
```text
(error, req, res, next)        → los cuatro parámetros le indican a Express que es un manejador de errores.
                                 Aunque no utilicemos next, debemos declararlo.
entity.parse.failed            → el tipo de error que produce express.json() cuando el JSON no es válido.
console.error(error.message)   → el detalle queda en la terminal del servidor, no en la respuesta.
status(500)                    → "Internal Server Error": cualquier otro error inesperado.
```

Vuelve a enviar la petición **JSON malformado** desde Postman: ahora la respuesta es `400` con un JSON claro, y el detalle aparece solo en la terminal.

***Nota:*** En Express 5, si ocurre un error dentro de una ruta (por ejemplo, con `throw new Error(...)`), también llega a este manejador, que responde `500`.

**¿Por qué `morgan` debe ir primero?** 

Cuando el JSON no es válido, `express.json()` produce un error y Express salta directamente al manejador de errores, omitiendo los middlewares que vienen después. Si `morgan` estuviera después de `express.json()`, esa petición **no aparecería** en la terminal. Pruébalo moviendo `app.use(morgan("tiny"))` debajo de `app.use(express.json())`, y luego vuelve a dejarlo primero.

## 10. Organizar las rutas con `express.Router` (Paso 6)

Nuestro `servidor.js` mezcla la configuración del servidor con todas las rutas de las publicaciones (api/posts). A medida que la API crece (usuarios, comentarios, etc.), un solo archivo se vuelve difícil de mantener. `express.Router` permite agrupar las rutas de un recurso en su propio archivo.

Crea la carpeta `routes` dentro de `taller8-backend` y, dentro de ella, el archivo `posts.js`:

```text
taller8-backend/
├── routes/
│   └── posts.js     → arreglo posts + todas las rutas de /api/posts
└── servidor.js      → configuración, middlewares y montaje de las rutas
```

En `routes/posts.js`, crea el siguiente router:

```javascript
const express = require("express");

const router = express.Router();

// Aquí va el arreglo posts (muévelo desde servidor.js)

// Aquí van las rutas de las publicaciones api/posts (muévelas desde servidor.js)

module.exports = router;
```

Luego **mueve** desde el archivo `servidor.js` el arreglo `posts` y las cinco rutas de publicaciones (api/posts), haciendo los siguientes cambios en cada ruta:

| En `servidor.js` | En `routes/posts.js` |
|---|---|
| `app.get("/api/posts", ...)` | `router.get("/", ...)` |
| `app.get("/api/posts/:id", ...)` | `router.get("/:id", ...)` |
| `app.post("/api/posts", ...)` | `router.post("/", ...)` |
| `app.put("/api/posts/:id", ...)` | `router.put("/:id", ...)` |
| `app.delete("/api/posts/:id", ...)` | `router.delete("/:id", ...)` |

Finalmente, en `servidor.js`, importa el router y asocialo a la ruta `/api/posts`, después de los middlewares y antes de `endpointDesconocido`, utilizando lo siguiente:

Importar el router:
```javascript
const postsRouter = require("./routes/posts");
```
Asociarlo a la ruta:
```javascript
app.use("/api/posts", postsRouter);
```

**Explicación del Router:**
```text
module.exports = router         → permite que otro archivo utilice el router.
require("./routes/posts")       → importa el router (./ indica un archivo de nuestro proyecto).
app.use("/api/posts", ...)      → todas las rutas del router quedan bajo /api/posts:
                                  router.get("/:id") equivale a GET /api/posts/:id
```

Las rutas `/` y `/saludo/:nombre` del Taller 6 se quedan en el archivo `servidor.js`, porque no pertenecen al recurso **publicaciones** (posts).

Envía nuevamente todas las peticiones de la colección de Postman. Si configuraste todo correctamente, deben responder exactamente igual que antes. Organizar el código **no debe cambiar** el comportamiento de la API.

***Nota:*** En algunos tutoriales (por ejemplo, W3Schools) encontrarás `app.all("*", ...)` para responder a las rutas inexistentes. Esa forma produce un error en Express 5; por eso en este taller utilizamos `app.use(endpointDesconocido)`.

---
# Parte 2: Utilizar la API desde Ionic (frontend)

## 11. La aplicación

Abre `http://localhost:8100`. La aplicación ya está implementada:

- **Lista** de publicaciones, cargada con `GET /api/posts` al abrir la página.
- **Filtro** por usuario en la parte superior.
- Botón **+** para crear una publicación (`POST`).
- **Tocar** una publicación abre el formulario para editarla (`PUT`).
- **Deslizar** una publicación hacia la izquierda muestra el botón **Eliminar**, que pide confirmación (`DELETE`). También puedes eliminar desde el formulario de edición.
- Los mensajes del servidor se muestran en la parte inferior de la pantalla.

Las peticiones al servidor están en `src/services/api.ts`. Listar y crear ya funcionan. Prueba lo siguiente:

- Crea una publicación **sin título**: aparece el mensaje *"Debes enviar title y body"*. La aplicación no valida el formulario a propósito: ese mensaje lo envió **el servidor** con un `400`.
- Filtra por **Usuario 2**: siguen apareciendo todas las publicaciones y un aviso indica que falta el paso 7.
- Edita o elimina una publicación: aparece un mensaje indicando que falta el paso 8 o el paso 9.

***Nota:*** Si completaste el frontend antes que el backend, al editar o eliminar verás *"Ruta no encontrada"*. Ese mensaje lo envió el servidor: la aplicación funciona, pero la ruta `PUT` o `DELETE` todavía no existe.

## 12. `fetch()` y `response.ok`

Abre `src/services/api.ts` y revisa la función `procesarRespuesta`, que ya está lista:

```tsx
const procesarRespuesta = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }
  const texto = await response.text();
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    datos = null;
  }
  if (!response.ok) {
    throw new Error(datos?.error ?? `El servidor respondió con el código ${response.status}`);
  }
  return datos;
};
```

Hay un detalle importante sobre `fetch()`: **solo falla cuando no recibe respuesta**, por ejemplo por un error de CORS o porque el servidor está apagado. Un `400` o un `404` **sí son respuestas**, así que `fetch()` las entrega como si todo hubiera funcionado.

**Explicación:**
```text
response.ok              → true si el código está entre 200 y 299.
!response.ok             → lanzamos un error con el mensaje que envió el servidor ({ error: "..." }).
status === 204           → no hay contenido que leer (lo usaremos al eliminar).
```

Así, la página puede utilizar `try/catch` y mostrar el mensaje del servidor cuando algo falla.

## 13. Filtrar por usuario (Paso 7)

En el Taller 6 creamos el filtro `GET /api/posts?userId=2`. La función `obtenerPublicaciones` recibe un `userId` opcional, pero todavía no lo envía. Complétala:

```tsx
export const obtenerPublicaciones = async (userId?: number): Promise<Publicacion[]> => {
  const url = userId ? `${API_URL}/api/posts?userId=${userId}` : `${API_URL}/api/posts`;
  const response = await fetch(url);
  return procesarRespuesta(response);
};
```

**Explicación del fragmento de código anterior:**
```text
userId?: number   → el ? indica que el parámetro es opcional ("Todas" no envía userId).
condición ? a : b → si hay userId, se utiliza la URL con el parámetro de consulta; si no, la URL sin filtro.
```

Guarda y prueba el filtro en la aplicación.

## 14. Editar una publicación (Paso 8)

Completa `actualizarPublicacion`, reemplazando la línea `throw new Error(...)`. Es muy parecida a `crearPublicacion`, pero cambian el método y la URL:

```tsx
export const actualizarPublicacion = async (id: number, datos: DatosPublicacion): Promise<Publicacion> => {
  const response = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });
  return procesarRespuesta(response);
};
```

Edita una publicación en la aplicación y guarda. Prueba también borrar el título y guardar: el servidor responde `400` y el formulario queda abierto para que puedas corregirlo.

## 15. Eliminar una publicación (Paso 9)

Completa `eliminarPublicacion`. Una petición `DELETE` no necesita headers ni body:

```tsx
export const eliminarPublicacion = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/posts/${id}`, { method: "DELETE" });
  await procesarRespuesta(response);
};
```

Desliza una publicación hacia la izquierda, presiona **Eliminar** y confirma.

## 16. Observar las peticiones en la terminal

Con la aplicación funcionando, observa la terminal del backend (servidor) mientras creas, editas y eliminas. `morgan` muestra algo similar a:

```text
OPTIONS /api/posts/3 204 0 - 0.210 ms
PUT /api/posts/3 200 135 - 2.497 ms
GET /api/posts 200 861 - 0.399 ms
OPTIONS /api/posts/2 204 0 - 0.147 ms
DELETE /api/posts/2 204 - - 0.328 ms
```

- Antes de cada `POST`, `PUT` y `DELETE` aparece una petición `OPTIONS`: es la **verificación previa (preflight)** del Taller 7. El navegador pregunta si tiene permiso y `cors()` lo autoriza.
- Después de cada operación aparece un `GET /api/posts`: la aplicación recarga la lista.

***Nota:*** A veces verás `GET /api/posts 304`. El código `304 Not Modified` significa que la lista no cambió desde la última vez, por lo que el navegador reutiliza la copia que ya tenía.

Por último, prueba qué ocurre cuando dos clientes modifican los mismos datos: elimina una publicación desde **Postman** y luego intenta editarla en la aplicación (sin recargar). El servidor responde `404` y la aplicación muestra *"Publicación no encontrada"*.

## 17. Comparación con el taller anterior

| Taller 7 | Taller 8 |
|---|---|
| La app envía 9 peticiones fijas | La app envía peticiones según lo que hace el usuario |
| `GET` y `POST` | `GET`, `POST`, `PUT` y `DELETE` (CRUD completo) |
| Funciones de `fetch()` sin parámetros | Funciones con parámetros (`id`, `datos`) |
| Se muestra la respuesta tal como llega | Se revisa `response.ok` y se muestra el mensaje del servidor |
| Todo el servidor en `servidor.js` | Rutas en `routes/posts.js` con `express.Router` |
| Log manual de peticiones | `morgan` y un middleware de errores |

> En el Taller 7 conectamos la aplicación con el servidor. Ahora la aplicación puede modificar los datos, y el servidor responde de forma ordenada y predecible, incluso cuando algo sale mal.

---
# Desafío

1. Implementa la ruta `PATCH /api/posts/:id`, que actualice **solo** los campos enviados en el body (por ejemplo, solo el `title`). Pruébala en Postman: ¿qué diferencia hay con enviar un `PUT` con solo el título?

respuesta: Diferencia con PUT: PUT exige reemplazar la publicación completa (requiere title y body), mientras que PATCH aplica actualizaciones parciales conservando los campos no enviados.

2. En la aplicación, después de eliminar una publicación, muestra un mensaje con un botón **Deshacer** que vuelva a crearla con `POST` (pista: el componente `IonToast` acepta botones). ¿La publicación recuperada tiene el mismo `id` que antes? ¿Por qué?

respuesta: No.
Porque al usar POST, el servidor siempre genera un nuevo id automáticamente sumándole 1 al más alto que exista en ese momento.

## Referencias

- Full Stack Open, parte 3 - Node.js y Express: https://fullstackopen.com/es/part3/node_js_y_express
- W3Schools - Node.js Express.js: https://www.w3schools.com/nodejs/nodejs_express.asp
- Express - Enrutamiento y express.Router: https://expressjs.com/es/guide/routing.html
- Express - Uso de middleware: https://expressjs.com/es/guide/using-middleware.html
- Express - Manejo de errores: https://expressjs.com/es/guide/error-handling.html
- Paquete morgan: https://www.npmjs.com/package/morgan
- MDN - Métodos de petición HTTP: https://developer.mozilla.org/es/docs/Web/HTTP/Methods
- MDN - Glosario: Idempotente: https://developer.mozilla.org/es/docs/Glossary/Idempotent
- Ionic React - Componentes: https://ionicframework.com/docs/components
