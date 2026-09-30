# Taller 3: JavaScript + APIs

## Objetivo

Aprender a obtener información desde una API y mostrarla dinámicamente en una página web.

En este taller utilizaremos JSONPlaceholder, una API gratuita para realizar pruebas y prototipos. Entre sus recursos se encuentran `/posts`, `/comments`, `/albums`, `/photos`, `/todos` y `/users`.

## 1. Estructura recomendada

```text
taller3/
├── index.html
├── style.css
├── script.js
└── README.md
```

## 2. Explorar la API

Abre el siguiente enlace en el navegador:

```text
https://jsonplaceholder.typicode.com/posts
```

La URL anterior contiene un arreglo de objetos JSON asociados a publicaciones ficticias. Cada publicación incluye propiedades como `id`, `title`, `body` y `userId`. La documentación oficial de JSONPlaceholder muestra el uso del método `fetch()` para listar recursos.

## 3. Nuestro primer `fetch()`

En tu archivo `script.js` (créalo si no lo has hecho aún), pega el siguiente fragmento de código:

```javascript
fetch("https://jsonplaceholder.typicode.com/posts")
  .then(response => response.json())
  .then(datos => {
    console.log(datos);
  });
```

Abre la consola del navegador y observa si recibiste correctamente la información que proporciona la URL.

Después prueba:

```javascript
console.log(datos[0]);
console.log(datos[0].title);
console.log(datos[0].body);
```

**Nota**: 
- *Fetch es una función de JavaScript que puede utilizar para enviar una solicitud a cualquier URL de API web y obtener una respuesta. Puedes leer más al respecto en el siguiente enlace: https://www.freecodecamp.org/espanol/news/javascript-fetch-api-para-principiantes/*
- *Por otra parte, el código anterior hace uso de funciones flecha, puedes leer más acerca de las funciones flecha en el siguiente enlace: https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Functions/Arrow_functions. Sin embargo, para este taller es suficiente saber que:*

```javascript
// este fragmento de código:
response => response.json()
//Es una abreviación del siguiente fragmento de código:
function(response) {
  return response.json();
}
```


## 4. Ejecutar la consulta con un botón

Tu archivo `index.html` ya tiene lo siguiente:

```html
<button id="btn-cargar">Cargar publicaciones</button>
```

Sin embargo, en nuestro archivo `script.js` el botón aún "no existe". Para obtener el botón podemos añadir el siguiente fragmento de código:

```javascript
const boton = document.getElementById("btn-cargar");
```

Ahora que tenemos nuestro botón creado, podemos "escuchar" sus eventos. Por ejemplo, para capturar el evento click, podemos añadir el siguiente fragmento de código:

```javascript
boton.addEventListener("click", function() {
  // Realizar aquí la petición
  // Mueve el método `fetch()` dentro de este evento "click".
});
```

## 5. Mostrar el estado

Tu archivo `index.html` ya tiene lo siguiente:

```html
<p id="estado" class="estado"></p>
```

Sin embargo, en nuestro archivo `script.js` este elemento HTML aún "no existe". Añade el siguiente fragmento de código para obtenerlo:

```javascript
const estado = document.getElementById("estado");
```

Ahora, al inicio de nuestro método que captura el evento `click`, podemos añadir:

```javascript
estado.textContent = "Cargando publicaciones...";
```

Y dentro del mismo método, una vez obtenidos los datos mostramos al usuario el siguiente mensaje:

```javascript
estado.textContent = "Publicaciones cargadas correctamente.";
```

## 6. Mostrar datos en el DOM

Tu archivo `index.html` ya tiene un contenedor que puedes utilizar para mostrar la información:

```html
<div id="lista-posts" class="lista-posts"></div>
```

Ahora, para acceder a dicho contenedor usando JavaScript, podemos usar lo siguiente:

```javascript
const listaPosts = document.getElementById("lista-posts");
```

Para recorrer los datos que obtuvimos con `fetch()`, utiliza el siguiente fragmento de código:

```javascript
datos.forEach(function(post) {
  // Crear aquí los elementos HTML
});
```
**Nota**: *El método forEach de JavaScript es una de las varias formas de recorrer un arreglo. Puedes leer más al respecto en el siguiente enlace: https://www.freecodecamp.org/espanol/news/foreach-en-javascript-como-recorrer-un-arreglo-en-js/*

## 7. Crear cada publicación

Una publicación debería tener una estructura similar a la siguiente:

```html
<article class="post">
  <h3>Título</h3>
  <p>Contenido</p>
</article>
```

Añade el siguiente fragmento de código dentro de tu método `forEach` para crear las publicaciones de forma dinámica:

```javascript
const articulo = document.createElement("article");
articulo.classList.add("post");

const titulo = document.createElement("h3");
titulo.textContent = post.title;

const cuerpo = document.createElement("p");
cuerpo.textContent = post.body;

articulo.appendChild(titulo);
articulo.appendChild(cuerpo);

listaPosts.appendChild(articulo);
```

## 8. Evitar publicaciones duplicadas

Para evitar que las publicaciones que se muestran al usuario, podemos añadir lo siguiente antes de recorrer nuevamente los datos:

```javascript
listaPosts.innerHTML = "";
```
**Nota**: *innerHTML = "" limpia el contenido de un elemento HTML. En este contexto se utiliza para borrar las publicaciones que ya se encuentran en la página antes de mostrar nuevamente los datos obtenidos desde la API, evitando que aparezcan duplicados.*

## 9. Manejo de errores

Si consultaste el enlace que habla acerca del método `fetch()`, sabrás que es sumamente importante que "capturemos" la información de un error en caso de que ocurra. Para ello, basta con agregar el siguiente fragmento de código al final del método `fetch()`:

```javascript
.catch(error => {
  console.error(error);
  estado.textContent = "Ocurrió un error al cargar los datos.";
});
```

## 10. Estructura esperada

Llegados a este punto, tu archivo `script.js` debería seguir esta lógica:

```javascript
const boton = document.getElementById("btn-cargar");
const estado = document.getElementById("estado");
const listaPosts = document.getElementById("lista-posts");

boton.addEventListener("click", function() {

  estado.textContent = "Cargando publicaciones...";
  listaPosts.innerHTML = "";

  fetch("https://jsonplaceholder.typicode.com/posts")
    .then(response => response.json())
    .then(datos => {

      // Recorrer datos
      // Crear elementos
      // Mostrar datos en el DOM

      estado.textContent =
        "Publicaciones cargadas correctamente.";

    })
    .catch(error => {

      console.error(error);

      estado.textContent =
        "Ocurrió un error al cargar los datos.";

    });
});
```

## Ejercicios propuestos

### Los siguientes ejercicios utilizan como referencia la API de JSONPlaceholder. Sin embargo, aquí tienes disponibles otras APIs para jugar

1. https://pokeapi.co/
2. https://rickandmortyapi.com/
3. https://open-meteo.com/

## **Ejercicio 1** — Obtener un álbum

Consulta la siguiente URL en tu navegador:

```text
https://jsonplaceholder.typicode.com/albums/1
```

Accede a la URL anterior utilizando JavaScript y muestra en tu archivo `index.html` la siguiente información:

- Id del usuario
- Id del album
- Título

## **Ejercicio 2** — Filtrar publicaciones

JSONPlaceholder admite parámetros de consulta, por ejemplo, podemos utilizar la siguiente URL para obtener las publicaciones del usuario 1:

```text
https://jsonplaceholder.typicode.com/posts?userId=1
```

Agrega un `<select>` en tu archivo `index.html` y permite seleccionar un usuario en específico.

## **Ejercicio 3** — Mostrar tareas

Consulta la siguiente URL:

```text
https://jsonplaceholder.typicode.com/todos
```

La URL contiene 200 tareas. Muestra el título y el estado de cada tarea.

## **Ejercicio 4** — Buscar una publicación

Crea un formulario que permita al usuario ingresar un ID y consultar lo siguiente:

```text
https://jsonplaceholder.typicode.com/posts/5
```

## **Nota**: Recursos disponibles en JSONPlaceholder

| Recurso | Cantidad |
|---|---:|
| `/posts` | 100 |
| `/comments` | 500 |
| `/albums` | 100 |
| `/photos` | 5000 |
| `/todos` | 200 |


## Referencias

- JSONPlaceholder: https://jsonplaceholder.typicode.com/
- Documentación oficial: https://jsonplaceholder.typicode.com/guide/
- JavaScript Fetch API: https://www.freecodecamp.org/espanol/news/javascript-fetch-api-para-principiantes/
- Funciones flecha: https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Functions/Arrow_functions
