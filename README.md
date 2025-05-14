# GameHub Local - Plataforma de Streaming y Red Social de Videojuegos (Proyecto Local)

Bienvenido a GameHub Local, una plataforma local para streaming de videojuegos, intercambio de archivos (mods), y funcionalidades de red social. Este proyecto está diseñado para correr en un entorno de desarrollo local.

## Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Funcionalidades](#funcionalidades)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Prerrequisitos de Software](#prerrequisitos-de-software)
5. [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
    * [Clonar el Repositorio](#clonar-el-repositorio)
    * [Configurar DNS Local](#configurar-dns-local)
    * [Configurar el Backend](#configurar-el-backend)
    * [Configurar Nginx Portátil](#configurar-nginx-portátil)
6. [Iniciar los Servicios](#iniciar-los-servicios)
7. [Acceder a la Aplicación](#acceder-a-la-aplicación)
8. [(Opcional) Configurar OBS para Streaming](#opcional-configurar-obs-para-streaming)

---

## Descripción General
Este proyecto simula una plataforma tipo Twitch/red social enfocada en videojuegos, operando completamente en una red local. Permite a los usuarios registrarse, iniciar sesión, ver streams en vivo, (eventualmente) subir mods, y más.

## Funcionalidades
* **Servidor DNS Local:** Usando Acrylic DNS Proxy (o archivo hosts) para nombres de dominio locales.
* **Servidor Web y Proxy Inverso:** Nginx para servir el frontend y como proxy para el backend.
* **Servidor de Streaming:** Nginx con el módulo RTMP para streaming en vivo y HLS para visualización.
* **Backend de Aplicación:** Node.js con Express para la lógica de negocio, autenticación y APIs.
* **Autenticación:** Registro e inicio de sesión de usuarios con JWT.
* **(En desarrollo)** Servidor de Correo, Servidor FTP, mensajería, etc.

## Stack Tecnológico
* **Frontend:** HTML, CSS, JavaScript
* **Backend:** Node.js, Express.js
* **Base de Datos:** SQLite
* **Servidor Web/Proxy/Streaming:** Nginx (versión portátil para Windows incluida en el repo)
* **DNS Local:** Acrylic DNS Proxy.

---

## Prerrequisitos de Software
Antes de comenzar, asegúrate de tener instalado lo siguiente en tu máquina Windows:

* **Git:** Para clonar y gestionar el control de versiones. [Descargar Git](https://git-scm.com/downloads)
* **Node.js:** Versión LTS (Long Term Support) recomendada. Esto también instala `npm`. [Descargar Node.js](https://nodejs.org/)
* **(Opcional pero recomendado)** Un editor de código como [VS Code](https://code.visualstudio.com/).
* **(Opcional)** Herramienta para probar APIs como [Postman](https://www.postman.com/downloads/).
* **(Para streaming)** [OBS Studio](https://obsproject.com/download)

---

## Configuración del Entorno de Desarrollo

Sigue estos pasos para configurar el proyecto en tu máquina local:

### 1. Clonar el Repositorio
Abre una terminal (Git Bash, CMD o PowerShell) y clona el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO_GIT_AQUI] GameHub_Project
cd GameHub_Project
```
(Reemplaza `[URL_DEL_REPOSITORIO_GIT_AQUI]` con la URL real del repositorio en GitHub).

### 2. Configurar DNS Local
Para acceder a la plataforma usando los nombres de dominio `servidor-juego.casa.local` y `servidor-stream.casa.local`, necesitas configurar tu DNS local.

**Opción A: Acrylic DNS Proxy (Recomendado)**
1.  Descarga e instala Acrylic DNS Proxy desde [su sitio oficial](http://mayakron.altervista.org/wikibase/show.php?id=AcrylicHome).
2.  Edita el archivo de hosts de Acrylic (ej. `C:\Program Files (x86)\Acrylic DNS Proxy\AcrylicHosts.txt`).
3.  Añade las siguientes líneas:
    ```
    127.0.0.1 servidor-juego.casa.local
    127.0.0.1 servidor-stream.casa.local
    ```
4.  Guarda el archivo y reinicia el servicio "Acrylic DNS Proxy Service" desde `services.msc` o reinicia tu PC.
5.  Configura las propiedades de tu adaptador de red (IPv4) para usar `127.0.0.1` como el "Servidor DNS preferido". (Si tu Acrylic corre en otra IP, usa esa).

**Opción B: Archivo Hosts de Windows**
1.  Abre el Bloc de notas (o tu editor preferido) **como Administrador**.
2.  Abre el archivo: `C:\Windows\System32\drivers\etc\hosts`
3.  Añade las siguientes líneas al final del archivo:
    ```
    127.0.0.1 servidor-juego.casa.local
    127.0.0.1 servidor-stream.casa.local
    ```
4.  Guarda el archivo. Puede que necesites ejecutar `ipconfig /flushdns` en una terminal (como administrador).

### 3. Configurar el Backend
El backend maneja la lógica de la aplicación y la autenticación.

1.  Navega a la carpeta del backend en tu terminal:
    ```bash
    cd backend
    ```
    (Si estás en la raíz del proyecto `GameHub_Project`, entonces `cd backend`).

2.  **Crear archivo de entorno `.env`:**
    Copia el archivo `backend/.env.example` (si existe en el repositorio) a un nuevo archivo llamado `backend/.env`. Si `.env.example` no existe, crea `backend/.env` manualmente con el siguiente contenido:
    ```env
    # backend/.env
    JWT_SECRET="REEMPLAZA_ESTO_CON_UNA_CADENA_SECRETA_MUY_LARGA_Y_ALEATORIA"
    DATABASE_PATH=./gamehub_local_db.sqlite # Ruta relativa a la carpeta 'backend'
    PORT=3000 # Puerto donde correrá el backend
    ```
    **¡Importante!** Cambia `JWT_SECRET` por una cadena única, larga y segura.

3.  **Instalar dependencias del backend:**
    ```bash
    npm install
    ```

### 4. Configurar Nginx Portátil
Nginx se incluye de forma portátil dentro de la carpeta `nginx/` del proyecto.

1.  **Verificar Puertos:** Asegúrate de que ningún otro servicio (como IIS, Skype, u otra instancia de Apache/Nginx) esté usando el **puerto 80**. Si es así, detén ese servicio temporalmente o modifica el archivo `nginx/conf/nginx.conf` para que escuche en un puerto diferente (ej. `listen 8080;`) y ajusta las URLs de acceso en el navegador.
2.  La configuración de Nginx (`nginx/conf/nginx.conf`) ya está preparada con rutas relativas para funcionar desde la carpeta del proyecto. No deberías necesitar modificarla si la estructura del proyecto se mantiene como está en el repositorio.

---

## Iniciar los Servicios
Debes iniciar tanto el backend como Nginx.

1.  **Iniciar el Backend Node.js:**
    * Abre una terminal en la carpeta `backend/` (ej. `C:\Users\[TuUsuario]\Documents\GitHub\GameHub_Project\backend\`).
    * Ejecuta:
        ```bash
        npm start
        ```
    * Deberías ver un mensaje como: `Servidor backend corriendo en http://localhost:3000`. Mantén esta terminal abierta.

2.  **Iniciar Nginx:**
    * Abre **OTRA** terminal.
    * Navega a la carpeta `nginx/` dentro del proyecto (ej. `C:\Users\[TuUsuario]\Documents\GitHub\GameHub_Project\nginx\`).
    * Ejecuta el script de inicio:
        ```batch
        start_nginx.bat
        ```
    * Esto debería iniciar Nginx. Puedes verificar los logs en `nginx/logs/error.log` si algo sale mal.

---

## Acceder a la Aplicación
Una vez que ambos servicios estén corriendo:

* Abre tu navegador web y ve a: `http://servidor-juego.casa.local/`
* Para ver la página del reproductor de stream (si alguien está transmitiendo): `http://servidor-stream.casa.local/` (y la ruta HLS específica, ej. `http://servidor-stream.casa.local/hls/test.m3u8`).

---

## (Opcional) Configurar OBS para Streaming
Si quieres probar la funcionalidad de streaming y transmitir desde tu PC:

1.  Descarga e instala [OBS Studio](https://obsproject.com/download).
2.  Abre OBS Studio.
3.  Ve a `Archivo` -> `Configuración` (o `Settings`).
4.  Selecciona la pestaña `Emisión` (o `Stream`).
5.  Configura lo siguiente:
    * **Servicio:** `Personalizado...` (o `Custom...`)
    * **Servidor:** `rtmp://servidor-stream.casa.local/hls` (Esta es la aplicación RTMP que definiste en `nginx.conf` para HLS. Si tienes otra aplicación RTMP como `live`, usa `rtmp://servidor-stream.casa.local/live`).
    * **Clave de retransmisión:** `test` (o cualquier clave que desees. Esta clave se usará en la URL HLS, ej. `http://servidor-stream.casa.local/hls/test.m3u8` si `hls_path` en Nginx está configurado como `html/hls_stream_data` y la clave es `test`, entonces el archivo será `html/hls_stream_data/test.m3u8`).
6.  Configura tus fuentes de video/audio en OBS (ej. capturar pantalla o juego).
7.  Haz clic en "Iniciar transmisión" en OBS.
8.  Luego, visita `http://servidor-stream.casa.local/` (tu página que tiene el reproductor HLS) y asegúrate de que el reproductor apunte a la URL HLS correcta (ej. `http://servidor-stream.casa.local/hls/test.m3u8`).

---