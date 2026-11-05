import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Escena, PropsVisual} from '../Armazon';

const FUERTE = '"Arial Black", Arial, sans-serif';
const SANS = 'Arial, sans-serif';
const FONDO = '#0b0a1a';
const PANEL = '#191733';
const PARED = '#6d6a94';
const CIAN = '#57e3ff';
const VIOLETA = '#a78bfa';
const AMBAR = '#ffb627';
const ROJO = '#ff5c7a';
const VERDE = '#4be3a0';
const BLANCO = '#f4f6fb';
const TENUE = '#9a97b8';

// Geometría del aparato, igual en todas las escenas para que el fundido no lo mueva.
const EMISOR = {x: 540, y: 400};
const Y_PARED = 660;
const RENDIJAS = [430, 650];
const ANCHO_RENDIJA = 46;
const PANTALLA = {x: 70, y: 1060, ancho: 940, alto: 240};
const VUELO = 30;

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

const useSalto = (desde: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - desde, fps, config: {damping: 14, stiffness: 130}});
};

// Intensidad en la pantalla: `mezcla` 0 son las dos franjas de las bolitas, 1 la interferencia.
const intensidad = (x: number, mezcla: number) => {
	const d = x - 540;
	const envolvente = Math.exp(-((d / 330) ** 2));
	const onda = Math.cos((Math.PI * d) / 118) ** 2 * envolvente;
	const clasica = Math.exp(-(((d - 190) / 85) ** 2)) + Math.exp(-(((d + 190) / 85) ** 2));
	return entre(clasica, onda, mezcla);
};

type Impacto = {x: number; y: number; rendija: number};

// Puntos repartidos según la intensidad, por rechazo con una secuencia fija.
const sembrar = (mezcla: number, semilla: number, total: number): Impacto[] => {
	const lista: Impacto[] = [];
	for (let i = 0; lista.length < total; i++) {
		const x = PANTALLA.x + azar(semilla + i * 3) * PANTALLA.ancho;
		if (azar(semilla + i * 3 + 1) < intensidad(x, mezcla)) {
			lista.push({x, y: PANTALLA.y + 8 + azar(semilla + i * 3 + 2) * (PANTALLA.alto - 16), rendija: mezcla === 0 ? (x > 540 ? 1 : 0) : lista.length % 2});
		}
	}
	return lista;
};

const BOLITAS = sembrar(0, 500, 340);
const ELECTRONES = sembrar(1, 9000, 520);

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
			<div style={{fontFamily: FUERTE, fontSize: 76, lineHeight: 1.06, color: BLANCO, textShadow: '0 4px 20px #000'}}>{texto}</div>
			{detalle ? <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: AMBAR, marginTop: 12, textShadow: '0 0 4px #000, 0 2px 12px #000'}}>{detalle}</div> : null}
		</div>
	);
};

const Sello: React.FC<{texto: string; desde: number; y: number; color?: string; tamano?: number}> = ({texto, desde, y, color = AMBAR, tamano = 46}) => {
	const salto = useSalto(desde);
	return (
		<div style={{position: 'absolute', top: y, left: 40, right: 40, display: 'flex', justifyContent: 'center'}}>
			<div style={{padding: '14px 30px', borderRadius: 8, background: color, color: FONDO, fontFamily: FUERTE, fontSize: tamano, lineHeight: 1.1, textAlign: 'center', opacity: Math.min(salto, 1), transform: `scale(${salto})`}}>{texto}</div>
		</div>
	);
};

const Pie: React.FC<{fuente?: string; foto?: string}> = ({fuente, foto}) => (
	<div style={{position: 'absolute', bottom: 190, left: 50, right: 50, textAlign: 'center', fontFamily: SANS, fontSize: 25, lineHeight: 1.3, color: '#d5d8e6', textShadow: '0 1px 6px #000'}}>
		{fuente && fuente !== 'Tesis del usuario' ? <div>Fuente: {fuente}</div> : null}
		<div>{foto ?? 'Ilustración simplificada'}</div>
	</div>
);

const Pared: React.FC = () => {
	const [izq, der] = RENDIJAS;
	const m = ANCHO_RENDIJA / 2;
	return (
		<g>
			<rect x={40} y={Y_PARED - 18} width={izq - m - 40} height={36} rx={4} fill={PARED} />
			<rect x={izq + m} y={Y_PARED - 18} width={der - izq - ANCHO_RENDIJA} height={36} fill={PARED} />
			<rect x={der + m} y={Y_PARED - 18} width={1040 - der - m} height={36} rx={4} fill={PARED} />
		</g>
	);
};

const Emisor: React.FC<{color: string}> = ({color}) => {
	const frame = useCurrentFrame();
	return (
		<g transform={`translate(${EMISOR.x} ${EMISOR.y})`}>
			<circle r={entre(30, 44, (Math.sin(frame / 5) + 1) / 2)} fill={color} opacity={0.16} />
			<rect x={-44} y={-62} width={88} height={62} rx={10} fill={PANEL} stroke={color} strokeWidth={6} />
			<rect x={-20} y={-6} width={40} height={18} rx={4} fill={color} />
		</g>
	);
};

// Pantalla vacía; lo que cae sobre ella se dibuja aparte.
const Pantalla: React.FC = () => (
	<rect x={PANTALLA.x} y={PANTALLA.y} width={PANTALLA.ancho} height={PANTALLA.alto} rx={10} fill="#070616" stroke={PARED} strokeWidth={5} />
);

// Franjas continuas en la pantalla, para poder pasar de un patrón a otro sin saltos.
const Franjas: React.FC<{mezcla?: number; color?: string; opacidad?: number}> = ({mezcla = 1, color = CIAN, opacidad = 1}) => (
	<g opacity={opacidad}>
		{Array.from({length: 118}, (_, i) => {
			const x = PANTALLA.x + i * 8;
			return <rect key={i} x={x} y={PANTALLA.y + 5} width={8.5} height={PANTALLA.alto - 10} fill={color} opacity={Math.min(1, intensidad(x + 4, mezcla))} />;
		})}
	</g>
);

// Partículas que salen del emisor, cruzan una rendija y dejan su punto en la pantalla.
const Disparos: React.FC<{impactos: Impacto[]; ritmo: number; color: string; radio?: number; puntos?: boolean; precarga?: number; opacidadPuntos?: number}> = ({impactos, ritmo, color, radio = 11, puntos = true, precarga = 0, opacidadPuntos = 1}) => {
	const frame = useCurrentFrame();
	const salidos = precarga + frame * ritmo;
	const llegados = Math.min(impactos.length, Math.max(precarga, Math.floor(salidos - VUELO * ritmo)));
	const enVuelo = [];
	for (let n = Math.max(precarga, llegados); n < Math.min(salidos, llegados + 60); n++) {
		const destino = impactos[n % impactos.length];
		const t = (frame - (n - precarga) / ritmo) / VUELO;
		if (t < 0 || t > 1) {
			continue;
		}
		const xR = RENDIJAS[destino.rendija];
		const antes = t < 0.5;
		const x = antes ? entre(EMISOR.x, xR, t / 0.5) : entre(xR, destino.x, (t - 0.5) / 0.5);
		const y = antes ? entre(EMISOR.y, Y_PARED, t / 0.5) : entre(Y_PARED, destino.y, (t - 0.5) / 0.5);
		enVuelo.push(<circle key={n} cx={x} cy={y} r={radio} fill={color} />);
	}
	return (
		<g>
			{puntos ? <g opacity={opacidadPuntos}>{impactos.slice(0, llegados).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={6} fill={color} />)}</g> : null}
			{enVuelo}
		</g>
	);
};

const Bolitas: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Lienzo>
				<Emisor color={AMBAR} />
				<Pared />
				<Pantalla />
				<Disparos impactos={BOLITAS} ritmo={1.25} color={AMBAR} radio={13} />
			</Lienzo>
			<Titular texto="Dos rendijas" detalle="Lanzas bolitas" />
			<Sello texto="Dos franjas" desde={cue(escena, 'franjas', fps)} y={1320} tamano={52} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Electrones: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const anio = cue(escena, 'mil', fps);
	const muchas = cue(escena, 'muchas', fps);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Emisor color={CIAN} />
				<Pared />
				<Pantalla />
				<Disparos impactos={BOLITAS} ritmo={0.0001} precarga={BOLITAS.length} color={AMBAR} opacidadPuntos={1 - rampa(frame, 0, 24)} />
				<Disparos impactos={ELECTRONES} ritmo={1.45} color={CIAN} />
			</Lienzo>
			<Titular texto="Ahora, electrones" hasta={anio} />
			<Titular texto="1961" detalle="Claus Jönsson" desde={anio} />
			<Sello texto="Muchas franjas" desde={muchas - 8} y={1320} color={CIAN} tamano={52} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Ondas: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const suman = cue(escena, 'suman', fps);
	const cancelan = cue(escena, 'cancelan', fps);
	const mira = rampa(frame, suman - 6, 12);
	const oscura = rampa(frame, cancelan - 6, 12);
	const separacion = 62;
	return (
		<AbsoluteFill>
			<Lienzo>
				<clipPath id="bajo-pared">
					<rect x={0} y={Y_PARED} width={1080} height={PANTALLA.y - Y_PARED} />
				</clipPath>
				<g clipPath="url(#bajo-pared)">
					{RENDIJAS.map((x) =>
						Array.from({length: 11}, (_, i) => {
							const r = ((frame * 2.4 + i * separacion) % (11 * separacion));
							return <circle key={`${x}-${i}`} cx={x} cy={Y_PARED} r={r} fill="none" stroke={CIAN} strokeWidth={5} opacity={Math.max(0, 0.75 - r / 780)} />;
						}),
					)}
				</g>
				<Pared />
				<Pantalla />
				<Franjas opacidad={rampa(frame, 0, 18)} />
				<g opacity={mira}>
					<path d={`M 540 ${PANTALLA.y - 44} L 540 ${PANTALLA.y - 6}`} stroke={VERDE} strokeWidth={9} strokeLinecap="round" />
					<rect x={500} y={PANTALLA.y - 6} width={80} height={PANTALLA.alto + 12} rx={6} fill="none" stroke={VERDE} strokeWidth={6} />
				</g>
				<g opacity={oscura}>
					<path d={`M 599 ${PANTALLA.y - 44} L 599 ${PANTALLA.y - 6}`} stroke={ROJO} strokeWidth={9} strokeLinecap="round" />
					<rect x={574} y={PANTALLA.y - 6} width={50} height={PANTALLA.alto + 12} rx={6} fill="none" stroke={ROJO} strokeWidth={6} />
				</g>
			</Lienzo>
			<Titular texto="Dos ondas que se cruzan" />
			<Sello texto="Se suman: brillo" desde={suman} y={1320} color={VERDE} tamano={40} />
			<Sello texto="Se cancelan: oscuridad" desde={cancelan} y={1390} color={ROJO} tamano={40} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const PANELES = [
	{archivo: 'tono_a', electrones: 11},
	{archivo: 'tono_b', electrones: 200},
	{archivo: 'tono_c', electrones: 6000},
	{archivo: 'tono_d', electrones: 40000},
	{archivo: 'tono_e', electrones: 140000},
];

const Uno: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pero = cue(escena, 'hitachi', fps);
	const unoPorUno = cue(escena, 'uno', fps);
	const cada = cue(escena, 'cada', fps);
	const punto = cue(escena, 'punto', fps);
	const aparecieron = cue(escena, 'aparecieron', fps);
	const franjas = cue(escena, 'franjas', fps);
	const inicios = [cada, cue(escena, 'solo', fps), punto, entre(punto, franjas, 0.5), franjas - 4];
	const choque = 1 - rampa(frame, pero - 8, 12);
	const indice = inicios.reduce((n, inicio, i) => (frame >= inicio ? i : n), 0);
	const siguiente = inicios[indice + 1] ?? aparecieron;
	const avance = Math.min(1, Math.max(0, (frame - inicios[indice]) / Math.max(1, siguiente - inicios[indice])));
	const desdeN = indice === 0 ? 1 : PANELES[indice - 1].electrones;
	const cuenta = frame < cada ? 0 : Math.round(entre(desdeN, PANELES[indice].electrones, avance));
	// Antes de la imagen real, los electrones caen de a uno sobre la pantalla negra.
	const periodo = 24;
	const turno = Math.floor(Math.max(0, frame - pero) / periodo);
	const caida = (Math.max(0, frame - pero) % periodo) / 14;
	const xElectron = 180 + azar(turno + 300) * 720;
	const yImpacto = 440 + azar(turno + 700) * 300;
	return (
		<AbsoluteFill>
			<Lienzo>
				<g opacity={choque}>
					{[0, 1, 2, 3, 4, 5].map((i) => {
						const a = (i / 6) * Math.PI * 2 + frame / 40;
						const d = 190 + Math.sin(frame / 7 + i * 2) * 150;
						return <circle key={i} cx={540 + Math.cos(a) * d} cy={800 + Math.sin(a) * d} r={26} fill={CIAN} />;
					})}
					<text x={540} y={830} textAnchor="middle" fontFamily={FUERTE} fontSize={120} fill={AMBAR}>?</text>
				</g>
			</Lienzo>
			<Titular texto="¿Chocan entre sí?" hasta={pero} />
			<Titular texto="1989" detalle="Hitachi" desde={pero} hasta={unoPorUno} />
			<Titular texto="Uno por uno" desde={unoPorUno} />
			<div style={{position: 'absolute', top: 400, left: 60, right: 60, height: 472, borderRadius: 10, overflow: 'hidden', background: '#000', opacity: rampa(frame, pero - 4, 12)}}>
				{PANELES.map((p, i) => (
					<Img key={p.archivo} src={staticFile(`fotos/rendija/${p.archivo}.jpg`)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: rampa(frame, inicios[i] - 4, 10)}} />
				))}
				<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '8px 18px', background: 'rgba(11,10,26,0.82)', fontFamily: SANS, fontWeight: 700, fontSize: 28, color: BLANCO, opacity: rampa(frame, cada, 10)}}>Imagen real del experimento de Tonomura</div>
			</div>
			<Lienzo>
				{frame >= pero && frame < cada ? (
					caida < 1 ? (
						<circle cx={xElectron} cy={entre(320, yImpacto, caida)} r={18} fill={CIAN} />
					) : (
						<circle cx={xElectron} cy={yImpacto} r={entre(6, 34, (caida - 1) * 1.4)} fill={BLANCO} opacity={Math.max(0, 1 - (caida - 1) * 1.4)} />
					)
				) : null}
			</Lienzo>
			<div style={{position: 'absolute', top: 920, left: 0, right: 0, textAlign: 'center', opacity: rampa(frame, cada, 10)}}>
				<div style={{fontFamily: FUERTE, fontSize: 124, lineHeight: 1, color: CIAN}}>{cuenta.toLocaleString('es-ES').replace(/\./g, ' ')}</div>
				<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 46, color: BLANCO, marginTop: 8}}>electrones</div>
			</div>
			<Sello texto="Las franjas aparecen" desde={aparecieron - 8} y={1200} color={CIAN} tamano={52} />
			<Pie fuente={escena.fuente} foto="Imagen: Dr. Tonomura / Belsazar, CC BY-SA 3.0" />
		</AbsoluteFill>
	);
};

const Detector: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const detector = cue(escena, 'detector', fps);
	const apagan = cue(escena, 'apagan', fps);
	const entra = rampa(frame, detector - 4, 14);
	const mezcla = 1 - rampa(frame, apagan - 14, 30);
	const parpadeo = frame >= detector && Math.floor(frame / 5) % 2 === 0;
	return (
		<AbsoluteFill>
			<Lienzo>
				<Emisor color={CIAN} />
				<Pared />
				<Pantalla />
				<Franjas mezcla={mezcla} />
				<Disparos impactos={ELECTRONES} ritmo={0.45} color={BLANCO} radio={10} puntos={false} />
				<g opacity={entra} transform={`translate(${entre(1200, 790, entra)} ${Y_PARED + 90})`}>
					<rect x={-70} y={-48} width={300} height={96} rx={14} fill={PANEL} stroke={ROJO} strokeWidth={7} />
					<circle cx={-34} r={16} fill={parpadeo ? ROJO : '#4e2233'} />
					<path d="M -70 0 L -110 0" stroke={ROJO} strokeWidth={8} strokeLinecap="round" />
					<text x={92} y={13} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={36} fill={BLANCO}>¿Por dónde?</text>
				</g>
			</Lienzo>
			<Titular texto="Lo más extraño" hasta={detector} />
			<Titular texto="Un detector" detalle="Revela el camino" desde={detector} />
			<Sello texto="Las franjas se apagan" desde={apagan - 8} y={1320} color={ROJO} tamano={52} />
			<Pie fuente={escena.fuente} foto="Ilustración simplificada. Buks et al. usaron un interferómetro en un chip" />
		</AbsoluteFill>
	);
};

const Tachado: React.FC<{x: number; y: number; desde: number; rotulo: string; children: React.ReactNode}> = ({x, y, desde, rotulo, children}) => {
	const frame = useCurrentFrame();
	const entra = rampa(frame, desde - 4, 12);
	const tacha = rampa(frame, desde + 10, 8);
	return (
		<g transform={`translate(${x} ${y + Math.sin(frame / 22 + x) * 5})`} opacity={entra}>
			<circle r={120} fill={PANEL} stroke={TENUE} strokeWidth={6} />
			{children}
			<path d="M -85 -85 L 85 85 M 85 -85 L -85 85" stroke={ROJO} strokeWidth={15} strokeLinecap="round" strokeDasharray={260} strokeDashoffset={260 * (1 - tacha)} />
			<text y={174} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={42} fill={BLANCO}>{rotulo}</text>
		</g>
	);
};

const Mente: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const mirada = cue(escena, 'mirada', fps);
	const mente = cue(escena, 'mente', fps);
	const interactua = cue(escena, 'interactúa', fps);
	const borrar = cue(escena, 'borrar', fps);
	const choque = rampa(frame, interactua - 16, 18);
	const rebote = rampa(frame, interactua + 2, 22);
	const deriva = Math.max(0, frame - interactua - 24) * 0.7;
	return (
		<AbsoluteFill>
			<Lienzo>
				<Tachado x={290} y={490} desde={mirada} rotulo="Tu mirada">
					<path d="M -70 0 Q 0 -60 70 0 Q 0 60 -70 0 Z" fill="none" stroke={BLANCO} strokeWidth={8} />
					<circle r={24} fill={CIAN} />
				</Tachado>
				<Tachado x={790} y={490} desde={mente} rotulo="Tu mente">
					<path d="M 0 -62 C -62 -62 -72 -8 -40 18 L -40 58 L 40 58 L 40 18 C 72 -8 62 -62 0 -62 Z" fill="none" stroke={BLANCO} strokeWidth={8} strokeLinejoin="round" />
					<path d="M -22 -18 L 0 4 L 22 -18 M 0 4 V 54" fill="none" stroke={AMBAR} strokeWidth={6} />
				</Tachado>
				<g opacity={rampa(frame, interactua - 26, 12)}>
					<rect x={70} y={830} width={940} height={270} rx={18} fill={PANEL} />
					<circle cx={entre(170, 540, choque) + rebote * 300 + deriva} cy={965 + rebote * 80 + Math.sin(frame / 9) * 6 * rebote} r={30} fill={CIAN} />
					<path d={`M ${entre(960, 590, choque) + rebote * 240 - deriva} ${965 - rebote * 90} q -22 ${-26 * Math.cos(frame / 4)} -44 0 t -44 0 t -44 0`} fill="none" stroke={AMBAR} strokeWidth={9} strokeLinecap="round" />
					<circle cx={540} cy={965} r={rampa(frame, interactua, 18) * 170} fill={BLANCO} opacity={Math.max(0, 0.65 - rampa(frame, interactua, 18))} />
					<text x={170} y={880} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={32} fill={CIAN} opacity={1 - rebote}>Electrón</text>
					<text x={890} y={880} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={32} fill={AMBAR} opacity={1 - rebote}>Detector</text>
				</g>
			</Lienzo>
			<Titular texto="No hace falta una mente" />
			<Sello texto="Una interacción física" desde={interactua} y={1150} color={AMBAR} tamano={48} />
			<Sello texto="Basta para borrar las franjas" desde={borrar - 6} y={1250} color={ROJO} tamano={38} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const curva = (y: number, amplitud: number, fase: number, largo = 940) =>
	Array.from({length: 95}, (_, i) => `${i === 0 ? 'M' : 'L'} ${70 + (i * largo) / 94} ${y + Math.sin(i * 0.27 + fase) * amplitud}`).join(' ');

const Caminos: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const exacto = cue(escena, 'exactamente', fps);
	const posibilidades = cue(escena, 'caminos', fps);
	const sumar = cue(escena, 'sumar', fps);
	const cancelar = cue(escena, 'cancelar', fps);
	const arriba = 1 - rampa(frame, posibilidades - 6, 14);
	const abajo = rampa(frame, posibilidades - 4, 14);
	const desfase = Math.PI * rampa(frame, sumar + 6, cancelar - sumar + 2);
	const avance = frame / 8;
	const altura = 56 * (Math.abs(Math.cos(desfase / 2)) * 2);
	const recorrido = (frame % 50) / 50;
	return (
		<AbsoluteFill>
			<Lienzo>
				<g opacity={arriba}>
					<Emisor color={CIAN} />
					<Pared />
					{RENDIJAS.map((x) => (
						<g key={x}>
							<path d={`M ${EMISOR.x} ${EMISOR.y} L ${x} ${Y_PARED} L ${x + (x - 540) * 0.9} 1060`} fill="none" stroke={CIAN} strokeWidth={7} strokeDasharray="16 14" />
							<circle cx={recorrido < 0.5 ? entre(EMISOR.x, x, recorrido * 2) : entre(x, x + (x - 540) * 0.9, (recorrido - 0.5) * 2)} cy={recorrido < 0.5 ? entre(EMISOR.y, Y_PARED, recorrido * 2) : entre(Y_PARED, 1060, (recorrido - 0.5) * 2)} r={22} fill={CIAN} />
						</g>
					))}
					<path d="M 370 730 L 710 1070 M 710 730 L 370 1070" stroke={ROJO} strokeWidth={20} strokeLinecap="round" strokeDasharray={490} strokeDashoffset={490 * (1 - rampa(frame, exacto, 10))} />
				</g>
				<g opacity={abajo}>
					<path d={curva(520, 56, avance)} fill="none" stroke={VIOLETA} strokeWidth={8} />
					<path d={curva(700, 56, avance + desfase)} fill="none" stroke={CIAN} strokeWidth={8} />
					<text x={540} y={830} textAnchor="middle" fontFamily={FUERTE} fontSize={70} fill={TENUE}>=</text>
					<path d={curva(1000, altura, avance + desfase / 2)} fill="none" stroke={desfase > 1.6 ? ROJO : VERDE} strokeWidth={11} />
				</g>
			</Lienzo>
			<Titular texto="¿Pasó por los dos lados?" hasta={posibilidades} />
			<Titular texto="Posibilidades" detalle={desfase > 1.6 ? 'Se cancelan' : 'Se suman'} desde={posibilidades} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const INTERPRETACIONES = [
	{texto: 'Copenhague', x: 90, y: 870},
	{texto: 'Muchos mundos', x: 520, y: 980},
	{texto: 'Onda piloto', x: 130, y: 1110},
];

const Debate: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const formulas = cue(escena, 'fórmulas', fps);
	const interpretacion = cue(escena, 'interpretación', fps);
	const predice = useSalto(formulas);
	return (
		<AbsoluteFill>
			<Lienzo>
				{[0, 1, 2, 3, 4].map((i) => {
					const a = frame / 34 + (i / 5) * Math.PI * 2;
					return <circle key={i} cx={540 + Math.cos(a) * 470} cy={520 + Math.sin(a) * 210} r={16} fill={VIOLETA} opacity={0.8} />;
				})}
			</Lienzo>
			<div style={{position: 'absolute', top: 400, left: 90, right: 90, padding: '50px 20px', borderRadius: 18, background: PANEL, textAlign: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 104, color: CIAN, opacity: rampa(frame, 0, 14), transform: `translateY(${Math.sin(frame / 26) * 8}px)`}}>
				|ψ|² → ?
			</div>
			<div style={{position: 'absolute', top: 690, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(predice, 1), transform: `scale(${predice})`}}>
				<div style={{padding: '10px 26px', borderRadius: 8, background: VERDE, color: FONDO, fontFamily: FUERTE, fontSize: 42}}>Predice el resultado</div>
			</div>
			{INTERPRETACIONES.map((c, i) => {
				const entra = rampa(frame, interpretacion - 30 + i * 12, 14);
				return (
					<div key={c.texto} style={{position: 'absolute', left: c.x, top: c.y + Math.sin(frame / 20 + i * 2) * 10, padding: '20px 32px', borderRadius: 12, background: '#262350', border: `4px solid ${VIOLETA}`, fontFamily: SANS, fontWeight: 700, fontSize: 46, color: BLANCO, opacity: entra, transform: `scale(${entre(0.8, 1, entra)})`}}>
						{c.texto}
					</div>
				);
			})}
			<Titular texto="¿Qué significa?" />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Tarjeta: React.FC<{texto: string; desde: number; y: number}> = ({texto, desde, y}) => {
	const frame = useCurrentFrame();
	const entra = rampa(frame, desde - 6, 12);
	const tacha = rampa(frame, desde + 14, 10);
	return (
		<div style={{position: 'absolute', top: y + Math.sin(frame / 24 + y) * 4, left: 60, right: 60, padding: '34px 30px', borderRadius: 12, background: PANEL, borderLeft: `14px solid ${ROJO}`, opacity: entra, transform: `translateX(${(1 - entra) * -60}px)`}}>
			<div style={{position: 'relative', display: 'inline-block', fontFamily: SANS, fontWeight: 700, fontSize: 50, lineHeight: 1.15, color: entre(0, 1, tacha) > 0.5 ? TENUE : BLANCO}}>
				{texto}
				<div style={{position: 'absolute', left: 0, top: '50%', height: 8, width: `${tacha * 100}%`, background: ROJO, borderRadius: 4}} />
			</div>
		</div>
	);
};

const Limites: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const intuicion = cue(escena, 'intuición', fps);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Pantalla />
				<Franjas opacidad={0.5} />
			</Lienzo>
			<Titular texto="Lo que no prueba" hasta={intuicion} />
			<Titular texto="Lo que sí prueba" desde={intuicion} />
			<Tarjeta texto="Vivimos en una simulación" desde={cue(escena, 'simulación', fps)} y={400} />
			<Tarjeta texto="El pensamiento crea la realidad" desde={cue(escena, 'pensamiento', fps)} y={600} />
			<Sello texto="Nuestra intuición no sirve para todo" desde={intuicion - 6} y={860} color={CIAN} tamano={54} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const CierreRendija: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const medir = cue(escena, 'medir', fps);
	const quizas = cue(escena, 'quizás', fps);
	const abre = rampa(frame, medir, 60);
	return (
		<AbsoluteFill>
			<Lienzo>
				<g opacity={entre(0.25, 0.85, rampa(frame, quizas, 40))}>
					{Array.from({length: 135}, (_, i) => {
						const x = i * 8;
						const d = x - 540;
						const brillo = Math.cos((Math.PI * d) / (118 + frame * 0.12)) ** 2 * Math.exp(-((d / (260 + abre * 340)) ** 2));
						return <rect key={i} x={x} y={330} width={8.5} height={1070} fill={CIAN} opacity={brillo} />;
					})}
				</g>
				<g opacity={1 - rampa(frame, medir - 8, 16)} transform={`translate(540 860) scale(${1.5 + frame * 0.002})`}>
					<path d="M -100 0 Q 0 -80 100 0 Q 0 80 -100 0 Z" fill={FONDO} stroke={BLANCO} strokeWidth={8} />
					<circle r={34} fill={CIAN} />
				</g>
			</Lienzo>
			<Titular texto="Observar era mirar" hasta={medir} />
			<Titular texto="Medir es interactuar" desde={medir} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const VISUALES: Record<string, React.FC<{escena: Escena}>> = {
	bolitas: Bolitas,
	electrones: Electrones,
	ondas: Ondas,
	uno: Uno,
	detector: Detector,
	mente: Mente,
	caminos: Caminos,
	debate: Debate,
	limites: Limites,
	cierre: CierreRendija,
};

const MOTAS = Array.from({length: 26}, (_, i) => ({x: azar(i) * 1080, y: azar(i + 50) * 1920, r: 2 + azar(i + 90) * 6, v: 0.2 + azar(i + 130) * 0.5}));

// Fondo continuo de todo el video: no se reinicia entre escenas, así el corte no se nota.
export const AmbienteRendija: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, #1c1a3a, ${FONDO} 72%)`}}>
			<Lienzo>
				{MOTAS.map((m, i) => (
					<circle key={i} cx={m.x + Math.sin(frame / 40 + i) * 30} cy={(((m.y - frame * m.v) % 1920) + 1920) % 1920} r={m.r} fill={VIOLETA} opacity={0.14} />
				))}
			</Lienzo>
		</AbsoluteFill>
	);
};

export const EscenaRendija: React.FC<PropsVisual> = ({escena}) => {
	const Visual = VISUALES[escena.id];
	return <Visual escena={escena} />;
};
