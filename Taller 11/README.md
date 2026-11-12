# Taller 11: Pruebas automatizadas y contenedores con Docker

**Nota**: Durante todos nuestros talleres utilizaremos el editor de código Visual Studio Code. Para dudas respecto a la interfaz del editor puedes consultar la documentación oficial en: https://code.visualstudio.com/docs/editing/getting-started

## Algunos comandos útiles para VSCode
```text
Nota: Los siguientes comandos fueron probados en Windows.

Alt + Shift + F - comando para indentar el código.
Control + J - comando para abrir o cerrar la terminal.
Control + S - comando para guardar el archivo actual.
Control + C - (dentro de la terminal) detiene el servidor o el contenedor que se está ejecutando.
F12 - (en el navegador) abre las herramientas de desarrollo y la consola.
```

## Objetivo del Taller 11

Automatizar las pruebas que hasta ahora hacíamos a mano (con Postman y haciendo clic en la aplicación), y empaquetar el servidor en un **contenedor** para que funcione igual en cualquier computador.

En este taller trabajaremos con:

- **Pruebas unitarias** con `node:test` (backend) y Vitest (frontend).
- **Pruebas de integración** con Supertest.
- **Pruebas de interfaz** con Cypress.
- Imágenes y contenedores con **Docker**.

## ¿Qué cambia respecto al taller anterior?

Con el Taller 10 terminamos una aplicación completa: publicaciones, inicio de sesión con contraseña y con GitHub, y rutas protegidas. En cada taller comprobamos **a mano** que todo siguiera funcionando: enviando las colecciones de Postman, iniciando sesión, creando publicaciones. Esto tiene dos problemas:

1. **¿Cómo sabemos que un cambio no rompió algo que ya funcionaba?** Revisar todo a mano después de cada cambio es lento y fácil de olvidar. De hecho, el proyecto de Ionic incluye desde el Taller 7 una prueba automática que **lleva varios talleres fallando** sin que lo notáramos, porque nunca la ejecutamos.
2. **¿Cómo nos aseguramos de que el servidor funcione en otro computador?** Necesita la versión correcta de Node, ejecutar `npm install`, el archivo `.env`…

```text
Talleres 6 a 10:  hago un cambio  →  pruebo a mano en Postman y en la app  →  ¿revisé todo?
Taller 11:        hago un cambio  →  npm test (segundos)                    →  sé exactamente qué falló
```

## 1. Archivos del taller

Descarga la carpeta del Taller 11. Contiene el código del Taller 10 terminado, con algunos archivos nuevos:

```text
Taller 11/
├── taller11-backend/
│   ├── .env.test                     → variables para las pruebas (no son secretos)
│   ├── servidor.js                   → paso 1
│   ├── utils/
│   │   ├── usuarios.js               → función nombreDisponible (ya está lista)
│   │   └── validaciones.js           → función validarPublicacion (ya está lista)
│   └── test/
│       ├── unitarias/                → paso 2
│       │   ├── usuarios.test.js
│       │   └── validaciones.test.js
│       └── integracion/              → paso 3
│           ├── posts.test.js
│           └── sesion.test.js
└── taller11-frontend/
    ├── cypress.config.ts             → paso 5
    ├── cypress/
    │   ├── e2e/
    │   │   ├── test.cy.ts            → paso 5 (la prueba que falla)
    │   │   ├── sesion.cy.ts          → paso 6
    │   │   └── publicaciones.cy.ts   → paso 6
    │   └── support/commands.ts       → comando visitarConSesion (ya está listo)
    └── src/services/api.test.ts      → paso 4
```

En la Parte 3 crearás dos archivos más en `taller11-backend`: `Dockerfile` y `.dockerignore`.

## 2. Levantar los proyectos

En `taller11-backend`, copia el archivo `.env` de tu Taller 10 (o crea uno nuevo a partir de `.env.example`, como en el Taller 10). Luego, como siempre, utiliza dos terminales.

**Terminal 1 (backend):**

```bash
npm config set ignore-scripts true
cd taller11-backend
npm install
npm run dev
```

**Terminal 2 (frontend):**

```bash
cd taller11-frontend
npm install
ionic serve
Recuerda ignorar la sugerencia de actualizaciones para las versiones de las dependencias.
```

***Nota 1:*** El frontend utiliza Ionic 9, React 19, React Router 6, Vitest 5 y Cypress 16. **No actualices `react-router-dom` a la versión 7**: Ionic 9 requiere la versión 6.

***Nota 2:*** Cypress 16 requiere Node.js 22, 24 o 26. Revisa tu versión con `node -v`.

## 3. ¿Por qué automatizar las pruebas?

Una **prueba automatizada** es un programa que ejecuta una parte de nuestra aplicación y verifica que el resultado sea el esperado. Cada verificación se llama **aserción**: por ejemplo, «el código de estado debe ser `403`».

Existen distintos tipos de pruebas, según cuánto de la aplicación ejercitan:

| Tipo | ¿Qué prueba? | Herramienta | Ejemplo en nuestro proyecto |
|---|---|---|---|
| **Unitaria** | Una función, de forma aislada | `node:test` y Vitest | `nombreDisponible("ana", usuarios)` devuelve `"ana-github"` |
| **De integración** | Varias partes juntas, a través de HTTP | Supertest | `PUT /api/posts/5` con el token de ana responde `403` |
| **De interfaz** (o *end-to-end*) | La aplicación completa, como un usuario en el navegador | Cypress | Iniciar sesión como ana y crear una publicación |

```text
            ▲  Interfaz       → pocas: lentas, prueban todo el sistema
           ▲▲▲ Integración    → algunas
         ▲▲▲▲▲▲▲ Unitarias    → muchas: rápidas, prueban una pieza a la vez
```

Esta forma se conoce como la **pirámide de pruebas**: muchas pruebas unitarias rápidas en la base, y pocas pruebas de interfaz, más lentas y frágiles, en la punta.

---
# Parte 1: Pruebas del backend

## 4. Separar la aplicación del servidor (Paso 1)

Para probar nuestras rutas, las pruebas necesitan la aplicación Express (`app`). Pero hoy `servidor.js` crea la aplicación **y** llama a `app.listen()`: si una prueba importara ese archivo, levantaría un servidor en el puerto 3000 (que quizás ya está en uso) y verificaría las variables de entorno de GitHub.

La solución es separar las responsabilidades en dos archivos:

```text
app.js        → crea la aplicación, registra middlewares y rutas, y la EXPORTA.   ← lo usan las pruebas
servidor.js   → verifica las variables de entorno, importa app y llama a listen(). ← lo usa npm run dev
```

Crea el archivo `app.js` y **mueve** a él, desde `servidor.js`, todo lo que va desde `const express = require("express");` hasta `app.use(manejadorErrores);`. Al final de `app.js`, agrega:

```javascript
module.exports = app;
```

Además, en `app.js`, reemplaza `app.use(morgan("tiny"));` por:

```javascript
// Durante las pruebas no mostramos el registro de cada petición.
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("tiny"));
}
```

`servidor.js` queda solo con la verificación de variables, la importación de `app` y `listen()`:

```javascript
const variablesRequeridas = ["JWT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_REDIRECT_URI"];
const faltantes = variablesRequeridas.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno: ${faltantes.join(", ")}. Revisa el archivo .env`);
  process.exit(1);
}

const app = require("./app");

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
```

Borra también el comentario del paso 1 al inicio de `servidor.js`. Guarda ambos archivos y comprueba que la aplicación Ionic sigue funcionando igual: **reorganizar el código no debe cambiar su comportamiento**.

***Nota:*** Este es un principio que conviene recordar: el código que **se puede probar** suele estar mejor organizado. Por la misma razón, las funciones `validarPublicacion` y `nombreDisponible` ahora están en la carpeta `utils/` (ya está listo): no dependen de Express ni de los datos guardados, así que se pueden probar de forma aislada. Revisa cómo las utilizan `routes/posts.js` y `routes/auth.js`.

## 5. Las variables de entorno de las pruebas

Abre el archivo `.env.test` (ya está listo):

```text
NODE_ENV=test
JWT_SECRET=clave-solo-para-pruebas
JWT_EXPIRA=1h
GITHUB_CLIENT_ID=cliente-de-prueba
...
```

Las pruebas utilizan sus propias variables, con valores inventados. Como **no son secretos reales**, este archivo sí se puede subir a GitHub (el `.gitignore` solo excluye `.env`).

Revisa también los scripts que se agregaron a `package.json`:

```json
"test": "node --env-file=.env.test --test",
"test:unitarias": "node --env-file=.env.test --test test/unitarias/*.test.js",
"test:integracion": "node --env-file=.env.test --test test/integracion/*.test.js"
```

```text
node --test   → el ejecutor de pruebas incluido en Node.js (no hay que instalar nada).
                Busca y ejecuta los archivos de pruebas, por ejemplo, los que están dentro de test/.
```

## 6. Pruebas unitarias con node:test (Paso 2)

Ejecuta las pruebas unitarias:

```bash
npm run test:unitarias
```

Verás algo similar a esto:

```text
▶ nombreDisponible
  ✔ devuelve el mismo nombre si está libre (0.98ms)
  ✔ agrega -github si el nombre ya existe (0.13ms) # TODO
  ...
ℹ pass 2
ℹ fail 0
ℹ todo 6
```

Las pruebas marcadas con `# TODO` están **pendientes**: aparecen con ✔, pero no se cuentan como aprobadas.

Abre `test/unitarias/validaciones.test.js`. La primera prueba ya está escrita:

```javascript
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { validarPublicacion } = require("../../utils/validaciones");

describe("validarPublicacion", () => {
  test("acepta una publicación con title y body", () => {
    assert.equal(validarPublicacion({ title: "Hola", body: "Mundo" }), null);
  });

  // 2: Completa esta prueba.
  test.todo("rechaza una publicación sin title");
  ...
});
```

**Explicación del fragmento de código anterior:**

```text
describe("...", () => {...})   → agrupa pruebas relacionadas (aquí, todas las de validarPublicacion).
test("...", () => {...})       → una prueba: su nombre describe el comportamiento esperado.
assert.equal(real, esperado)   → la aserción: si los valores no son iguales, la prueba falla.
test.todo("...")               → una prueba pendiente: se muestra en el resultado, pero no falla.
```

Completa las pruebas pendientes de **ambos** archivos de `test/unitarias/`. Para cada una, reemplaza la línea `test.todo("...")` por una prueba completa con el mismo nombre. Por ejemplo:

```javascript
  test("rechaza una publicación sin title", () => {
    assert.equal(validarPublicacion({ body: "Mundo" }), "Debes enviar title y body");
  });
```

Las demás pruebas que debes completar son:

```text
validaciones.test.js:
  - "rechaza un title vacío"                 → { title: "", body: "Mundo" }
  - "rechaza cuando no se envían datos"      → validarPublicacion(undefined)

usuarios.test.js:
  - "agrega -github si el nombre ya existe"          → usuarios: [{ username: "ana" }]
  - "agrega -github2 si también existe ana-github"   → usuarios: [{ username: "ana" }, { username: "ana-github" }]
  - "no modifica la lista de usuarios"               → usa assert.deepEqual para comparar arreglos
```

Ejecuta nuevamente `npm run test:unitarias` hasta que todas pasen.

***Nota:*** Para comprobar que una prueba **realmente** verifica algo, haz que falle a propósito: cambia el valor esperado (por ejemplo, `"ana-github"` por `"ana-gitlab"`) y observa el mensaje de error, que muestra el valor esperado y el obtenido. Luego vuelve a dejarlo como estaba.

## 7. Pruebas de integración con Supertest (Paso 3)

Las pruebas de integración envían **peticiones HTTP reales** a nuestra aplicación, igual que Postman, pero de forma automática. Para eso utilizaremos **Supertest**. Instálalo como **dependencia de desarrollo**:

```bash
npm view supertest
npm install --save-dev supertest
```

**Explicación del comando anterior:**

```text
--save-dev   → se registra en "devDependencies" de package.json: solo se necesita mientras
               desarrollamos y probamos, no para ejecutar el servidor (lo aprovecharemos en Docker).
```

Abre `test/integracion/posts.test.js`:

```javascript
const request = require("supertest");
const app = require("../../app");

// Inicia sesión y devuelve el token (igual que la petición «Login» de Postman).
const iniciarSesion = async (username, password) => {
  const respuesta = await request(app).post("/api/login").send({ username, password });
  return respuesta.body.token;
};

describe("GET /api/posts", () => {
  test("responde 200 con las 5 publicaciones iniciales", async () => {
    const respuesta = await request(app).get("/api/posts");
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.length, 5);
  });
  ...
```

**Explicación del fragmento de código anterior:**

```text
require("../../app")      → importa la aplicación sin levantar el servidor (gracias al paso 1).
request(app).get(ruta)    → Supertest envía la petición directamente a la aplicación.
.post(ruta).send({...})   → envía un body en formato JSON.
.set("Authorization", …)  → agrega un header (lo usaremos para enviar el token).
await                     → espera la respuesta antes de revisarla.
respuesta.status          → el código de estado; respuesta.body → el JSON de la respuesta.
```

Completa las pruebas pendientes de `posts.test.js` y de `sesion.test.js`. Los nombres indican qué verificar, y casi todas corresponden a una petición de tus colecciones de Postman de los Talleres 6 a 10. Algunas ayudas:

```javascript
// Enviar el token de ana:
const token = await iniciarSesion("ana", "ana-12345");
const respuesta = await request(app)
  .post("/api/posts")
  .set("Authorization", `Bearer ${token}`)
  .send({ userId: 3, title: "Publicación de prueba", body: "Creada por una prueba" });

// Enviar un JSON mal escrito (como el experimento del Taller 8):
const respuesta = await request(app)
  .post("/api/posts")
  .set("Content-Type", "application/json")
  .send('{ "title": "Hola", }');

// Comparar arreglos u objetos completos:
assert.deepEqual(respuesta.body.map((p) => p.id), [3, 4]);

// Verificar que un texto cumpla un patrón (expresión regular):
assert.match(url.searchParams.get("state"), /^[0-9a-f]{32}$/);
```

***Nota:*** Si ejecutas estas pruebas antes de completar el paso 1, fallarán con el error `Cannot find module '../../app'`: el archivo `app.js` aún no existe.

Cuando termines, ejecuta **todas** las pruebas:

```bash
npm test
```

Deberías ver `ℹ pass 23` y `ℹ fail 0`.

***Nota 1:*** Entre los resultados aparecerán los mensajes `Expected double-quoted property name in JSON...` e `invalid signature`. No son errores de las pruebas: son los mensajes que el `manejadorErrores` del Taller 8 escribe en la terminal cuando las pruebas envían un JSON mal escrito y un token alterado.

***Nota 2:*** La prueba del inicio de sesión con GitHub solo verifica la URL de autorización y el rechazo de un `state` inventado: así no necesita conectarse a GitHub. Las pruebas automatizadas no deben depender de servicios externos.

## 8. Experimentos

**Las pruebas como red de seguridad.** En `routes/posts.js`, quita temporalmente `verificarToken` de la ruta `POST`:

```javascript
router.post("/", (req, res) => {
```

Ejecuta `npm test`: fallan **tres** pruebas. Una indica que la ruta ya no responde `401` sin token, y las otras fallan porque la ruta intenta leer `req.usuario`, que ya no existe. Sin las pruebas, este error podría haber llegado a producción sin que nadie lo notara. Al terminar, vuelve a dejar `verificarToken`.

**Las pruebas deben ser independientes.** Los datos están en memoria y las pruebas de un mismo archivo los comparten. En `posts.test.js`, mueve todo el bloque `describe("GET /api/posts", ...)` al **final** del archivo y ejecuta `npm run test:integracion`: la prueba que espera 5 publicaciones falla, porque una prueba anterior creó una publicación más. Por eso la prueba «el autor puede eliminar su propia publicación» **crea** la publicación que elimina, en lugar de eliminar una de las publicaciones iniciales: cada prueba debe preparar lo que necesita. Al terminar, deja el bloque en su lugar original.

***Nota:*** `node --test` ejecuta cada **archivo** de pruebas en un proceso separado, así que los datos sí se reinician entre `posts.test.js` y `sesion.test.js`.

---
# Parte 2: Pruebas del frontend

## 9. Pruebas unitarias con Vitest (Paso 4)

El proyecto de Ionic ya incluía, desde su creación, dos herramientas de pruebas que no habíamos utilizado: **Vitest** (pruebas unitarias) y **Cypress** (pruebas de interfaz). Revisa los scripts de `package.json` del frontend:

```json
"test.e2e": "cypress run",
"test.unit": "vitest"
```

Ejecuta las pruebas unitarias:

```bash
npx vitest run
```

**Explicación del comando anterior:**

```text
npx vitest run    → ejecuta las pruebas una vez y termina.
npm run test.unit → ejecuta las pruebas y se queda observando los archivos: vuelve a ejecutarlas
                    cada vez que guardas un cambio (presiona q para salir).
```

Además de la prueba que traía la plantilla (`src/App.test.tsx`), está el archivo `src/services/api.test.ts`, que prueba las funciones de `api.ts`. Vitest utiliza una sintaxis muy parecida a `node:test`:

```tsx
import { afterEach, describe, expect, test, vi } from "vitest";

describe("encabezadosConToken", () => {
  test("no agrega Authorization si no hay sesión", () => {
    expect(encabezadosConToken()).toEqual({});
  });
  ...
```

```text
expect(real).toEqual(esperado)   → la aserción, equivalente a assert.deepEqual de node:test.
```

***Nota:*** En el resultado puede aparecer una advertencia que menciona `act(...)` y `StackManager`. Proviene de la navegación interna de Ionic en la prueba de la plantilla y no afecta los resultados.

**¿Cómo probar funciones que usan `fetch()` sin el servidor?** Reemplazamos `fetch` por una **función simulada** (*mock*) que responde lo que nosotros decidamos:

```tsx
const respuestaJson = (status: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

test("agrega ?userId= a la URL al filtrar por usuario", async () => {
  const fetchSimulado = vi.fn().mockResolvedValue(respuestaJson(200, []));
  vi.stubGlobal("fetch", fetchSimulado);

  await obtenerPublicaciones(2);

  expect(fetchSimulado).toHaveBeenCalledWith("http://localhost:3000/api/posts?userId=2");
});
```

**Explicación del fragmento de código anterior:**

```text
vi.fn()                    → crea una función simulada que registra cómo fue llamada.
.mockResolvedValue(...)    → hace que la función devuelva esa respuesta (como lo haría fetch).
vi.stubGlobal("fetch", …)  → reemplaza el fetch global por la función simulada durante la prueba.
toHaveBeenCalledWith(...)  → verifica con qué argumentos se llamó (aquí, la URL con el filtro).
afterEach(...)             → al terminar cada prueba, restaura fetch y limpia localStorage.
```

Completa las pruebas pendientes de `api.test.ts` (paso 4) y, al terminar, borra la primera línea del archivo (`/* eslint-disable ... */`). Algunas ayudas:

```tsx
// Guardar una sesión antes de la prueba (como si el usuario hubiera iniciado sesión):
guardarSesion({ token: "abc123", id: 1, username: "ana" });

// Verificar parte de los argumentos de fetch (el método y el header Authorization):
expect(fetchSimulado).toHaveBeenCalledWith(
  "http://localhost:3000/api/posts",
  expect.objectContaining({
    method: "POST",
    headers: expect.objectContaining({ Authorization: "Bearer abc123" })
  })
);

// Capturar el error que lanza una función (el ErrorApi del Taller 9):
const error = await crearPublicacion({ title: "", body: "" }).catch((e) => e);
expect(error).toBeInstanceOf(ErrorApi);
expect(error.status).toBe(400);

// Una respuesta 204 sin contenido:
new Response(null, { status: 204 })
```

Estas pruebas verifican, por ejemplo, la lección del Taller 8: un `400` no hace fallar a `fetch()`, pero nuestra función `procesarRespuesta` sí debe convertirlo en un error con el mensaje del servidor.

## 10. Pruebas de interfaz con Cypress (Paso 5)

**Cypress** abre la aplicación en un navegador real y la utiliza como lo haría un usuario: escribe en los campos, presiona botones y verifica lo que aparece en pantalla.

Primero, instala el programa de Cypress. Como bloqueamos los scripts de instalación (`ignore-scripts`), npm instaló el paquete, pero no descargó el navegador que utiliza Cypress:

```bash
npx cypress install
Explicación: Descarga el programa de Cypress (varios cientos de MB). Solo se hace una vez por computador.
```

***Nota:*** Si omites este paso, al ejecutar Cypress aparecerá el mensaje `No version of Cypress is installed`.

Con el backend (`npm run dev`) y el frontend (`ionic serve`) en ejecución, abre una **tercera terminal** y ejecuta la prueba que trae la plantilla:

```bash
cd taller11-frontend
npm run test.e2e
```

**La prueba falla.** Hay dos problemas que corregir:

**Problema 1: el puerto.** Cypress indica que no pudo conectarse a `http://localhost:5173`. Abre `cypress.config.ts`: la plantilla de Ionic asume el puerto de Vite (`5173`), pero `ionic serve` utiliza el `8100`. Corrígelo:

```ts
baseUrl: "http://localhost:8100",
```

**Problema 2: la prueba está desactualizada.** Vuelve a ejecutar `npm run test.e2e`. Ahora Cypress se conecta, pero no encuentra el texto `Publicaciones`. Abre `cypress/e2e/test.cy.ts`:

```ts
describe('Taller 10', () => {
  it('Muestra la página de publicaciones', () => {
    cy.visit('/')
    cy.contains('Publicaciones')
  })
})
```

Esta prueba se escribió cuando la ruta `/` mostraba las publicaciones. Desde el Taller 9, sin una sesión, `RutaProtegida` redirige al inicio de sesión: la aplicación cambió y nadie actualizó la prueba, porque nadie la ejecutaba. Actualízala para que verifique el comportamiento actual:

```ts
describe('Taller 11', () => {
  it('Redirige al inicio de sesión si no hay sesión', () => {
    cy.visit('/')
    cy.url().should('include', '/login')
    cy.contains('Iniciar sesión')
  })
})
```

**Explicación del fragmento de código anterior:**

```text
cy.visit('/')                       → abre la aplicación en esa ruta (baseUrl + '/').
cy.url().should('include', ...)     → verifica la URL actual. Cypress reintenta la verificación
                                      durante unos segundos, dando tiempo a la redirección.
cy.contains('texto')                → busca un elemento que contenga ese texto.
```

Ejecuta nuevamente `npm run test.e2e`: la prueba pasa.

> Una prueba que nunca se ejecuta no protege nada: se desactualiza y da una falsa sensación de seguridad.

***Nota:*** También puedes ejecutar `npx cypress open`, que abre una ventana donde puedes elegir las pruebas y ver paso a paso cómo Cypress utiliza la aplicación.

## 11. Nuevas pruebas de interfaz (Paso 6)

Abre `cypress/e2e/sesion.cy.ts`. La primera prueba inicia sesión a través del formulario:

```ts
it('inicia sesión con un usuario de prueba', () => {
  cy.visit('/login')
  cy.get('input[autocomplete="username"]').type('ana')
  cy.get('input[type="password"]').type('ana-12345')
  cy.get('ion-button[type="submit"]').click()

  cy.url().should('include', '/publicaciones')
  cy.get('.usuario').should('have.text', 'ana')
})
```

```text
cy.get(selector)          → busca elementos con un selector CSS (como querySelector).
.type('texto')            → escribe en el campo, tecla por tecla.
.click()                  → hace clic en el elemento.
.should('have.text', …)   → verifica el texto del elemento.
```

Probar el formulario de inicio de sesión en **cada** prueba sería lento y repetitivo. Para las pruebas que no prueban el inicio de sesión, el archivo `cypress/support/commands.ts` define un comando personalizado (ya está listo) que inicia sesión directamente con la API y abre la aplicación con la sesión ya guardada:

```ts
cy.visitarConSesion('/publicaciones', 'ana', 'ana-12345')
```

Completa las pruebas pendientes de `sesion.cy.ts` y `publicaciones.cy.ts`. En Cypress, una prueba escrita sin función, como `it('crea una publicación')`, queda **pendiente**. Algunas ayudas:

```ts
// Verificar que no se guardó una sesión:
cy.window().its('localStorage').invoke('getItem', 'taller9-sesion').should('be.null')

// Buscar un botón por su texto:
cy.contains('ion-button', 'Salir').click()

// Crear una publicación con un título único (las pruebas se ejecutan muchas veces):
const titulo = `Publicación de Cypress ${Date.now()}`
cy.get('ion-fab-button').click()
cy.get('ion-modal input').type(titulo)
cy.get('ion-modal textarea').type('Creada por una prueba de interfaz')
cy.contains('ion-modal ion-button', 'Guardar').click()
cy.contains('ion-item', titulo).should('contain', 'Tuya')

// Verificar que una publicación ajena no se pueda deslizar para editar o eliminar:
cy.contains('h2', 'Postman').parents('ion-item-sliding').should('not.exist')
```

Cuando termines, `npm run test.e2e` debería mostrar 7 pruebas aprobadas.

***Nota 1:*** Las pruebas de interfaz utilizan el backend real, cuyos datos están en memoria: cada ejecución crea una publicación nueva. Por eso el título incluye `Date.now()`, y por eso estas pruebas no verifican cuántas publicaciones hay.

***Nota 2:*** Las notificaciones de Ionic (`ion-toast`) dibujan su texto dentro de un *shadow DOM*, que Cypress no revisa por defecto. Por eso las pruebas verifican la URL, el contenido de la lista o `localStorage`, en lugar del texto de las notificaciones.

---
# Parte 3: Contenedores con Docker

## 12. ¿Qué es un contenedor?

Para ejecutar nuestro servidor en otro computador se necesita instalar Node.js (en una versión compatible), ejecutar `npm install` y crear el archivo `.env`. Si algo es distinto, puede fallar: es el clásico «en mi computador funciona».

**Docker** resuelve este problema empaquetando la aplicación junto con **todo lo que necesita para ejecutarse** (el sistema base, Node.js y las dependencias) en una **imagen**. Esa imagen se ejecuta igual en cualquier computador que tenga Docker.

| Concepto | Qué es | Analogía |
|---|---|---|
| **Dockerfile** | Archivo de texto con las instrucciones para construir una imagen | La receta |
| **Imagen** | El paquete resultante: sistema base, Node.js, dependencias y nuestro código. No cambia | El plato preparado y congelado |
| **Contenedor** | Una imagen en ejecución. Se pueden ejecutar varios contenedores de la misma imagen | Una porción servida |
| **Docker Hub** | Un registro público de imágenes, por ejemplo, la imagen oficial de Node.js | El supermercado |

A diferencia de una máquina virtual, un contenedor no incluye un sistema operativo completo: comparte el núcleo (*kernel*) del sistema anfitrión, por lo que es mucho más liviano y se inicia en segundos.

## 13. Instalar Docker

Elige **una** de las siguientes opciones según tu situación.

### Opción A: Windows (Docker Desktop)

Requisitos:

- Windows 10 u 11 de 64 bits, versión 21H2 o posterior.
- Virtualización por hardware habilitada en la BIOS/UEFI.
- Al menos 8 GB de memoria RAM.
- **WSL 2** (Subsistema de Windows para Linux), versión 2.1.5 o posterior.

Pasos:

1. Abre PowerShell y revisa si tienes WSL con `wsl --version`. Si no está instalado, ejecuta `wsl --install` en una PowerShell **abierta como administrador** y reinicia el computador. Si ya está instalado, actualízalo con `wsl --update`.
2. Descarga **Docker Desktop for Windows** desde https://docs.docker.com/desktop/setup/install/windows-install/ y ejecuta el instalador. Elige la instalación **por usuario** (*per-user*), que no requiere privilegios de administrador.
3. Abre Docker Desktop y espera a que indique que el motor está en ejecución (*Engine running*).

***Nota:*** El uso de Docker Desktop es gratuito para fines educativos y personales.

### Opción B: Linux (Docker Engine)

En Ubuntu o Debian, la forma más rápida para un entorno de aprendizaje es el script oficial de instalación:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
Explicación: Instala Docker Engine y agrega tu usuario al grupo docker, para no tener que usar sudo
en cada comando. Cierra la sesión del sistema y vuelve a ingresar para que el cambio de grupo tenga efecto.
```

***Nota:*** Para otras distribuciones, o para una instalación paso a paso, consulta https://docs.docker.com/engine/install/

### Opción C: Sin instalar nada (GitHub Codespaces)

Si no puedes instalar Docker (por ejemplo, porque no tienes permisos de administrador para instalar WSL, o tu computador no cumple los requisitos), puedes usar **GitHub Codespaces**: un computador en la nube, con Visual Studio Code en el navegador y Docker ya instalado. Usarás la misma cuenta de GitHub del Taller 10.

1. Crea un repositorio en GitHub (puede ser privado) y sube la carpeta `taller11-backend`. El archivo `.env` no se subirá, porque está en `.gitignore`.
2. En la página del repositorio, presiona **Code** → pestaña **Codespaces** → **Create codespace on main**.
3. Se abrirá Visual Studio Code en el navegador, con una terminal. Comprueba que Docker está disponible con `docker version`.
4. Dentro del codespace, crea el archivo `.env` en la carpeta `taller11-backend` (copiando `.env.example` y completando los valores).

Desde aquí, todos los comandos de las secciones siguientes funcionan igual. Para probar el contenedor, utiliza la terminal del codespace: `curl http://localhost:3000/api/posts`.

***Importante:*** Las cuentas personales gratuitas de GitHub incluyen 120 horas de cómputo de Codespaces al mes (equivalentes a 60 horas en la máquina más pequeña, de 2 núcleos). Cuando termines, detén el codespace desde https://github.com/codespaces para no consumir horas innecesariamente.

### Verificar la instalación e iniciar sesión en Docker Hub

En cualquiera de las tres opciones, verifica que Docker funcione:

```bash
docker version
docker run hello-world
Explicación: Descarga una imagen de prueba desde Docker Hub y la ejecuta. Si ves el mensaje
"Hello from Docker!", Docker está funcionando.
```

Luego, crea una cuenta gratuita en https://hub.docker.com e inicia sesión:

```bash
docker login
```

***Importante:*** Sin iniciar sesión, Docker Hub permite solo **10 descargas de imágenes por hora por dirección IP**. En un laboratorio, todos los computadores suelen compartir la misma dirección IP, así que ese límite se agota de inmediato. Con una cuenta, el límite se aplica a cada usuario por separado.

## 14. Crear la imagen (Paso 7)

En la carpeta `taller11-backend`, crea el archivo `Dockerfile` (sin extensión):

```dockerfile
# Imagen base: Node.js 26 (versión LTS activa) sobre Alpine Linux, una distribución muy liviana.
FROM node:26-alpine

# Carpeta de trabajo dentro de la imagen.
WORKDIR /app

# Primero solo los archivos de dependencias: así Docker reutiliza esta capa
# mientras package.json y package-lock.json no cambien.
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Luego el resto del código (lo que no excluye .dockerignore).
COPY . .

# Ejecutar con un usuario sin privilegios (la imagen de Node incluye el usuario "node").
USER node

# El servidor escucha en el puerto 3000.
EXPOSE 3000

# Comando que se ejecuta al iniciar el contenedor.
CMD ["node", "servidor.js"]
```

**Explicación del fragmento de código anterior:**

```text
FROM node:26-alpine        → parte de la imagen oficial de Node.js 26. Se indica la versión mayor (26)
                             y no "latest", para que la imagen no cambie de versión sin aviso.
WORKDIR /app               → crea la carpeta /app dentro de la imagen y trabaja en ella.
COPY package*.json ./      → copia package.json y package-lock.json desde nuestra carpeta.
RUN npm ci ...             → ejecuta un comando DURANTE la construcción de la imagen:
  npm ci                   → instala exactamente las versiones de package-lock.json.
  --omit=dev               → no instala las dependencias de desarrollo (como Supertest).
  --ignore-scripts         → igual que en nuestros talleres: no ejecuta scripts de instalación.
COPY . .                   → copia el resto de los archivos.
USER node                  → el servidor no se ejecuta como administrador (root) del contenedor.
EXPOSE 3000                → documenta el puerto en que escucha la aplicación.
CMD [...]                  → el comando que se ejecuta al INICIAR un contenedor.
```

Observa que `CMD` ejecuta `node servidor.js` y no `npm run dev`: dentro de la imagen no hay archivo `.env`, y no necesitamos que el servidor se reinicie al guardar cambios. Las variables de entorno se entregarán al iniciar el contenedor.

Crea también el archivo `.dockerignore`, que indica qué archivos **no** se copian a la imagen:

```text
node_modules
.env
.env.test
test
.git
Dockerfile
.dockerignore
```

```text
node_modules   → las dependencias se instalan dentro de la imagen (con npm ci).
.env           → los secretos NUNCA deben quedar dentro de una imagen.
test, .env.test → las pruebas no se necesitan para ejecutar el servidor.
```

Construye la imagen:

```bash
docker build -t taller11-backend .
Explicación: Construye la imagen siguiendo el Dockerfile de la carpeta actual (el punto final)
y le asigna el nombre taller11-backend.
```

La primera vez tardará un poco más, porque Docker debe descargar la imagen de Node.js. Al terminar, revisa tus imágenes con `docker images`.

## 15. Ejecutar el contenedor (Paso 8)

Primero, **detén el servidor del backend** (Ctrl+C en la terminal de `npm run dev`): el contenedor también usará el puerto 3000. Luego ejecuta:

```bash
docker run --rm -p 3000:3000 --env-file .env --name taller11 taller11-backend
```

**Explicación del comando anterior:**

```text
docker run          → crea y ejecuta un contenedor a partir de la imagen indicada al final.
--rm                → elimina el contenedor cuando se detiene.
-p 3000:3000        → conecta el puerto 3000 de tu computador con el puerto 3000 del contenedor.
                      Sin esta opción, el servidor estaría aislado dentro del contenedor.
--env-file .env     → entrega las variables de entorno del archivo .env al contenedor.
--name taller11     → le da un nombre al contenedor para referirse a él.
```

Verás el mensaje `Servidor ejecutándose en http://localhost:3000`. Abre la aplicación Ionic (`http://localhost:8100`): **funciona igual que antes**, porque el navegador sigue enviando las peticiones a `localhost:3000`, que ahora llegan al contenedor. Inicia sesión y crea una publicación.

En otra terminal, puedes revisar el contenedor:

```bash
docker ps                 → lista los contenedores en ejecución.
docker logs taller11      → muestra lo que el servidor escribió en la terminal (los registros de morgan).
docker stop taller11      → detiene el contenedor (también puedes usar Ctrl+C en su terminal).
```

***Nota:*** Si aparece el error `port is already allocated`, el puerto 3000 está en uso: probablemente el servidor de `npm run dev` sigue ejecutándose.

## 16. Experimentos con Docker

**¿Qué hay dentro de la imagen?** Ejecuta un contenedor con otro comando en lugar de `CMD`:

```bash
docker run --rm taller11-backend ls -a
```

Verás `app.js`, `servidor.js`, `routes`, `node_modules`… pero **no** el archivo `.env` ni la carpeta `test`: el `.dockerignore` funcionó. Comprueba también que Supertest no está instalado: `docker run --rm taller11-backend ls node_modules/supertest` responde que no existe.

**Las variables no están en la imagen.** Ejecuta el contenedor **sin** `--env-file`:

```bash
docker run --rm taller11-backend
```

El servidor se detiene con el mensaje `Faltan variables de entorno: ...` del Taller 10. La imagen es la misma para cualquier persona; los secretos se entregan al ejecutarla.

**Los datos no sobreviven al contenedor.** Con el contenedor en ejecución, crea una publicación desde la aplicación. Detén el contenedor y vuelve a ejecutarlo con el mismo `docker run`: la publicación ya no existe. Cada contenedor comienza desde la imagen, y nuestros datos están en memoria. Para conservarlos se necesita una base de datos.

**La caché de capas.** Modifica cualquier texto de `app.js` (por ejemplo, el mensaje de la ruta `/`) y vuelve a ejecutar `docker build -t taller11-backend .`. La construcción es casi inmediata: en el paso `RUN npm ci` aparece `CACHED`. Cada instrucción del `Dockerfile` genera una **capa**, y Docker reutiliza las capas cuyas entradas no cambiaron. Por eso copiamos `package*.json` **antes** que el resto del código: las dependencias solo se reinstalan cuando cambia `package.json`.

**Dos contenedores de la misma imagen.** Con el contenedor `taller11` en ejecución, abre otra terminal y ejecuta uno más en otro puerto:

```bash
docker run --rm -p 3001:3000 --env-file .env --name taller11-b taller11-backend
```

Visita `http://localhost:3001/api/posts`: es un segundo servidor, con sus propios datos. Crea una publicación en uno y comprueba que no aparece en el otro.

**¿Por qué no `127.0.0.1`?** En la presentación del Módulo 3.1, el servidor escuchaba en `SERVER: "127.0.0.1"`. En `servidor.js`, cambia temporalmente `app.listen(PORT, () => {` por `app.listen(PORT, "127.0.0.1", () => {`, reconstruye la imagen y ejecuta el contenedor: el servidor indica que se está ejecutando, pero la aplicación ya no puede comunicarse con él. Dentro del contenedor, `127.0.0.1` es el **propio contenedor**, así que el servidor solo acepta conexiones que se originen ahí mismo. Sin indicar una dirección, Express escucha en todas las interfaces de red, incluida la que Docker conecta con tu computador. Al terminar, deshaz el cambio y reconstruye la imagen.

## 17. Comparación con el taller anterior

| Taller 10 | Taller 11 |
|---|---|
| Las pruebas se hacen a mano (Postman y la app) | Las pruebas se ejecutan con `npm test`, `npx vitest run` y `npm run test.e2e` |
| Un error puede pasar inadvertido | Las pruebas indican exactamente qué comportamiento cambió |
| `servidor.js` crea la aplicación y la inicia | `app.js` crea la aplicación; `servidor.js` solo la inicia |
| Todas las dependencias son iguales | Dependencias de producción y de desarrollo (`--save-dev`) |
| El servidor se ejecuta con el Node.js de cada computador | El servidor se ejecuta en un contenedor, con su propio Node.js |
| Hay que instalar dependencias y configurar en cada computador | Se construye una imagen una vez y se ejecuta igual en todos |

> Las pruebas automatizadas nos dan confianza para cambiar el código; los contenedores nos dan confianza de que funcionará igual en otro lugar. Ambos son la base para publicar una aplicación.

---
# Desafío

1. **Integración continua con GitHub Actions.** Sube el proyecto a un repositorio de GitHub y crea el archivo `.github/workflows/pruebas.yml`, para que las pruebas del backend (`npm ci` y `npm test` en `taller11-backend`) se ejecuten automáticamente cada vez que subas cambios. Investiga en la documentación de GitHub Actions cómo usar la acción `actions/setup-node`.
2. **Probar el intercambio con GitHub sin GitHub.** Escribe una prueba de integración para `POST /api/auth/github` que reemplace `fetch` por una función simulada con `mock.method(globalThis, "fetch", ...)` de `node:test`, de modo que responda como GitHub. Pista: primero obtén un `state` válido con `GET /api/auth/github/url`.

## Para seguir aprendiendo

- **Cobertura de código**: Node.js puede indicar qué líneas del código ejercitaron las pruebas con `node --test --experimental-test-coverage`.
- **Docker Compose**: permite describir y ejecutar varios contenedores juntos (por ejemplo, el backend y una base de datos) con un solo comando.
- **Volúmenes**: el mecanismo de Docker para conservar datos fuera del contenedor.
- **La imagen del frontend**: compilar la aplicación Ionic (`npm run build`) y servirla desde un contenedor con un servidor web como nginx.

## Referencias

- Node.js - Test runner (`node:test`): https://nodejs.org/api/test.html
- Supertest: https://www.npmjs.com/package/supertest
- Vitest: https://vitest.dev/guide/
- Cypress - Documentación: https://docs.cypress.io
- Docker - Primeros pasos: https://docs.docker.com/get-started/
- Docker Desktop para Windows: https://docs.docker.com/desktop/setup/install/windows-install/
- Docker Engine para Linux: https://docs.docker.com/engine/install/
- Referencia del Dockerfile: https://docs.docker.com/reference/dockerfile/
- Límites de descarga de Docker Hub: https://docs.docker.com/docker-hub/usage/
- GitHub Codespaces - Facturación y uso incluido: https://docs.github.com/en/billing/concepts/product-billing/github-codespaces
- Imagen oficial de Node.js: https://hub.docker.com/_/node
