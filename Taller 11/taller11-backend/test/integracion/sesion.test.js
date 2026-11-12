// Pruebas de integración del inicio de sesión (contraseña y GitHub)

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const request = require("supertest");
const app = require("../../app");

describe("POST /api/login", () => {
  test("responde 200 con un token si las credenciales son correctas", async () => {
    const respuesta = await request(app).post("/api/login").send({ username: "ana", password: "ana-12345" });
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.body.username, "ana");
    assert.ok(respuesta.body.token);
  });

  test("responde 401 si la contraseña es incorrecta", async () => {
    await request(app)
      .post("/api/login")
      .send({ username: "ana", password: "incorrecta" })
      .expect(401, { error: "Usuario o contraseña incorrectos" });
  });
});

describe("GET /api/usuarios/yo", () => {
  test("responde 401 sin token", async () => {
    await request(app).get("/api/usuarios/yo").expect(401);
  });

  test("responde 401 con un token alterado", async () => {
    const sesion = await request(app)
      .post("/api/login")
      .send({ username: "ana", password: "ana-12345" })
      .expect(200);
    const [encabezado, datos, firma] = sesion.body.token.split(".");
    const firmaAlterada = (firma[0] === "A" ? "B" : "A") + firma.slice(1);
    await request(app)
      .get("/api/usuarios/yo")
      .set("Authorization", `Bearer ${encabezado}.${datos}.${firmaAlterada}`)
      .expect(401, { error: "Token inválido" });
  });
});

describe("Inicio de sesión con GitHub", () => {
  test("la URL de autorización incluye client_id, state y PKCE", async () => {
    const respuesta = await request(app).get("/api/auth/github/url").expect(200);
    const url = new URL(respuesta.body.url);
    assert.equal(url.origin, "https://github.com");
    assert.equal(url.pathname, "/login/oauth/authorize");
    assert.equal(url.searchParams.get("client_id"), process.env.GITHUB_CLIENT_ID);
    assert.equal(url.searchParams.get("redirect_uri"), process.env.GITHUB_REDIRECT_URI);
    assert.match(url.searchParams.get("state"), /^[0-9a-f]{32}$/);
    assert.match(url.searchParams.get("code_challenge"), /^[A-Za-z0-9_-]{43}$/);
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  });

  test("responde 400 si el state no fue generado por el servidor", async () => {
    const respuesta = await request(app)
      .post("/api/auth/github")
      .send({ code: "codigo-de-prueba", state: "state-inventado" })
      .expect(400);
    assert.match(respuesta.body.error, /state no es válido/);
  });

  // Desafio 2: Probar el intercambio con GitHub sin GitHub
  test("intercambia un código válido con GitHub simulado y emite una sesión", async (t) => {
    const autorizacion = await request(app).get("/api/auth/github/url").expect(200);
    const parametros = new URL(autorizacion.body.url).searchParams;
    const fetchSimulado = t.mock.method(globalThis, "fetch", async (url) => {
      if (url === "https://github.com/login/oauth/access_token") {
        return Response.json({ access_token: "token-github-de-prueba" });
      }
      assert.equal(url, "https://api.github.com/user");
      return Response.json({ id: 583231, login: "ana" });
    });

    const sesion = await request(app)
      .post("/api/auth/github")
      .send({ code: "codigo-de-prueba", state: parametros.get("state") })
      .expect(200);
    assert.equal(sesion.body.username, "ana-github");
    assert.ok(Number.isInteger(sesion.body.id));
    assert.ok(sesion.body.token);
    assert.equal(fetchSimulado.mock.callCount(), 2);
    const [, intercambio] = fetchSimulado.mock.calls[0].arguments;
    assert.equal(intercambio.method, "POST");
    assert.equal(intercambio.body.get("code"), "codigo-de-prueba");
    const challenge = createHash("sha256").update(intercambio.body.get("code_verifier")).digest("base64url");
    assert.equal(challenge, parametros.get("code_challenge"));
    const [, perfil] = fetchSimulado.mock.calls[1].arguments;
    assert.equal(perfil.headers.Authorization, "Bearer token-github-de-prueba");

    await request(app)
      .get("/api/usuarios/yo")
      .set("Authorization", `Bearer ${sesion.body.token}`)
      .expect(200, { id: sesion.body.id, username: "ana-github" });
  });
});
