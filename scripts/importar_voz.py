"""Usa un audio ya generado afuera (por ejemplo, Fish Audio) como narración de un guion, sin usar la nube.

Uso: E:\\FabricaVideos\\.venv\\Scripts\\python.exe scripts\\importar_voz.py guiones/lluvia.json voces/externas/audio.mp3 valentino
Alinea el audio con el texto, lo divide por escenas y solo ajusta el volumen: la voz no se altera.
Salida: public/generado/<id>-<nombre>/*.wav y src/generado/<id>-<nombre>.json
"""
import difflib
import json
import re
import subprocess
import sys
import unicodedata
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

from narrar import FABRICA, FFMPEG, RAIZ, VOLUMEN, audio_para_whisper

COINCIDENCIA_MINIMA = 0.85


def normalizar(palabra):
    sin_acentos = unicodedata.normalize("NFD", palabra.lower())
    return re.sub(r"[^a-z0-9ñ]", "", "".join(c for c in sin_acentos if unicodedata.category(c) != "Mn"))


def a_wav_con_volumen(origen, destino):
    medicion = subprocess.run([FFMPEG, "-hide_banner", "-nostats", "-i", str(origen), "-af", f"loudnorm={VOLUMEN}:print_format=json", "-f", "null", "-"],
                              capture_output=True, text=True, encoding="utf-8", errors="replace", check=True).stderr
    m = json.loads(medicion[medicion.rindex("{"):medicion.rindex("}") + 1])
    filtro = (f"loudnorm={VOLUMEN}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(origen), "-af", filtro, "-ac", "1", "-ar", "44100", "-c:a", "pcm_s16le", str(destino)], check=True)


def alinear(palabras_guion, oidas):
    """Da a cada palabra del guion sus tiempos en el audio; las que Whisper no reconoció se interpolan."""
    bloques = difflib.SequenceMatcher(None, [normalizar(p) for p in palabras_guion],
                                      [normalizar(p.word) for p in oidas], autojunk=False).get_matching_blocks()
    pares = [(b.a + i, b.b + i) for b in bloques for i in range(b.size)]
    if not pares:
        sys.exit("El audio no coincide con el guion")
    indices = np.arange(len(palabras_guion))
    guion_idx = [g for g, _ in pares]
    inicios = np.interp(indices, guion_idx, [oidas[o].start for _, o in pares])
    finales = np.interp(indices, guion_idx, [oidas[o].end for _, o in pares])
    return inicios, finales, len(pares) / len(palabras_guion)


def main():
    guion = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    audio, nombre = Path(sys.argv[2]), sys.argv[3]
    id_video = f"{guion['id']}-{nombre}"
    if not re.fullmatch(r"[a-z0-9_-]+", id_video):
        sys.exit("El id solo admite minúsculas, números, guiones y guiones bajos")

    carpeta = RAIZ / "public" / "generado" / id_video
    carpeta.mkdir(parents=True, exist_ok=True)
    completo = carpeta / "completo.wav"
    a_wav_con_volumen(audio, completo)

    whisper = WhisperModel("small", device="cpu", compute_type="int8",
                           download_root=str(FABRICA / "modelos/whisper"), local_files_only=True)
    segmentos, _ = whisper.transcribe(audio_para_whisper(completo), language="es", word_timestamps=True, beam_size=1)
    oidas = [p for s in segmentos for p in s.words]

    por_escena = [e["texto"].split() for e in guion["escenas"]]
    palabras = [p for grupo in por_escena for p in grupo]
    inicios, finales, coincidencia = alinear(palabras, oidas)
    print(f"coincidencia con el guion: {coincidencia:.0%}")
    if coincidencia < COINCIDENCIA_MINIMA:
        sys.exit("El audio se parece poco al guion. ¿Se cambió el texto al generarlo?")

    with wave.open(str(completo), "rb") as entrada:
        frecuencia, muestras = entrada.getframerate(), entrada.readframes(entrada.getnframes())
    total_s = len(muestras) / 2 / frecuencia

    # Cada corte cae en mitad de la pausa entre escenas, así se conserva el ritmo original del audio.
    limites, cursor = [0.0], 0
    for grupo in por_escena[:-1]:
        cursor += len(grupo)
        limites.append(float(finales[cursor - 1] + inicios[cursor]) / 2)
    limites.append(total_s)

    escenas, cursor = [], 0
    for numero, (escena, grupo) in enumerate(zip(guion["escenas"], por_escena), 1):
        desde, hasta = limites[numero - 1], limites[numero]
        ruta = carpeta / f"escena_{numero}.wav"
        with wave.open(str(ruta), "wb") as salida:
            salida.setnchannels(1)
            salida.setsampwidth(2)
            salida.setframerate(frecuencia)
            salida.writeframes(muestras[int(desde * frecuencia) * 2:int(hasta * frecuencia) * 2])
        tiempos = [{"t": t, "ini": round(float(inicios[cursor + i]) - desde, 3), "fin": round(float(finales[cursor + i]) - desde, 3)}
                   for i, t in enumerate(grupo)]
        cursor += len(grupo)
        escenas.append({**escena, "audio": f"generado/{id_video}/{ruta.name}", "duracion_s": round(hasta - desde, 3),
                        "pausa_s": 0, "palabras": tiempos, "tiempos": "alineado"})
        print(f"escena {numero}: {hasta - desde:.1f} s")
    completo.unlink()

    destino = RAIZ / "src" / "generado" / f"{id_video}.json"
    destino.write_text(json.dumps({"id": id_video, "perfil": nombre, "escenas": escenas}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"listo: {destino.relative_to(RAIZ)} ({total_s:.1f} s de voz)")


if __name__ == "__main__":
    main()
