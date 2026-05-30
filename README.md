# NetMAM

Emulador arcade online basado en EmulatorJS para ejecutar ROMs compatibles con MAME 2003, MAME 2003-Plus o FinalBurn Neo desde el navegador.

## Uso local

Instalar dependencias:

```powershell
npm install
```

Correr la app:

```powershell
npm run dev
```

Abrir la URL local que muestre `serve` y cargar un archivo de ROM propio, normalmente un `.zip` compatible con el core elegido.

Para fijar el puerto de la app:

```powershell
npx serve public --listen 8080
```

Abrir:

```text
http://localhost:8080
```

Tambien se puede usar un servidor simple:

```powershell
python -m http.server 8080 -d public
```

## Deploy en Vercel

Este proyecto es estatico y ya incluye `vercel.json`.

```powershell
npm install
npm run build
npx vercel
```

Para produccion:

```powershell
npx vercel --prod
```

## Android

La app incluye `manifest.webmanifest`, service worker e iconos para instalarse como PWA en Android desde Chrome. Para crear un APK/AAB, usar la guia en `android/README.md` con Bubblewrap y la URL final de Vercel.

## Windows y Linux

La app tambien incluye wrapper Electron para generar ejecutables de escritorio.

Ejecutar en modo escritorio:

```powershell
npm run desktop
```

Generar instalador y portable para Windows:

```powershell
npm run dist:win
```

Generar Linux desde Windows:

```bash
npm run dist:linux
```

Ese comando genera `linux-unpacked` y `.tar.gz`. Para AppImage y `.deb`, correr desde Linux o WSL:

```bash
npm run dist:linux-native
```

Los archivos finales quedan en `dist/`.

### ¿Está integrado Netplay en los ejecutables?

El **cliente** de Netplay está 100% integrado en la app de escritorio, pero el **servidor** de Netplay no lo está:

* **Cliente integrado:** La versión de escritorio para Windows/Linux cuenta con toda la interfaz de Netplay habilitada (crear salas, unirse a salas, copiar links, chat y sincronización de controles). Es 100% compatible y permite jugar de forma cruzada con jugadores que usen la versión web.
* **Servidor externo requerido:** El ejecutable no levanta un servidor de Netplay en segundo plano de manera automática. Para poder usar el multijugador, ambos jugadores deben configurar la dirección de un servidor externo (ya sea uno público alojado en la nube como Railway/Render, o uno local iniciado manualmente mediante la terminal con `npm run netplay:start`).

## Netplay

La interfaz tiene modo Netplay con servidor y sala compartible. Todos los jugadores deben usar el mismo core y cargar la misma ROM localmente.

El servidor online de netplay sirve para conectar jugadores entre PCs por internet o por red local. No aloja ROMs y no ejecuta el juego; solo mantiene salas y mensajes de sincronizacion.

Este repo incluye un proyecto listo para deploy en:

```text
netplay-online/
```

Ver instrucciones completas en `netplay-online/README.md`.

### Correr Netplay local

En una terminal, correr la app web:

```powershell
cd D:\sistemas\netmam
npx serve public --listen 8080
```

Abrir:

```text
http://localhost:8080
```

En otra terminal, preparar y correr el servidor netplay:

```powershell
cd D:\sistemas\netmam
npm run netplay:setup
npm run netplay:start
```

Alternativa con el servidor incluido en `netplay-online`:

```powershell
cd D:\sistemas\netmam
npm run netplay-online:dev
```

En la app:

```text
Servidor: http://localhost:3000
```

Si el servidor netplay muestra otro puerto, usar ese puerto.

### 🏠 Guía paso a paso: Jugar en Red Local (LAN)

Esta opción es perfecta para jugar con alguien en tu misma casa, usando la misma red Wi-Fi o router. Una computadora actuará como **Anfitriona (Host)** para levantar el juego y el servidor de Netplay, y la otra computadora se conectará como **Invitada (Cliente)**.

---

#### 💻 PASO A PASO EN LA PC ANFITRIONA (HOST)

1. **Iniciar el servidor de Netplay local:**
   Abre una terminal en tu proyecto y ejecuta el servidor local que coordinará los controles:
   ```powershell
   npm run netplay:setup
   npm run netplay:start
   ```
   *Nota: Por defecto, este servidor escuchará en el puerto **`3000`**.*

2. **Iniciar el Frontend (Servidor Web):**
   Abre otra terminal y ejecuta el servidor web para que la otra PC pueda cargar la aplicación:
   ```powershell
   npx serve public --listen 8080
   ```
   *Nota: Esto levantará la aplicación web de NetMAM en el puerto **`8080`**.*

3. **Averiguar tu IP Local en la red de tu casa:**
   Abre una terminal (PowerShell o CMD) y escribe:
   ```powershell
   ipconfig
   ```
   Busca la tarjeta de red activa (Wi-Fi o Ethernet) y copia la dirección **IPv4 Address**.
   > [!TIP]
   > En tu caso particular, tu IP local actual en tu placa de red es **`192.168.1.4`**.

4. **Entrar al juego y configurar Netplay:**
   - Abre tu navegador web en **`http://localhost:8080`** (o en la app de Electron).
   - Activa la casilla de **Netplay**.
   - En el campo **Servidor**, asegúrate de ingresar la URL local del servidor de Netplay:
     ```text
     http://localhost:3000
     ```
   - Escribe un nombre único para tu **Sala** (por ejemplo: `sala-casa`) o genera uno aleatorio.
   - Elige el **Core** deseado (por ejemplo, *MAME 2003-Plus*) y carga tu **ROM (.zip)**.
   - Espera a que el juego inicie. Ahora estarás en la pantalla del juego esperando a que se conecte el segundo jugador.

---

#### 👥 PASO A PASO EN LA PC INVITADA (CLIENTE)

1. **Acceder a la aplicación web de la PC Anfitriona:**
   Desde la PC invitada, abre el navegador web e ingresa a la IP local de la PC Anfitriona en el puerto 8080:
   ```text
   http://192.168.1.4:8080
   ```
   *(Reemplaza `192.168.1.4` por la IP IPv4 de la PC Anfitriona si esta llegara a cambiar).*

2. **Configurar Netplay para apuntar a la PC Anfitriona:**
   - Activa la casilla de **Netplay**.
   - En el campo **Servidor**, debes poner la IP de la PC Anfitriona en el puerto `3000`:
     ```text
     http://192.168.1.4:3000
     ```
   - En el campo **Sala**, escribe **exactamente el mismo nombre de sala** que ingresó la PC Anfitriona (por ejemplo: `sala-casa`).

3. **Iniciar el juego:**
   - Elige el **mismo Core** que seleccionó el anfitrión (*MAME 2003-Plus*).
   - Carga la **misma ROM (.zip)** del juego.
   - ¡Listo! En unos segundos el emulador sincronizará ambos controles y podrán jugar juntos.

> [!WARNING]
> **¿No conecta? Revisa el Firewall de Windows:**
> La primera vez que corres Node.js o el servidor en la PC Anfitriona, Windows te mostrará una ventana preguntando si deseas dar permisos de red.
> - Asegúrate de permitir el acceso en **Redes Privadas** (tu red de hogar).
> - Si sigues experimentando bloqueos, puedes permitir temporalmente el puerto `3000` y `8080` de entrada en la Configuración Avanzada del Firewall de Windows o desactivarlo momentáneamente para probar.

---

### 🌐 Guía paso a paso: Jugar por Internet (Online)

Para jugar por internet con amigos que no están en tu misma casa, necesitas que el servidor de Netplay (puerto `3000`) sea accesible externamente a través de internet. 

A continuación, tienes las **4 mejores alternativas** para lograrlo, ordenadas de la más sencilla a la más avanzada:

---

#### ☁️ MÉTODO A: Deployar el Servidor en la Nube (Opción Recomendada 24/7)

La mejor opción para no depender de que tu computadora actúe como servidor público es subir el backend de Netplay a un hosting gratuito o de bajo costo (como Render, Railway o Fly.io).

1. **Preparar y subir el servidor:**
   El subdirectorio `netplay-online/` en este repositorio ya contiene un servidor en Rust rápido y optimizado para Docker y servicios en la nube.
   - Consulta el manual detallado en `[netplay-online/README.md](file:///d:/sistemas/netmam/netplay-online/README.md)`.
2. **Deployar en Render o Railway:**
   - Sube este repositorio a tu cuenta de GitHub.
   - Crea un nuevo servicio Web Service / App en [Render](https://render.com) o [Railway](https://railway.app).
   - Configura el **Root Directory** como `netplay-online` y selecciona la opción de Docker (o Cargo/Rust).
   - Una vez finalizado el despliegue, el hosting te dará una URL HTTPS pública permanente, por ejemplo:
     ```text
     https://netmam-netplay.onrender.com
     ```
3. **Jugar online:**
   - Ambos jugadores entran a NetMAM (puede ser la versión web subida a Vercel, ejecutables de escritorio, o local en `http://localhost:8080`).
   - Ambos configuran el campo **Servidor** con tu nueva URL pública:
     ```text
     https://netmam-netplay.onrender.com
     ```
   - El Anfitrión activa Netplay, crea una sala, copia el link y se lo envía al Cliente.
   - Ambos cargan la misma ROM y a disfrutar sin configuraciones de red complejas.

---

#### ⚡ MÉTODO B: Usar ngrok (Rápido, gratuito y sin configurar el router)

[ngrok](https://ngrok.com/) es una herramienta gratuita excelente que crea un túnel seguro desde internet directo a un puerto de tu PC local. Te permite jugar online en 2 minutos sin abrir puertos del router.

1. **Instalar ngrok:**
   - Descarga ngrok gratis desde su sitio web oficial y regístrate para obtener tu token de autenticación gratuito.
   - Autentica tu cliente ngrok en tu PC ejecutando:
     ```powershell
     ngrok config add-authtoken TU_TOKEN_DE_NGROK
     ```
2. **Iniciar tu servidor local:**
   - En la PC que será el host, arranca el servidor local de netplay de manera normal:
     ```powershell
     npm run netplay:start
     ```
3. **Exponer el puerto al mundo:**
   - Abre otra terminal y ejecuta el siguiente comando para tunelizar el puerto del servidor:
     ```powershell
     ngrok http 3000
     ```
   - ngrok te mostrará una pantalla con una URL pública que finaliza en `.ngrok-free.app` (ejemplo: `https://abcd-123-456.ngrok-free.app`).
4. **Jugar:**
   - Ambos jugadores configuran en NetMAM el campo **Servidor** con esa dirección pública HTTPS generada por ngrok:
     ```text
     https://abcd-123-456.ngrok-free.app
     ```
   - Usen la misma sala, mismo core y misma ROM. ¡El túnel de ngrok redirigirá toda la comunicación automáticamente!

---

#### 🔒 MÉTODO C: Redes Virtuales Privadas (Tailscale o ZeroTier)

Si quieres jugar únicamente con amigos de confianza y con la máxima seguridad y mínima latencia, puedes crear una red LAN virtual privada encriptada.

1. **Instalar Tailscale:**
   - Ambos jugadores descargan e instalan [Tailscale](https://tailscale.com/) de forma totalmente gratuita en sus computadoras.
   - Ambos inician sesión con la misma cuenta o comparten un enlace de invitación para unirse a la misma red virtual privada (Tailnet).
2. **Obtener la IP Virtual de Tailscale:**
   - Al conectarse, Tailscale les asignará una IP virtual privada del estilo `100.x.y.z`.
   - La PC 1 (Anfitriona) inicia el servidor local de Netplay en su puerto `3000`.
3. **Configurar en NetMAM:**
   - El jugador 1 (Host) configura su servidor en NetMAM como `http://localhost:3000`.
   - El jugador 2 (Cliente) configura el servidor usando la IP virtual de Tailscale de la PC Anfitriona:
     ```text
     http://100.x.y.z:3000
     ```
   - Activan Netplay, colocan la misma sala, cargan la misma ROM y juegan como si estuvieran en la misma habitación.

---

#### 🛠️ MÉTODO D: Redirección de Puertos (Port Forwarding - El clásico)

Si prefieres la vieja escuela y tienes acceso de administrador al panel de control de tu router de internet:

1. **Fijar IP e iniciar servidor:**
   - Fija la IP local de tu PC en tu red local (por ejemplo, configurando tu placa a `192.168.1.4` o haciéndolo mediante DHCP estático en el router).
   - Inicia el servidor de netplay local: `npm run netplay:start`.
2. **Redirigir puertos en el router:**
   - Entra a la puerta de enlace de tu router (normalmente ingresando a `http://192.168.1.1` en el navegador).
   - Busca la sección de **Port Forwarding / Virtual Server / Redirección de Puertos**.
   - Añade una nueva regla redirigiendo el puerto **`3000`** (protocolo TCP/UDP) hacia la IP local de tu PC (`192.168.1.4`).
3. **Buscar tu IP Pública:**
   - Escribe en Google *"¿Cuál es mi IP pública?"* o entra a sitios como `cualesmiip.com`. Supongamos que tu IP pública es `200.123.45.67`.
4. **Conectarse:**
   - Tu amigo (el cliente) pondrá en su configuración de NetMAM:
     ```text
     Servidor: http://200.123.45.67:3000
     ```
   - Recuerda permitir el puerto en el firewall de Windows.

> [!IMPORTANT]
> **Detalle crucial sobre HTTPS y Seguridad:**
> Algunos navegadores modernos bloquean conexiones WebSocket inseguras (`ws://` o `http://`) cuando la app web principal está corriendo bajo HTTPS seguro (como cuando está subida a `https://netmam.vercel.app`).
> - Si juegas en la versión web HTTPS, **debes usar un servidor Netplay HTTPS** (Método A con Render/Railway, o el túnel HTTPS de ngrok del Método B).
> - Si usas conexiones HTTP simples (`http://192.168.1.4:3000` o `http://IP-PUBLICA:3000`), te recomendamos jugar abriendo la aplicación desde la **versión de escritorio (Electron)** o sirviendo la aplicación web localmente de forma insegura en `http://localhost:8080`.

### Reglas para que funcione online

Todos los jugadores deben:

- Usar el mismo core.
- Cargar la misma ROM ZIP.
- Usar la misma sala.
- Tener buena latencia.
- Poner una URL real en `Servidor`; no dejar `https://tu-servidor:3000`.

## Notas

- La app no incluye ROMs, BIOS ni contenido comercial.
- Los archivos se cargan con `URL.createObjectURL`, por lo que no se suben a ningun servidor.
- Para mejor compatibilidad, usar ROM sets que correspondan al core seleccionado.

## Si un juego no arranca

Revisar estos puntos:

- Probar primero con `Netplay` desactivado.
- Usar `.zip` de arcade sin descomprimir.
- Elegir el core correcto para esa ROM: `MAME 2003-Plus`, `MAME 2003` o `FinalBurn Neo`.
- Las ROMs arcade no son universales: un ZIP de MAME moderno puede no funcionar en MAME 2003.
- El nombre del ZIP importa. MAME espera el nombre corto del set, por ejemplo `sf2.zip`, `pacman.zip`, `mslug.zip`; no `Street Fighter II (World).zip`.
- Muchas ROMs dependen de un set padre o BIOS. Por ejemplo, algunos clones no arrancan si falta el ZIP padre.
- Algunos juegos necesitan el ZIP padre o BIOS adicional en el mismo set.
- Si aparece un error en la barra superior, revisar la consola del navegador para ver el mensaje completo.

### Mensaje `Unsupported Game`

Ese mensaje significa que el core recibio el archivo, pero no lo reconoce como juego valido para ese core. No es un problema de Windows ni de Electron.

Soluciones tipicas:

1. Probar el mismo ZIP con `MAME 2003-Plus`.
2. Si no funciona, probar con `MAME 2003`.
3. Si sigue igual, probar con `FinalBurn Neo`.
4. Usar ROMs del set exacto del core elegido.
5. Verificar que el ZIP tenga el nombre corto del set arcade.

Ejemplo correcto:

```text
sf2.zip
```

Ejemplo problematico:

```text
Street Fighter II - The World Warrior (World).zip
```
