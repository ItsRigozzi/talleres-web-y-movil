import { useCallback, useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast
} from "@ionic/react";
import type { RefresherEventDetail } from "@ionic/react";
import { add } from "ionicons/icons";

import FormularioPublicacion from "../components/FormularioPublicacion";
import {
  actualizarPublicacion,
  crearPublicacion,
  eliminarPublicacion,
  obtenerPublicaciones
} from "../services/api";
import type { DatosPublicacion, Publicacion } from "../services/api";
import "./PublicacionesPage.css";

// Esta página ya está lista: no necesitas modificarla.
// Las peticiones al servidor se completan en src/services/api.ts

const mensajeDeError = (error: unknown) => (error instanceof Error ? error.message : String(error));

const PublicacionesPage: React.FC = () => {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [filtro, setFiltro] = useState("todas");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState<Publicacion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const lista = useRef<HTMLIonListElement>(null);

  const [presentarToast] = useIonToast();
  const [presentarAlerta] = useIonAlert();

  const mostrarMensaje = (mensaje: string, color: "success" | "danger") => {
    presentarToast({ message: mensaje, color, duration: 3000, position: "bottom" });
  };

  // GET: carga las publicaciones (con o sin filtro por usuario).
  const cargar = useCallback(async () => {
    setErrorCarga("");
    try {
      const userId = filtro === "todas" ? undefined : Number(filtro);
      setPublicaciones(await obtenerPublicaciones(userId));
    } catch (error) {
      setErrorCarga(mensajeDeError(error));
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const recargar = async (evento: CustomEvent<RefresherEventDetail>) => {
    await cargar();
    evento.detail.complete();
  };

  const abrirNueva = () => {
    setEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (publicacion: Publicacion) => {
    setEnEdicion(publicacion);
    setModalAbierto(true);
  };

  // POST o PUT, según si estamos creando o editando.
  const guardar = async (datos: DatosPublicacion) => {
    setGuardando(true);
    try {
      if (enEdicion) {
        await actualizarPublicacion(enEdicion.id, datos);
        mostrarMensaje("Publicación actualizada", "success");
      } else {
        await crearPublicacion(datos);
        mostrarMensaje("Publicación creada", "success");
      }
      setModalAbierto(false);
      await cargar();
    } catch (error) {
      // El formulario queda abierto para que se pueda corregir.
      mostrarMensaje(mensajeDeError(error), "danger");
    } finally {
      setGuardando(false);
    }
  };

  // DELETE, después de confirmar.
  const confirmarEliminacion = (publicacion: Publicacion) => {
    presentarAlerta({
      header: "Eliminar publicación",
      message: `¿Quieres eliminar «${publicacion.title}»?`,
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          role: "destructive",
          handler: async () => {
            try {
              await eliminarPublicacion(publicacion.id);
              setModalAbierto(false);
              await cargar();
              presentarToast({
                message: "Publicación eliminada",
                color: "success",
                duration: 5000,
                position: "bottom",
                buttons: [
                  {
                    text: "Deshacer",
                    handler: async () => {
                      try {
                        await crearPublicacion({
                          userId: publicacion.userId,
                          title: publicacion.title,
                          body: publicacion.body
                        });
                        await cargar();
                      } catch (error) {
                        mostrarMensaje(mensajeDeError(error), "danger");
                      }
                    }
                  }
                ]
              });
            } catch (error) {
              mostrarMensaje(mensajeDeError(error), "danger");
            }
          }
        }
      ],
      onDidDismiss: () => lista.current?.closeSlidingItems()
    });
  };
  /*No.
  Porque al usar POST,
  el servidor siempre genera un nuevo id automáticamente sumándole 1 al más alto que exista en ese momento.*/
  // Si el paso 7 no está completo, el servidor devuelve todas las publicaciones.
  const filtroSinAplicar =
    filtro !== "todas" && publicaciones.some((p) => p.userId !== Number(filtro));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Publicaciones</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment scrollable value={filtro} onIonChange={(e) => setFiltro(String(e.detail.value))}>
            <IonSegmentButton value="todas">
              <IonLabel>Todas</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="1">
              <IonLabel>Usuario 1</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="2">
              <IonLabel>Usuario 2</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="3">
              <IonLabel>Usuario 3</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={recargar}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="publicaciones">
          {cargando && (
            <div className="estado">
              <IonSpinner name="dots" />
            </div>
          )}

          {!cargando && errorCarga && (
            <div className="estado">
              <p className="error">No se pudieron cargar las publicaciones: {errorCarga}</p>
              <p>Revisa que el servidor Express esté ejecutándose y abre la consola del navegador (F12).</p>
              <IonButton fill="outline" onClick={() => cargar()}>
                Reintentar
              </IonButton>
            </div>
          )}

          {!cargando && !errorCarga && filtroSinAplicar && (
            <p className="aviso">
              Se muestran publicaciones de otros usuarios: el filtro no se está enviando al servidor. Completa el
              paso 7 en src/services/api.ts.
            </p>
          )}

          {!cargando && !errorCarga && publicaciones.length === 0 && (
            <div className="estado">
              <p>No hay publicaciones.</p>
              <IonButton onClick={abrirNueva}>Crear publicación</IonButton>
            </div>
          )}

          {!cargando && !errorCarga && publicaciones.length > 0 && (
            <>
              <p className="ayuda">Toca una publicación para editarla o deslízala hacia la izquierda para eliminarla.</p>
              <IonList ref={lista}>
                {publicaciones.map((publicacion) => (
                  <IonItemSliding key={publicacion.id}>
                    <IonItem button detail={false} onClick={() => abrirEdicion(publicacion)}>
                      <IonLabel>
                        <h2>{publicacion.title}</h2>
                        <p>{publicacion.body}</p>
                      </IonLabel>
                      <IonNote slot="end">Usuario {publicacion.userId}</IonNote>
                    </IonItem>
                    <IonItemOptions side="end">
                      <IonItemOption color="danger" onClick={() => confirmarEliminacion(publicacion)}>
                        Eliminar
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>
            </>
          )}
        </div>

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={abrirNueva} aria-label="Nueva publicación">
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={modalAbierto} onDidDismiss={() => setModalAbierto(false)}>
          {modalAbierto && (
            <FormularioPublicacion
              key={enEdicion?.id ?? "nueva"}
              publicacion={enEdicion}
              guardando={guardando}
              onCancelar={() => setModalAbierto(false)}
              onGuardar={guardar}
              onEliminar={confirmarEliminacion}
            />
          )}
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default PublicacionesPage;
