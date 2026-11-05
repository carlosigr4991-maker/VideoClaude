import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Escena, PropsVisual} from '../Armazon';

const FUERTE = '"Arial Black", Arial, sans-serif';
const SANS = 'Arial, sans-serif';
const SERIF = 'Georgia, serif';
const FONDO = '#0a1420';
const PANEL = '#14283a';
const VIEJA = '#6d4524';
const NUEVA = '#e0ad62';
const VELA = '#ead9b8';
const MAR = '#123f5c';
const ORO = '#f2c14e';
const CELULA = '#ff8f6b';
const ROJO = '#e4525f';
const VERDE = '#5fd9a0';
const CIAN = '#63d2e8';
const BLANCO = '#f6f3ec';
const TENUE = '#9db0bf';

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
	const valores = [0, 1, 2].map((i) => Math.round(entre(canal(a, i), canal(b, i), t)));
	return `rgb(${valores.join(',')})`;
};

const useSalto = (desde: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - desde, fps, config: {damping: 14, stiffness: 130}});
};

const Lienzo: React.FC<{children: React.ReactNode}> = ({children}) => (
	<svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
		{children}
	</svg>
);

// Con `hasta`, el rótulo se desvanece para dejar lugar al siguiente.
const Titular: React.FC<{texto: string; detalle?: string; desde?: number; hasta?: number}> = ({texto, detalle, desde = 0, hasta}) => {
	const frame = useCurrentFrame();
	const entra = rampa(frame, desde, 12);
	const sale = hasta === undefined ? 0 : rampa(frame, hasta - 6, 8);
	return (
		<div style={{position: 'absolute', top: 150, left: 50, right: 50, textAlign: 'center', opacity: entra * (1 - sale), transform: `translateY(${(1 - entra) * -20}px)`}}>
			<div style={{fontFamily: FUERTE, fontSize: 74, lineHeight: 1.06, color: BLANCO, textShadow: '0 4px 20px #000'}}>{texto}</div>
			{detalle ? <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: ORO, marginTop: 12, textShadow: '0 0 4px #000, 0 2px 12px #000'}}>{detalle}</div> : null}
		</div>
	);
};

const Sello: React.FC<{texto: string; desde: number; y: number; color?: string; tamano?: number}> = ({texto, desde, y, color = ORO, tamano = 48}) => {
	const salto = useSalto(desde);
	return (
		<div style={{position: 'absolute', top: y, left: 40, right: 40, display: 'flex', justifyContent: 'center'}}>
			<div style={{padding: '14px 30px', borderRadius: 8, background: color, color: FONDO, fontFamily: FUERTE, fontSize: tamano, lineHeight: 1.1, textAlign: 'center', opacity: Math.min(salto, 1), transform: `scale(${salto})`}}>{texto}</div>
		</div>
	);
};

const Pie: React.FC<{fuente?: string; foto?: string}> = ({fuente, foto}) => (
	<div style={{position: 'absolute', bottom: 190, left: 50, right: 50, textAlign: 'center', fontFamily: SANS, fontSize: 25, lineHeight: 1.3, color: '#d5dde6', textShadow: '0 1px 6px #000'}}>
		{fuente && fuente !== 'Tesis del usuario' ? <div>Fuente: {fuente}</div> : null}
		<div>{foto ?? 'Ilustración simplificada'}</div>
	</div>
);

// El barco, centrado en (0, 0): 7 hileras de tablas que se estrechan hacia la quilla.
const FILAS = 7;
const ALTO_TABLA = 38;
const ANCHO_TABLA = 108;
const anchoCasco = (fila: number) => 410 - fila * 36;
const TABLAS = Array.from({length: FILAS}, (_, fila) => {
	const media = anchoCasco(fila);
	const columnas = Math.round((media * 2) / ANCHO_TABLA);
	const ancho = (media * 2) / columnas;
	return Array.from({length: columnas}, (_, columna) => ({x: -media + columna * ancho, y: fila * ALTO_TABLA, ancho}));
}).flat();
const ORDEN = TABLAS.map((_, i) => azar(i * 7 + 3));

const Barco: React.FC<{x: number; y: number; escala?: number; progreso: (i: number) => number; aparicion?: (i: number) => number; velas?: number}> = ({x, y, escala = 1, progreso, aparicion, velas = 1}) => {
	const frame = useCurrentFrame();
	const viento = Math.sin(frame / 20) * 16;
	return (
		<g transform={`translate(${x} ${y + Math.sin(frame / 24) * 8}) rotate(${Math.sin(frame / 34) * 1.5}) scale(${escala})`}>
			<g opacity={velas}>
				<rect x={-9} y={-430} width={18} height={440} fill={VIEJA} />
				<path d={`M 12 -410 Q ${200 + viento} -280 12 -60 Z`} fill={VELA} />
				<path d={`M -12 -380 Q ${-150 + viento * 0.6} -260 -12 -90 Z`} fill={VELA} opacity={0.85} />
				<path d="M 0 -432 L 56 -412 L 0 -392 Z" fill={ROJO} />
				<path d={`M -410 0 Q -480 -40 -500 -110`} fill="none" stroke={VIEJA} strokeWidth={22} strokeLinecap="round" />
				<path d={`M 410 0 Q 480 -50 490 -130`} fill="none" stroke={VIEJA} strokeWidth={22} strokeLinecap="round" />
			</g>
			{TABLAS.map((t, i) => {
				const p = progreso(i);
				const a = aparicion ? aparicion(i) : 1;
				const cae = p > 0 && p < 1 ? p * 70 : 0;
				return (
					<g key={i} opacity={a}>
						<rect x={t.x + 1.5} y={t.y + (p < 0.5 ? cae : (1 - p) * -60) + (1 - a) * -220} width={t.ancho - 3} height={ALTO_TABLA - 3} rx={3} fill={mezclarColor(VIEJA, NUEVA, p < 0.5 ? 0 : 1)} opacity={p > 0 && p < 1 ? Math.abs(p - 0.5) * 2 : 1} />
					</g>
				);
			})}
		</g>
	);
};

const Mar: React.FC<{y: number}> = ({y}) => {
	const frame = useCurrentFrame();
	const ola = (base: number, f: number) => `M 0 ${base} ${Array.from({length: 13}, (_, i) => `L ${i * 90} ${base + Math.sin(i * 0.9 + frame / 18 + f) * 16}`).join(' ')} L 1080 1440 L 0 1440 Z`;
	return (
		<g>
			<path d={ola(y, 0)} fill={MAR} />
			<path d={ola(y + 34, 2)} fill="#0d2f47" />
		</g>
	);
};

// Figuras hechas de los mismos puntos, para que una se transforme en la otra.
const PUNTOS = 460;
const sembrar = (dentro: (x: number, y: number) => boolean, semilla: number) => {
	const lista: {x: number; y: number}[] = [];
	for (let i = 0; lista.length < PUNTOS; i++) {
		const x = 80 + azar(semilla + i * 2) * 920;
		const y = 320 + azar(semilla + i * 2 + 1) * 1080;
		if (dentro(x, y)) {
			lista.push({x, y});
		}
	}
	return lista;
};
const CABEZA = sembrar((x, y) => {
	const craneo = ((x - 540) / 225) ** 2 + ((y - 680) / 285) ** 2 < 1;
	const cuello = Math.abs(x - 540) < 95 && y > 900 && y < 1060;
	const hombros = ((x - 540) / 370) ** 2 + ((y - 1290) / 260) ** 2 < 1 && y < 1390;
	return craneo || cuello || hombros;
}, 1000);
const SILUETA_BARCO = sembrar((x, y) => {
	const casco = y > 930 && y < 1200 && Math.abs(x - 540) < 410 - (y - 930) * 0.95;
	const vela = x > 552 && y > 500 && y < 900 && x - 552 < 190 * Math.sin(((y - 500) / 400) * Math.PI);
	const mastil = Math.abs(x - 540) < 10 && y > 480 && y < 930;
	return casco || vela || mastil;
}, 5000);

const Figura: React.FC<{forma: number; opacidad?: number}> = ({forma, opacidad = 1}) => {
	const frame = useCurrentFrame();
	return (
		<g opacity={opacidad}>
			{CABEZA.map((c, i) => {
				const b = SILUETA_BARCO[i];
				const t = rampa(forma * 60, azar(i + 40) * 20, 40);
				const ciclo = 50 + azar(i + 90) * 80;
				const fase = ((frame + azar(i + 70) * ciclo) % ciclo) / ciclo;
				const destello = fase < 0.16 ? 1 - fase / 0.16 : 0;
				return <circle key={i} cx={entre(b.x, c.x, t) + Math.sin(frame / 22 + i) * 3} cy={entre(b.y, c.y, t) + Math.cos(frame / 26 + i) * 3} r={entre(10, 15, destello)} fill={mezclarColor(entre(0, 1, t) > 0.5 ? CELULA : NUEVA, BLANCO, destello)} opacity={0.92} />;
			})}
		</g>
	);
};

const Gancho: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const tiempo = cue(escena, 'tiempo', fps);
	const celulas = cue(escena, 'células', fps);
	const pregunta = cue(escena, 'pregunta', fps);
	const avance = interpolate(frame, [tiempo, celulas + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
	const cuenta = Math.round(avance * 1150000000).toLocaleString('es-ES').replace(/\./g, ' ');
	const contador = rampa(frame, tiempo - 6, 10) * (1 - rampa(frame, pregunta - 4, 10));
	return (
		<AbsoluteFill>
			<Lienzo>
				<Figura forma={1 - rampa(frame, pregunta - 4, 30)} />
			</Lienzo>
			<Titular texto="¿Eres la misma persona?" detalle="que hace cinco minutos" hasta={pregunta} />
			<div style={{position: 'absolute', top: 1190, left: 20, right: 20, textAlign: 'center', opacity: contador}}>
				<div style={{display: 'inline-block', padding: '12px 26px', borderRadius: 12, background: 'rgba(10,20,32,0.88)'}}>
					<div style={{fontFamily: FUERTE, fontSize: 78, lineHeight: 1, color: ORO}}>{cuenta}</div>
					<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 36, color: BLANCO, marginTop: 6}}>células reemplazadas (estimación)</div>
				</div>
			</div>
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const BarcoEscena: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pudria = cue(escena, 'tabla', fps);
	const ninguna = cue(escena, 'ninguna', fps);
	const sigue = cue(escena, 'sigue', fps);
	const total = Math.max(ninguna + 8 - pudria, 30);
	const progreso = (i: number) => {
		const inicio = pudria + ORDEN[i] * total;
		return interpolate(frame, [inicio, inicio + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	};
	const cuantas = TABLAS.filter((_, i) => progreso(i) >= 0.5).length;
	return (
		<AbsoluteFill>
			<Lienzo>
				<Barco x={540} y={880} progreso={progreso} />
				<Mar y={1130} />
			</Lienzo>
			<Titular texto="El barco de Teseo" detalle={cuantas > 0 ? `Tablas originales: ${TABLAS.length - cuantas} de ${TABLAS.length}` : 'Atenas lo conservó durante siglos'} />
			<Sello texto="¿Sigue siendo el mismo?" desde={sigue} y={1260} tamano={50} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Segundo: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const guarda = cue(escena, 'guarda', fps);
	const verdadero = cue(escena, 'verdadero', fps);
	const respuesta = cue(escena, 'respuesta', fps);
	const arma = cue(escena, 'arma', fps);
	const aparicion = (i: number) => rampa(frame, guarda + ORDEN[i] * Math.max(arma - guarda + 12, 24), 12);
	const dudar = frame >= verdadero;
	return (
		<AbsoluteFill>
			<Lienzo>
				<Barco x={540} y={550} escala={0.56} progreso={() => 1} />
				<Barco x={540} y={1030} escala={0.56} progreso={() => 0} aparicion={aparicion} velas={rampa(frame, arma, 16)} />
				<text x={540} y={750} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={38} fill={NUEVA} opacity={rampa(frame, 8, 12)}>Tablas nuevas, misma historia</text>
				<text x={540} y={1232} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={38} fill="#d59a62" opacity={rampa(frame, arma, 12)}>Tablas originales, barco rearmado</text>
				{dudar ? [[930, 470], [930, 950]].map(([x, y]) => <text key={y} x={x} y={y + Math.sin(frame / 7) * 6} textAnchor="middle" fontFamily={FUERTE} fontSize={120} fill={ORO} opacity={rampa(frame, verdadero, 8)}>?</text>) : null}
			</Lienzo>
			<Titular texto="Thomas Hobbes" detalle="Un segundo barco" />
			<Sello texto="Sin respuesta definitiva" desde={respuesta - 8} y={1275} tamano={50} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Cuerpo: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const tu = cue(escena, 'barco', fps);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Figura forma={rampa(frame, 0, Math.max(tu + 30, 40))} />
			</Lienzo>
			<Titular texto="Ese barco eres tú" />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Tejido: React.FC<{y: number; desde: number; titulo: string; dato: string; color: string; children: React.ReactNode}> = ({y, desde, titulo, dato, color, children}) => {
	const frame = useCurrentFrame();
	const entra = rampa(frame, desde - 6, 12);
	return (
		<g opacity={entra} transform={`translate(${(1 - entra) * -70} ${y})`}>
			<rect x={50} y={0} width={980} height={300} rx={18} fill={PANEL} />
			<rect x={50} y={0} width={14} height={300} rx={7} fill={color} />
			<text x={90} y={110} fontFamily={FUERTE} fontSize={38} fill={BLANCO}>{titulo}</text>
			<text x={90} y={170} fontFamily={SANS} fontWeight={700} fontSize={38} fill={color}>{dato}</text>
			<svg x={480} y={15} width={530} height={270} viewBox="0 0 530 270">{children}</svg>
		</g>
	);
};

const Renovacion: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Lienzo>
				<Tejido y={320} desde={cue(escena, 'células', fps)} titulo="Intestino" dato="Unos pocos días" color={CELULA}>
					{Array.from({length: 5}, (_, v) => (
						<g key={v} transform={`translate(${60 + v * 100} 250)`}>
							{Array.from({length: 7}, (_, c) => {
								const t = (((frame / 26 + c * 0.14 + v * 0.1) % 1) + 1) % 1;
								const alto = t * 190;
								return <circle key={c} cy={-alto} cx={Math.sin(t * 9 + v) * 9} r={15} fill={CELULA} opacity={t > 0.86 ? (1 - t) / 0.14 : 0.9} />;
							})}
						</g>
					))}
				</Tejido>
				<Tejido y={660} desde={cue(escena, 'glóbulos', fps)} titulo="Glóbulos rojos" dato="Unos cuatro meses" color={ROJO}>
					<path d="M 0 40 C 180 10 360 70 530 40 L 530 230 C 360 260 180 200 0 230 Z" fill="#3a1820" />
					{Array.from({length: 11}, (_, i) => {
						const x = ((frame * (1.8 + azar(i) * 1.1) + azar(i + 11) * 530) % 590) - 30;
						const y = 70 + azar(i + 23) * 130 + Math.sin(frame / 14 + i) * 8;
						return (
							<g key={i} transform={`translate(${x} ${y}) rotate(${frame * 1.5 + i * 40})`}>
								<ellipse rx={30} ry={21} fill={ROJO} />
								<ellipse rx={13} ry={8} fill="#a02b3a" />
							</g>
						);
					})}
				</Tejido>
				<Tejido y={1000} desde={cue(escena, 'huesos', fps)} titulo="Huesos" dato="Se rehacen sin parar" color={VELA}>
					{Array.from({length: 54}, (_, i) => {
						const col = i % 9;
						const fila = Math.floor(i / 9);
						const onda = Math.sin(col * 0.75 - frame / 16 + fila * 0.5);
						const vivo = onda > -0.25;
						return <rect key={i} x={18 + col * 56} y={14 + fila * 42} width={50} height={36} rx={7} fill={vivo ? VELA : '#3b4b5a'} opacity={interpolate(onda, [-0.6, -0.1], [0.25, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />;
					})}
				</Tejido>
			</Lienzo>
			<Titular texto="Tu cuerpo se renueva" />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Siete: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const falso = cue(escena, 'falso', fps);
	const muchas = cue(escena, 'muchas', fps);
	const sello = useSalto(falso);
	const mito = 1 - rampa(frame, muchas + 14, 12);
	const neurona = rampa(frame, muchas + 16, 14);
	const latido = 1 + Math.sin(frame / 10) * 0.035;
	const ramas = [[-200, -150], [-250, 40], [-130, 190], [170, -190], [250, -40], [190, 150]];
	const pulso = (frame % 40) / 40;
	return (
		<AbsoluteFill>
			<Lienzo>
				<g opacity={mito * rampa(frame, 0, 12)}>
					{Array.from({length: 7}, (_, i) => {
						const a = frame / 22 + (i / 7) * Math.PI * 2;
						return <circle key={i} cx={540 + Math.cos(a) * 400} cy={730 + Math.sin(a) * 400} r={30} fill={CELULA} />;
					})}
				</g>
			</Lienzo>
			<div style={{position: 'absolute', top: 520, left: 0, right: 0, textAlign: 'center', opacity: mito * rampa(frame, 0, 12), transform: `scale(${latido})`}}>
				<div style={{fontFamily: FUERTE, fontSize: 300, lineHeight: 1, color: BLANCO}}>7</div>
				<div style={{fontFamily: FUERTE, fontSize: 90, color: TENUE}}>años</div>
			</div>
			<div style={{position: 'absolute', top: 740, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: mito * Math.min(sello, 1), transform: `rotate(-9deg) scale(${sello})`}}>
				<div style={{padding: '8px 34px', border: `12px solid ${ROJO}`, borderRadius: 14, fontFamily: FUERTE, fontSize: 120, color: ROJO}}>FALSO</div>
			</div>
			<Lienzo>
				<g opacity={neurona} transform={`translate(540 780) scale(${entre(0.8, 1.25, neurona)})`}>
					{ramas.map(([x, y], i) => (
						<g key={i}>
							<path d={`M 0 0 Q ${x * 0.3} ${y * 0.9} ${x} ${y}`} fill="none" stroke={CIAN} strokeWidth={12} strokeLinecap="round" />
							<path d={`M ${x} ${y} l ${x * 0.28} ${-46} M ${x} ${y} l ${x * 0.3} ${46}`} stroke={CIAN} strokeWidth={7} strokeLinecap="round" />
							<circle cx={x * pulso} cy={y * pulso} r={13} fill={ORO} opacity={1 - pulso * 0.5} />
						</g>
					))}
					<circle r={64 + Math.sin(frame / 8) * 4} fill="#1f5f74" stroke={CIAN} strokeWidth={9} />
				</g>
			</Lienzo>
			<Titular texto="¿Cambias cada 7 años?" hasta={muchas + 16} />
			<Titular texto="Te acompañan" detalle="Neuronas de la corteza: casi tu edad" desde={muchas + 16} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Rio: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const piensa = cue(escena, 'río', fps);
	const quizas = cue(escena, 'quizás', fps);
	const curso = (y: number) => 540 + Math.sin(y / 170) * 120;
	const margen = (signo: number) => Array.from({length: 24}, (_, i) => {
		const y = 300 + i * 50;
		return `${i === 0 ? 'M' : 'L'} ${curso(y) + signo * 210} ${y}`;
	}).join(' ');
	const borde = `${margen(-1)} ${Array.from({length: 24}, (_, i) => {
		const y = 300 + (23 - i) * 50;
		return `L ${curso(y) + 210} ${y}`;
	}).join(' ')} Z`;
	return (
		<AbsoluteFill>
			<Lienzo>
				<g opacity={entre(0.35, 1, rampa(frame, piensa - 12, 18))}>
					<path d={borde} fill="#124a6b" />
					<path d={margen(-1)} fill="none" stroke={VERDE} strokeWidth={12} />
					<path d={margen(1)} fill="none" stroke={VERDE} strokeWidth={12} />
					{Array.from({length: 90}, (_, i) => {
						const y = 300 + ((azar(i) * 1150 + frame * (3.2 + azar(i + 30) * 2.6)) % 1150);
						const lado = (azar(i + 60) - 0.5) * 340;
						return <ellipse key={i} cx={curso(y) + lado} cy={y} rx={7} ry={20} fill={CIAN} opacity={0.75} />;
					})}
				</g>
			</Lienzo>
			<Titular texto="¿Qué permanece?" hasta={piensa} />
			<Titular texto="El mismo río" detalle="Con agua siempre distinta" desde={piensa} />
			<Sello texto="Quizás no la materia, sino el proceso" desde={quizas} y={1270} tamano={40} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const NODOS = Array.from({length: 15}, (_, i) => ({x: 130 + (i % 4) * 270 + azar(i) * 110, y: 400 + Math.floor(i / 4) * 240 + azar(i + 20) * 110}));
const ENLACES = NODOS.flatMap((a, i) => NODOS.map((b, j) => ({i, j, d: Math.hypot(a.x - b.x, a.y - b.y)})).filter((e) => e.j > i && e.d < 380));

const Mente: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const aprendes = cue(escena, 'aprendes', fps);
	const recuerdas = cue(escena, 'recuerdas', fps);
	const conexiones = cue(escena, 'conexiones', fps);
	return (
		<AbsoluteFill>
			<Lienzo>
				{ENLACES.map((e, n) => {
					const a = NODOS[e.i];
					const b = NODOS[e.j];
					const fase = azar(n + 3);
					const nuevo = n % 3 === 0;
					const nace = nuevo ? rampa(frame, (n % 2 ? aprendes : recuerdas) + fase * 40, 18) : 1;
					const muere = n % 5 === 1 ? 1 - rampa(frame, conexiones - 20 + fase * 30, 22) : 1;
					const brillo = nuevo && nace > 0 ? ORO : CIAN;
					const t = ((frame / 34 + fase) % 1);
					return (
						<g key={n} opacity={nace * muere}>
							<line x1={a.x} y1={a.y} x2={entre(a.x, b.x, nace)} y2={entre(a.y, b.y, nace)} stroke={brillo} strokeWidth={nuevo ? 8 : 5} opacity={0.7} />
							<circle cx={entre(a.x, b.x, t)} cy={entre(a.y, b.y, t)} r={8} fill={BLANCO} opacity={0.9} />
						</g>
					);
				})}
				{NODOS.map((n, i) => (
					<circle key={i} cx={n.x + Math.sin(frame / 24 + i) * 5} cy={n.y + Math.cos(frame / 28 + i) * 5} r={24 + Math.sin(frame / 12 + i) * 3} fill="#1f5f74" stroke={CIAN} strokeWidth={6} />
				))}
			</Lienzo>
			<Titular texto="Ni tu mente está quieta" />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

// Rostro dibujado: `edad` va de 0 (infancia) a 1 (vejez). No representa a nadie real.
const Cara: React.FC<{edad: number}> = ({edad}) => {
	const frame = useCurrentFrame();
	const pelo = mezclarColor('#4a2f1b', '#d8d8d8', interpolate(edad, [0.5, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	const parpadeo = frame % 110 < 5 ? 0.15 : 1;
	const ojoY = -8 + edad * -6;
	return (
		<g>
			<path d={`M -92 ${10} C -100 -120 100 -120 92 ${10} L 92 ${-8 - edad * 30} C 62 -50 -62 -50 -92 ${-8 - edad * 30} Z`} fill={pelo} />
			<ellipse rx={entre(72, 80, edad)} ry={entre(82, 102, edad)} cy={8} fill="#e6b694" />
			<path d={`M -80 ${-30 + edad * 8} C -60 -100 60 -100 80 ${-30 + edad * 8} C 50 -68 -40 -56 -80 ${-30 + edad * 8} Z`} fill={pelo} />
			{[-30, 30].map((x) => (
				<g key={x}>
					<ellipse cx={x} cy={ojoY} rx={11} ry={entre(11, 7, edad) * parpadeo} fill="#1b2a38" />
					<path d={`M ${x - 18} ${ojoY - 20} q 18 -8 36 0`} fill="none" stroke={pelo} strokeWidth={6} strokeLinecap="round" />
					{edad > 0.7 ? <path d={`M ${x + (x > 0 ? 14 : -14)} ${ojoY + 2} l ${x > 0 ? 12 : -12} 4`} stroke="#b0805f" strokeWidth={3} strokeLinecap="round" /> : null}
				</g>
			))}
			<path d="M 0 6 q -8 18 3 22" fill="none" stroke="#b0805f" strokeWidth={4} strokeLinecap="round" />
			<path d={`M -26 ${48 + edad * 4} Q 0 ${64 + edad * 2} 26 ${48 + edad * 4}`} fill="none" stroke="#8a3f3a" strokeWidth={5} strokeLinecap="round" />
			{edad > 0.55 ? <path d="M -44 28 q 6 16 16 22 M 44 28 q -6 16 -16 22" fill="none" stroke="#b0805f" strokeWidth={3} strokeLinecap="round" /> : null}
		</g>
	);
};

const Foto: React.FC<{x: number; y: number; edad: number; rotulo: string; escala?: number; giro?: number; opacidad?: number; apagada?: number}> = ({x, y, edad, rotulo, escala = 1, giro = 0, opacidad = 1, apagada = 0}) => (
	<g transform={`translate(${x} ${y}) rotate(${giro}) scale(${escala})`} opacity={opacidad}>
		<rect x={-150} y={-180} width={300} height={380} rx={8} fill="#f1eadc" />
		<rect x={-130} y={-160} width={260} height={270} fill="#37566b" />
		<g transform="translate(0 -24) scale(0.95)">
			<Cara edad={edad} />
		</g>
		<rect x={-130} y={-160} width={260} height={270} fill="#c49a5e" opacity={apagada * 0.32} />
		<text y={165} textAnchor="middle" fontFamily={SERIF} fontStyle="italic" fontSize={36} fill="#3a2c1d">{rotulo}</text>
	</g>
);

const Etiqueta: React.FC<{texto: string; desde: number; y: number}> = ({texto, desde, y}) => {
	const frame = useCurrentFrame();
	const entra = useSalto(desde);
	return (
		<div style={{position: 'absolute', top: y + Math.sin(frame / 20 + y) * 4, left: 60, right: 60, display: 'flex', justifyContent: 'center', opacity: Math.min(entra, 1), transform: `scale(${entra})`}}>
			<div style={{padding: '10px 26px', borderRadius: 40, background: PANEL, border: `4px solid ${ORO}`, fontFamily: SANS, fontWeight: 700, fontSize: 44, color: BLANCO}}>{texto}</div>
		</div>
	);
};

const FotoEscena: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const miedos = cue(escena, 'miedos', fps);
	const suenos = cue(escena, 'sueños', fps);
	const certezas = cue(escena, 'certezas', fps);
	const desconocida = cue(escena, 'desconocida', fps);
	const entra = rampa(frame, 0, 16);
	const hilo = rampa(frame, desconocida - 16, 20);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Foto x={290} y={entre(320, 560, entra)} edad={0.28} rotulo="Hace 10 años" giro={-5 + Math.sin(frame / 24) * 3} escala={0.95 + Math.sin(frame / 30) * 0.015} opacidad={entra} apagada={1} />
				<Foto x={790} y={entre(800, 560, rampa(frame, miedos - 10, 18))} edad={0.5} rotulo="Hoy" giro={4 - Math.sin(frame / 44) * 1.5} escala={0.95} opacidad={rampa(frame, miedos - 10, 14)} />
				<path d="M 400 600 C 500 500 590 680 680 600" fill="none" stroke={ORO} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - hilo} />
			</Lienzo>
			<Titular texto="Una foto tuya" />
			<Etiqueta texto="Otros miedos" desde={miedos} y={840} />
			<Etiqueta texto="Otros sueños" desde={suenos} y={950} />
			<Etiqueta texto="Otras certezas" desde={certezas} y={1060} />
			<Sello texto="No es una desconocida" desde={desconocida - 6} y={1190} tamano={52} />
			<Pie fuente={escena.fuente} foto="Rostros dibujados: no representan a una persona real" />
		</AbsoluteFill>
	);
};

const EDADES = [{edad: 0, rotulo: 'Infancia', x: 220, y: 500}, {edad: 0.3, rotulo: 'Juventud', x: 740, y: 690}, {edad: 0.6, rotulo: 'Adultez', x: 270, y: 980}, {edad: 1, rotulo: 'Vejez', x: 800, y: 1180}];

const Historia: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const historia = cue(escena, 'historia', fps);
	const crecer = cue(escena, 'crecer', fps);
	const hilo = rampa(frame, historia - 14, 40);
	return (
		<AbsoluteFill>
			<Lienzo>
				<path d="M 220 500 C 620 480 780 560 740 690 C 700 840 240 780 270 980 C 300 1120 680 1040 800 1180" fill="none" stroke={ORO} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - hilo} />
				{EDADES.map((e, i) => (
					<Foto key={e.rotulo} x={e.x} y={e.y + Math.sin(frame / 26 + i) * 6} edad={e.edad} rotulo={e.rotulo} escala={0.68} giro={i % 2 ? 4 : -4} opacidad={rampa(frame, i * 16, 14)} />
				))}
			</Lienzo>
			<Titular texto="Lo que las conecta" />
			<Sello texto="A veces es crecer" desde={crecer - 10} y={1300} tamano={46} />
			<Pie fuente={escena.fuente} foto="Rostros dibujados: no representan a una persona real" />
		</AbsoluteFill>
	);
};

const CierreTeseo: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const somos = cue(escena, 'somos', fps);
	const segunda = escena.palabras.filter((p) => p.t.toLowerCase().includes('somos'))[1];
	const inicioSegunda = segunda ? Math.round(segunda.ini * fps) : somos + 60;
	const avanza = frame * 0.5;
	return (
		<AbsoluteFill>
			<Lienzo>
				<Barco x={entre(540, 700, Math.min(avanza / 200, 1))} y={960} escala={entre(0.72, 0.56, Math.min(avanza / 200, 1))} progreso={() => 1} />
				<Mar y={1120} />
			</Lienzo>
			<div style={{position: 'absolute', top: 170, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, fontSize: 66, lineHeight: 1.18, color: BLANCO, textShadow: '0 3px 18px #000'}}>
				<div style={{opacity: rampa(frame, 0, 14) * (1 - rampa(frame, inicioSegunda - 6, 10) * 0.55)}}>No somos las piezas que nos componen.</div>
				<div style={{marginTop: 24, color: ORO, opacity: rampa(frame, inicioSegunda - 4, 14)}}>Somos la historia que esas piezas hicieron posible.</div>
			</div>
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const VISUALES: Record<string, React.FC<{escena: Escena}>> = {
	gancho: Gancho,
	barco: BarcoEscena,
	segundo: Segundo,
	cuerpo: Cuerpo,
	renovacion: Renovacion,
	siete: Siete,
	rio: Rio,
	mente: Mente,
	foto: FotoEscena,
	historia: Historia,
	cierre: CierreTeseo,
};

const MOTAS = Array.from({length: 24}, (_, i) => ({x: azar(i) * 1080, y: azar(i + 50) * 1920, r: 2 + azar(i + 90) * 7, v: 0.2 + azar(i + 130) * 0.5}));

// Fondo continuo de todo el video: no se reinicia entre escenas, así el corte no se nota.
export const AmbienteTeseo: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, #1b3144, ${FONDO} 74%)`}}>
			<Lienzo>
				{MOTAS.map((m, i) => (
					<circle key={i} cx={m.x + Math.sin(frame / 40 + i) * 30} cy={(((m.y - frame * m.v) % 1920) + 1920) % 1920} r={m.r} fill={ORO} opacity={0.1} />
				))}
			</Lienzo>
		</AbsoluteFill>
	);
};

export const EscenaTeseo: React.FC<PropsVisual> = ({escena}) => {
	const Visual = VISUALES[escena.id];
	return <Visual escena={escena} />;
};
