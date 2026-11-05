// Renderiza en este equipo: temporales en E: (C: está casi lleno) y el registro completo en logs/.
// Uso: npm run render -- <Composicion> [salida.mp4]
import {spawn} from 'node:child_process';
import {createWriteStream, mkdirSync, statSync} from 'node:fs';
import {resolve} from 'node:path';

const [composicion, salida = `out/${composicion}.mp4`] = process.argv.slice(2);
if (!composicion) {
	console.error('Uso: npm run render -- <Composicion> [salida.mp4]');
	process.exit(1);
}

const temporales = resolve('.tmp');
for (const carpeta of [temporales, 'logs', 'out']) {
	mkdirSync(carpeta, {recursive: true});
}

const rutaLog = `logs/render_${composicion}.log`;
const log = createWriteStream(rutaLog);
const inicio = Date.now();
const proceso = spawn(
	process.execPath,
	['node_modules/@remotion/cli/remotion-cli.js', 'render', 'src/index.ts', composicion, salida, '--concurrency=6', '--crf=20', '--log=info'],
	{env: {...process.env, TEMP: temporales, TMP: temporales}},
);
proceso.stdout.pipe(log);
proceso.stderr.pipe(log);

proceso.on('close', (codigo) => {
	const segundos = Math.round((Date.now() - inicio) / 1000);
	if (codigo !== 0) {
		console.error(`Falló (código ${codigo}) tras ${segundos} s. Ver ${rutaLog}`);
		process.exit(codigo ?? 1);
	}
	console.log(`${salida}: ${(statSync(salida).size / 1048576).toFixed(1)} MB en ${segundos} s`);
});
