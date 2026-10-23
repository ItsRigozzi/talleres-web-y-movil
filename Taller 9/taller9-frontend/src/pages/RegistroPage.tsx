// Desafío 1: Página de registro
import { useState } from "react";
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
  useIonToast
} from "@ionic/react";

import { registrarUsuario } from "../services/api";
import "./LoginPage.css";

const RegistroPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const router = useIonRouter();
  const [presentarToast] = useIonToast();

  const registrar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setEnviando(true);
    try {
      await registrarUsuario(username, password);
      presentarToast({
        message: "Usuario registrado con éxito. Ahora puedes iniciar sesión.",
        color: "success",
        duration: 3000,
        position: "bottom"
      });
      router.push("/login", "root", "replace");
    } catch (error) {
      presentarToast({
        message: error instanceof Error ? error.message : String(error),
        color: "danger",
        duration: 3000,
        position: "bottom"
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Registrarse</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <form className="login" onSubmit={registrar}>
          <h1>Crear cuenta</h1>
          <p>Ingresa un nombre de usuario y una contraseña (mínimo 8 caracteres).</p>

          <IonList>
            <IonItem>
              <IonInput
                label="Usuario"
                labelPlacement="stacked"
                value={username}
                autocomplete="username"
                placeholder="Por ejemplo: lucas"
                onIonInput={(e) => setUsername(e.detail.value ?? "")}
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Contraseña"
                labelPlacement="stacked"
                type="password"
                value={password}
                autocomplete="new-password"
                placeholder="Mínimo 8 caracteres"
                onIonInput={(e) => setPassword(e.detail.value ?? "")}
              >
                <IonInputPasswordToggle slot="end" />
              </IonInput>
            </IonItem>
          </IonList>

          <IonButton type="submit" expand="block" disabled={enviando}>
            Registrarme
          </IonButton>

          <IonButton routerLink="/login" fill="clear" expand="block">
            ¿Ya tienes cuenta? Inicia sesión
          </IonButton>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default RegistroPage;
