---
name: video-local
description: Crear o modificar un video animado de este estudio (recreaciones de casos reales, animaciones educativas para niños) con voz, subtítulos y render en el equipo local. Usar cuando se pida un video, una escena, una animación o un guion para animar.
---

# Flujo

1. **Guion:** escribe `guiones/<id>.json` con `id` y `escenas: [{id, texto}]`. Opcional: `perfil` de voz (`natural` por defecto para temas tranquilos, `sombria` para temas oscuros; `piper` solo para pruebas rápidas de sincronía). La voz elegida por el usuario es la referencia masculina `ref_ald` (predeterminada). Los campos extra de cada escena (`hora`, `etiqueta`, `fuente`) llegan a la plantilla. Si hay que redactar mucho texto, genera primero un borrador local y revísalo: `npm run borrador -- borradores/<id>.md "<pedido>"`. El modelo local se equivoca: nunca lo uses como fuente de hechos.
2. **Voz y tiempos:** `npm run narrar -- guiones/<id>.json`. Si cambia el texto, hay que repetirlo. Con un audio externo (Fish Audio), el usuario lo descarga con el texto exacto y avisa el nombre: cópialo a `voces/externas/` sin tocar el original y ejecuta `E:\FabricaVideos\.venv\Scripts\python.exe scripts\importar_voz.py guiones/<id>.json voces/externas/<audio>.mp3 <nombre>`. Crea `<id>-<nombre>`.
3. **Visual:** reutiliza una plantilla de `src/escenas/` (`Lluvia.tsx` para niños, `Plano.tsx` para casos) y registra la composición en `src/Root.tsx`. Cambia datos antes que código. Para animar, consulta `remotion-markup`; para mapas, `remotion-maps`.
4. **Render:** `npm run render -- <Composicion>`. El comando solo imprime un resumen.
5. **Revisión:** extrae una hoja de contacto en vez de mirar fotogramas sueltos, y dile al usuario que escuche el resultado, porque la revisión no incluye el oído:
   `E:\FabricaVideos\herramientas\ffmpeg\bin\ffmpeg.exe -v error -y -i out\X.mp4 -vf "fps=8/DURACION,scale=270:-1,tile=4x2" -frames:v 1 .tmp\X.jpg`

Las ediciones se hacen por escena. Para ajustes finos, sugiere `npm run estudio`, que muestra la vista previa sin gastar tokens.

# Casos reales

- Cada hecho necesita una fuente citada en `fuente`. Marca `CONFIRMADO` o `SIN CONFIRMAR`; las hipótesis se presentan como hipótesis.
- Estilo esquemático (planos, líneas de tiempo, mapas) y el rótulo "Recreación ilustrativa". Nada que parezca foto o video de evidencia.
- Sin violencia gráfica ni detalles morbosos. No señales como culpable a quien no tenga condena firme. Trata a víctimas y familias con respeto.
- Antes de publicar, el usuario debe comparar cada escena con su fuente.

# Niños

- Frases cortas, una idea por escena, sin contenido que asuste. Verifica los datos científicos.
- Sin llamadas a comprar o a dejar datos personales. Al publicar, recuerda marcar "contenido para niños" en la plataforma.
