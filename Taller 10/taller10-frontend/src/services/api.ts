// Taller 10: completa el paso 5 de este archivo.
// El resto de las funciones viene del Taller 9 (ya completo).

import { obtenerSesion } from "./sesion";
import type { Sesion } from "./sesion";

export interface Publicacion {
  userId: number;
  id: number;
  title: string;
  body: string;
}

// Ya no enviamos userId: el servidor lo toma del token.
export interface DatosPublicacion {
  title: string;
  body: string;
}

// Dirección del servidor Express.
export const API_URL = "http://localhost:3000";

// Error con el código de estado de la respuesta, para que la página
// pueda reaccionar distinto ante un 401 (por ejemplo, volver al login).
export class ErrorApi extends Error {
  status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

// Revisa la respuesta del servidor (ya está lista, igual que en el Taller 8).
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
    throw new ErrorApi(datos?.error ?? `El servidor respondió con el código ${response.status}`, response.status);
  }
  return datos;
};

// POST /api/login (Taller 9)
// Envía username y password, y devuelve la respuesta del servidor ({ token, id, username }).
// Pista: es muy parecida a crearPublicacion.
export const iniciarSesion = async (username: string, password: string): Promise<Sesion> => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return procesarRespuesta(response);
};

// Header Authorization con el token de la sesión (Taller 9).
export const encabezadosConToken = (): Record<string, string> => {
  const sesion = obtenerSesion();
  const encabezados: Record<string, string> = {};
  if (sesion) {
    encabezados.Authorization = `Bearer ${sesion.token}`;
  }
  return encabezados;
};

// 5: GET /api/auth/github/url
// Pide al servidor la URL de autorización de GitHub. El servidor responde { url }.
export const obtenerUrlGithub = async (): Promise<string> => {
  const response = await fetch(`${API_URL}/api/auth/github/url`);
  const datos = await procesarRespuesta(response);
  return datos.url;
};

// 5: POST /api/auth/github
// Envía el code y el state que entregó GitHub, y devuelve la sesión ({ token, id, username }).
// Pista: es muy parecida a iniciarSesion.
export const iniciarSesionConGithub = async (code: string, state: string): Promise<Sesion> => {
  const response = await fetch(`${API_URL}/api/auth/github`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state })
  });
  return procesarRespuesta(response);
};

// GET /api/usuarios/yo (ruta protegida)
// desafio 1 Retorna avatarUrl si el usuario se registró con GitHub
export const obtenerPerfil = async (): Promise<{ id: number; username: string; avatarUrl?: string }> => {
  const response = await fetch(`${API_URL}/api/usuarios/yo`, { headers: encabezadosConToken() });
  return procesarRespuesta(response);
};

// GET /api/posts (ruta pública)
export const obtenerPublicaciones = async (userId?: number): Promise<Publicacion[]> => {
  const url = userId ? `${API_URL}/api/posts?userId=${userId}` : `${API_URL}/api/posts`;
  const response = await fetch(url);
  return procesarRespuesta(response);
};

// POST /api/posts (ruta protegida)
export const crearPublicacion = async (datos: DatosPublicacion): Promise<Publicacion> => {
  const response = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...encabezadosConToken() },
    body: JSON.stringify(datos)
  });
  return procesarRespuesta(response);
};

// PUT /api/posts/:id (ruta protegida)
export const actualizarPublicacion = async (id: number, datos: DatosPublicacion): Promise<Publicacion> => {
  const response = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...encabezadosConToken() },
    body: JSON.stringify(datos)
  });
  return procesarRespuesta(response);
};

// DELETE /api/posts/:id (ruta protegida)
export const eliminarPublicacion = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: encabezadosConToken()
  });
  await procesarRespuesta(response);
};
