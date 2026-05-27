# NetMAM Netplay Online Server

Servidor netplay compatible con EmulatorJS para conectar jugadores por internet. Este servidor no aloja ROMs ni ejecuta juegos: solo coordina salas y mensajes de netplay.

## Uso Local

Requisitos:

- Rust
- Cargo

```bash
cd netplay-online
cargo run
```

Por defecto escucha en:

```text
http://localhost:3000
```

Probar estado:

```bash
curl http://localhost:3000/list
```

En NetMAM:

```text
Servidor: http://localhost:3000
```

## Docker

```bash
cd netplay-online
docker build -t netmam-netplay .
docker run --rm -p 3000:3000 netmam-netplay
```

## Deploy En Railway

1. Crear un proyecto nuevo en Railway.
2. Conectar el repo.
3. Configurar el root directory como `netplay-online`.
4. Railway detecta `railway.json` y usa Docker.
5. Cuando termine el deploy, copiar la URL publica.

Ejemplo:

```text
https://netmam-netplay-production.up.railway.app
```

En NetMAM:

```text
Servidor: https://netmam-netplay-production.up.railway.app
```

## Deploy En Render

1. Crear un nuevo Web Service.
2. Conectar el repo.
3. Usar `netplay-online` como root directory.
4. Render puede usar `render.yaml` o Dockerfile.
5. Copiar la URL publica HTTPS.

## Deploy En Fly.io

```bash
cd netplay-online
fly launch
fly deploy
```

Si Fly pregunta por el nombre de la app, usar uno unico, por ejemplo:

```text
netmam-netplay-tuusuario
```

## Uso En NetMAM

Todos los jugadores deben:

1. Abrir NetMAM.
2. Activar `Netplay`.
3. Poner la misma URL del servidor.
4. Usar la misma sala.
5. Cargar la misma ROM ZIP.
6. Usar el mismo core.

Ejemplo:

```text
Servidor: https://netmam-netplay-production.up.railway.app
Sala: 381767fb288f
Core: MAME 2003-Plus
```

## Endpoints

- `GET /list`: lista salas activas.
- `GET /games`: lista juegos registrados por las salas.
- Socket.IO `/`: canal usado por EmulatorJS.

## Notas

- Para internet real, usar HTTPS.
- No subir ROMs a este servidor.
- Si hay latencia alta, netplay puede sentirse lento o desincronizar.
