# Android

NetMAM queda preparado como PWA. En Android se puede instalar directamente desde Chrome cuando este sitio este publicado por HTTPS, por ejemplo en Vercel.

## Opcion 1: instalar como PWA

1. Publicar el proyecto en Vercel.
2. Abrir la URL en Chrome para Android.
3. Usar la opcion "Instalar app" o "Agregar a pantalla principal".

## Opcion 2: generar APK/AAB con Trusted Web Activity

Cuando tengas el dominio final de Vercel, podes empaquetar la PWA como app Android con Bubblewrap:

```powershell
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://TU-DOMINIO.vercel.app/manifest.webmanifest
bubblewrap build
```

Para publicar en Play Store vas a necesitar firmar la app y configurar Digital Asset Links para tu dominio. Bubblewrap genera el archivo `assetlinks.json` que debe servirse en:

```text
https://TU-DOMINIO.vercel.app/.well-known/assetlinks.json
```

No agregue ese archivo todavia porque depende del package name y de la huella SHA-256 de tu firma Android.
