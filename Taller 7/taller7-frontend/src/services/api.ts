// Taller 7: Ionic + React + Express
// Completa la URL de cada fetch(). Cada función corresponde a una petición
// de la colección de Postman que creaste en el Taller 6.
// El resto del código (método, headers y body) ya está listo.

// 1: Escribe la dirección de tu servidor Express (la misma que usabas en Postman).
export const API_URL = "/servidor";

// 2: GET «Mensaje de bienvenida»
// Pista: fetch(`${API_URL}/`)
export const obtenerBienvenida = () =>
  fetch(`${API_URL}/`);

// 3: GET «Saludo personalizado» (con el nombre Camila)
export const obtenerSaludo = () =>
  fetch(`${API_URL}/saludo/Nombre`);

// 4: GET «Todas las publicaciones»
export const obtenerPublicaciones = () =>
  fetch(`${API_URL}/api/posts`);

// 5: GET «Una publicación» (la publicación con id 1)
export const obtenerPublicacion = () =>
  fetch(`${API_URL}/api/posts/1`);

// 6: GET «Publicación inexistente» (la  publicación con id 999)
export const obtenerPublicacionInexistente = () =>
  fetch(`${API_URL}/api/posts/999`);

// 7: GET «Publicaciones de un usuario» (el usuario con userId 2)
export const obtenerPublicacionesDeUsuario = () =>
  fetch(`${API_URL}/api/posts?userId=2`);

// 8: POST «Crear publicación»
export const crearPublicacion = () =>
  fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: 1,
      title: "Mi primera publicación",
      body: "Creada desde Ionic"
    })
  });

// 9: POST «Crear publicación sin título»
export const crearPublicacionSinTitulo = () =>
  fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      body: "A esta publicación le falta el título"
    })
  });

// 10: GET «Ruta inexistente»
export const obtenerRutaInexistente = () =>
  fetch(`${API_URL}/no-existe`);

// 11: DELETE «Eliminar publicación»
export const eliminarPublicacion = (id: number) =>
  fetch(`${API_URL}/api/posts/3`, {
    method: "DELETE"
  });