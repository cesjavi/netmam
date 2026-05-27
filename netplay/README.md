# Netplay

NetMAM integra el netplay de EmulatorJS desde la UI. Para usarlo hacen falta tres cosas:

1. Todos los jugadores usan el mismo core.
2. Todos cargan la misma ROM compatible.
3. Todos usan la misma sala y el mismo servidor netplay.

## Servidor

El servidor netplay oficial vive en otro repositorio:

```bash
git clone https://github.com/EmulatorJS/EmulatorJS-Netplay.git netplay-server
cd netplay-server
npm install
npm start
```

La documentacion oficial indica que el puerto por defecto suele ser `3000`. En produccion, publicar el servidor con HTTPS/WSS.

## Frontend

En NetMAM:

1. Activar `Netplay`.
2. Escribir la URL del servidor, por ejemplo `https://netplay.tu-dominio.com`.
3. Crear una sala.
4. Copiar el link e invitar al otro jugador.
5. Todos cargan la misma ROM localmente.

## Hosting recomendado

Vercel sirve para el frontend estatico, pero no es la mejor opcion para este servidor porque netplay necesita conexiones persistentes. Usar un VPS, Railway, Fly.io, Render, Docker en un servidor propio o cualquier host Node.js con WebSockets.

## Variables de EmulatorJS usadas

La app configura:

```js
EJS_gameID = "<sala>";
EJS_netplayServer = "<servidor>";
EJS_netplayICEServers = [/* STUN/TURN */];
```

Referencia: https://emulatorjs.org/docs4devs/netplay
