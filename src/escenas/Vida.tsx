import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {cuadrosDe, FPS} from '../Armazon';
import type {Escena, PropsVisual, VideoNarrado} from '../Armazon';

const FUERTE = '"Arial Black", Arial, sans-serif';
const SANS = 'Arial, sans-serif';
const SERIF = 'Georgia, serif';
const FONDO = '#05060f';
const PANEL = '#14162b';
const CIAN = '#5fe1f2';
const VIOLETA = '#a78bfa';
const AMBAR = '#ffb627';
const ROJO = '#ff5c7a';
const VERDE = '#5be0a4';
const AZUL = '#4f8df0';
const BLANCO = '#f4f6fb';
const TENUE = '#9a9db8';

// Cuadro en el que la narración dice una palabra, para que la imagen acompañe a la voz.
const cue = (escena: Escena, palabra: string, fps: number) => {
	const encontrada = escena.palabras.find((p) => p.t.toLowerCase().includes(palabra));
	return encontrada ? Math.round(encontrada.ini * fps) : 0;
};

const rampa = (frame: number, desde: number, duracion = 14) =>
	interpolate(frame, [desde, desde + Math.max(duracion, 1)], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.cubic),
	});

const entre = (a: number, b: number, t: number) => a + (b - a) * t;

// Valor fijo por índice: el render debe dar lo mismo en cada cuadro.
const azar = (i: number) => {
	const x = Math.sin(i * 127.1 + 11.7) * 43758.5453;
	return x - Math.floor(x);
};

const mezclarColor = (a: string, b: string, t: number) => {
	const canal = (c: string, i: number) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
	return `rgb(${[0, 1, 2].map((i) => Math.round(entre(canal(a, i), canal(b, i), t))).join(',')})`;
};

const useSalto = (desde: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - desde, fps, config: {damping: 14, stiffness: 130}});
};

// --- Formas del campo de puntos ---

const PUNTOS = 430;
type Punto = {x: number; y: number};
type Forma = {pos: (i: number, f: number) => Punto; color: (i: number, f: number) => string; radio?: number; opacidad?: number};

const sembrar = (dentro: (x: number, y: number) => boolean, semilla: number) => {
	const lista: Punto[] = [];
	for (let i = 0; lista.length < PUNTOS; i++) {
		const x = 60 + azar(semilla + i * 2) * 960;
		const y = 320 + azar(semilla + i * 2 + 1) * 1080;
		if (dentro(x, y)) {
			lista.push({x, y});
		}
	}
	return lista;
};

// Los puntos sembrados tiemblan un poco, para que nada quede quieto.
const dePuntos = (lista: Punto[], color: Forma['color'], radio = 7, opacidad = 0.95): Forma => ({
	pos: (i, f) => ({x: lista[i].x + Math.sin(f / 21 + i) * 5, y: lista[i].y + Math.cos(f / 25 + i * 1.3) * 5}),
	color,
	radio,
	opacidad,
});

const fijo = (c: string) => () => c;

const SILUETA = sembrar((x, y) => {
	const craneo = ((x - 540) / 215) ** 2 + ((y - 640) / 265) ** 2 < 1;
	const cuello = Math.abs(x - 540) < 90 && y > 850 && y < 1010;
	const hombros = ((x - 540) / 360) ** 2 + ((y - 1240) / 250) ** 2 < 1 && y < 1350;
	return craneo || cuello || hombros;
}, 1000);

const CUERPO = sembrar((x, y) => {
	const cabeza = ((x - 540) / 88) ** 2 + ((y - 440) / 100) ** 2 < 1;
	const torso = Math.abs(x - 540) < 135 - (y - 560) * 0.08 && y > 550 && y < 900;
	const brazos = y > 560 && y < 900 && Math.abs(x - 540) > 150 && Math.abs(x - 540) < 215 + (y - 560) * 0.08;
	const piernas = y >= 900 && y < 1340 && Math.abs(x - 540) > 14 && Math.abs(x - 540) < 112;
	return cabeza || torso || brazos || piernas;
}, 2000);

const CEREBRO = sembrar((x, y) => {
	const arriba = ((x - 540) / 340) ** 2 + ((y - 720) / 260) ** 2 < 1;
	const atras = ((x - 720) / 170) ** 2 + ((y - 900) / 110) ** 2 < 1;
	const tronco = Math.abs(x - 640 - (y - 950) * 0.3) < 44 && y > 930 && y < 1140;
	return arriba || atras || tronco;
}, 3000);

const VIRUS = sembrar((x, y) => {
	const dx = Math.abs(x - 540);
	const dy = Math.abs(y - 780);
	const hexagono = dy < 250 && dx < 216 && dx * 0.5 + dy * 0.866 < 216 * 0.866 + 54;
	const angulo = Math.atan2(y - 780, x - 540);
	const radio = Math.hypot(x - 540, y - 780);
	const espiga = radio > 270 && radio < 380 && Math.abs(((angulo / (Math.PI / 3) + 0.5 + 12) % 1) - 0.5) < 0.07;
	return hexagono || espiga;
}, 4000);

const OJO = sembrar((x, y) => {
	const ancho = 400 * Math.sqrt(Math.max(0, 1 - ((y - 800) / 230) ** 2));
	const almendra = Math.abs(x - 540) < ancho && Math.abs(y - 800) < 230 * (1 - (Math.abs(x - 540) / 430) ** 2);
	const r = Math.hypot(x - 540, y - 800);
	return almendra && (r < 105 || r > 145);
}, 6000);

const PREGUNTA = sembrar((x, y) => {
	const r = Math.hypot(x - 540, y - 620);
	const a = Math.atan2(y - 620, x - 540);
	const arco = r > 130 && r < 215 && (a < 1.05 || a > 2.9 || a < -0.05 && a > -3.3);
	const tallo = Math.abs(x - 560) < 44 && y > 780 && y < 1000;
	const punto = Math.hypot(x - 560, y - 1100) < 58;
	return (arco && !(a > 0.9 && a < 2.95)) || tallo || punto;
}, 7000);

const SILUETA_FRIA = dePuntos(SILUETA, (i) => (i % 3 ? AZUL : VIOLETA));
const SILUETA_VIVA = dePuntos(SILUETA, (i, f) => (Math.sin(f / 9 + i) > 0.55 ? BLANCO : i % 2 ? AMBAR : ROJO), 8);
const CUERPO_VIVO = dePuntos(CUERPO, (i, f) => (Math.sin(f / 8 + i * 0.5) > 0.6 ? BLANCO : i % 3 ? ROJO : AMBAR));
const CEREBRO_VIVO = dePuntos(CEREBRO, (i, f) => (Math.sin(f / 6 + i * 0.7) > 0.5 ? BLANCO : i % 2 ? VIOLETA : CIAN));
const VIRUS_FORMA = dePuntos(VIRUS, (i) => (i % 4 ? VIOLETA : ROJO));
const OJO_FORMA = dePuntos(OJO, (i) => (Math.hypot(OJO[i].x - 540, OJO[i].y - 800) < 110 ? CIAN : BLANCO));
const PREGUNTA_FORMA = dePuntos(PREGUNTA, fijo(AMBAR), 8);

const DISPERSO: Forma = {
	pos: (i, f) => ({x: ((azar(i) * 1080 + f * (azar(i + 9) - 0.5)) % 1080 + 1080) % 1080, y: ((azar(i + 40) * 1500 + f * (azar(i + 19) - 0.5) * 1.5) % 1500 + 1500) % 1500 + 200}),
	color: fijo(TENUE),
	radio: 4,
	opacidad: 0.55,
};

const PARTICULAS: Forma = {
	pos: (i, f) => ({x: 540 + Math.sin(f / (5 + azar(i) * 7) + i) * (120 + azar(i + 3) * 400), y: 780 + Math.cos(f / (4 + azar(i + 5) * 8) + i * 2) * (120 + azar(i + 7) * 430)}),
	color: (i) => (i % 2 ? CIAN : BLANCO),
	radio: 3.5,
};

const CENTROS_ATOMOS = [[250, 520], [760, 480], [540, 790], [230, 1090], [820, 1070]];
const ATOMOS: Forma = {
	pos: (i, f) => {
		const [cx, cy] = CENTROS_ATOMOS[i % CENTROS_ATOMOS.length];
		if (i % 4 === 0) {
			return {x: cx + (azar(i) - 0.5) * 44, y: cy + (azar(i + 9) - 0.5) * 44};
		}
		const a = f / (10 + (i % 3) * 5) + azar(i) * 6.3;
		const orbita = 80 + (i % 3) * 52;
		const inclina = (i % 3) * 1.05;
		const ox = Math.cos(a) * orbita;
		const oy = Math.sin(a) * orbita * 0.42;
		return {x: cx + ox * Math.cos(inclina) - oy * Math.sin(inclina), y: cy + ox * Math.sin(inclina) + oy * Math.cos(inclina)};
	},
	color: (i) => (i % 4 === 0 ? AMBAR : CIAN),
	radio: 5.5,
};

const CENTROS_MOLECULAS = Array.from({length: 12}, (_, n) => ({x: 200 + (n % 3) * 340 + azar(n) * 70, y: 450 + Math.floor(n / 3) * 230 + azar(n + 5) * 70}));
const MOLECULAS: Forma = {
	pos: (i, f) => {
		const c = CENTROS_MOLECULAS[i % 12];
		const lado = Math.floor(i / 12) % 4;
		const a = (lado / 4) * 6.28 + f / 44 + (i % 12);
		return {x: c.x + Math.cos(a) * 58 + (azar(i) - 0.5) * 22, y: c.y + Math.sin(a) * 58 + (azar(i + 3) - 0.5) * 22};
	},
	color: (i) => [AMBAR, CIAN, VERDE, ROJO][Math.floor(i / 12) % 4],
	radio: 8,
};

const CADENA: Forma = {
	pos: (i, f) => {
		const t = i / PUNTOS;
		const x = 90 + t * 900;
		const signo = i % 2 ? 1 : -1;
		return {x, y: 780 + Math.sin(t * 16 + f / 22) * 150 * signo};
	},
	color: (i) => (i % 2 ? VERDE : CIAN),
	radio: 7,
};

const DIVISION: Forma = {
	pos: (i, f) => {
		const separacion = ((Math.sin(f / 26) + 1) / 2) * 240;
		const a = (i / PUNTOS) * 6.28 * 4;
		const centro = i % 2 ? 540 - separacion : 540 + separacion;
		const r = i % 5 === 0 ? 100 * azar(i) : 195;
		return {x: centro + Math.cos(a) * r, y: 780 + Math.sin(a) * r};
	},
	color: (i) => (i % 5 === 0 ? AMBAR : VERDE),
	radio: 7,
};

const CELULA: Forma = {
	pos: (i, f) => {
		const a = (i / PUNTOS) * 6.28 * 3 + f / 90;
		if (i % 5 < 3) {
			const r = 330 + Math.sin(a * 2 + f / 22) * 16;
			return {x: 540 + Math.cos(a) * r, y: 780 + Math.sin(a) * r};
		}
		if (i % 5 === 3) {
			const r = 90 * Math.sqrt(azar(i));
			return {x: 540 + Math.cos(a * 7) * r + 40, y: 760 + Math.sin(a * 7) * r};
		}
		const r = 120 + azar(i) * 190;
		const b = azar(i + 5) * 6.28 + f / (60 + azar(i) * 80);
		return {x: 540 + Math.cos(b) * r, y: 780 + Math.sin(b) * r};
	},
	color: (i) => (i % 5 < 3 ? VERDE : i % 5 === 3 ? VIOLETA : CIAN),
	radio: 7,
};

const TRIADA: Forma = {
	pos: (i, f) => {
		const n = i % 3;
		const a = (n / 3) * 6.28 + f / 70 - 1.57;
		const r = 120 * Math.sqrt(azar(i));
		const b = azar(i + 4) * 6.28 + f / 30;
		return {x: 540 + Math.cos(a) * 310 + Math.cos(b) * r, y: 780 + Math.sin(a) * 310 + Math.sin(b) * r};
	},
	color: (i) => [CIAN, VERDE, AMBAR][i % 3],
	radio: 7,
};

const PLANETA: Forma = {
	pos: (i, f) => {
		const r = 300 * Math.sqrt(azar(i));
		const a = azar(i + 5) * 6.28;
		const x = Math.cos(a) * r;
		const giro = ((x + f * 1.3 + 300) % 600) - 300;
		const y = Math.sin(a) * r;
		const borde = Math.sqrt(Math.max(0, 300 * 300 - y * y));
		return {x: 540 + (giro / 300) * borde, y: 700 + y};
	},
	color: (i) => (azar(i + 30) < 0.3 ? ROJO : azar(i + 30) < 0.7 ? AMBAR : AZUL),
	radio: 8,
};

const OCEANO: Forma = {
	pos: (i, f) => {
		const x = azar(i) * 1080;
		if (i % 5 === 0) {
			const t = ((f / (70 + azar(i) * 80) + azar(i + 2)) % 1);
			return {x: x + Math.sin(f / 15 + i) * 18, y: 1250 - t * 560};
		}
		const banda = azar(i + 3);
		return {x, y: 780 + banda * 480 + Math.sin(x / 110 + f / 20 + banda * 5) * 26};
	},
	color: (i) => (i % 5 === 0 ? VERDE : azar(i + 8) < 0.5 ? AZUL : CIAN),
	radio: 6,
};

const NIVELES: Forma = {
	pos: (i, f) => {
		const fila = i % 5;
		const media = 440 - fila * 74;
		return {x: 540 + (azar(i) - 0.5) * 2 * media, y: 1240 - fila * 190 + Math.sin(f / 18 + i) * 22};
	},
	color: (i, f) => {
		const fila = i % 5;
		const encendida = Math.sin(f / 24 - fila * 0.9) > 0.3;
		return encendida ? BLANCO : [CIAN, AMBAR, ROJO, VERDE, VIOLETA][fila];
	},
	radio: 7,
};

// Células pequeñas: cada una es un anillo de 12 puntos.
const celulitas = (centro: (n: number, f: number) => Punto, color: (n: number) => string): Forma => ({
	pos: (i, f) => {
		const n = Math.floor(i / 12);
		const c = centro(n, f);
		const a = ((i % 12) / 12) * 6.28 + f / 40;
		return {x: c.x + Math.cos(a) * 38, y: c.y + Math.sin(a) * 38};
	},
	color: (i) => color(Math.floor(i / 12)),
	radio: 5.5,
});
const SUELTAS = celulitas((n, f) => ({x: 130 + azar(n) * 820 + Math.sin(f / 30 + n) * 40, y: 420 + azar(n + 8) * 860 + Math.cos(f / 34 + n) * 40}), (n) => [VERDE, CIAN][n % 2]);
const lugarHex = (n: number, cx: number, cy: number, paso: number) => {
	const anillo = n === 0 ? 0 : n < 7 ? 1 : n < 19 ? 2 : 3;
	const enAnillo = anillo === 0 ? 1 : anillo * 6;
	const previos = anillo === 0 ? 0 : anillo === 1 ? 1 : anillo === 2 ? 7 : 19;
	const a = ((n - previos) / enAnillo) * 6.28;
	return {x: cx + Math.cos(a) * anillo * paso, y: cy + Math.sin(a) * anillo * paso};
};
const COLONIA = celulitas((n, f) => {
	const p = lugarHex(n, 540, 780, 88);
	const late = 1 + Math.sin(f / 16) * 0.03;
	return {x: 540 + (p.x - 540) * late, y: 780 + (p.y - 780) * late};
}, (n) => (n % 3 ? VERDE : AMBAR));
const CENTROS_COLONIAS = [[280, 540], [800, 540], [280, 1060], [800, 1060]];
const COLONIAS = celulitas((n) => {
	const [cx, cy] = CENTROS_COLONIAS[n % 4];
	return lugarHex(Math.floor(n / 4), cx, cy, 82);
}, (n) => [VERDE, AMBAR, CIAN, ROJO][n % 4]);

const CHIP: Forma = {
	pos: (i) => {
		const lado = 22;
		const col = i % lado;
		const fila = Math.floor(i / lado) % 20;
		const n = Math.floor(i / lado);
		if (n >= 16) {
			const pin = i % 4;
			const t = ((i % 22) / 22) * 620;
			const base = [[230 + t, 440], [230 + t, 1120], [200, 470 + t], [880, 470 + t]][pin];
			return {x: base[0], y: base[1]};
		}
		return {x: 280 + col * 24.5, y: 530 + fila * 34};
	},
	color: (i, f) => (Math.sin(f / 7 + (i % 22) * 0.6 + Math.floor(i / 22)) > 0.75 ? BLANCO : Math.floor(i / 22) >= 16 ? AMBAR : CIAN),
	radio: 6,
};

const CAPAS = [[220, [560, 780, 1000]], [540, [470, 680, 880, 1090]], [860, [560, 780, 1000]]] as const;
const NODOS_RED = CAPAS.flatMap(([x, ys]) => ys.map((y) => ({x, y})));
const ARISTAS = NODOS_RED.flatMap((a, n) => NODOS_RED.filter((b) => b.x > a.x && b.x - a.x < 400).map((b) => ({a, b, n})));
const RED: Forma = {
	pos: (i, f) => {
		if (i % 3 === 0) {
			const nodo = NODOS_RED[i % NODOS_RED.length];
			const b = azar(i) * 6.28 + f / 26;
			return {x: nodo.x + Math.cos(b) * 34, y: nodo.y + Math.sin(b) * 34};
		}
		const arista = ARISTAS[i % ARISTAS.length];
		const t = ((f / (50 + azar(i) * 30) + azar(i + 4)) % 1);
		return {x: entre(arista.a.x, arista.b.x, t), y: entre(arista.a.y, arista.b.y, t)};
	},
	color: (i) => (i % 3 === 0 ? AMBAR : i % 2 ? CIAN : VIOLETA),
	radio: 6,
};

const GALAXIA: Forma = {
	pos: (i, f) => {
		const t = azar(i);
		const brazo = i % 2 ? 0 : Math.PI;
		const a = t * 8 + brazo + f / 140 + (azar(i + 6) - 0.5) * 0.6;
		const r = 40 + t * 440;
		return {x: 540 + Math.cos(a) * r, y: 800 + Math.sin(a) * r * 0.82};
	},
	color: (i) => (azar(i + 2) < 0.15 ? AMBAR : azar(i + 2) < 0.55 ? BLANCO : VIOLETA),
	radio: 5,
};

// Qué forma toma el campo con cada palabra. Sin palabra: desde el inicio de la escena.
const PLAN: Record<string, [string, Forma][]> = {
	gancho: [['', SILUETA_FRIA], ['aún', SILUETA_VIVA]],
	instante: [['', SILUETA_VIVA], ['primera', CELULA], ['moléculas', MOLECULAS], ['pero', PREGUNTA_FORMA]],
	aviso: [['', DISPERSO]],
	escalas: [['células', CELULA], ['moléculas', MOLECULAS], ['átomos', ATOMOS], ['partículas', PARTICULAS], ['nada', DISPERSO]],
	quimica: [['átomos', ATOMOS], ['moléculas', MOLECULAS], ['organización', CADENA]],
	pregunta: [['', CADENA], ['perpetuarse', DIVISION]],
	virus: [['', VIRUS_FORMA]],
	proceso: [['', VIRUS_FORMA], ['proceso', TRIADA]],
	tierra: [['tierra', PLANETA], ['intervalo', OCEANO], ['sistemas', SUELTAS]],
	transicion: [['', NIVELES]],
	celulas: [['', SUELTAS], ['organismos', COLONIA], ['muchas', COLONIAS]],
	organismo: [['', CUERPO_VIVO]],
	conciencia: [['conciencia', CEREBRO_VIVO], ['organismo', OJO_FORMA]],
	contradiccion: [['', {...CEREBRO_VIVO, opacidad: 0.3}]],
	materia: [['', DISPERSO], ['organizarse', SILUETA_VIVA], ['capaz', PREGUNTA_FORMA]],
	maquinas: [['', NIVELES], ['máquinas', CHIP]],
	futuro: [['', RED], ['proyectando', SILUETA_FRIA]],
	consecuencia: [['', SILUETA_FRIA], ['universo', GALAXIA], ['consecuencias', SILUETA_VIVA]],
	cierre: [['', SILUETA_VIVA], ['hasta', GALAXIA]],
};

// Campo continuo durante todo el video: los mismos puntos se reorganizan de una forma a la otra.
export const CampoVida: React.FC<{video: VideoNarrado}> = ({video}) => {
	const frame = useCurrentFrame();
	const pasos: {desde: number; forma: Forma}[] = [];
	let inicio = 0;
	for (const escena of video.escenas) {
		for (const [palabra, forma] of PLAN[escena.id] ?? []) {
			const desde = inicio + (palabra ? cue(escena, palabra, FPS) : 0);
			pasos.push({desde: pasos.length ? Math.max(desde, pasos[pasos.length - 1].desde + 20) : desde, forma});
		}
		inicio += cuadrosDe(escena);
	}
	let actual = 0;
	for (let n = 0; n < pasos.length; n++) {
		if (frame >= pasos[n].desde) {
			actual = n;
		}
	}
	const paso = pasos[actual];
	const previo = pasos[Math.max(0, actual - 1)];
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, #171a36, ${FONDO} 75%)`}}>
			<svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				{Array.from({length: PUNTOS}, (_, i) => {
					const t = actual === 0 ? 1 : rampa(frame, paso.desde + azar(i + 200) * 16, 34);
					const a = previo.forma.pos(i, frame);
					const b = paso.forma.pos(i, frame);
					const radio = entre(previo.forma.radio ?? 7, paso.forma.radio ?? 7, t);
					const opacidad = entre(previo.forma.opacidad ?? 0.95, paso.forma.opacidad ?? 0.95, t);
					return <circle key={i} cx={entre(a.x, b.x, t)} cy={entre(a.y, b.y, t)} r={radio} fill={t < 0.5 ? previo.forma.color(i, frame) : paso.forma.color(i, frame)} opacity={opacidad} />;
				})}
			</svg>
		</AbsoluteFill>
	);
};

// --- Lo que va encima del campo ---

const Titular: React.FC<{texto: string; detalle?: string; desde?: number; hasta?: number}> = ({texto, detalle, desde = 0, hasta}) => {
	const frame = useCurrentFrame();
	const entra = rampa(frame, desde, 12);
	const sale = hasta === undefined ? 0 : rampa(frame, hasta - 6, 8);
	return (
		<div style={{position: 'absolute', top: 150, left: 50, right: 50, textAlign: 'center', opacity: entra * (1 - sale), transform: `translateY(${(1 - entra) * -20}px)`}}>
			<div style={{fontFamily: FUERTE, fontSize: 70, lineHeight: 1.06, color: BLANCO, textShadow: '0 4px 20px #000'}}>{texto}</div>
			{detalle ? <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: AMBAR, marginTop: 12, textShadow: '0 0 4px #000, 0 2px 12px #000'}}>{detalle}</div> : null}
		</div>
	);
};

const Sello: React.FC<{texto: string; desde: number; y?: number; color?: string; tamano?: number}> = ({texto, desde, y = 1300, color = AMBAR, tamano = 46}) => {
	const salto = useSalto(desde);
	return (
		<div style={{position: 'absolute', top: y, left: 40, right: 40, display: 'flex', justifyContent: 'center'}}>
			<div style={{padding: '14px 30px', borderRadius: 8, background: color, color: FONDO, fontFamily: FUERTE, fontSize: tamano, lineHeight: 1.1, textAlign: 'center', opacity: Math.min(salto, 1), transform: `scale(${salto})`}}>{texto}</div>
		</div>
	);
};

const Etiqueta: React.FC<{texto: string; desde: number; x?: number; y: number; color?: string; tachada?: number}> = ({texto, desde, x, y, color = CIAN, tachada}) => {
	const frame = useCurrentFrame();
	const entra = useSalto(desde);
	const tacha = tachada === undefined ? 0 : rampa(frame, tachada, 10);
	return (
		<div style={{position: 'absolute', top: y + Math.sin(frame / 22 + y) * 4, left: x ?? 40, right: x === undefined ? 40 : undefined, display: 'flex', justifyContent: 'center', opacity: Math.min(entra, 1), transform: `scale(${entra})`}}>
			<div style={{position: 'relative', padding: '14px 28px', borderRadius: 12, background: 'rgba(20,22,43,0.94)', border: `4px solid ${color}`, fontFamily: SANS, fontWeight: 700, fontSize: 42, color: BLANCO}}>
				{texto}
				<div style={{position: 'absolute', left: 18, right: 18, top: '50%', height: 8, borderRadius: 4, background: ROJO, transform: `scaleX(${tacha})`, transformOrigin: 'left'}} />
			</div>
		</div>
	);
};

const Frase: React.FC<{texto: string; desde: number; top?: number; color?: string; tamano?: number; hasta?: number}> = ({texto, desde, top = 170, color = BLANCO, tamano = 66, hasta}) => {
	const frame = useCurrentFrame();
	const sale = hasta === undefined ? 0 : rampa(frame, hasta - 6, 10);
	return <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, fontSize: tamano, lineHeight: 1.18, color, opacity: rampa(frame, desde, 14) * (1 - sale), textShadow: '0 3px 18px #000'}}>{texto}</div>;
};

const Gancho: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const aun = cue(escena, 'aún', fps);
	const entonces = cue(escena, 'entonces', fps);
	return (
		<AbsoluteFill>
			<Titular texto="Ninguno de tus átomos está vivo" hasta={aun} />
			<Titular texto="Y aun así, tú sí" desde={aun} hasta={entonces} />
			<Titular texto="¿Cuándo comenzó la vida?" desde={entonces} />
		</AbsoluteFill>
	);
};

const Instante: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const lugar = cue(escena, 'pero', fps);
	return (
		<AbsoluteFill>
			<Titular texto="Solemos imaginar un instante" hasta={lugar} />
			<Titular texto="¿El lugar equivocado?" desde={lugar} />
		</AbsoluteFill>
	);
};

const Aviso: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Etiqueta texto="Teoría demostrada" desde={0} y={560} color={ROJO} tachada={cue(escena, 'demostrada', fps)} />
			<Sello texto="Hipótesis filosófica" desde={cue(escena, 'hipótesis', fps)} y={720} tamano={60} />
			<Etiqueta texto="Construida con lo que la ciencia sí sabe" desde={cue(escena, 'ciencia', fps) - 8} y={880} color={VERDE} />
		</AbsoluteFill>
	);
};

const ESCALAS: [string, string][] = [['células', 'Células'], ['moléculas', 'Moléculas'], ['átomos', 'Átomos'], ['partículas', 'Partículas']];

const Escalas: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const actual = ESCALAS.reduce((n, [p], i) => (frame >= cue(escena, p, fps) ? i : n), 0);
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', top: 170, left: 30, right: 30, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap'}}>
				{ESCALAS.map(([, rotulo], i) => (
					<div key={rotulo} style={{padding: '10px 18px', borderRadius: 30, fontFamily: SANS, fontWeight: 700, fontSize: 36, background: i === actual ? CIAN : PANEL, color: i === actual ? FONDO : TENUE}}>{rotulo}</div>
				))}
			</div>
			<Sello texto="Nada de esto estaba vivo" desde={cue(escena, 'nada', fps)} y={1300} tamano={46} />
		</AbsoluteFill>
	);
};

const Quimica: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const organizacion = cue(escena, 'organización', fps);
	return (
		<AbsoluteFill>
			<Titular texto="Sin intención" hasta={organizacion} />
			<Titular texto="Y aun así, se organiza" desde={organizacion} />
			<Etiqueta texto="No deciden" desde={cue(escena, 'deciden', fps) - 4} y={1120} color={ROJO} />
			<Etiqueta texto="No tienen intenciones" desde={cue(escena, 'intenciones', fps) - 8} y={1215} color={ROJO} />
			<Etiqueta texto="No persiguen objetivos" desde={cue(escena, 'objetivos', fps) - 8} y={1310} color={ROJO} />
		</AbsoluteFill>
	);
};

const Pregunta: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Titular texto="¿En qué momento?" />
			<Sello texto="Algo que se perpetúa a sí mismo" desde={cue(escena, 'producir', fps)} y={1300} color={VERDE} tamano={42} />
		</AbsoluteFill>
	);
};

const INSTRUCCIONES = 'AUGGCUACGUUAGCCUAAGGCUAUCGGAUCCAGUUACGGAU';

const VirusEscena: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const instrucciones = cue(escena, 'instrucciones', fps);
	const vivos = cue(escena, 'vivos', fps);
	const desplazar = Math.floor(frame / 3);
	return (
		<AbsoluteFill>
			<Titular texto="Los virus" detalle="Información genética que evoluciona" hasta={vivos} />
			<Titular texto="¿Están vivos?" detalle="Todavía se debate" desde={vivos} />
			<Etiqueta texto="Dependen de una célula" desde={cue(escena, 'dependen', fps)} y={1220} color={VIOLETA} />
			<div style={{position: 'absolute', top: 1320, left: 40, right: 40, textAlign: 'center', fontFamily: 'Consolas, monospace', fontWeight: 700, fontSize: 44, color: CIAN, opacity: rampa(frame, instrucciones - 4, 12), whiteSpace: 'nowrap', overflow: 'hidden'}}>
				{(INSTRUCCIONES + INSTRUCCIONES).slice(desplazar % INSTRUCCIONES.length, desplazar % INSTRUCCIONES.length + 34)}
			</div>
		</AbsoluteFill>
	);
};

const Proceso: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Titular texto="¿Un organismo o un proceso?" />
			<Etiqueta texto="Información" desde={cue(escena, 'información', fps) - 4} y={1140} color={CIAN} />
			<Etiqueta texto="Reproducción" desde={cue(escena, 'reproducción', fps) - 4} y={1230} color={VERDE} />
			<Etiqueta texto="Organización" desde={cue(escena, 'organización', fps) - 4} y={1320} color={AMBAR} />
		</AbsoluteFill>
	);
};

const Tierra: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const formo = cue(escena, 'formó', fps);
	const rastros = cue(escena, 'rastros', fps);
	const avance = interpolate(frame, [formo, rastros + 20], [0, 1000 / 4500], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const izq = 90;
	const ancho = 900;
	return (
		<AbsoluteFill>
			<Titular texto="La Tierra primitiva" detalle="Procesos que todavía investigamos" />
			<div style={{position: 'absolute', top: 1190, left: izq, width: ancho, height: 12, borderRadius: 6, background: PANEL, opacity: rampa(frame, formo - 6, 10)}}>
				<div style={{width: `${avance * 100}%`, height: '100%', borderRadius: 6, background: VERDE}} />
			</div>
			<div style={{position: 'absolute', top: 1215, left: izq, padding: '4px 12px', borderRadius: 6, background: 'rgba(5,6,15,0.85)', fontFamily: SANS, fontWeight: 700, fontSize: 34, color: AMBAR, opacity: rampa(frame, formo, 12)}}>Hace 4500 millones de años</div>
			<div style={{position: 'absolute', top: 1272, left: izq, padding: '4px 12px', borderRadius: 6, background: 'rgba(5,6,15,0.85)', fontFamily: SANS, fontWeight: 700, fontSize: 34, color: VERDE, opacity: rampa(frame, rastros, 12)}}>Hace 3500 millones: rastros probables</div>
			<div style={{position: 'absolute', top: 1215, right: izq, padding: '4px 12px', borderRadius: 6, background: 'rgba(5,6,15,0.85)', fontFamily: SANS, fontWeight: 700, fontSize: 34, color: TENUE, opacity: rampa(frame, formo, 12)}}>Hoy</div>
		</AbsoluteFill>
	);
};

const Transicion: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Titular texto="¿Ruptura o transición?" />
			<Sello texto="Las mismas leyes de siempre" desde={cue(escena, 'leyes', fps) - 16} y={1370} color={CIAN} tamano={42} />
		</AbsoluteFill>
	);
};

const Celulas: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const cooperar = cue(escena, 'cooperar', fps);
	return (
		<AbsoluteFill>
			<Titular texto="Células solas" hasta={cooperar} />
			<Titular texto="Células que cooperan" desde={cooperar} />
			<Sello texto="Muchas veces, de forma independiente" desde={cue(escena, 'muchas', fps)} y={1320} color={VERDE} tamano={38} />
		</AbsoluteFill>
	);
};

const Organismo: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Titular texto="Algo más grande que ellos" />
			<Etiqueta texto="Célula" desde={cue(escena, 'célula', fps)} x={40} y={1250} color={ROJO} />
			<Etiqueta texto="Tejido" desde={cue(escena, 'tejido', fps)} x={385} y={1250} color={AMBAR} />
			<Etiqueta texto="Órgano" desde={cue(escena, 'órgano', fps)} x={720} y={1250} color={VERDE} />
		</AbsoluteFill>
	);
};

const Conciencia: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const observar = cue(escena, 'organismo', fps);
	return (
		<AbsoluteFill>
			<Titular texto="La conciencia" detalle="Nadie sabe cuándo, ni cómo" hasta={observar} />
			<Titular texto="Observa su propia existencia" desde={observar} />
		</AbsoluteFill>
	);
};

const Contradiccion: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Titular texto="Algo contradictorio" detalle="Podemos cuestionar lo que nos formó" />
			<Etiqueta texto="Supervivencia y reproducción" desde={cue(escena, 'supervivencia', fps)} y={430} color={TENUE} tachada={cue(escena, 'cuestionarlas', fps)} />
			<Etiqueta texto="Decidir no tener hijos" desde={cue(escena, 'hijos', fps) - 8} y={640} color={AMBAR} />
			<Etiqueta texto="Una idea antes que la comodidad" desde={cue(escena, 'idea', fps) - 4} y={800} color={CIAN} />
			<Etiqueta texto="Respuestas sin ninguna ventaja" desde={cue(escena, 'respuestas', fps) - 4} y={960} color={VIOLETA} />
		</AbsoluteFill>
	);
};

const Materia: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const preguntarse = cue(escena, 'capaz', fps);
	return (
		<AbsoluteFill>
			<Frase texto="Miles de millones de años organizándose…" desde={0} hasta={preguntarse} />
			<Frase texto="…para preguntarse por qué existe." desde={preguntarse} color={AMBAR} />
		</AbsoluteFill>
	);
};

const Maquinas: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const maquinas = cue(escena, 'máquinas', fps);
	return (
		<AbsoluteFill>
			<Titular texto="Materia → vida → conciencia" detalle="¿Y después?" hasta={maquinas} />
			<Titular texto="Máquinas que aprenden" desde={maquinas} />
		</AbsoluteFill>
	);
};

const Futuro: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const absurda = cue(escena, 'pregunta', fps);
	const proyectando = cue(escena, 'proyectando', fps);
	return (
		<AbsoluteFill>
			<Titular texto="Lejos de demostrarse" hasta={absurda} />
			<Titular texto="¿Una nueva forma de existencia?" desde={absurda} hasta={proyectando} />
			<Titular texto="O solo proyectamos nuestras ideas" desde={proyectando} />
		</AbsoluteFill>
	);
};

const Consecuencia: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const universo = cue(escena, 'universo', fps);
	const punto = cue(escena, 'punto', fps);
	return (
		<AbsoluteFill>
			<Titular texto="¿Una excepción?" hasta={universo} />
			<Titular texto="¿O una forma de organizarse?" desde={universo} hasta={punto} />
			<Titular texto="No el punto final" desde={punto} />
			<Sello texto="Una de sus consecuencias" desde={cue(escena, 'consecuencias', fps) - 8} y={1370} tamano={44} />
		</AbsoluteFill>
	);
};

const CierreVida: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const hasta = cue(escena, 'hasta', fps);
	return (
		<AbsoluteFill>
			<Frase texto="Quizás la pregunta nunca fue cuándo comenzó." desde={0} hasta={hasta} />
			<Frase texto="Hasta dónde puede llegar la materia antes de que volvamos a llamarla vida." desde={hasta} color={AMBAR} tamano={60} />
		</AbsoluteFill>
	);
};

const VISUALES: Record<string, React.FC<{escena: Escena}>> = {
	gancho: Gancho,
	instante: Instante,
	aviso: Aviso,
	escalas: Escalas,
	quimica: Quimica,
	pregunta: Pregunta,
	virus: VirusEscena,
	proceso: Proceso,
	tierra: Tierra,
	transicion: Transicion,
	celulas: Celulas,
	organismo: Organismo,
	conciencia: Conciencia,
	contradiccion: Contradiccion,
	materia: Materia,
	maquinas: Maquinas,
	futuro: Futuro,
	consecuencia: Consecuencia,
	cierre: CierreVida,
};

// Indica la parte durante los primeros segundos del video.
export const RotuloParte: React.FC<{numero: number}> = ({numero}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', fontFamily: FUERTE, fontSize: 40, letterSpacing: 6, color: AMBAR, opacity: rampa(frame, 0, 10) * (1 - rampa(frame, 100, 16))}}>
			PARTE {numero}
		</div>
	);
};

export const EscenaVida: React.FC<PropsVisual> = ({escena}) => {
	const Visual = VISUALES[escena.id];
	return <Visual escena={escena} />;
};
