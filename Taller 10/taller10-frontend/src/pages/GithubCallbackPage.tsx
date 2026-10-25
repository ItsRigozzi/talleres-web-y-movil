import { useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonRouter
} from "@ionic/react";

import { iniciarSesionConGithub } from "../services/api";
import { guardarSesion } from "../services/sesion";
import "./GithubCallbackPage.css";

// Página a la que GitHub devuelve al usuario después de autorizar (o rechazar) la aplicación.
// GitHub agrega parámetros a la URL, por ejemplo:
//   /auth/github/callback?code=abc123&state=9f2e...
//   /auth/github/callback?error=access_denied&state=9f2e...
// Esta página ya está lista, salvo la función leerParametros (paso 6).

interface ParametrosGithub {
  code: string | null;
  state: string | null;
  error: string | null;
}

// 6: Lee los parámetros code, state y error de la URL actual.
// Pista: new URLSearchParams(window.location.search) permite leer cada parámetro con .get("nombre").
const leerParametros = (): ParametrosGithub => {
  const parametros = new URLSearchParams(window.location.search);
  return {
    code: parametros.get("code"),
    state: parametros.get("state"),
    error: parametros.get("error")
  };
};

const GithubCallbackPage: React.FC = () => {
  const [mensaje, setMensaje] = useState("Verificando tu cuenta de GitHub...");
  const [fallo, setFallo] = useState(false);
  const router = useIonRouter();
  const yaProcesado = useRef(false);

  useEffect(() => {
    // En desarrollo, React.StrictMode (src/main.tsx) ejecuta los efectos dos veces.
    // Sin esta protección, el code y el state se enviarían dos veces al servidor,
    // y el segundo intento fallaría porque el state es de un solo uso.
    if (yaProcesado.current) {
      return;
    }
    yaProcesado.current = true;

    const hayParametros = window.location.search !== "";
    const { code, state, error } = leerParametros();

    // El code es de un solo uso: lo quitamos de la barra de direcciones y del historial.
    window.history.replaceState(null, "", window.location.pathname);

    const fallar = (texto: string) => {
      setFallo(true);
      setMensaje(texto);
    };

    if (error === "access_denied") {
      fallar("Cancelaste la autorización en GitHub.");
      return;
    }
    if (error) {
      fallar(`GitHub respondió con un error: ${error}`);
      return;
    }
    if (!code || !state) {
      fallar(
        hayParametros
          ? "GitHub envió parámetros en la URL, pero no se están leyendo. Completa el paso 6 en src/pages/GithubCallbackPage.tsx."
          : "No se recibió el código de GitHub. Vuelve a ingresar con GitHub."
      );
      return;
    }

    iniciarSesionConGithub(code, state)
      .then((sesion) => {
        guardarSesion(sesion);
        router.push("/publicaciones", "root", "replace");
      })
      .catch((errorServidor) => {
        fallar(errorServidor instanceof Error ? errorServidor.message : String(errorServidor));
      });
  }, [router]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Ingresar con GitHub</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="callback">
          {!fallo && <IonSpinner name="dots" />}
          <p className={fallo ? "error" : undefined}>{mensaje}</p>
          {fallo && (
            <IonButton fill="outline" onClick={() => router.push("/login", "root", "replace")}>
              Volver al inicio de sesión
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default GithubCallbackPage;
