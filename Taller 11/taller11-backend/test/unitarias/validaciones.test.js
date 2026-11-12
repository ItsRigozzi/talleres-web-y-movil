// Pruebas unitarias de utils/validaciones.js

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { validarPublicacion } = require("../../utils/validaciones");

describe("validarPublicacion", () => {
  test("acepta una publicación con title y body", () => {
    assert.equal(validarPublicacion({ title: "Hola", body: "Mundo" }), null);
  });

  test("rechaza una publicación sin title", () => {
    assert.equal(validarPublicacion({ body: "Mundo" }), "Debes enviar title y body");
  });

  test("rechaza un title vacío", () => {
    assert.equal(validarPublicacion({ title: "", body: "Mundo" }), "Debes enviar title y body");
  });

  test("rechaza cuando no se envían datos", () => {
    assert.equal(validarPublicacion(undefined), "Debes enviar title y body");
  });
});
