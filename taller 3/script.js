const boton = document.getElementById("btn-cargar");
const estado = document.getElementById("estado");
const listaPosts = document.getElementById("lista-posts");

boton.addEventListener("click", function() {
  estado.textContent = "Cargando publicaciones...";
  listaPosts.innerHTML = "";


  // Mueve el método `fetch()` dentro de este evento "click".
  fetch("https://jsonplaceholder.typicode.com/posts")
    .then(response => response.json())
    .then(datos => {
      console.log(datos);
      console.log(datos[0]);
      console.log(datos[0].title);
      console.log(datos[0].body);
    


      estado.textContent = "Publicaciones cargadas correctamente.";
      datos.forEach(function(post) {
    // Crear aquí los elementos HTML
        const articulo = document.createElement("article");
        articulo.classList.add("post");

        const titulo = document.createElement("h3");
        titulo.textContent = post.title;

        const cuerpo = document.createElement("p");
        cuerpo.textContent = post.body;

        articulo.appendChild(titulo);
        articulo.appendChild(cuerpo);

        listaPosts.appendChild(articulo);
      });
    
    })
    .catch(error => {
        console.error(error);
        estado.textContent = "Ocurrió un error al cargar los datos.";
      });
});


