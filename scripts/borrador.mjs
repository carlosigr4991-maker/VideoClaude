// Redacta con el modelo local (Ollama) y guarda en un archivo; solo imprime la ruta, para no gastar tokens de Claude.
// Uso: npm run borrador -- borradores/tema.md "Escribe un guion sobre..." [modelo]
import {spawn} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';

const [destino, prompt, modelo = 'qwen3:4b-instruct'] = process.argv.slice(2);
if (!destino || !prompt) {
	console.error('Uso: npm run borrador -- <archivo> "<pedido>" [modelo]');
	process.exit(1);
}

const URL_OLLAMA = 'http://127.0.0.1:11434';

const activo = () => fetch(URL_OLLAMA).then(() => true, () => false);

if (!(await activo())) {
	// OLLAMA_MODELS ya apunta a E:\FabricaVideos\modelos\ollama en las variables de usuario.
	spawn('ollama', ['serve'], {detached: true, stdio: 'ignore', windowsHide: true}).unref();
	for (let i = 0; i < 30 && !(await activo()); i++) {
		await new Promise((r) => setTimeout(r, 1000));
	}
}

const inicio = Date.now();
const respuesta = await fetch(`${URL_OLLAMA}/api/generate`, {
	method: 'POST',
	// keep_alive 0 libera la VRAM al terminar: la voz necesita la misma GPU de 4 GB.
	body: JSON.stringify({model: modelo, prompt, stream: false, think: false, keep_alive: 0}),
});
if (!respuesta.ok) {
	console.error(`Ollama respondió ${respuesta.status}: ${await respuesta.text()}`);
	process.exit(1);
}
const {response} = await respuesta.json();

mkdirSync(dirname(destino), {recursive: true});
writeFileSync(destino, response.trim() + '\n', 'utf8');
console.log(`${destino}: ${response.trim().split(/\s+/).length} palabras en ${Math.round((Date.now() - inicio) / 1000)} s (${modelo})`);
