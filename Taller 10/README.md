# Taller 10: OAuth con GitHub

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

## Objetivo del Taller 10

Permitir que los usuarios inicien sesión con su **cuenta de GitHub**, sin que nuestra aplicación conozca su contraseña, y entender cómo funciona el flujo **OAuth 2.0**: quién participa, qué datos viajan y quién guarda cada secreto.

En este taller trabajaremos con:

- El flujo **Authorization Code** de OAuth 2.0.
- El parámetro **state**, que protege contra ataques CSRF.
- **PKCE** (*Proof Key for Code Exchange*), que protege el código de autorización.
- Peticiones de **servidor a servidor** con `fetch` desde Node.
- Usuarios **sin contraseña**, creados a partir de una cuenta externa.
- Redirecciones entre nuestra aplicación y otro sitio web.

## ¿Qué cambia respecto al taller anterior?

En el Taller 9, nuestro servidor verificaba el usuario y la contraseña, y luego emitía **nuestro propio JWT**. En este taller, quien verifica la identidad es **GitHub**. Una vez que GitHub confirma quién es el usuario, todo sigue igual que antes:

```text
Taller 9:   usuario + contraseña   ──►  nuestro servidor verifica  ──►  emite NUESTRO JWT
Taller 10:  "Ingresar con GitHub"  ──►  GitHub verifica            ──►  emite NUESTRO JWT
                                                                        (el resto no cambia)
```

> El middleware `verificarToken`, la autorización por autor y la ruta protegida del Taller 9 **no cambian**. OAuth solo reemplaza la forma de comprobar quién es el usuario.

## 1. Archivos del taller

Descarga la carpeta del Taller 10. Contiene dos proyectos:

```text
Taller 10/
├── Taller10.postman_collection.json  → peticiones para probar la API en Postman
├── taller10-backend/                 → el servidor del Taller 9 (ya completo)
│   ├── .env.example                  → ahora incluye las variables de GitHub
│   ├── datos/usuarios.js             → usuarios de prueba (ya está listo)
│   ├── routes/
│   │   ├── auth.js                   → nuevo: pasos 3 y 4
│   │   └── login.js                  → paso 2
│   └── servidor.js                   → pasos 1 y 3
└── taller10-frontend/                → la aplicación Ionic + React (Taller 9 completo)
    └── src/
        ├── pages/
        │   ├── GithubCallbackPage.tsx  → nueva: paso 6
        │   └── LoginPage.tsx           → ahora incluye el botón de GitHub (ya está listo)
        ├── services/
        │   └── api.ts                  → paso 5
        └── App.tsx                     → incluye la nueva ruta (ya está listo)
```

Importa `Taller10.postman_collection.json` en Postman (botón **Import**).

Los usuarios de prueba del Taller 9 siguen funcionando con su contraseña: `ana` (`ana-12345`), `benjamin` (`benjamin-12345`) y `carla` (`carla-12345`).

## 2. Registrar la aplicación en GitHub

Para que GitHub acepte a nuestra aplicación, primero hay que registrarla. Necesitas una cuenta de GitHub con el **correo principal verificado**.

1. En GitHub, abre **Settings** (desde tu foto de perfil) → **Developer settings** (al final de la lista) → **OAuth Apps** → **New OAuth App**.
***Importante:*** Si no te aparecen las opciones anteriores, es porque no has verificado tu cuenta. Debes completar el proceso de verificación que aparece antes de continuar con el Taller.
2. Completa el formulario:

| Campo | Valor |
|---|---|
| Application name | `Taller 10 - tu nombre` |
| Homepage URL | `http://localhost:8100` |
| Authorization callback URL | `http://localhost:8100/auth/github/callback` |

3. Presiona **Register application**.
4. Copia el **Client ID**.
5. Presiona **Generate a new client secret** y copia el **Client secret**.

***Importante:*** GitHub muestra el *client secret* completo **una sola vez**. Cópialo de inmediato. Si lo pierdes, puedes generar uno nuevo.

**Explicación de los datos anteriores:**

```text
Client ID                   → identifica a nuestra aplicación. Es público: aparece en la URL que ve el usuario.
Client secret               → demuestra que quien pide el token es nuestro servidor. Es SECRETO,
                              igual que una contraseña: solo debe estar en el archivo .env del backend.
Authorization callback URL  → la dirección a la que GitHub devolverá al usuario después de autorizar.
                              GitHub solo redirige a esta dirección.
```

## 3. Levantar los proyectos

En la carpeta `taller10-backend`, copia el archivo `.env.example` con el nombre `.env` y completa los valores. Para `JWT_SECRET`, genera una clave como en el Taller 9:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```text
JWT_SECRET=pega-aquí-la-clave-generada
JWT_EXPIRA=1h
GITHUB_CLIENT_ID=pega-aquí-el-client-id
GITHUB_CLIENT_SECRET=pega-aquí-el-client-secret
GITHUB_REDIRECT_URI=http://localhost:8100/auth/github/callback
```

Luego, como en los talleres anteriores, utiliza dos terminales.

**Terminal 1 (backend):**

```bash
npm config set ignore-scripts true
cd taller10-backend
npm install
npm run dev
Explicación: Instala las dependencias y levanta el servidor en http://localhost:3000.
```

**Terminal 2 (frontend):**

```bash
cd taller10-frontend
npm install
ionic serve
Explicación: Instala las dependencias y abre la aplicación en http://localhost:8100.
Recuerda ignorar la sugerencia de actualizaciones para las versiones de las dependencias.
```

***Nota 1:*** El frontend utiliza Ionic 9, React 19 y React Router 6. **No actualices `react-router-dom` a la versión 7**: Ionic 9 requiere la versión 6.

***Nota 2:*** Si el comando `ionic` no es reconocido, instala la interfaz de línea de comandos de Ionic: `npm install -g @ionic/cli`.

## 4. ¿Cómo funciona OAuth?

En OAuth participan cuatro actores:

| Actor | En nuestro caso |
|---|---|
| **Usuario** (dueño de la cuenta) | La persona que inicia sesión |
| **Cliente** (la aplicación que pide acceso) | Nuestra aplicación Ionic y nuestro servidor Express |
| **Servidor de autorización** | GitHub (`github.com`), que muestra el inicio de sesión y entrega los tokens |
| **API de recursos** | La API de GitHub (`api.github.com`), que entrega los datos del usuario |

El flujo que implementaremos se llama **Authorization Code** (código de autorización). Estos son los datos que viajan en el flujo:

| Dato | ¿Quién lo genera? | ¿Para qué sirve? |
|---|---|---|
| `code` | GitHub | Un comprobante de que el usuario autorizó la aplicación. Es temporal y de un solo uso. |
| `state` | Nuestro servidor | Un valor aleatorio que permite comprobar que el retorno corresponde a un inicio de sesión que **nosotros** comenzamos. |
| `code_verifier` y `code_challenge` (PKCE) | Nuestro servidor | Garantizan que quien canjea el `code` es quien inició el flujo. |
| Access token de GitHub | GitHub | Permite consultar la API de GitHub en nombre del usuario. **Nunca** llega a la aplicación. |
| Nuestro JWT | Nuestro servidor | El mismo token del Taller 9. |

***Nota:*** Estrictamente, OAuth sirve para **autorizar** el acceso a datos, no para **autenticar** usuarios. Nosotros lo usamos para identificar al usuario consultando la API `/user` de GitHub. El estándar diseñado específicamente para la autenticación es **OpenID Connect**, una capa construida sobre OAuth que utilizan proveedores como Google. Las OAuth Apps de GitHub no lo implementan.

---
# Parte 1: El servidor (backend)

## 5. Variables de entorno de GitHub (Paso 1)

En el Taller 9 verificamos al iniciar el servidor que existiera `JWT_SECRET`. Ahora necesitamos también los datos de GitHub. En el paso 1 de `servidor.js`, **reemplaza** la verificación del Taller 9 por la siguiente:

```javascript
const variablesRequeridas = ["JWT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_REDIRECT_URI"];
const faltantes = variablesRequeridas.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno: ${faltantes.join(", ")}. Revisa el archivo .env`);
  process.exit(1);
}
```

**Explicación del fragmento de código anterior:**

```text
filter(...)               → se queda con los nombres de las variables que no existen.
process.env[nombre]       → lee la variable de entorno cuyo nombre está en la constante nombre.
join(", ")                → une los nombres en un solo texto para mostrarlos en la terminal.
```

Pruébalo: borra temporalmente una línea de GitHub en `.env` y guarda. En la terminal aparecerá, por ejemplo: `Faltan variables de entorno: GITHUB_CLIENT_SECRET. Revisa el archivo .env`. Luego vuelve a dejar la línea.

***Nota:*** Si el servidor se detiene por un error (por ejemplo, porque falta el archivo `.env`), `--watch` espera a que cambie `servidor.js` antes de volver a intentarlo. Si corriges el `.env` y el servidor no vuelve a levantarse, detenlo (Ctrl+C) y ejecuta nuevamente `npm run dev`.

## 6. Usuarios sin contraseña (Paso 2)

Los usuarios que ingresen con GitHub se guardarán en `datos/usuarios.js` con un `githubId` y **sin** `passwordHash`, porque su contraseña la conoce GitHub, no nosotros:

```javascript
{ id: 4, username: "octocat", githubId: 583231 }
```

Esto produce un problema en el inicio de sesión con contraseña del Taller 9: si alguien intenta ingresar con contraseña usando el nombre de un usuario de GitHub, `bcrypt.compare()` recibe `undefined` como hash, lanza el error `Illegal arguments: string, undefined` y el servidor responde `500`.

En `routes/login.js`, en el paso 2, reemplaza la línea de `passwordCorrecta` por:

```javascript
  const passwordCorrecta =
    usuario && usuario.passwordHash ? await bcrypt.compare(datos.password, usuario.passwordHash) : false;
```

**Explicación del fragmento de código anterior:**

```text
usuario && usuario.passwordHash   → solo se compara si el usuario existe Y tiene contraseña.
: false                           → en cualquier otro caso, la contraseña se considera incorrecta,
                                    y el servidor responde el mismo 401 genérico del Taller 9.
```

Lo comprobaremos en el paso 11, cuando exista un usuario de GitHub.

## 7. La URL de autorización (Paso 3)

El inicio de sesión con GitHub comienza cuando nuestro servidor genera la dirección a la que se enviará al usuario. Abre `routes/auth.js`. Ya incluye las importaciones, un `Map` llamado `estados` y la función `nombreDisponible` (la utilizaremos en el paso 4). En el paso 3, crea la ruta:

```javascript
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
```

**Explicación del fragmento de código anterior:**

```text
crypto.randomBytes(...)       → genera valores aleatorios, imposibles de adivinar
                                (el mismo módulo que usamos para generar JWT_SECRET en el Taller 9).
state                         → un valor aleatorio para este inicio de sesión. GitHub lo devolverá
                                sin cambios, y así comprobaremos que el retorno es legítimo.
codeVerifier                  → un secreto que se queda en nuestro servidor.
codeChallenge                 → el hash SHA-256 del codeVerifier. Este sí viaja a GitHub.
estados.set(state, {...})     → guarda el state junto a su codeVerifier, por 10 minutos.
scope: "read:user"            → el permiso que pedimos: solo leer el perfil público del usuario.
new URLSearchParams({...})    → arma los parámetros de la URL (?client_id=...&state=...).
```

**¿Por qué el state?** Sin él, un atacante podría iniciar un flujo con **su propia** cuenta de GitHub y engañar a la víctima para que abra el enlace de retorno: la víctima terminaría con la sesión del atacante. Este tipo de ataque se llama **CSRF** (*Cross-Site Request Forgery*). Con el `state`, nuestro servidor solo acepta retornos de inicios de sesión que él mismo comenzó.

**¿Por qué PKCE?** El `code` viaja en la URL, por lo que podría quedar expuesto (por ejemplo, en el historial del navegador). Con PKCE, GitHub recibe primero el **hash** (`code_challenge`) y, al canjear el `code`, exige el **valor original** (`code_verifier`), que nunca salió de nuestro servidor. Un `code` robado no sirve sin él. GitHub admite PKCE desde 2025 y lo recomienda; solo acepta el método `S256`.

En `servidor.js`, en los comentarios del paso 3, importa el router y móntalo en `/api/auth`:

```javascript
const authRouter = require("./routes/auth");
```

```javascript
app.use("/api/auth", authRouter);
```

Prueba en Postman **URL de autorización de GitHub** (`200`). Copia la URL de la respuesta y ábrela en el navegador: verás la pantalla de GitHub que pide autorizar tu aplicación. **No la autorices todavía**: aún falta el paso 4.

***Nota:*** El *scope* define los permisos que pedimos. Siempre se pide el **mínimo** necesario: para identificar al usuario basta con `read:user`.

## 8. Intercambiar el código (Paso 4)

Cuando GitHub devuelva al usuario a la aplicación, esta enviará el `code` y el `state` a nuestro servidor. En el paso 4 de `routes/auth.js`, crea la ruta que completa el flujo:

```javascript
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
      "User-Agent": "taller10-ingenieria-web"
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
      username: nombreDisponible(perfil.login),
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
```

**Explicación del fragmento de código anterior:**

```text
estados.delete(datos.state)     → el state se borra apenas se usa: no se puede reutilizar.
fetch(...) desde el servidor    → Node incluye fetch, igual que el navegador. Esta petición viaja
                                  de nuestro servidor a GitHub: el navegador no participa.
new URLSearchParams({...})      → el estándar OAuth exige enviar estos datos en formato de formulario
                                  (no JSON); fetch agrega el Content-Type correspondiente.
Accept: application/json        → pedimos a GitHub que responda en JSON.
!respuestaToken.ok || datosToken.error
                                → GitHub informa los errores con un JSON que contiene el campo error,
                                  por lo que no basta con revisar response.ok (como en el Taller 8).
"User-Agent"                    → la API de GitHub exige que cada petición identifique a la aplicación.
status(502)                     → "Bad Gateway": falló un servicio externo del que dependemos.
perfil.id                       → el identificador numérico de la cuenta en GitHub. Lo usamos (y no el
                                  login) porque el usuario puede cambiar su nombre en GitHub, pero no su id.
nombreDisponible(perfil.login)  → si el nombre ya existe (por ejemplo, "ana"), usa "ana-github".
```

Observa que el *access token* de GitHub solo se usa dentro de esta función: no se guarda ni se envía a la aplicación. La aplicación recibe **nuestro** JWT, exactamente como en el Taller 9.

Prueba en Postman, en este orden:

1. **URL de autorización de GitHub**: genera un `state` nuevo y lo guarda en la variable `{{state}}` de la colección.
2. **Intercambio con un código inventado** (`401`): el `state` es válido, así que el servidor consulta a GitHub, y GitHub rechaza el código. El mensaje de error es el que envió GitHub.
3. **Intercambio repitiendo el state** (`400`): el `state` ya se utilizó en la petición anterior.
4. **Intercambio sin code** (`400`).

---
# Parte 2: La aplicación (frontend)

## 9. La aplicación

Abre `http://localhost:8100`. La aplicación del Taller 9 tiene algunos cambios, ya listos:

- La página de inicio de sesión tiene el botón **Ingresar con GitHub**.
- La nueva página `GithubCallbackPage` recibe al usuario cuando vuelve de GitHub.
- En `App.tsx` se agregó la ruta `/auth/github/callback`, **sin** `RutaProtegida`: el usuario que vuelve de GitHub todavía no tiene una sesión.

Presiona **Ingresar con GitHub**: aparece el mensaje *"Paso 5 pendiente"*. El inicio de sesión con contraseña sigue funcionando igual que en el Taller 9.

## 10. Las funciones de GitHub (Paso 5)

En `src/services/api.ts`, completa las dos funciones del paso 5, reemplazando las líneas `throw new Error(...)`:

```tsx
export const obtenerUrlGithub = async (): Promise<string> => {
  const response = await fetch(`${API_URL}/api/auth/github/url`);
  const datos = await procesarRespuesta(response);
  return datos.url;
};
```

```tsx
export const iniciarSesionConGithub = async (code: string, state: string): Promise<Sesion> => {
  const response = await fetch(`${API_URL}/api/auth/github`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state })
  });
  return procesarRespuesta(response);
};
```

La página de inicio de sesión utiliza la primera función así:

```tsx
const url = await obtenerUrlGithub();
window.location.href = url;
```

**Explicación del fragmento de código anterior:**

```text
window.location.href = url   → el navegador ABANDONA nuestra aplicación y abre GitHub.
                               A diferencia de router.push(), no es una navegación interna:
                               el estado de React se pierde y la aplicación vuelve a cargarse al regresar.
```

Presiona **Ingresar con GitHub**. GitHub te pedirá autorizar tu aplicación: presiona **Authorize**. GitHub te devolverá a `http://localhost:8100/auth/github/callback`, pero aparecerá el mensaje *"GitHub envió parámetros en la URL, pero no se están leyendo"*.

## 11. Leer la respuesta de GitHub (Paso 6)

Al volver, GitHub agrega parámetros a la URL de retorno:

```text
Si el usuario autorizó:   /auth/github/callback?code=1a2b3c...&state=9f2e...
Si el usuario canceló:    /auth/github/callback?error=access_denied&state=9f2e...
```

En `src/pages/GithubCallbackPage.tsx`, completa la función `leerParametros` del paso 6:

```tsx
const leerParametros = (): ParametrosGithub => {
  const parametros = new URLSearchParams(window.location.search);
  return {
    code: parametros.get("code"),
    state: parametros.get("state"),
    error: parametros.get("error")
  };
};
```

**Explicación del fragmento de código anterior:**

```text
window.location.search   → la parte de la URL que comienza con ? (por ejemplo, "?code=1a2b&state=9f2e").
URLSearchParams          → interpreta esos parámetros.
.get("code")             → devuelve el valor del parámetro, o null si no existe.
```

Vuelve a presionar **Ingresar con GitHub**. Como ya autorizaste la aplicación, normalmente GitHub no vuelve a preguntar y te devuelve de inmediato: llegarás directamente a las publicaciones, con **tu usuario de GitHub** en la barra superior. Crea una publicación: aparece como **Tuya**.

Observa la terminal del backend:

```text
GET /api/auth/github/url 200 294 - 0.721 ms
OPTIONS /api/auth/github 204 0 - 0.187 ms
POST /api/auth/github 200 205 - 75.926 ms
```

Revisa también el resto de `GithubCallbackPage.tsx`, que ya está listo:

```text
window.history.replaceState(...)   → borra el code de la barra de direcciones y del historial:
                                     es de un solo uso y no debe quedar a la vista.
yaProcesado (useRef)               → en desarrollo, React.StrictMode (src/main.tsx) ejecuta los efectos
                                     dos veces para ayudar a detectar errores. Esta protección evita
                                     enviar el code dos veces (lo comprobarás en los experimentos).
guardarSesion(sesion)              → la misma función del Taller 9: desde aquí, todo funciona igual.
```

Por último, comprueba el paso 2. En Postman, abre **Login con contraseña de un usuario de GitHub**, reemplaza `tu-usuario-de-github` por tu nombre de usuario de GitHub y envíala: el servidor responde `401` (y no `500`).

## 12. Experimentos

**¿Por qué no intercambiar el código desde la aplicación?** Abre la consola del navegador (F12) y escribe:

```javascript
fetch("https://github.com/login/oauth/access_token", {
  method: "POST",
  headers: { Accept: "application/json" },
  body: new URLSearchParams({ client_id: "x", client_secret: "y", code: "z" })
});
```

El navegador muestra el error de CORS del Taller 7: GitHub no envía el header `Access-Control-Allow-Origin`, por lo que no permite este intercambio desde otro sitio web. Pero aunque lo permitiera, la aplicación necesitaría el *client secret*, y **todo lo que está en el frontend es público**: cualquiera puede leerlo con las herramientas del navegador. Por eso el intercambio ocurre en el servidor.

**Cancelar la autorización.** GitHub recuerda que ya autorizaste tu aplicación y no vuelve a preguntar. Para ver la pantalla otra vez, revoca el acceso: en GitHub, abre **Settings** → **Applications** → pestaña **Authorized OAuth Apps**, busca tu aplicación y presiona **Revoke**. Luego presiona **Ingresar con GitHub** y, en la pantalla de autorización, cancela: la aplicación muestra *"Cancelaste la autorización en GitHub"*.

**Revocar el acceso no cierra la sesión.** Ingresa con GitHub y luego revoca el acceso a la aplicación en GitHub, como en el experimento anterior. Recarga la aplicación: sigues con la sesión iniciada. Nuestro JWT es independiente de GitHub y sigue siendo válido hasta su expiración, la misma limitación que vimos en el Taller 9.

**El mínimo privilegio.** En `routes/auth.js`, cambia el *scope* a `"read:user user:email"` y vuelve a ingresar con GitHub: como pedimos un permiso nuevo, GitHub vuelve a pedir autorización y muestra que la aplicación ahora quiere leer tus correos. Al terminar, vuelve a dejar `"read:user"`.

**Una ruta de retorno protegida por error.** En `src/App.tsx`, envuelve temporalmente la ruta `/auth/github/callback` con `RutaProtegida`, igual que `/publicaciones`, y cierra la sesión. Ingresa con GitHub: vuelves a la página de inicio de sesión sin haber ingresado, y en la terminal del backend no aparece el `POST /api/auth/github`. `RutaProtegida` redirigió al login antes de que la página pudiera leer el código. Al terminar, deshaz el cambio.

**La doble ejecución en desarrollo.** En `GithubCallbackPage.tsx`, borra temporalmente el bloque `if (yaProcesado.current) { ... }`, la línea `yaProcesado.current = true;` **y** la línea `window.history.replaceState(...)`. Cierra la sesión e ingresa con GitHub, observando la terminal del backend:

```text
POST /api/auth/github 400 86 - 1.569 ms
POST /api/auth/github 200 205 - 19.731 ms
```

`React.StrictMode` ejecutó el efecto dos veces y el `code` se envió dos veces. Una de las peticiones respondió `400` porque el `state` ya se había utilizado. Al terminar, deshaz los cambios.

## 13. Problemas frecuentes al configurar GitHub

| Síntoma | Causa probable | Solución |
|---|---|---|
| La terminal muestra `Faltan variables de entorno: ...` | Falta un valor en `.env` | Completa el `.env` y vuelve a levantar el servidor |
| GitHub muestra un error (normalmente una página `404`) al presionar **Ingresar con GitHub** | El `GITHUB_CLIENT_ID` es incorrecto | Cópialo nuevamente desde la página de tu OAuth App |
| GitHub muestra un error sobre la `redirect_uri` | `GITHUB_REDIRECT_URI` no coincide con la *Authorization callback URL* registrada | Deben ser exactamente iguales: `http://localhost:8100/auth/github/callback` |
| La aplicación muestra *"GitHub rechazó el código: The client_id and/or client_secret passed are incorrect."* | El `GITHUB_CLIENT_SECRET` es incorrecto | Genera un nuevo *client secret* en GitHub y actualiza `.env` |
| La aplicación muestra *"GitHub rechazó el código: Not Found"* | GitHub no reconoce el `GITHUB_CLIENT_ID` | Revisa el `GITHUB_CLIENT_ID` en `.env` |
| La aplicación muestra *"El parámetro state no es válido o expiró"* | Se reinició el servidor durante el inicio de sesión (los `state` se guardan en memoria), o pasaron más de 10 minutos | Vuelve a presionar **Ingresar con GitHub** |
| La aplicación muestra *"GitHub rechazó el código"* con el error `unverified_user_email` | El correo principal de la cuenta de GitHub no está verificado | Verifica el correo en la configuración de GitHub |

## 14. Comparación con el taller anterior

| Taller 9 | Taller 10 |
|---|---|
| El usuario escribe su contraseña en nuestra aplicación | El usuario escribe su contraseña en GitHub |
| Nuestro servidor verifica la contraseña con `bcrypt` | GitHub verifica la identidad; nuestro servidor verifica el `state` y canjea el `code` |
| Todos los usuarios tienen `passwordHash` | Los usuarios de GitHub tienen `githubId` y no tienen contraseña |
| El navegador solo habla con nuestro servidor | El navegador visita GitHub, y nuestro servidor habla con GitHub |
| Un solo secreto: `JWT_SECRET` | Dos secretos: `JWT_SECRET` y `GITHUB_CLIENT_SECRET` |
| Nuestro servidor emite el JWT | Nuestro servidor emite el **mismo** JWT |

> OAuth permite delegar la verificación de la identidad en un servicio externo sin conocer la contraseña del usuario. Gracias a que nuestra aplicación ya usaba su propio JWT, el resto del sistema no tuvo que cambiar.

---
# Desafío

1. Guarda la foto de perfil del usuario de GitHub (`perfil.avatar_url`) al crearlo, inclúyela en la respuesta de `GET /api/usuarios/yo` y muéstrala en la barra superior de la aplicación junto al nombre de usuario.
2. Los `state` que nunca se utilizan quedan guardados en el `Map` para siempre. Agrega en `routes/auth.js` una limpieza periódica con `setInterval` que elimine los `state` expirados cada minuto.

## Para seguir aprendiendo

- **OpenID Connect**: el estándar de autenticación sobre OAuth que utilizan proveedores como Google y Microsoft, que entrega un `id_token` con la identidad del usuario.
- **Vincular cuentas**: permitir que un usuario con contraseña conecte también su cuenta de GitHub, en lugar de crear un usuario nuevo.
- **GitHub Apps**: la alternativa que GitHub recomienda para integraciones más amplias que el inicio de sesión.

## Referencias

- GitHub - Creating an OAuth app: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app
- GitHub - Authorizing OAuth apps: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- GitHub - Troubleshooting OAuth app access token request errors: https://docs.github.com/en/apps/oauth-apps/maintaining-oauth-apps/troubleshooting-oauth-app-access-token-request-errors
- GitHub - PKCE support for OAuth and GitHub App authentication: https://github.blog/changelog/2025-07-14-pkce-support-for-oauth-and-github-app-authentication/
- OAuth 2.0: https://oauth.net/2/
- RFC 7636 - PKCE: https://datatracker.ietf.org/doc/html/rfc7636
- MDN - URLSearchParams: https://developer.mozilla.org/es/docs/Web/API/URLSearchParams
- React - StrictMode: https://react.dev/reference/react/StrictMode
