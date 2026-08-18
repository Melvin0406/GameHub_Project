# GameHub Local

Plataforma tipo Twitch autoalojada: streaming en vivo (RTMP → HLS), red social y distribución de mods, corriendo íntegramente sobre infraestructura de red local.

Proyecto final de la materia de Redes y Servidores (CETYS Universidad, 2025). El objetivo era levantar y conectar todos los servicios de una plataforma real — DNS, proxy inverso, servidor de streaming, API y base de datos — sin depender de servicios en la nube.

---

## Stack

| Capa | Tecnología |
|---|---|
| API | Node.js · Express 5 |
| Tiempo real | Socket.IO (chat 1-a-1 con autenticación por JWT) |
| Base de datos | SQLite 3 |
| Autenticación | JWT + bcryptjs |
| Frontend | JavaScript vanilla (ES6), sin framework |
| Proxy inverso / web | Nginx |
| Streaming | Nginx-RTMP → HLS · hls.js en el cliente |
| DNS local | Acrylic DNS Proxy |
| Otros | Multer (subida de archivos), Nodemailer |

---

## Arquitectura

El backend está organizado en cuatro capas con responsabilidades separadas. Cada petición atraviesa:

```
Cliente → Nginx (proxy inverso)
            ↓
        routes/       ← define endpoints y aplica middleware
            ↓
        middleware/   ← verifica el JWT y adjunta req.user
            ↓
        controllers/  ← traduce HTTP ↔ dominio (params, status codes)
            ↓
        services/     ← reglas de negocio, validaciones, errores tipados
            ↓
        repositories/ ← único punto que toca SQL
            ↓
         SQLite
```

Los `services` lanzan errores con `statusCode` propio, de modo que los `controllers` no necesitan conocer las reglas de negocio para responder correctamente. Los `repositories` son el único lugar del código con SQL: ninguna capa superior sabe que la base es SQLite.

```
backend/
├── server.js                  # Composición: Express, Socket.IO, montaje de rutas
└── src/
    ├── config/
    │   ├── database.js        # Conexión y creación de tablas
    │   └── mailer.js
    ├── routes/                # 8 routers montados bajo /api
    ├── middleware/
    │   └── authMiddleware.js  # Verificación de JWT
    ├── controllers/           # 8 controllers
    ├── services/              # Lógica de negocio
    └── repositories/          # Acceso a datos
```

El frontend sigue la misma idea de separación, sin framework:

```
nginx/htmlPages/js/
├── BaseApiService.js   # Cliente HTTP base (headers, manejo de errores)
├── ApiService.js       # Endpoints concretos, extiende BaseApiService
├── auth/AuthManager.js # Sesión y token en el cliente
├── authGuard.js        # Protección de páginas privadas
├── patterns/           # Subject / Observer para propagar cambios de estado
└── page_managers/      # Un controlador por página (Home, Games, Chat, Profile)
```

### Decisiones que vale la pena señalar

- **Nginx como único punto de entrada:** el frontend se sirve estático y `/api/` y `/socket.io/` se pasan por proxy al backend en el puerto 3000. El navegador nunca habla directo con Node.
- **Socket.IO autenticado:** el handshake valida el JWT en un middleware antes de aceptar la conexión; no basta con abrir el socket.
- **El `password_hash` nunca sale de la capa de servicio** — se filtra explícitamente antes de construir la respuesta.
- **Streaming desacoplado:** OBS publica por RTMP al puerto 1935; Nginx fragmenta a HLS y lo sirve por HTTP. El backend solo administra metadatos del stream (título, juego, clave), no toca el video.

---

## Funcionalidades

- Registro e inicio de sesión con JWT
- Perfiles de usuario con foto (subida vía Multer)
- Sistema de amistades (solicitud / aceptación)
- Chat privado en tiempo real vía Socket.IO
- Mensajería interna tipo correo
- Catálogo de juegos y subida de mods
- Transmisión en vivo y visualización HLS

---

## Requisitos

- [Node.js](https://nodejs.org/) LTS
- [Nginx con el módulo RTMP](https://github.com/illuknight/nginx-rtmp-win32) (build para Windows)
- [Acrylic DNS Proxy](http://mayakron.altervista.org/wikibase/show.php?id=AcrylicHome) (o edición manual del archivo `hosts`)
- [OBS Studio](https://obsproject.com/download) — solo para probar streaming

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Melvin0406/GameHub_Project.git
cd GameHub_Project
```

### 2. Configurar DNS local

Para acceder mediante los dominios `servidor-juego.casa.local` y `servidor-stream.casa.local`:

1. Instala Acrylic DNS Proxy.
2. Abre `C:\Program Files (x86)\Acrylic DNS Proxy\AcrylicHosts.txt` como administrador y añade:
   ```
   [IP_DE_TU_MAQUINA] servidor-juego.casa.local
   [IP_DE_TU_MAQUINA] servidor-stream.casa.local
   ```
3. En `AcrylicConfiguration.ini`, dentro de `[AllowedAddressesSection]`, añade:
   ```
   IP1=*
   ```
4. Reinicia el servicio:
   ```bash
   net stop AcrylicDNSProxySvc
   net start AcrylicDNSProxySvc
   ```
5. Configura tu adaptador de red (IPv4) para usar `127.0.0.1` como DNS preferido.

> Alternativa rápida sin Acrylic: añade esas dos líneas a `C:\Windows\System32\drivers\etc\hosts`.

### 3. Configurar el backend

```bash
cd backend
cp .env.example .env
npm install
```

Edita `.env` y reemplaza `JWT_SECRET` por una cadena larga y aleatoria. La base de datos SQLite se crea sola en el primer arranque.

### 4. Instalar Nginx

Este repositorio **no incluye el binario de Nginx**, solo la configuración. Descarga un build de Nginx con el módulo RTMP y colócalo así:

```
nginx/
├── nginx.exe          ← el binario que descargaste
├── conf/nginx.conf    ← incluido en este repo
├── htmlPages/         ← incluido en este repo (frontend)
└── html/index.html    ← incluido en este repo (reproductor HLS)
```

Copia el resto de archivos del build descargado (`logs/`, `temp/`, `conf/mime.types` si falta) junto al ejecutable.

> Verifica que ningún otro servicio esté ocupando el **puerto 80**.

---

## Ejecución

**Terminal 1 — backend:**
```bash
cd backend
npm start
```
Debe imprimir `Servidor backend corriendo en http://localhost:3000`.

**Terminal 2 — Nginx:**
```bash
cd nginx
start_nginx.bat
```

Luego abre `http://servidor-juego.casa.local/` en el navegador. Si algo falla, revisa `nginx/logs/error.log`.

Para detener Nginx: `stop_nginx.bat`.

---

## (Opcional) Transmitir con OBS

En OBS, `Configuración → Emisión`:

| Campo | Valor |
|---|---|
| Servicio | Personalizado |
| Servidor | `rtmp://servidor-stream.casa.local/hls` |
| Clave de retransmisión | la `stream_key` de tu perfil |

Al iniciar la transmisión se generan fragmentos `.ts` en `nginx/html/hls_stream_data/`. El reproductor está en `http://servidor-stream.casa.local/`.

---

## Estado del proyecto

Funcionales: autenticación, perfiles, amistades, chat en tiempo real, mensajería interna, catálogo de juegos, mods y streaming.

Quedaron fuera del alcance del curso: servidor FTP dedicado y servidor de correo saliente real (el módulo de correo funciona solo entre usuarios de la plataforma).

---

## Autoría

Desarrollado por [Melvin0406](https://github.com/Melvin0406) (36 de 37 commits) como proyecto final de curso.
