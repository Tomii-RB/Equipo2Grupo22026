# Mundo F1 - Plataforma Web Informativa de Fórmula 1

## Descripción del proyecto
Mundo F1 es una plataforma web informativa centrada en la Fórmula 1. Su objetivo es reunir en un solo sitio información relevante sobre la categoría, permitiendo a los usuarios consultar datos de pilotos, equipos, circuitos y carreras de manera rápida y sencilla.
La aplicación buscará mostrar información actualizada de la temporada mediante el uso de APIs y datos almacenados localmente. Además, contará con una interfaz simple e intuitiva para facilitar la navegación entre las distintas secciones.

## Objetivos
### Objetivo general
Desarrollar una página web que permita visualizar información relacionada con la Fórmula 1 de forma organizada, dinámica y accesible.

### Objetivos específicos
* Mostrar información de pilotos y equipos.
* Mostrar información de circuitos y Grandes Premios.
* Visualizar el calendario de la temporada.
* Consultar clasificaciones de pilotos y constructores.
* Incorporar datos obtenidos mediante APIs.
* Diseñar una interfaz clara y fácil de utilizar.

## Funcionalidades previstas
La plataforma contará con las siguientes secciones:

### Inicio
Página principal donde se mostrará información destacada de la temporada, próximas carreras y accesos rápidos a las distintas secciones.

### Pilotos
Permitirá visualizar información de los pilotos participantes, incluyendo datos básicos, equipo al que pertenecen y posición en el campeonato.

### Equipos
Mostrará información de las escuderías, pilotos asociados y datos generales de cada equipo.

### Circuitos
Contendrá información de los distintos circuitos utilizados durante la temporada, incluyendo ubicación y características principales.

### Calendario
Permitirá consultar las fechas de prácticas, clasificación y carrera correspondientes a cada Gran Premio.

### Clasificaciones
Mostrará las posiciones actuales tanto de pilotos como de constructores.

### Funcionalidades adicionales
* Buscador de pilotos, equipos y circuitos.
* Cuenta regresiva para la próxima carrera.
* Sistema de favoritos.
* Diseño adaptable para distintos dispositivos.

## Tecnologías a utilizar
Para el desarrollo del proyecto se prevé utilizar:
* **Frontend:** HTML, CSS, JavaScript
* **Backend & Capa API:** Node.js (Express) o Python (FastAPI) para gestionar peticiones, lógica de negocio y almacenamiento local eficientemente.
* **APIs Externas:** API OpenF1
* **Almacenamiento:** Archivos JSON complementarios para datos estáticos / Cache del servidor.

## Alcance del proyecto
La primera versión estará enfocada únicamente en la Fórmula 1. Sin embargo, la estructura del sistema permitirá que en futuras versiones puedan incorporarse otras categorías del automovilismo, como IndyCar, NASCAR o WEC.

## Planificación general
El proyecto se desarrollará entre mayo y noviembre.

### Etapas principales
1. Investigación y análisis de información.
2. Definición de requisitos y alcance.
3. Diseño de la interfaz.
4. Desarrollo de la estructura principal del sitio.
5. Integración de APIs.
6. Implementación de funcionalidades.
7. Pruebas y corrección de errores.
8. Documentación.
9. Presentación final.

### Diagrama de Gantt
La siguiente planificación representa las etapas previstas para el desarrollo del proyecto entre mayo y noviembre.

| Actividad | Mayo | Junio | Julio | Agosto | Septiembre | Octubre | Noviembre |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Investigación y relevamiento | X | | | | | | |
| Análisis de APIs y tecnologías | X | X | | | | | |
| Definición de requisitos | X | X | | | | | |
| Diseño de interfaz | | X | X | | | | |
| Diseño de la estructura del sistema | | X | X | | | | |
| Desarrollo de la página principal | | | X | X | | | |
| Desarrollo del módulo de pilotos | | | X | X | | | |
| Desarrollo del módulo de equipos | | | | X | X | | |
| Desarrollo del módulo de circuitos | | | | X | X | | |
| Integración de APIs | | | | X | X | | |
| Implementación de funcionalidades adicionales | | | | | X | X | |
| Pruebas y corrección de errores | | | | | X | X | |
| Documentación final | | | | | | X | X |
| Preparación de la presentación | | | | | | | X |
| Entrega final | | | | | | | X |

### Curva S Proyectada
La Curva S representa la evolución estimada del proyecto a lo largo del tiempo. Durante las primeras etapas el avance es más lento debido a las tareas de investigación, análisis y planificación. Posteriormente el porcentaje de avance aumenta durante la fase de desarrollo y finalmente vuelve a estabilizarse en las etapas de pruebas, documentación y entrega.

## Estado actual
Actualmente se encuentra finalizada la etapa inicial de investigación y definición del proyecto.
Se han definido:
* Presupuesto e infraestructura de despliegue.
* Requerimientos a nivel cliente.
* Temática y alcance del sistema.
* Funcionalidades principales.
* Tecnologías a utilizar.
* API principal para la obtención de datos (OpenF1).
* Planificación general del desarrollo.

Las próximas tareas estarán enfocadas en el diseño de la interfaz y la construcción del primer prototipo funcional.

---

## 💰 Presupuesto de Infraestructura y Despliegue (Backend y API)
Para garantizar la disponibilidad de la plataforma web, asegurar un tiempo de respuesta óptimo y manejar el almacenamiento de los archivos JSON complementarios de forma centralizada, se plantea la siguiente estructura de costos mensuales estimados para un entorno de producción inicial:



| Concepto / Recurso | Proveedor Sugerido | Descripción / Capacidad | Costo Mensual Estimado |
| :--- | :--- | :--- | :---: |
| **Backend & API Hosting** | Render / | Servidor web administrado para alojar el código de la API intermedia (512MB - 1GB RAM, CPU Compartida). | \$7.00 - \$12.00 USD |
| **Caché y Base de Datos** |  Neon | Base de datos relacional ligera o almacenamiento Key-Value para guardar configuraciones y actuar como caché (evita hacer consultas repetitivas a la API OpenF1 y sobrepasar límites de tasa). | \$0.00 *(Capa gratuita)* a \$5.00 USD |
| **Red de Datos y Seguridad** | Cloudflare | Red de distribución (CDN) para el contenido estático, aprovisionamiento de certificados SSL/HTTPS automáticos y mitigación de ataques. | \$0.00 *(Capa gratuita)* |
| **Dominio Personalizado** | Namecheap  | Compra y renovación del dominio único del proyecto (`mundof1.com` o similar). Aprox. \$12.00 anuales. | \$1.00 USD |
| **Costo Total Estimado** | | **Operación activa 24/7** | **\$8.00 - \$18.00 USD / mes** |
