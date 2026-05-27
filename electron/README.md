# Escritorio

NetMAM usa Electron para generar builds de escritorio con la misma app web ubicada en `public/`.

## Ejecutar en modo escritorio

```powershell
npm run desktop
```

## Generar Windows

```powershell
npm run dist:win
```

El instalador queda en `dist/`.

## Generar Linux

```bash
npm run dist:linux
```

Genera `linux-unpacked` y `.tar.gz` en `dist/`. Para AppImage y paquete `.deb`, usar Linux o WSL:

```bash
npm run dist:linux-native
```
