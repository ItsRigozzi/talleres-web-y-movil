// Pruebas unitarias de utils/usuarios.js

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { nombreDisponible } = require("../../utils/usuarios");

describe("nombreDisponible", () => {
  test("devuelve el mismo nombre si está libre", () => {
    const usuarios = [{ username: "ana" }];
    assert.equal(nombreDisponible("octocat", usuarios), "octocat");
  });

  test("agrega -github si el nombre ya existe", () => {
    assert.equal(nombreDisponible("ana", [{ username: "ana" }]), "ana-github");
  });

  test("agrega -github2 si también existe ana-github", () => {
    const usuarios = [{ username: "ana" }, { username: "ana-github" }];
    assert.equal(nombreDisponible("ana", usuarios), "ana-github2");
  });

  test("no modifica la lista de usuarios", () => {
    const usuarios = [{ username: "ana" }];
    nombreDisponible("ana", usuarios);
    assert.deepEqual(usuarios, [{ username: "ana" }]);
  });
});
