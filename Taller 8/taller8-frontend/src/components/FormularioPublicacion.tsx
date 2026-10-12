import { useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToolbar
} from "@ionic/react";

import type { DatosPublicacion, Publicacion } from "../services/api";

// Este componente ya está listo: no necesitas modificarlo.
// Se utiliza tanto para crear (publicacion = null) como para editar una publicación.

interface Props {
  publicacion: Publicacion | null;
  guardando: boolean;
  onCancelar: () => void;
  onGuardar: (datos: DatosPublicacion) => void;
  onEliminar: (publicacion: Publicacion) => void;
}

const FormularioPublicacion: React.FC<Props> = ({ publicacion, guardando, onCancelar, onGuardar, onEliminar }) => {
  const [title, setTitle] = useState(publicacion?.title ?? "");
  const [body, setBody] = useState(publicacion?.body ?? "");
  const [userId, setUserId] = useState(publicacion?.userId ?? 1);

  // No validamos aquí a propósito: si falta un campo, el servidor responde 400
  // y la aplicación muestra su mensaje.
  const guardar = () => {
    onGuardar({ userId, title, body });
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onCancelar}>Cancelar</IonButton>
          </IonButtons>
          <IonTitle>{publicacion ? "Editar" : "Nueva"}</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={guardar} disabled={guardando}>
              Guardar
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonList>
          <IonItem>
            <IonInput
              label="Título"
              labelPlacement="stacked"
              value={title}
              placeholder="Escribe el título"
              onIonInput={(e) => setTitle(e.detail.value ?? "")}
            />
          </IonItem>
          <IonItem>
            <IonTextarea
              label="Contenido"
              labelPlacement="stacked"
              value={body}
              autoGrow
              rows={4}
              placeholder="Escribe el contenido"
              onIonInput={(e) => setBody(e.detail.value ?? "")}
            />
          </IonItem>
          <IonItem>
            <IonSelect
              label="Usuario"
              labelPlacement="stacked"
              value={userId}
              onIonChange={(e) => setUserId(Number(e.detail.value))}
            >
              <IonSelectOption value={1}>Usuario 1</IonSelectOption>
              <IonSelectOption value={2}>Usuario 2</IonSelectOption>
              <IonSelectOption value={3}>Usuario 3</IonSelectOption>
            </IonSelect>
          </IonItem>
        </IonList>
      </IonContent>

      {publicacion && (
        <IonFooter>
          <IonToolbar>
            <IonButton
              expand="block"
              fill="clear"
              color="danger"
              disabled={guardando}
              onClick={() => onEliminar(publicacion)}
            >
              Eliminar publicación
            </IonButton>
          </IonToolbar>
        </IonFooter>
      )}
    </>
  );
};

export default FormularioPublicacion;
