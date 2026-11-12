// Pruebas unitarias de src/services/api.ts
// fetch se reemplaza por una función simulada (vi.fn), así no se necesita el servidor.
import { afterEach, describe, expect, test, vi } from "vitest";
import { ErrorApi, crearPublicacion, eliminarPublicacion, encabezadosConToken, obtenerPublicaciones } from "./api";
import { guardarSesion } from "./sesion";

// Crea una respuesta HTTP con un cuerpo JSON, como la que enviaría nuestro servidor.
const respuestaJson = (status: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("encabezadosConToken", () => {
  test("no agrega Authorization si no hay sesión", () => {
    expect(encabezadosConToken()).toEqual({});
  });

  test("agrega Authorization con el token de la sesión", () => {
    guardarSesion({ token: "abc123", id: 1, username: "ana" });
    expect(encabezadosConToken()).toEqual({ Authorization: "Bearer abc123" });
  });
});

describe("obtenerPublicaciones", () => {
  test("agrega ?userId= a la URL al filtrar por usuario", async () => {
    const fetchSimulado = vi.fn().mockResolvedValue(respuestaJson(200, []));
    vi.stubGlobal("fetch", fetchSimulado);

    await expect(obtenerPublicaciones(2)).resolves.toEqual([]);
    expect(fetchSimulado).toHaveBeenCalledWith("http://localhost:3000/api/posts?userId=2");
  });
});

describe("crearPublicacion", () => {
  test("envía un POST con el token de la sesión", async () => {
    guardarSesion({ token: "abc123", id: 1, username: "ana" });
    const datos = { title: "Hola", body: "Mundo" };
    const publicacion = { ...datos, id: 6, userId: 1 };
    const fetchSimulado = vi.fn().mockResolvedValue(respuestaJson(201, publicacion));
    vi.stubGlobal("fetch", fetchSimulado);

    await expect(crearPublicacion(datos)).resolves.toEqual(publicacion);
    expect(fetchSimulado).toHaveBeenCalledWith("http://localhost:3000/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer abc123" },
      body: JSON.stringify(datos)
    });
  });

  test("lanza un ErrorApi con el mensaje del servidor si responde 400", async () => {
    const mensaje = "Debes enviar title y body";
    const fetchSimulado = vi.fn().mockResolvedValue(respuestaJson(400, { error: mensaje }));
    vi.stubGlobal("fetch", fetchSimulado);

    const creacion = crearPublicacion({ title: "", body: "" });
    await expect(creacion).rejects.toBeInstanceOf(ErrorApi);
    await expect(creacion).rejects.toMatchObject({ status: 400, message: mensaje });
  });
});

describe("eliminarPublicacion", () => {
  test("acepta una respuesta 204 sin contenido", async () => {
    const fetchSimulado = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchSimulado);

    await expect(eliminarPublicacion(6)).resolves.toBeUndefined();
    expect(fetchSimulado).toHaveBeenCalledWith("http://localhost:3000/api/posts/6", {
      method: "DELETE",
      headers: {}
    });
  });
});
