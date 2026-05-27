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

### Jugar de una PC a otra en la misma red

En la PC que corre el servidor netplay, buscar la IP local:

```powershell
ipconfig
```

Usar la direccion IPv4 de tu placa de red, por ejemplo:

```text
192.168.1.50
```

En la otra PC, abrir la app web y configurar:

```text
Servidor: http://192.168.1.50:3000
```

Ambas PCs deben activar `Netplay`, usar la misma sala, el mismo core y la misma ROM. Si Windows Firewall pregunta, permitir Node.js en redes privadas.

### Jugar de una PC a otra por internet

Para jugar por internet necesitás dos cosas separadas:

1. `NetMAM`: la app web o desktop donde cada jugador carga su ROM.
2. `Servidor Netplay`: un servidor Node.js accesible por internet.

Vercel sirve para publicar NetMAM, pero no es buena opcion para el servidor Netplay porque necesita conexiones persistentes/WebSocket.

El servidor netplay debe ser accesible desde afuera. Hay dos formas:

1. Publicarlo en un hosting con WebSockets/Docker, como Railway, Render, Fly.io, VPS o Docker en un servidor propio.
2. Abrir/redirigir el puerto del router hacia la PC que corre el servidor netplay.

### Opcion recomendada: hosting con WebSockets/Docker

Subir o clonar el servidor oficial:

```bash
git clone https://github.com/EmulatorJS/EmulatorJS-Netplay.git
cd EmulatorJS-Netplay
npm install
npm start
```

Deployarlo en un host con WebSockets o Docker:

- Railway
- Render
- Fly.io
- VPS propio
- Docker en un servidor propio

Cuando el hosting entregue una URL, por ejemplo:

```text
https://netplay-tuapp.up.railway.app
```

ponerla en NetMAM:

```text
Servidor: https://netplay-tuapp.up.railway.app
```

Despues:

1. Activar `Netplay`.
2. Tocar `Nueva sala`.
3. Tocar `Copiar link`.
4. Pasar ese link al otro jugador.
5. Ambos cargan la misma ROM ZIP y usan el mismo core.

### Opcion casera: abrir puerto del router

En la PC que va a hacer de servidor:

```powershell
cd D:\sistemas\netmam
npm run netplay:setup
npm run netplay:start
```

Buscar la IP local:

```powershell
ipconfig
```

Ejemplo:

```text
192.168.1.50
```

En el router:

1. Fijar la IP local de la PC servidor, por ejemplo `192.168.1.50`.
2. Redirigir el puerto del servidor netplay, normalmente `3000`, hacia `192.168.1.50:3000`.
3. Permitir Node.js en el firewall.
4. Compartir tu IP publica o dominio DDNS.

Ejemplo:

```text
Servidor: http://TU-IP-PUBLICA:3000
```

Esta opcion es menos recomendable. Para internet real, HTTPS/WSS es preferible porque algunos navegadores bloquean funciones modernas desde origenes inseguros. Ver detalles en `netplay/README.md`.

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
