"""Convierte guiones/<id>.json en voz y tiempos por palabra (faster-whisper), sin usar la nube.

Uso: npm run narrar -- guiones/lluvia.json [perfil]
Perfiles: natural (predeterminado), sombria (Chatterbox, GPU) y piper (CPU, rápido, para pruebas).
La voz sale de voces/<referencia>.pt; un guion puede elegir otra con "referencia". El perfil también se puede fijar en el guion con "perfil". Si se pasa por parámetro, el resultado se guarda como <id>-<perfil>.
Salida: public/generado/<id>/*.wav y src/generado/<id>.json
"""
import json
import os
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel
from piper import PiperVoice, SynthesisConfig

FABRICA = Path("E:/FabricaVideos")
FFMPEG = str(FABRICA / "herramientas/ffmpeg/bin/ffmpeg.exe")
RAIZ = Path(__file__).resolve().parent.parent

# cfg más bajo = ritmo más pausado; exageracion más alta = más expresiva.
# tono (semitonos) y ritmo (1 = sin cambio) se aplican después de sintetizar, sin alterar el resto de la voz.
PERFILES = {
    "natural": {"exageracion": 0.6, "cfg": 0.4, "temperatura": 0.8, "ritmo": 1.12},
    "sombria": {"exageracion": 0.6, "cfg": 0.4, "temperatura": 0.8, "ritmo": 1.12, "tono": -5},
}
REFERENCIA_PREDETERMINADA = "ref_ald"  # voz masculina con acento mexicano, elegida por el usuario
PAUSA_ENTRE_FRASES_S = 0.28
UMBRAL_SILENCIO = 330  # alrededor de -40 dB en muestras de 16 bits
PULIDO = ("highpass=f=80,equalizer=f=180:t=q:w=1:g=1.5,equalizer=f=3200:t=q:w=1.5:g=2,"
          "acompressor=threshold=-20dB:ratio=2.5:attack=15:release=180,aecho=0.9:0.9:22|37:0.05|0.035")
VOLUMEN = "I=-14:TP=-1.5:LRA=11"


def sintetizar_chatterbox(escenas, perfil, carpeta_frases, referencia=None):
    """Usa el sintetizador de la fábrica, en su propio entorno, cargando el modelo una sola vez por video.
    referencia: nombre de una voz preparada en voces/<nombre>.pt (define timbre y acento); sin ella, la incorporada."""
    shutil.rmtree(carpeta_frases, ignore_errors=True)
    carpeta_frases.mkdir(parents=True)
    frases, por_escena = [], []
    for numero, escena in enumerate(escenas, 1):
        rutas = []
        for orden, texto in enumerate(re.split(r"(?<=[.!?])\s+", escena["texto"].strip())):
            ruta = carpeta_frases / f"e{numero}_f{orden}.wav"
            frases.append({"texto": texto, "salida": str(ruta)})
            rutas.append(ruta)
        por_escena.append(rutas)

    pedido = carpeta_frases / "pedido.json"
    pedido.write_text(json.dumps({
        "modelo_dir": str(FABRICA / "modelos/voz/chatterbox_es_latam"), "t3": "t3_es_mx_latam.safetensors",
        "idioma": "es", "semilla": 1234, "frases": frases, **PERFILES[perfil],
        "referencia": str(RAIZ / "voces" / f"{referencia}.pt") if referencia else None,
    }, ensure_ascii=False), encoding="utf-8")
    subprocess.run([str(FABRICA / ".venv_voz/Scripts/python.exe"), str(FABRICA / "scripts/sintetizar_voz.py"), str(pedido)],
                   check=True, stdout=subprocess.DEVNULL, env={**os.environ, "PYTHONIOENCODING": "utf-8"})
    return por_escena


def unir_frases(rutas, destino):
    with wave.open(str(rutas[0]), "rb") as primera:
        frecuencia = primera.getframerate()
    silencio = b"\0\0" * int(PAUSA_ENTRE_FRASES_S * frecuencia)
    with wave.open(str(destino), "wb") as salida:
        salida.setnchannels(1)
        salida.setsampwidth(2)
        salida.setframerate(frecuencia)
        for indice, ruta in enumerate(rutas):
            if indice:
                salida.writeframes(silencio)
            with wave.open(str(ruta), "rb") as entrada:
                salida.writeframes(recortar_silencio(entrada.readframes(entrada.getnframes()), frecuencia))


def recortar_silencio(crudo, frecuencia):
    """Quita el silencio de los extremos de una frase (Chatterbox lo deja variable) y conserva 60 ms de margen."""
    muestras = np.frombuffer(crudo, np.int16)
    con_voz = np.flatnonzero(np.abs(muestras) > UMBRAL_SILENCIO)
    if not len(con_voz):
        return crudo
    margen = int(0.06 * frecuencia)
    return muestras[max(0, con_voz[0] - margen):con_voz[-1] + margen].tobytes()


def pulir(ruta, tono=0, ritmo=1):
    """Ajusta tono y ritmo si el perfil lo pide, ecualiza y comprime la voz, y deja el volumen en -14 LUFS con ganancia lineal (dos pasadas)."""
    cadena = PULIDO
    if tono or ritmo != 1:
        cadena = (f"rubberband=tempo={ritmo}:pitch={2 ** (tono / 12):.4f}:transients=smooth:pitchq=quality:"
                  f"channels=together,{PULIDO}")
    medicion = subprocess.run([FFMPEG, "-hide_banner", "-nostats", "-i", str(ruta), "-af",
                               f"{cadena},loudnorm={VOLUMEN}:print_format=json", "-f", "null", "-"],
                              capture_output=True, text=True, encoding="utf-8", errors="replace", check=True).stderr
    m = json.loads(medicion[medicion.rindex("{"):medicion.rindex("}") + 1])
    filtro = (f"{cadena},loudnorm={VOLUMEN}:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")
    temporal = ruta.with_suffix(".pulido.wav")
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(ruta), "-af", filtro, "-ar", "44100", "-c:a", "pcm_s16le", str(temporal)],
                   check=True)
    temporal.replace(ruta)


def repartir_por_longitud(palabras, inicio, fin):
    total = sum(len(p) for p in palabras) or 1
    resultado, cursor = [], inicio
    for palabra in palabras:
        duracion = (fin - inicio) * len(palabra) / total
        resultado.append({"t": palabra, "ini": round(cursor, 3), "fin": round(cursor + duracion, 3)})
        cursor += duracion
    return resultado


def audio_para_whisper(ruta):
    """Decodifica con FFmpeg: faster-whisper 1.2.1 no es compatible con PyAV 19."""
    crudo = subprocess.run([FFMPEG, "-v", "error", "-i", str(ruta), "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                           capture_output=True, check=True).stdout
    return np.frombuffer(crudo, np.int16).astype(np.float32) / 32768.0


def tiempos_de_palabras(modelo, ruta, texto, duracion):
    """Conserva el texto exacto del guion; Whisper solo aporta los tiempos."""
    segmentos, _ = modelo.transcribe(audio_para_whisper(ruta), language="es", word_timestamps=True, beam_size=1)
    oidas = [p for s in segmentos for p in s.words]
    palabras = texto.split()
    if len(oidas) == len(palabras):
        return [{"t": t, "ini": round(p.start, 3), "fin": round(p.end, 3)} for t, p in zip(palabras, oidas)], "whisper"
    inicio = oidas[0].start if oidas else 0.0
    fin = oidas[-1].end if oidas else duracion
    return repartir_por_longitud(palabras, inicio, fin), "proporcional"


def main():
    guion = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    id_video = guion["id"]
    perfil = guion.get("perfil", "natural")
    if len(sys.argv) > 2:
        perfil = sys.argv[2]
        id_video = f"{id_video}-{perfil}"
    if not re.fullmatch(r"[a-z0-9_-]+", id_video):
        sys.exit("El id solo admite minúsculas, números, guiones y guiones bajos")
    if perfil != "piper" and perfil not in PERFILES:
        sys.exit(f"Perfil desconocido: {perfil}. Opciones: {', '.join(PERFILES)}, piper")

    carpeta = RAIZ / "public" / "generado" / id_video
    carpeta.mkdir(parents=True, exist_ok=True)
    rutas = [carpeta / f"escena_{n}.wav" for n in range(1, len(guion["escenas"]) + 1)]

    if perfil == "piper":
        voz = PiperVoice.load(str(FABRICA / "modelos/piper" / f"{guion.get('voz', 'es_MX-claude-high')}.onnx"))
        ajustes = SynthesisConfig(length_scale=1 / guion.get("velocidad", 1.0))
        for ruta, escena in zip(rutas, guion["escenas"]):
            with wave.open(str(ruta), "wb") as salida:
                voz.synthesize_wav(escena["texto"], salida, syn_config=ajustes)
    else:
        por_escena = sintetizar_chatterbox(guion["escenas"], perfil, RAIZ / ".tmp" / "frases" / id_video,
                                           guion.get("referencia", REFERENCIA_PREDETERMINADA))
        for ruta, frases in zip(rutas, por_escena):
            unir_frases(frases, ruta)

    whisper = WhisperModel("small", device="cpu", compute_type="int8",
                           download_root=str(FABRICA / "modelos/whisper"), local_files_only=True)
    escenas = []
    for numero, (ruta, escena) in enumerate(zip(rutas, guion["escenas"]), 1):
        ajustes_perfil = PERFILES.get(perfil, {})
        pulir(ruta, ajustes_perfil.get("tono", 0), ajustes_perfil.get("ritmo", 1))
        with wave.open(str(ruta), "rb") as entrada:
            duracion = entrada.getnframes() / entrada.getframerate()
        palabras, metodo = tiempos_de_palabras(whisper, ruta, escena["texto"], duracion)
        escenas.append({**escena, "audio": f"generado/{id_video}/{ruta.name}",
                        "duracion_s": round(duracion, 3), "palabras": palabras, "tiempos": metodo})
        print(f"escena {numero}: {duracion:.1f} s ({metodo})")

    destino = RAIZ / "src" / "generado" / f"{id_video}.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps({"id": id_video, "perfil": perfil, "escenas": escenas}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"listo: {destino.relative_to(RAIZ)} ({sum(e['duracion_s'] for e in escenas):.1f} s de voz, perfil {perfil})")


if __name__ == "__main__":
    main()
