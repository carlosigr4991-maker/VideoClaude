# Estudio de animación

Videos animados con código (Remotion). El trabajo pesado corre en este equipo. Para crear o modificar un video, usa la skill `video-local`.

- Responde breve. Sin resúmenes de lo que ya se ve en el código.
- No leas `src/generado/`, `public/generado/`, `out/`, `logs/` ni `node_modules/`. De un log, solo la cola (`Get-Content -Tail 25`).
- Python: siempre `E:\FabricaVideos\.venv\Scripts\python.exe` (el Python 3.15 del sistema no sirve). No modifiques `E:\FabricaVideos`.
- Todo va en E:. C: está casi lleno. La caché global de npm en D: no admite escritura; `.npmrc` usa una propia.
- NVENC no funciona con el controlador 582; Remotion codifica por CPU.
