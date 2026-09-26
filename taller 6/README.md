# Taller 6: Node.js + Express (Backend)

**Nota**: Durante todos nuestros talleres utilizaremos el editor de código Visual Studio Code. Para dudas respecto a la interfaz del editor puedes consultar la documentación oficial en: https://code.visualstudio.com/docs/editing/getting-started

## Algunos comandos útiles para VSCode
```text
Nota: Los siguientes comandos fueron probados en Windows.

Alt + Shift + F - comando para indentar el código.
Control + J - comando para abrir o cerrar la terminal.
Control + S - comando para guardar el archivo actual.
Control + C - (dentro de la terminal) detiene el servidor que se está ejecutando.
```

## Objetivo del Taller 6

Crear y levantar nuestro primer **servidor web** utilizando **Node.js** y **Express**, programar respuestas a peticiones simples y probarlas utilizando **Postman**.

En este taller trabajaremos con:

- npm: crear un proyecto e instalar librerías.
- Express: crear un servidor y definir rutas (`GET` y `POST`).
- Respuestas en texto y en formato JSON.
- Parámetros de ruta (`req.params`) y parámetros de consulta (`req.query`).
- Códigos de estado HTTP (`200`, `201`, `400`, `404`).
- Postman: enviar peticiones y revisar las respuestas del servidor.


## Conceptos previos: peticiones y respuestas

La comunicación entre un cliente y un servidor web utiliza el protocolo **HTTP**. Cada **petición** (request) contiene, entre otras cosas:

- Un **método**, que indica qué queremos hacer.
- Una **URL**, que indica a qué recurso queremos acceder.
- Opcionalmente, un **cuerpo** (body) con datos, normalmente en formato JSON.

Los métodos más utilizados son:

| Método | Uso |
|---|---|
| `GET` | Obtener información |
| `POST` | Crear información nueva |
| `PUT` | Actualizar información existente |
| `DELETE` | Eliminar información |

El servidor devuelve una **respuesta** (response) que siempre incluye un **código de estado**, y opcionalmente datos:

| Código | Significado |
|---|---|
| `200 OK` | La petición funcionó correctamente |
| `201 Created` | Se creó un nuevo recurso |
| `400 Bad Request` | La petición tiene datos incorrectos o incompletos |
| `404 Not Found` | El recurso solicitado no existe |

***Nota:*** Puedes leer más acerca de los códigos de estado en: https://developer.mozilla.org/es/docs/Web/HTTP/Status

## 1. Primer paso: Crear el proyecto

Verifica que tienes Node y npm instalados:

```bash
node -v
npm -v
Explicación: Estos comandos muestran la versión instalada de Node y npm. Si alguno falla, descarga Node desde https://nodejs.org.
```

Crea una carpeta para el proyecto e ingresa a ella:

```bash
mkdir taller6-backend
cd taller6-backend
```

Crea el proyecto de Node:

```bash
npm init -y
Explicación: Este comando crea el archivo package.json con valores por defecto (-y responde "sí" a todas las preguntas).
```

El archivo `package.json` contiene la información del proyecto: su nombre, versión, los comandos (scripts) disponibles y las librerías que utiliza (dependencias).

Abre `package.json` y modifica la sección `scripts` para que quede de la siguiente forma:

```json
"scripts": {
  "start": "node servidor.js",
  "dev": "node --watch servidor.js"
},
```

```text
npm start    → levanta el servidor.
npm run dev  → levanta el servidor y lo reinicia automáticamente cada vez que guardamos un cambio.
```

***Nota:*** Sin la opción `--watch` tendríamos que detener el servidor (`Control + C`) y volver a levantarlo manualmente cada vez que modificamos el código.

## 2. Instalar Express

**Express** es un framework muy popular para crear servidores web con Node.js. Nos permite definir, de forma sencilla, qué debe responder el servidor ante cada petición.

Tal como en el Taller 4, primero bloqueamos la ejecución automática de scripts y revisamos el paquete antes de instalarlo:

```bash
npm config set ignore-scripts true
Explicación: Este comando le indica a npm que bloquee la ejecución automática de cualquier script; Se recomienda utilizarlo por motivos de seguridad.

npm view express
Explicación: Muestra información sobre el paquete express (versión, autores, dependencias, etc.).

npm install express
Explicación: Instala Express como dependencia del proyecto.
```

Después de la instalación ocurren tres cosas:

```text
node_modules/        → carpeta con el código de Express y de las librerías que necesita.
package-lock.json    → registra las versiones exactas que se instalaron.
package.json         → ahora incluye express en la sección "dependencies".
```

***Importante:*** La carpeta `node_modules` puede pesar mucho y **nunca** se sube a nuestro repositorio en GitHub.

## 3. Archivos del taller

Nuestro proyecto tendrá la siguiente estructura:

```text
taller6-backend/
├── node_modules/
├── servidor.js
├── package.json
└── package-lock.json
```

Descarga el archivo `servidor.js` que encontrarás en los archivos del Taller 6 y cópialo dentro de la carpeta `taller6-backend`. Este archivo contiene comentarios numerados (pasos) que te servirán de apoyo para completar el taller y un arreglo `posts` con publicaciones de ejemplo.

## 4. Nuestro primer servidor (Pasos 1 al 4)

Importa Express y crea la aplicación:

```javascript
const express = require("express");
const app = express();
```

`require()` cumple la misma función que el `import` que utilizamos en React: nos permite utilizar código de otra librería.

Crea la primera ruta:

```javascript
app.get("/", (req, res) => {
  res.send("¡Hola desde mi primer servidor con Express!");
});
```

El fragmento de código anterior puede interpretarse de la siguiente forma:

```text
app.get                      → cuando llegue una petición con el método GET...
"/"                          → ...a la ruta "/" (la raíz)...
(req, res) => {...}          → ...ejecuta esta función.
req (request)                → contiene la información de la petición que llegó.
res (response)               → nos permite construir la respuesta.
res.send(...)                → envía la respuesta al cliente.
```

Por último, al final del archivo, levanta el servidor:

```javascript
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
```

```text
Explicación:
app.listen(PORT, ...)  → el servidor queda "escuchando" peticiones en el puerto 3000.
localhost              → significa "este mismo computador".
```

Levanta el servidor en modo desarrollo usando el siguiente comando:

```bash
npm run dev
```

En la terminal debería aparecer el mensaje `Servidor ejecutándose en http://localhost:3000`. Abre esa dirección en el navegador para ver la respuesta de tu servidor. ¡Felicitaciones, levantaste tu primer servidor!

Observa que la terminal queda "ocupada": el servidor se mantiene ejecutándose, esperando peticiones, hasta que lo detengas con `Control + C`. A partir de ahora, cada vez que guardes `servidor.js`, el servidor se reiniciará automáticamente.

***Nota:*** Si aparece el error `EADDRINUSE`, significa que el puerto asignado ya está siendo utilizado (por ejemplo, porque dejaste el servidor ejecutándose en otra terminal). Detén el otro servidor o cambia el valor de la variable `PORT`.

## 5. Probar el servidor con Postman

El navegador solo nos permite enviar fácilmente peticiones `GET`. Para probar otros métodos, enviar datos y revisar los detalles de cada respuesta utilizaremos **Postman**.

1. Descarga e instala la aplicación de escritorio desde https://www.postman.com/downloads/
2. Al abrirla puedes crear una cuenta o continuar sin ella.
3. Crea una **colección** (Collections → **+**) llamada `Taller 6`. Una colección nos permite guardar y organizar nuestras peticiones.
4. Dentro de la colección, crea una nueva petición (**Add request**).

***Importante:*** Utiliza la aplicación de **escritorio**. La versión web de Postman no puede acceder a `localhost` sin instalar un programa adicional.

La pantalla de una petición en Postman tiene las siguientes partes:

```text
┌────────┬───────────────────────────────────┬────────┐
│  GET ▼ │ http://localhost:3000/            │  Send  │   ← método, URL y botón para enviar
├────────┴───────────────────────────────────┴────────┤
│ Params | Authorization | Headers | Body | ...       │   ← datos que enviamos en la petición
├─────────────────────────────────────────────────────┤
│ Body | Headers         Status: 200 OK  Time: 5 ms   │   ← respuesta del servidor
│ ¡Hola desde mi primer servidor con Express!         │
└─────────────────────────────────────────────────────┘
```

Selecciona el método `GET`, escribe la URL `http://localhost:3000/` y presiona **Send**. En la parte inferior verás la respuesta del servidor, el código de estado (`200 OK`) y el tiempo que tardó. Guarda la petición con `Control + S`.

Repite este proceso para probar cada ruta que crees durante el taller. Al finalizar tendrás una colección con todas las peticiones de tu API.

***Nota:*** Puedes leer más en la documentación oficial de Postman: https://learning.postman.com/docs/sending-requests/requests/

## 6. Parámetros de ruta (Paso 5)

Muchas veces necesitamos que una parte de la URL sea variable. Para eso utilizamos un **parámetro de ruta**, que se define con dos puntos (`:`):

```javascript
app.get("/saludo/:nombre", (req, res) => {
  res.send(`¡Hola, ${req.params.nombre}!`);
});
```

```text
/saludo/Camila     → req.params.nombre vale "Camila"
/saludo/Diego      → req.params.nombre vale "Diego"
```

Prueba en Postman la petición `GET http://localhost:3000/saludo/TuNombre`.

## 7. Responder con JSON (Paso 6)

Hasta ahora nuestro servidor responde con texto. Las APIs, como JSONPlaceholder, normalmente responden con datos en formato **JSON**. Crea la siguiente ruta:

```javascript
app.get("/api/posts", (req, res) => {
  res.json(posts);
});
```

`res.json()` convierte el arreglo de JavaScript a formato JSON y lo envía al cliente, indicando que el contenido es de tipo `application/json`.

Prueba en Postman la petición `GET http://localhost:3000/api/posts`. Observa que Postman muestra el JSON con formato y colores, y que en la pestaña **Headers** de la respuesta aparece `Content-Type: application/json`. Es la misma estructura que recibíamos de https://jsonplaceholder.typicode.com/posts en el Taller 4, pero ahora viene de nuestro propio servidor.

***Nota:*** El prefijo `/api` es una convención para diferenciar las rutas que devuelven datos.

## 8. Obtener una publicación y responder 404 (Paso 7)

Combinando lo que aprendimos en los pasos anteriores, podemos responder con una sola publicación según su `id`:

```javascript
app.get("/api/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);

  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: "Publicación no encontrada" });
  }
});
```

```text
Number(...)      → los parámetros siempre llegan como texto. Sin esta conversión, "3" === 3 sería false.
find()           → devuelve el primer elemento que cumple la condición, o undefined si no existe.
res.status(404)  → define el código de estado de la respuesta antes de enviarla.
```

Prueba en Postman `GET http://localhost:3000/api/posts/3` y luego `GET http://localhost:3000/api/posts/999`. Observa cómo cambia el código de estado de la respuesta.

***Nota:*** Si en algún momento algo no funciona, utiliza `console.log()` dentro de la ruta. Los mensajes aparecerán en la **terminal** de VSCode, no en Postman ni en el navegador, ya que este código se ejecuta en el servidor.

## 9. Parámetros de consulta (Paso 8)

Los **parámetros de consulta** (query parameters) se escriben al final de la URL, después de un signo `?`, con el formato `clave=valor`. Se utilizan, por ejemplo, para filtrar o buscar información:

```text
http://localhost:3000/api/posts?userId=2     → req.query.userId vale "2"
```

Modifica la ruta `GET /api/posts` del paso 6 para que, si recibe el parámetro `userId`, responda solo con las publicaciones de ese usuario:

```javascript
app.get("/api/posts", (req, res) => {
  const userId = req.query.userId;

  if (userId) {
    const filtrados = posts.filter((p) => p.userId === Number(userId));
    return res.json(filtrados);
  }

  res.json(posts);
});
```

En Postman puedes escribir los parámetros directamente en la URL, o utilizar la pestaña **Params** de la petición: al completar `Key = userId` y `Value = 2`, Postman los agregará a la URL automáticamente.

***Nota:*** El `return` detiene la función después de enviar la respuesta. Una petición solo puede tener **una** respuesta; si intentas enviar dos, aparecerá un error en la terminal.

## 10. Crear una publicación con POST (Pasos 9 y 10)

Cuando un cliente quiere crear información, envía una petición `POST` con los datos en el **cuerpo** (body) en formato JSON. Para que Express pueda leerlos, agrega la siguiente línea al inicio del archivo, después de crear `app`:

```javascript
app.use(express.json());
```

Sin esta línea, `req.body` sería `undefined`.

Crea la ruta que recibe los datos y agrega la nueva publicación:

```javascript
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
```

```text
req.body          → los datos que envió el cliente, ya convertidos a objeto de JavaScript.
status(400)       → la petición está incompleta; respondemos con un mensaje de error.
Math.max(...)     → busca el id más alto de las publicaciones y le suma 1.
push()            → agrega la nueva publicación al arreglo.
status(201)       → se creó un nuevo recurso; respondemos con la publicación creada.
```

Para probarla en Postman:

1. Crea una nueva petición y selecciona el método `POST`.
2. Escribe la URL `http://localhost:3000/api/posts`.
3. Ve a la pestaña **Body**, selecciona **raw** y en el menú de la derecha elige **JSON**.
4. Escribe los datos de la publicación y presiona **Send**:

```json
{
  "userId": 1,
  "title": "Mi primera publicación",
  "body": "Creada desde Postman"
}
```

Deberías recibir la publicación creada con su nuevo `id` y el código `201 Created`. Vuelve a enviar la petición `GET /api/posts` para verificar que se agregó. Luego prueba enviar una publicación **sin** `title` y observa el código `400`.

***Importante:*** Nuestros datos están guardados en una variable, es decir, en la memoria del servidor. Cada vez que el servidor se reinicia (por ejemplo, al guardar `servidor.js`), las publicaciones vuelven a su estado original. En talleres futuros aprenderemos a guardar los datos en una base de datos.

## 11. Rutas que no existen (Paso 11)

¿Qué ocurre si en Postman envías `GET http://localhost:3000/no-existe`? Express responde con un mensaje por defecto. Sin embargo, podemos personalizar esa respuesta agregando lo siguiente **después de todas las rutas** y **antes** de `app.listen()`:

```javascript
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});
```

Express revisa las rutas **en el orden en que fueron definidas**. Si ninguna coincide con la petición, llega a esta función, que responde con el código `404`.

## 12. Resultado esperado

Tu servidor debería permitir:

1. Levantarse con `npm run dev` en el puerto 3000 (o el que especificaste).
2. Responder con un mensaje de bienvenida en `GET /`.
3. Responder con un saludo personalizado en `GET /saludo/:nombre`.
4. Responder con todas las publicaciones en formato JSON en `GET /api/posts`.
5. Filtrar las publicaciones por usuario con `GET /api/posts?userId=...`.
6. Responder con una publicación en `GET /api/posts/:id` (y `404` si no existe).
7. Crear una publicación con `POST /api/posts` (y responder `400` si faltan datos).
8. Responder `404` a las rutas que no existen.

Además, deberías tener una colección de Postman llamada `Taller 6` con una petición guardada para cada punto anterior. Para compartirla, haz clic en los tres puntos (**...**) de la colección → **Export**, y se descargará un archivo `.json`.


## Referencias

- Full Stack Open, parte 3 - Node.js y Express: https://fullstackopen.com/es/part3/node_js_y_express
- W3Schools - Node.js Express.js: https://www.w3schools.com/nodejs/nodejs_express.asp
- Documentación de Express: https://expressjs.com/es/
- Rutas en Express: https://expressjs.com/es/guide/routing.html
- Postman - Enviar peticiones: https://learning.postman.com/docs/sending-requests/requests/
- Códigos de estado HTTP (MDN): https://developer.mozilla.org/es/docs/Web/HTTP/Status
