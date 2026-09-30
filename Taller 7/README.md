# Taller 7: Ionic + React + Express (CORS)

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

## Objetivo del Taller 7

Conectar una aplicación creada con **Ionic + React** con el servidor **Express** que creamos en el Taller 6, enfrentarnos al error de **CORS** y solucionarlo de dos formas distintas.

En este taller trabajaremos con:

- `fetch()` para consultar nuestro propio servidor desde el navegador.
- El concepto de **origen** y la política de mismo origen del navegador.
- Solución 1: el paquete `cors` en el servidor.
- Solución 2: el **proxy de desarrollo** de Ionic.

## 1. Archivos del taller

Descarga la carpeta del Taller 7. Contiene dos proyectos independientes:

```text
Taller 7/
├── taller7-backend/          → el servidor Express del Taller 6
│   ├── package.json
│   └── servidor.js
└── taller7-frontend/         → aplicación Ionic + React 
    ├── src/
    │   ├── pages/
    │   │   ├── PruebasPage.tsx   → Vista que se desplegara
    │   │   └── PruebasPage.css
    │   ├── services/
    │   │   └── api.ts            → aquí debes completar las URLs (rutas) hacía el servidor (Parte 1)
    │   └── App.tsx
    ├── package.json
    └── vite.config.ts            → aquí debes configurar el proxy (Parte 2)
```

El frontend ya está implementado. Contiene una página con las **mismas 9 peticiones** que probamos a través de Postman en el Taller 6. Solo falta indicar en cada `fetch()` a qué dirección se debe enviar la petición.


## 2. Levantar el servidor

Abre una terminal en VSCode, ingresa a la carpeta del backend e instala sus dependencias:

```bash
cd taller7-backend
npm install
Explicación: Instala las dependencias indicadas en package.json (en este caso, Express).

npm run dev
Explicación: Levanta el servidor en http://localhost:3000 y lo reinicia al guardar cambios.
```

Deja esta terminal abierta, ya que el servidor debe seguir ejecutándose.

## 3. Levantar el Frontend

Abre una **segunda terminal** (botón **+** de la terminal de VSCode) e ingresa a la carpeta del frontend:

```bash
cd taller7-frontend
npm install
Explicación: Esto instalará Ionic, React y el resto de dependencias del proyecto. Puede tardar algunos minutos.

ionic serve
Explicación: Levanta el servidor de desarrollo de Ionic y abre la aplicación en http://localhost:8100.
```

***Nota:*** Si el comando `ionic` no es reconocido, instala la interfaz de línea de comandos de Ionic tal como en el Taller 4: `npm install -g @ionic/cli`.

A partir de ahora trabajaremos con **dos servidores al mismo tiempo**, cada uno en su terminal:

```text
Terminal 1 (taller7-backend):   npm run dev    → http://localhost:3000   (Express)
Terminal 2 (taller7-frontend):  ionic serve    → http://localhost:8100   (Ionic)
```

En el navegador verás la página **Pruebas de la API**. Presiona el botón **Enviar todas**: cada petición mostrará el aviso *"La URL de esta petición está vacía o incompleta"*. Es lo esperado, ya que aún no completamos las URL.

## 4. Completar las URL (Pasos 1 al 10)

Abre el archivo `src/services/api.ts` en la carpeta del frontend (Ionic). Cada función corresponde a una petición, y ya incluye el método, los headers y el body. Solo falta la URL.

Primero, en el paso 1, escribe la dirección del servidor Express:

```tsx
export const API_URL = "http://localhost:3000";
```

Luego completa cada `fetch()` combinando `API_URL` con la ruta correspondiente. Por ejemplo, el paso 2:

```tsx
export const obtenerBienvenida = () =>
  fetch(`${API_URL}/`);
```

```text
`${API_URL}/`  → las comillas invertidas permiten insertar variables dentro de un texto.
               → el resultado es "http://localhost:3000/"
```

Completa los pasos 3 al 10 utilizando como base las peticiones realizadas durante el Taller 6.

***Nota:*** Utilizamos `API_URL` para escribir la dirección del servidor **una sola vez**. En la segunda parte del taller cambiaremos esa línea y todas las peticiones se actualizarán.

## 5. ¡Error!

Presiona el botón **Enviar todas**. Todas las peticiones muestran **Sin respuesta** y el mensaje `TypeError: Failed to fetch`.

Abre la consola del navegador. Verás un mensaje como el siguiente por cada petición:

```text
Access to...
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
on the requested resource.
```

## 6. ¿Qué es CORS?

El **origen** de una página web está formado por tres partes: el **protocolo**, el **dominio** y el **puerto**.

| | Protocolo | Dominio | Puerto |
|---|---|---|---|
| Frontend (Ionic+React)| `http` | `localhost` | `8100` |
| Backend (Express) | `http` | `localhost` | `3000` |

Basta con que una de las tres partes sea distinta para que sean **orígenes diferentes**. En nuestro caso, cambia el puerto en que se despliega el frontend y el backend.

Por seguridad, los navegadores aplican la **política de mismo origen**, es decir, una página solo puede leer las respuestas de su propio origen. Si quiere leer la respuesta de otro origen, el servidor debe autorizarlo explícitamente enviando el header `Access-Control-Allow-Origin`. Este mecanismo se llama **CORS** (*Cross-Origin Resource Sharing*).

***Importante:*** CORS **no** es un error del servidor ni de nuestro código. Es una protección del navegador. Puedes leer más acerca de CORS en: https://developer.mozilla.org/es/docs/Web/HTTP/CORS

## 7. Experimento: ¿la petición llega al servidor?

Agrega el siguiente middleware en `servidor.js`, justo después de crear `app`:

```javascript
app.use((req, res, next) => {
  console.log("Llegó:", req.method, req.url);
  next();
});
```

Guarda el archivo y presiona **Enviar todas** en la aplicación. En la terminal del backend verás algo similar a:

```text
Llegó: GET /
Llegó: GET /saludo/Nombre
Llegó: GET /api/posts
Llegó: GET /api/posts/1
Llegó: GET /api/posts/999
Llegó: GET /api/posts?userId=2
Llegó: OPTIONS /api/posts
Llegó: OPTIONS /api/posts
Llegó: GET /no-existe
```

Observa dos cosas:

1. Las peticiones `GET` **sí llegan** al servidor, y el servidor **sí responde**. Es el navegador quien recibe la respuesta y **no permite** que nuestra aplicación la procese.
2. Las peticiones `POST` **nunca llegan**. En su lugar llega una petición `OPTIONS`.

Esa petición `OPTIONS` se llama **preflight** (verificación previa). Antes de enviar ciertas peticiones, por ejemplo un `POST` con datos en formato JSON, el navegador pregunta al servidor si tiene permiso para enviarlas. Nuestro servidor no tiene una ruta para `OPTIONS`, así que la petición termina en el middleware que responde `404` a las rutas inexistentes, sin autorización. Por lo tanto, el navegador **cancela** el `POST`.

En la consola del navegador, el mensaje de error de los `POST` es distinto:

```text
Access to fetch at...
has been blocked by CORS policy: Response to preflight request doesn't pass access
control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

***Nota:*** En algunos navegadores también puedes revisar la pestaña **Network** (Red) de las herramientas de desarrollo. Las peticiones bloqueadas aparecen con el estado *CORS error*, y las verificaciones previas aparecen con el tipo *preflight*.


---
# Parte 1: Solucionar CORS en el servidor

## 8. Instalar el paquete `cors`

En la terminal del backend, detén el servidor (`Control + C`) e instala el paquete `cors`:

```bash
npm view cors
Explicación: Muestra información sobre el paquete antes de instalarlo.

npm install cors
Explicación: Instala el paquete cors y lo agrega a las dependencias de package.json.

npm run dev
Explicación: Vuelve a levantar el servidor.
```

En `servidor.js`, importa el paquete y agrégalo como middleware **inmediatamente después de crear `app`**, antes de cualquier ruta:

```javascript
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
```

Guarda el archivo y presiona **Enviar todas**. Ahora cada petición debería mostrar el mismo código de estado que obtenías en Postman:

| Petición | Código |
|---|---|
| Mensaje de bienvenida | `200` |
| Saludo personalizado | `200` |
| Todas las publicaciones | `200` |
| Una publicación | `200` |
| Publicación inexistente | `404` |
| Publicaciones de un usuario | `200` |
| Crear publicación | `201` |
| Crear publicación sin título | `400` |
| Ruta inexistente | `404` |

¿Qué hizo `app.use(cors())`?

```text
1. Agrega el header Access-Control-Allow-Origin: * a cada respuesta.
   El * significa "cualquier origen puede leer esta respuesta".
2. Responde las peticiones OPTIONS (preflight) autorizando el método y los headers.
```

Si quieres puedes comprobar este utilizando Postman. Envía cualquier petición y revisa la pestaña **Headers** de la respuesta. Ahora aparece `Access-Control-Allow-Origin: *`. En la terminal, además, verás que después de cada `OPTIONS` ahora sí llega el `POST`.

En la consola del navegador seguirás viendo líneas rojas como `Failed to load resource: the server responded with a status of 404 (Not Found)`. No son errores de CORS: el navegador registra todas las respuestas con códigos `400` o `404`, y en esas peticiones es justamente lo que esperamos.

***Nota:*** Permitir cualquier origen (`*`) es práctico mientras desarrollamos. En un proyecto real conviene permitir solo el origen de nuestro frontend. Puedes leer más en: https://www.npmjs.com/package/cors

## 9. Problema frecuente: `cors()` en el lugar incorrecto

Realiza el siguiente experimento. Mueve la línea `app.use(cors());` al final del archivo, justo **antes** del middleware que responde `404`:

```javascript
// ... todas las rutas ...

app.use(cors());

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});
```

Guarda este cambio y luego presiona el botón **Enviar todas**. Ocurre lo siguiente:

- Casi todas las peticiones vuelven a fallar por CORS.
- Solo **Ruta inexistente** funciona.
- Las peticiones **Crear publicación** muestran error... pero si consultas `GET /api/posts` desde Postman, **la publicación sí se creó**.

Recuerda que Express revisa el código **de arriba hacia abajo**. Las rutas que están antes de `cors()` responden sin el header de autorización, por lo que el navegador bloquea la respuesta. En cambio, las peticiones que no coinciden con ninguna ruta (`OPTIONS` y `/no-existe`) sí pasan por `cors()`. Por eso el preflight se autoriza, el `POST` llega al servidor y la publicación se guarda, aunque el frontend nunca recibe la respuesta.

***Importante:*** Este es un error difícil de detectar: el usuario ve un error, pero la operación sí se realizó. Por eso `app.use(cors())` debe ir **antes de todas las rutas**.

Vuelve a dejar `app.use(cors());` inmediatamente después de crear `app`.

***Nota:*** Si en algún momento guardas `servidor.js` y los cambios no se reflejan, detén el servidor con `Control + C` y vuelve a levantarlo con `npm run dev`.

---
# Parte 2: Solucionar CORS con el proxy de desarrollo de Ionic

## 10. ¿Otra forma de solucionarlo?

A veces no podemos modificar el servidor, por ejemplo cuando la API pertenece a otra persona. En esos casos, durante el desarrollo, podemos evitar el problema desde el frontend.

Primero, **desactiva** la solución anterior comentando la línea en `servidor.js`:

```javascript
// app.use(cors());
```

Presiona **Enviar todas** y verifica que el error de CORS volvió a aparecer.

## 11. Configurar un proxy

`ionic serve` utiliza internamente **Vite**, la herramienta que ejecuta nuestro proyecto en desarrollo. Podemos configurar un proxy en el archivo `vite.config.ts` del frontend. Agrega la sección `server`:

```ts
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  server: {
    proxy: {
      "/servidor": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/servidor/, "")
      }
    }
  },
  test: {
    // ... (sin cambios)
  }
})
```

El fragmento de código anterior puede interpretarse de la siguiente forma:

```text
"/servidor"     → las peticiones cuya ruta comience con /servidor se reenviarán.
target          → dirección del servidor al que se reenvían (Express).
changeOrigin    → el proxy se presenta ante Express con la dirección de destino.
rewrite         → quita /servidor antes de reenviar:
                  /servidor/api/posts  →  /api/posts
```

Luego, en `src/services/api.ts`, cambia la dirección del servidor:

```tsx
export const API_URL = "/servidor";
```

Gracias a que todas las URL utilizan `API_URL`, este único cambio actualiza las 9 peticiones. Ahora son direcciones **relativas**: se envían al mismo origen de la aplicación (`localhost:8100`).

Guarda ambos archivos. Al guardar `vite.config.ts`, el servidor de Ionic se reinicia automáticamente (lo verás en la terminal del frontend). Si no ocurre, detén `ionic serve` con `Control + C` y vuelve a ejecutarlo.

Presiona el botón **Enviar todas**: las 9 peticiones vuelven a funcionar, **sin** `cors()` en el servidor. Observa la URL que muestra cada resultado: ahora es `http://localhost:8100/servidor/...`.

***Nota:*** ¿Por qué utilizamos el prefijo `/servidor` y no simplemente `/api`? Nuestro servidor tiene rutas que no comienzan con `/api` (`/`, `/saludo/:nombre` y `/no-existe`). Además, la ruta `/` ya pertenece a la aplicación Ionic. El prefijo permite distinguir qué peticiones son para Express. Si todas las rutas del servidor comenzaran con `/api`, bastaría con configurar `"/api"` sin `rewrite`.

***Nota:*** Puedes leer más acerca del proxy en la documentación de Vite: https://vite.dev/config/server-options#server-proxy

## 12. ¿Cuál solución utilizar?

| | Paquete `cors` | Proxy de desarrollo |
|---|---|---|
| ¿Dónde se configura? | En el servidor (`servidor.js`) | En el frontend (`vite.config.ts`) |
| ¿Hay que modificar el servidor? | Sí | No |
| ¿Qué orígenes ve el navegador? | Dos orígenes distintos, autorizados por el servidor | Un solo origen |
| ¿Funciona fuera de `ionic serve`? | Sí | **No**: solo existe mientras ejecutamos `ionic serve` |

> El proxy es una herramienta de **desarrollo**. Cuando una aplicación se publica, el servidor de Ionic ya no existe, por lo que el servidor real debe autorizar al frontend (por ejemplo, con `cors`) o ambos deben publicarse en el mismo origen.

## 13. Comparación con el taller anterior

| Taller 6 | Taller 7 |
|---|---|
| El cliente es Postman | El cliente es una app Ionic en el navegador |
| Un servidor: Express (`localhost:3000`) | Dos servidores: Express (`3000`) e Ionic (`8100`) |
| Las peticiones se configuran en la interfaz de Postman | Las peticiones se escriben con `fetch()` |
| No existe CORS | El navegador aplica la política de mismo origen |
| Los errores se ven en Postman y en la terminal | Los errores de CORS se ven en la consola del navegador (F12) |

> En el Taller 6 construimos el servidor. Ahora lo conectamos con una aplicación real y descubrimos que el navegador exige que el servidor autorice explícitamente a quién le entrega sus datos.

---
# Desafío
Agrega a `servidor.js` la ruta `DELETE /api/posts/:id`, que elimine una publicación y responda con el código correspondiente. Luego agrega su petición en la aplicación.

## Referencias
- MDN - Intercambio de recursos de origen cruzado (CORS): https://developer.mozilla.org/es/docs/Web/HTTP/CORS
- MDN - Política de mismo origen: https://developer.mozilla.org/es/docs/Web/Security/Same-origin_policy
- Paquete cors: https://www.npmjs.com/package/cors
- Vite - Opciones del servidor (proxy): https://vite.dev/config/server-options#server-proxy
- Ionic React: https://ionicframework.com/docs/react
- Documentación de Express: https://expressjs.com/es/
