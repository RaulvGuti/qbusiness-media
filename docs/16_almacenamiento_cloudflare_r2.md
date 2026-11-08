# 16 — Almacenamiento de la galería en Cloudflare R2

La galería de fotos y videos dejó de subir archivos a Supabase Storage. Las subidas
nuevas van directo a **Cloudflare R2** y la base de datos sigue guardando una sola
cadena de texto: la URL pública final en `archivos_galeria.ruta_storage`.

No hay migración de esquema. Las filas antiguas que guardan rutas de Supabase
Storage se siguen mostrando y borrando como antes.

---

## 1. Por qué R2

- R2 no cobra egreso de datos y el CDN entrega las imágenes y videos sin pasar por
  Next.js.
- Los archivos grandes no consumen memoria ni tiempo del servidor.
- Las credenciales privadas se quedan en el servidor; el navegador solo recibe una
  URL de subida temporal.
- La tabla existente no cambia: `ruta_storage` es `varchar` y acepta la URL completa.

---

## 2. Flujo de una subida

```text
1. El navegador pide una firma:
   POST /api/api/galeria
   { carpetaId, tipoMime, tamano }

2. El servidor valida sesión admin_principal, carpeta, tipo y tamaño.
   Devuelve:
   { key, publicUrl, uploadUrl, headers, mock }

3. El navegador sube el archivo directo a R2:
   PUT uploadUrl
   headers: { Content-Type, Cache-Control }

4. El navegador registra la URL final:
   registrarArchivoGaleria({ rutaStorage: publicUrl, ... })

5. La base guarda:
   archivos_galeria.ruta_storage =
   https://cdn.tu-dominio.com/galeria/<carpeta-id>/<uuid>.jpg
```

Si el paso 4 falla, el navegador llama a `DELETE /api/api/galeria` con la `key`
para borrar el objeto huérfano.

Al eliminar un archivo desde el panel, `eliminarArchivoGaleria()`:

1. Borra la fila con la RPC `eliminar_archivo_galeria`.
2. Detecta si `ruta_storage` es una URL del CDN de R2.
3. Extrae la key y ejecuta `DeleteObjectCommand` en R2.
4. Si la ruta es legacy de Supabase, borra el objeto del bucket como antes.

---

## 3. Variables de entorno

| Variable | Dónde | Qué es |
| --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Runtime, servidor | ID de la cuenta de Cloudflare; forma el endpoint de R2 |
| `R2_ACCESS_KEY_ID` | Runtime, servidor | Access key del API Token de R2 |
| `R2_SECRET_ACCESS_KEY` | Runtime, servidor | Secret del API Token de R2 |
| `R2_BUCKET_NAME` | Runtime, servidor | Nombre del bucket, por ejemplo `qbusiness-media` |
| `R2_MOCK` | Runtime, servidor | `true` para trabajar sin credenciales reales |
| `NEXT_PUBLIC_CDN_URL` | Build y runtime | Dominio público del bucket; sin slash final |

Las credenciales de R2 **nunca** llevan el prefijo `NEXT_PUBLIC_` y nunca se pasan
como `build.args` de Docker. `NEXT_PUBLIC_CDN_URL` sí es pública y se incrusta en
el build, así que si cambia hay que reconstruir la imagen.

---

## 4. Configuración en Cloudflare

1. Crear un bucket de R2, por ejemplo `qbusiness-media`.
2. Crear un API Token con permiso **Object Read & Write** limitado a ese bucket.
3. Conectar un **custom domain** público al bucket. Ese dominio es
   `NEXT_PUBLIC_CDN_URL`.
4. Configurar CORS en el bucket:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://tudominio.com"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["content-type", "cache-control"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Sin CORS, la firma se genera pero el `PUT` desde el navegador falla.

---

## 5. Modo mock

`.env.example` trae credenciales de ejemplo y `R2_MOCK="true"`.

En modo mock:

- No se llama a Cloudflare.
- La ruta de firma devuelve `uploadUrl: null` y una `publicUrl` construida con
  `NEXT_PUBLIC_CDN_URL`; si esa variable no existe, usa `https://cdn.ejemplo.com`.
- El navegador omite el `PUT` y registra la URL de ejemplo en la base.
- Sirve para probar el flujo completo sin cuenta de R2.

Para usar R2 de verdad:

1. Reemplazar `CLOUDFLARE_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
   y `R2_BUCKET_NAME`.
2. Poner `R2_MOCK="false"`.
3. Reiniciar `npm run dev` o reconstruir la imagen de Docker.

---

## 6. Compatibilidad con lo anterior

`resolverUrlArchivo()` acepta las dos formas guardadas en `ruta_storage`:

| Valor guardado | Resultado |
| --- | --- |
| `https://cdn.tu-dominio.com/galeria/...` | Se devuelve tal cual |
| `galeria/mcdia/spot-principal.jpg` | Se convierte a la URL pública de Supabase |

No es necesario re-subir los archivos antiguos para que el sitio siga funcionando.
Los buckets `galeria`, `logos` y `comprobantes` de Supabase se conservan: los dos
primeros para archivos legacy y el último para los comprobantes privados de pago.

Si más adelante se quieren mover todos los archivos antiguos a R2, se puede hacer
un script aparte que copie cada objeto y actualice `ruta_storage`. No forma parte de
esta migración y no requiere cambiar el esquema.

---

## 7. Verificación

```bash
npm run check
```

Pruebas manuales:

1. Con `R2_MOCK=true`, subir una imagen y comprobar que la fila nueva guarda una URL.
2. Con credenciales reales y `R2_MOCK=false`, subir una imagen y abrir la URL del CDN.
3. Subir un video y comprobar que la subida va directo a R2, no a Next.js.
4. Eliminar el archivo y confirmar que desaparece de R2 y de `archivos_galeria`.
5. Abrir una carpeta con archivos legacy y confirmar que siguen visibles.
