import { useState } from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar
} from "@ionic/react";

import "./PostsPage.css";

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

const PostsPage: React.FC = () => {
  // 1: Crear el estado para almacenar publicaciones.
  const [posts, setPosts] = useState<Post[]>([]);


  // 2: Crear el estado para saber si los datos se están cargando.
  const [cargando, setCargando] = useState(false);
  // 3: Crear el estado para almacenar errores.
  const [error, setError] = useState("");

  const cargarPosts = () => {
    // - Indicar que comenzó la carga.
    setCargando(true);

    fetch("https://jsonplaceholder.typicode.com/posts")
      .then((response) => response.json())
      .then((datos) => {
        setPosts(datos);
      })
      .catch((error) => {
        console.error(error);
        setError("Ocurrió un error al cargar las publicaciones.");
      })
      .finally(() => {
        setCargando(false);
      });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Taller 4: Ionic + React + APIs</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="intro">
          <h1>Publicaciones</h1>
          <p>
            Presiona el botón para obtener información desde JSONPlaceholder.
          </p>

          <IonButton onClick={cargarPosts}>
            Cargar publicaciones
          </IonButton>
        </div>

        {cargando && (
          <div className="estado">
            <IonSpinner />
            <p>Cargando publicaciones...</p>
          </div>
        )}

        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}


        <div className="posts-container">
          {posts.map((post) => (
            <IonCard key={post.id}>
              <IonCardHeader>
                <IonCardTitle>{post.title}</IonCardTitle>
              </IonCardHeader>

              <IonCardContent>
                {post.body}
              </IonCardContent>
            </IonCard>
          ))
}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PostsPage;
