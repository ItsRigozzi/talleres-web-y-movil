import { useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar
} from "@ionic/react";

import * as api from "../services/api";
import "./PruebasPage.css";

// Esta página ya está lista: no necesitas modificarla.
// Las URL de cada petición se completan en src/services/api.ts

//habilito la funcion delete
type Metodo = "GET" | "POST" | "DELETE";

interface Prueba {
  id: number;
  nombre: string;
  metodo: Metodo;
  ruta: string;
  esperado: number;
  enviar: () => Promise<Response>;
}

type Resultado =
  | { tipo: "cargando" }
  | {
      tipo: "respuesta";
      status: number;
      statusText: string;
      url: string;
      cuerpo: string;
      ms: number;
      aviso: string;
    }
  | { tipo: "error"; mensaje: string; ms: number };

// Las mismas peticiones de la colección de Postman del Taller 6.
const pruebas: Prueba[] = [
  { id: 1, nombre: "Mensaje de bienvenida", metodo: "GET", ruta: "/", esperado: 200, enviar: api.obtenerBienvenida },
  { id: 2, nombre: "Saludo personalizado", metodo: "GET", ruta: "/saludo/Nombre", esperado: 200, enviar: api.obtenerSaludo },
  { id: 3, nombre: "Todas las publicaciones", metodo: "GET", ruta: "/api/posts", esperado: 200, enviar: api.obtenerPublicaciones },
  { id: 4, nombre: "Una publicación", metodo: "GET", ruta: "/api/posts/1", esperado: 200, enviar: api.obtenerPublicacion },
  { id: 5, nombre: "Publicación inexistente", metodo: "GET", ruta: "/api/posts/999", esperado: 404, enviar: api.obtenerPublicacionInexistente },
  { id: 6, nombre: "Publicaciones de un usuario", metodo: "GET", ruta: "/api/posts?userId=2", esperado: 200, enviar: api.obtenerPublicacionesDeUsuario },
  { id: 7, nombre: "Crear publicación", metodo: "POST", ruta: "/api/posts", esperado: 201, enviar: api.crearPublicacion },
  { id: 8, nombre: "Crear publicación sin título", metodo: "POST", ruta: "/api/posts", esperado: 400, enviar: api.crearPublicacionSinTitulo },
  { id: 9, nombre: "Ruta inexistente", metodo: "GET", ruta: "/no-existe", esperado: 404, enviar: api.obtenerRutaInexistente },
  { id: 10, nombre: "Eliminar publicación", metodo: "DELETE", ruta: "/api/posts/3", esperado: 200, enviar: () => api.eliminarPublicacion(3) }
];

// Muestra el JSON con sangría; si la respuesta no es JSON, la deja como texto.
const formatear = (texto: string) => {
  try {
    return JSON.stringify(JSON.parse(texto), null, 2);
  } catch {
    return texto;
  }
};

// Detecta respuestas que no vienen del servidor Express.
const revisarRespuesta = (response: Response, texto: string) => {
  if (response.url === document.baseURI) {
    return "La URL de esta petición está vacía o incompleta. Complétala en src/services/api.ts.";
  }
  const vieneDelFrontend = new URL(response.url).origin === window.location.origin;
  if (vieneDelFrontend && response.status === 502) {
    return "El proxy de Ionic no pudo conectarse con el servidor Express. Revisa que esté ejecutándose (npm run dev).";
  }
  if (texto.includes('<div id="root">') || (vieneDelFrontend && response.status === 404 && texto === "")) {
    return "Esta respuesta viene del servidor de Ionic (el frontend), no del servidor Express. Revisa la URL o la configuración del proxy.";
  }
  return "";
};

const claseEstado = (status: number) => {
  if (status >= 200 && status < 300) return "estado exito";
  if (status >= 400 && status < 500) return "estado advertencia";
  return "estado fallo";
};

const PruebasPage: React.FC = () => {
  const [resultados, setResultados] = useState<Record<number, Resultado>>({});
  const [enviandoTodas, setEnviandoTodas] = useState(false);

  const enviar = async (prueba: Prueba) => {
    setResultados((prev) => ({ ...prev, [prueba.id]: { tipo: "cargando" } }));
    const inicio = performance.now();
    let resultado: Resultado;

    try {
      const response = await prueba.enviar();
      const texto = await response.text();
      const aviso = revisarRespuesta(response, texto);
      resultado = {
        tipo: "respuesta",
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        cuerpo: aviso ? "" : formatear(texto),
        ms: Math.round(performance.now() - inicio),
        aviso
      };
    } catch (error) {
      console.error(error);
      resultado = {
        tipo: "error",
        mensaje: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
        ms: Math.round(performance.now() - inicio)
      };
    }

    setResultados((prev) => ({ ...prev, [prueba.id]: resultado }));
  };

  const enviarTodas = async () => {
    setEnviandoTodas(true);
    for (const prueba of pruebas) {
      await enviar(prueba);
    }
    setEnviandoTodas(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Taller 7: Ionic + Express</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={enviarTodas} disabled={enviandoTodas}>
              Enviar todas
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="pruebas">
          <header className="intro">
            <h1>Pruebas de la API</h1>
            <p>
              Mismas peticiones del taller 6, ahora enviadas desde el Frontend en ves de Postman.
            </p>
            <p className="servidor">
              Servidor: <code>{api.API_URL || "sin completar (paso 1 de src/services/api.ts)"}</code>
            </p>
          </header>

          <ol className="lista">
            {pruebas.map((prueba) => {
              const resultado = resultados[prueba.id];

              return (
                <li key={prueba.id} className="prueba">
                  <div className="peticion">
                    <span className={`metodo ${prueba.metodo.toLowerCase()}`}>{prueba.metodo}</span>
                    <div className="detalle">
                      <h2>{prueba.nombre}</h2>
                      <code className="ruta">{prueba.ruta}</code>
                      <span className="esperado">Esperado en Postman: {prueba.esperado}</span>
                    </div>
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => enviar(prueba)}
                      disabled={resultado?.tipo === "cargando"}
                    >
                      Enviar
                    </IonButton>
                  </div>

                  {resultado?.tipo === "cargando" && (
                    <div className="resultado">
                      <IonSpinner name="dots" />
                    </div>
                  )}

                  {resultado?.tipo === "respuesta" && (
                    <div className="resultado">
                      <p className="meta">
                        <span className={claseEstado(resultado.status)}>
                          {resultado.status} {resultado.statusText}
                        </span>
                        <span>{resultado.ms} ms</span>
                      </p>
                      <p className="url">{resultado.url}</p>
                      {resultado.aviso ? (
                        <p className="aviso">{resultado.aviso}</p>
                      ) : (
                        <pre className="cuerpo">{resultado.cuerpo || "(sin contenido)"}</pre>
                      )}
                    </div>
                  )}

                  {resultado?.tipo === "error" && (
                    <div className="resultado">
                      <p className="meta">
                        <span className="estado fallo">Sin respuesta</span>
                        <span>{resultado.ms} ms</span>
                      </p>
                      <p className="aviso">
                        El navegador no entregó la respuesta ({resultado.mensaje}). Abre la consola
                        del navegador (F12) para ver el motivo: puede ser un bloqueo de CORS o que el
                        servidor no esté ejecutándose.
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PruebasPage;
