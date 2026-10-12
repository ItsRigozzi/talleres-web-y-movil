// Taller 8: completa los pasos 7, 8 y 9 de este archivo.
// El resto de la aplicación ya está listo y utiliza estas funciones.

export interface Publicacion {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface DatosPublicacion {
  userId: number;
  title: string;
  body: string;
}

// Dirección del servidor Express (Taller 7).
// Si prefieres utilizar el proxy de desarrollo de Ionic, cambia este valor por "/servidor"
// y configura vite.config.ts como en el Taller 7.
export const API_URL = "http://localhost:3000";

// Revisa la respuesta del servidor (ya está lista).
// fetch() solo falla cuando no hay respuesta (por ejemplo, por un error de CORS
// o porque el servidor está apagado). Un 400 o un 404 SÍ son respuestas, por eso
// revisamos response.ok y lanzamos un error con el mensaje que envió el servidor.
const procesarRespuesta = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }
  const texto = await response.text();
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    datos = null;
  }
  if (!response.ok) {
    throw new Error(datos?.error ?? `El servidor respondió con el código ${response.status}`);
  }
  return datos;
};

// GET /api/posts
// 7: Si se recibe userId, agrega el parámetro de consulta a la URL (por ejemplo, ?userId=2).
export const obtenerPublicaciones = async (userId?: number): Promise<Publicacion[]> => {
  const url = userId ? `${API_URL}/api/posts?userId=${userId}` : `${API_URL}/api/posts`;
  const response = await fetch(url);
  return procesarRespuesta(response);
};

// POST /api/posts (ejemplo ya resuelto)
export const crearPublicacion = async (datos: DatosPublicacion): Promise<Publicacion> => {
  const response = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });
  return procesarRespuesta(response);
};

// 8: PUT /api/posts/:id
// Pista: es muy parecida a crearPublicacion, pero cambian el método y la URL.
export const actualizarPublicacion = async (id: number, datos: DatosPublicacion): Promise<Publicacion> => {
  const response = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });
  return procesarRespuesta(response);
};

// 9: DELETE /api/posts/:id
// Pista: no necesita headers ni body.
export const eliminarPublicacion = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/posts/${id}`, { method: "DELETE" });
  await procesarRespuesta(response);
};
