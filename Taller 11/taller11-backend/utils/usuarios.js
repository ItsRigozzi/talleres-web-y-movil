// Funciones sobre los usuarios (ya está listo).

// Elige un nombre de usuario que no exista en la lista recibida.
// Si "ana" ya existe, prueba "ana-github", luego "ana-github2", etc.
const nombreDisponible = (login, usuarios) => {
  let nombre = login;
  let intento = 1;
  while (usuarios.some((u) => u.username === nombre)) {
    nombre = intento === 1 ? `${login}-github` : `${login}-github${intento}`;
    intento++;
  }
  return nombre;
};

module.exports = { nombreDisponible };
