import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Escena, PropsVisual} from '../Armazon';

const FUERTE = '"Arial Black", Arial, sans-serif';
const SANS = 'Arial, sans-serif';
const FONDO = '#0a0d14';
const ACERO = '#b9d6e6';
const ACERO_OSCURO = '#4d6c82';
const BACTERIA = '#8fc93a';
const BACTERIA_OSCURA = '#2f4f16';
const AMBAR = '#ffb627';
const ROJO = '#ef476f';
const VERDE = '#3ddc97';
const CIAN = '#49d6f2';
const BLANCO = '#f4f7fa';
const TENUE = '#93a3b3';

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
	<div style={{position: 'absolute', bottom: 190, left: 50, right: 50, textAlign: 'center', fontFamily: SANS, fontSize: 25, lineHeight: 1.3, color: '#d5dde6', textShadow: '0 1px 6px #000'}}>
		{fuente ? <div>Fuente: {fuente}</div> : null}
		<div>{foto ?? 'Ilustración simplificada'}</div>
	</div>
);

const Foto: React.FC<{archivo: string; top: number; alto: number; left?: number; right?: number; posicion?: string; rotulo: string}> = ({archivo, top, alto, left = 60, right = 60, posicion = 'center', rotulo}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', top, left, right, height: alto, borderRadius: 10, overflow: 'hidden', background: '#000'}}>
			<Img src={staticFile(`fotos/fagos/${archivo}`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: posicion, transform: `scale(${1.03 + frame * 0.0012})`}} />
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 18px', background: 'rgba(10,13,20,0.82)', fontFamily: SANS, fontWeight: 700, fontSize: 30, color: BLANCO}}>{rotulo}</div>
		</div>
	);
};

// Bacteriófago de cola contráctil, con la base de la cola en (x, y). `flota` lo mantiene en movimiento.
const Fago: React.FC<{x: number; y: number; escala?: number; giro?: number; contraccion?: number; patas?: number; carga?: number; opacidad?: number; flota?: number}> = ({x, y, escala = 1, giro = 0, contraccion = 0, patas = 0, carga = 1, opacidad = 1, flota = 0}) => {
	const frame = useCurrentFrame();
	const vaiven = Math.sin(frame / 17 + x * 0.01);
	const largo = entre(210, 110, contraccion);
	const yCabeza = -largo - 40;
	const r = 120;
	const hexagono = Array.from({length: 6}, (_, i) => {
		const a = (Math.PI / 3) * i - Math.PI / 2;
		return `${Math.cos(a) * r},${yCabeza - r + Math.sin(a) * r}`;
	}).join(' ');
	const yC = yCabeza - r;
	return (
		<g transform={`translate(${x} ${y + vaiven * flota}) rotate(${giro + vaiven * flota * 0.25}) scale(${escala})`} opacity={opacidad}>
			{[-1, 1].flatMap((lado) =>
				[0, 1, 2].map((i) => {
					const abre = 92 + i * 44;
					const rodilla = entre(-46 + i * 8, -68 + i * 8, patas);
					const pie = entre(36 - i * 6, 8, patas);
					return (
						<path
							key={`${lado}-${i}`}
							d={`M 0 -6 L ${lado * abre} ${rodilla} L ${lado * (abre + 44)} ${pie}`}
							fill="none"
							stroke={i === 1 ? ACERO : ACERO_OSCURO}
							strokeWidth={9 - i}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					);
				}),
			)}
			<rect x={-40} y={-20} width={80} height={24} rx={8} fill={ACERO} />
			<rect x={entre(-20, -34, contraccion)} y={-largo} width={entre(40, 68, contraccion)} height={largo - 16} rx={8} fill={ACERO_OSCURO} stroke={ACERO} strokeWidth={4} />
			{Array.from({length: 9}, (_, i) => {
				const yAnillo = -24 - ((largo - 40) * i) / 8;
				const ancho = entre(20, 34, contraccion);
				return <line key={i} x1={-ancho} x2={ancho} y1={yAnillo} y2={yAnillo} stroke={ACERO} strokeWidth={5} opacity={0.75} />;
			})}
			<rect x={-26} y={-largo - 42} width={52} height={44} rx={6} fill={ACERO} />
			<polygon points={hexagono} fill="#1d3344" stroke={ACERO} strokeWidth={9} strokeLinejoin="round" />
			<path d={`M 0 ${yC - r} L 0 ${yC} M ${-r * 0.866} ${yC - r / 2} L 0 ${yC} L ${r * 0.866} ${yC - r / 2} M 0 ${yC} L ${-r * 0.866} ${yC + r / 2} M 0 ${yC} L ${r * 0.866} ${yC + r / 2}`} stroke={ACERO} strokeWidth={3} opacity={0.35} />
			<g opacity={carga}>
				<path d={`M -70 ${yC - 30} C -30 ${yC - 90} 30 ${yC + 30} 70 ${yC - 30} M -70 ${yC + 20} C -30 ${yC - 40} 30 ${yC + 80} 70 ${yC + 20} M -55 ${yC + 62} C -20 ${yC + 20} 20 ${yC + 100} 55 ${yC + 62}`} fill="none" stroke={AMBAR} strokeWidth={10} strokeLinecap="round" />
			</g>
		</g>
	);
};

// Bacteria en forma de cápsula, que respira y mueve los flagelos.
const Bacteria: React.FC<{x: number; y: number; escala?: number; giro?: number; opacidad?: number; hinchada?: number; color?: string; fase?: number}> = ({x, y, escala = 1, giro = 0, opacidad = 1, hinchada = 0, color = BACTERIA, fase = 0}) => {
	const frame = useCurrentFrame();
	const ancho = 360;
	const respira = Math.sin(frame / 15 + fase) * 7;
	const alto = entre(170, 220, hinchada) + respira;
	const t = frame / 7 + fase;
	const flagelo = (dy: number, f: number) => `M ${ancho / 2 - 8} ${dy} q 50 ${Math.sin(t + f) * 34} 100 0 t 100 0 t 90 0`;
	return (
		<g transform={`translate(${x} ${y}) rotate(${giro + Math.sin(frame / 31 + fase) * 2}) scale(${escala})`} opacity={opacidad}>
			<path d={flagelo(-30, 0)} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.75} />
			<path d={flagelo(30, 2)} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" opacity={0.75} />
			<rect x={-ancho / 2} y={-alto / 2} width={ancho} height={alto} rx={alto / 2} fill={BACTERIA_OSCURA} stroke={color} strokeWidth={10} />
			<path d={`M ${-ancho / 2 + 60} ${-alto / 2 + 34} Q 0 ${-alto / 2 + 16} ${ancho / 2 - 60} ${-alto / 2 + 34}`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.25} />
			<path d="M -110 10 C -60 -36 -30 46 20 2 C 50 -28 80 34 120 -4" fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" opacity={0.65} />
		</g>
	);
};

const Pastilla: React.FC<{x: number; y: number; tachada: number; color: string}> = ({x, y, tachada, color}) => (
	<g transform={`translate(${x} ${y}) rotate(-30)`}>
		<rect x={-66} y={-28} width={132} height={56} rx={28} fill={BLANCO} />
		<path d="M 0 -28 H 38 A 28 28 0 0 1 38 28 H 0 Z" fill={color} />
		<g opacity={tachada} transform="rotate(30)">
			<path d="M -56 -56 L 56 56 M 56 -56 L -56 56" stroke={ROJO} strokeWidth={16} strokeLinecap="round" />
		</g>
	</g>
);

// Trazo de monitor. El avance se acumula cuadro a cuadro: si dependiera del ritmo actual, el trazo saltaría al acelerarse.
const Monitor: React.FC<{y: number; desde?: number; duracion?: number; color: string; alto?: number}> = ({y, desde = 1e6, duracion = 30, color, alto = 150}) => {
	const frame = useCurrentFrame();
	const vida = rampa(frame, desde, duracion);
	let avance = 0;
	for (let f = 0; f < frame; f++) {
		avance += entre(1.6, 3.2, rampa(f, desde, duracion));
	}
	const puntos = Array.from({length: 109}, (_, i) => {
		const fase = (((i * 3 - avance) % 72) + 72) % 72;
		const pulso = fase < 4 ? fase / 4 : fase < 8 ? 1 - ((fase - 4) / 4) * 1.5 : fase < 12 ? -0.5 + ((fase - 8) / 4) * 0.5 : 0;
		return `${i * 10},${y - pulso * alto * entre(0.1, 1, vida)}`;
	}).join(' ');
	return <polyline points={puntos} fill="none" stroke={color} strokeWidth={7} strokeLinejoin="round" />;
};

const Gancho: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const casi = cue(escena, 'casi', fps);
	const antibiotico = cue(escena, 'antibiótico', fps);
	const colores = [ROJO, CIAN, AMBAR, BLANCO];
	return (
		<AbsoluteFill>
			<Lienzo>
				<Monitor y={470} color={ROJO} />
			</Lienzo>
			<Titular texto="En coma" detalle="San Diego, 2016" />
			<div style={{opacity: rampa(frame, 4, 14)}}>
				<Foto archivo="acinetobacter.jpg" top={540} alto={520} posicion="center bottom" rotulo="Acinetobacter baumannii al microscopio" />
			</div>
			<Lienzo>
				{colores.map((color, i) => (
					<g key={color} opacity={rampa(frame, casi + i * 3, 10)}>
						<Pastilla x={195 + i * 230} y={1200} color={color} tachada={rampa(frame, antibiotico + i * 5, 7)} />
					</g>
				))}
			</Lienzo>
			<Pie fuente={escena.fuente} foto="Foto: CDC / Janice Carr, dominio público" />
		</AbsoluteFill>
	);
};

const ENJAMBRE = Array.from({length: 7}, (_, i) => {
	const angulo = (i / 7) * Math.PI * 2 + 0.4;
	return {angulo, retardo: i * 4};
});

const Idea: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const atacar = cue(escena, 'atacar', fps);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Bacteria x={510} y={850} escala={1.25} />
				{ENJAMBRE.map(({angulo, retardo}, i) => {
					const llega = rampa(frame, retardo, atacar);
					const radio = entre(1500, 370, llega);
					const giro = (angulo * 180) / Math.PI + 90 + 180;
					return <Fago key={i} x={540 + Math.cos(angulo) * radio} y={850 + Math.sin(angulo) * radio * 1.15} escala={0.42} giro={giro} patas={llega} flota={10} />;
				})}
			</Lienzo>
			<Titular texto="Una salida poco común" />
			<Sello texto="Virus contra bacterias" desde={atacar} y={1290} tamano={54} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const FagoFicha: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const infectan = cue(escena, 'infectan', fps);
	const bacterias = cue(escena, 'bacterias', fps);
	const entra = rampa(frame, 0, 16);
	return (
		<AbsoluteFill>
			<Foto archivo="fagos.jpg" top={300} alto={560} left={60} right={560} rotulo="Fagos al microscopio" />
			<Lienzo>
				<Fago x={770} y={840} escala={entre(0.6, 0.95, entra)} patas={0.3} opacidad={entra} flota={10} />
				<g opacity={rampa(frame, infectan - 4, 10)}>
					<Bacteria x={270} y={1090} escala={0.6} />
					<text x={270} y={1270} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={40} fill={VERDE}>Bacterias: sí</text>
				</g>
				<g opacity={rampa(frame, bacterias + 8, 10)}>
					<circle cx={790} cy={1090} r={96} fill="#5b2c3f" stroke="#ff9bb5" strokeWidth={8} />
					<circle cx={790} cy={1090} r={34} fill="#a34a68" />
					<path d="M 720 1020 L 860 1160 M 860 1020 L 720 1160" stroke={ROJO} strokeWidth={15} strokeLinecap="round" />
					<text x={790} y={1270} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={40} fill="#ff9bb5">Células humanas: no</text>
				</g>
			</Lienzo>
			<Titular texto="Bacteriófagos" detalle="Virus que infectan bacterias" />
			<Pie fuente={escena.fuente} foto="Foto: Šimoliūnas et al., Viruses 2015, CC BY 4.0" />
		</AbsoluteFill>
	);
};

const RECEPTORES = [-420, -300, -180, -60, 60, 180, 300, 420];

const Ataque: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const reconoce = cue(escena, 'reconoce', fps);
	const posa = cue(escena, 'posa', fps);
	const inyecta = cue(escena, 'inyecta', fps);
	const genetico = cue(escena, 'genético', fps);
	const baja = rampa(frame, 0, posa + 8);
	const contraccion = rampa(frame, inyecta, 10);
	const avance = rampa(frame, inyecta + 4, genetico - inyecta + 10);
	const yBase = 1000 + contraccion * 6;
	return (
		<AbsoluteFill>
			<Lienzo>
				<path d="M 0 1000 Q 540 972 1080 1000 L 1080 1500 L 0 1500 Z" fill={BACTERIA_OSCURA} />
				<path d="M 0 1000 Q 540 972 1080 1000" fill="none" stroke={BACTERIA} strokeWidth={16} />
				{RECEPTORES.map((dx) => {
					const activo = dx === 60 || dx === -60;
					return <circle key={dx} cx={540 + dx} cy={982} r={entre(12, activo ? 18 : 12, rampa(frame, reconoce, 10))} fill={activo && frame >= reconoce ? AMBAR : '#5f8a26'} />;
				})}
				<path
					d={`M 540 ${yBase} C 470 ${yBase + 70} 610 ${yBase + 120} 540 ${yBase + 190} C 480 ${yBase + 240} 600 ${yBase + 280} 540 ${yBase + 340}`}
					fill="none"
					stroke={AMBAR}
					strokeWidth={13}
					strokeLinecap="round"
					pathLength={1}
					strokeDasharray={1}
					strokeDashoffset={1 - avance}
					opacity={avance > 0 ? 1 : 0}
				/>
				<Fago x={entre(860, 540, baja)} y={entre(800, yBase - 16, baja)} escala={1} giro={entre(16, 0, baja)} contraccion={contraccion} patas={rampa(frame, posa, 10)} carga={1 - avance} flota={(1 - baja) * 10} />
			</Lienzo>
			<Titular texto="1. Reconoce" hasta={inyecta} />
			<Titular texto="2. Inyecta" desde={inyecta} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const CRIAS = Array.from({length: 14}, (_, i) => ({
	x: entre(-125, 125, azar(i)) * 2.3,
	y: entre(-50, 50, azar(i + 40)) * 2.3,
	angulo: (i / 14) * Math.PI * 2 + azar(i + 80),
	giro: azar(i + 120) * 360,
}));

const Lisis: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const secuestrada = cue(escena, 'secuestrada', fps);
	const revienta = cue(escena, 'revienta', fps);
	const buscar = cue(escena, 'buscar', fps);
	const llenado = rampa(frame, secuestrada, revienta - secuestrada - 2);
	const estallido = rampa(frame, revienta, 30);
	const temblor = frame >= revienta - 16 && frame < revienta ? Math.sin(frame * 2.3) * ((frame - revienta + 16) / 2) : 0;
	const visibles = Math.ceil(llenado * CRIAS.length);
	const membrana = rampa(frame, revienta, 8);
	return (
		<AbsoluteFill>
			<Lienzo>
				<g transform={`translate(${540 + temblor} 880)`}>
					<g opacity={1 - membrana} transform={`scale(${1 + membrana * 0.25})`}>
						<Bacteria x={0} y={0} escala={2.05} hinchada={llenado} />
					</g>
					<circle r={estallido * 620} fill={BLANCO} opacity={frame >= revienta ? Math.max(0, 0.6 - estallido * 1.1) : 0} />
					{frame >= revienta
						? Array.from({length: 12}, (_, i) => {
								const a = (i / 12) * Math.PI * 2 + azar(i);
								const d = estallido * entre(260, 540, azar(i + 9));
								return <path key={i} d="M -46 -12 Q 0 -32 46 -8 L 28 18 Q -10 8 -38 22 Z" fill={BACTERIA_OSCURA} stroke={BACTERIA} strokeWidth={6} transform={`translate(${Math.cos(a) * d} ${Math.sin(a) * d * 0.72}) rotate(${i * 50 + estallido * 120})`} opacity={1 - estallido * 0.55} />;
							})
						: null}
					{CRIAS.slice(0, visibles).map((c, i) => {
						const d = estallido * entre(230, 500, azar(i + 200)) + Math.max(0, frame - revienta) * 0.6;
						const giroFinal = (c.angulo * 180) / Math.PI + 90;
						return <Fago key={i} x={c.x * (1 - estallido) + Math.cos(c.angulo) * d} y={c.y * (1 - estallido) + Math.sin(c.angulo) * d * 0.72} escala={entre(0.2, 0.3, estallido)} giro={entre(c.giro, giroFinal, estallido)} flota={4} />;
					})}
				</g>
				<Bacteria x={entre(1500, 880, rampa(frame, buscar, 24))} y={1330} escala={0.7} />
			</Lienzo>
			<Titular texto="3. Se copia" hasta={revienta} />
			<Titular texto="4. Revienta" detalle="Y salen a buscar la siguiente" desde={revienta} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const POZOS = Array.from({length: 20}, (_, i) => ({col: i % 4, fila: Math.floor(i / 4), acierto: i === 6 || i === 13}));

const Busqueda: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const correctos = cue(escena, 'correctos', fps);
	const muestras = cue(escena, 'muestras', fps);
	const residuales = cue(escena, 'residuales', fps);
	const barrido = interpolate(frame, [correctos - 20, residuales], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill>
			<Lienzo>
				{POZOS.map((p, i) => {
					const cx = 225 + p.col * 210;
					const cy = 500 + p.fila * 178;
					const prueba = interpolate(barrido * POZOS.length - i, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
					const probado = prueba > 0;
					const color = !probado ? '#26323f' : p.acierto ? VERDE : '#3a2230';
					const late = p.acierto && probado ? 1 + Math.sin(frame / 6) * 0.05 : 1;
					return (
						<g key={i} transform={`translate(${cx} ${cy + Math.sin(frame / 22 + i) * 3}) scale(${late})`} opacity={rampa(frame, i, 10)}>
							<circle r={76} fill={color} stroke={p.acierto && probado ? BLANCO : TENUE} strokeWidth={6} />
							<g opacity={prueba}>
								{!p.acierto ? <path d="M -30 -30 L 30 30 M 30 -30 L -30 30" stroke={ROJO} strokeWidth={10} strokeLinecap="round" /> : null}
								{p.acierto ? <path d="M -32 2 L -8 28 L 36 -26" fill="none" stroke={FONDO} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" /> : null}
							</g>
						</g>
					);
				})}
			</Lienzo>
			<Titular texto="Hallar los correctos" />
			<Sello texto="Más de 100 muestras" desde={muestras} y={1290} tamano={52} />
			<Pie fuente={escena.fuente} foto="Ilustración simplificada: los pozos no son datos reales" />
		</AbsoluteFill>
	);
};

const Despertar: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const dos = cue(escena, 'dos', fps);
	const mezclas = cue(escena, 'aplicaron', fps);
	const despues = cue(escena, 'después', fps);
	const mejoro = cue(escena, 'mejoró', fps);
	const vida = rampa(frame, despues, mejoro - despues + 6);
	const color = vida > 0.5 ? VERDE : ROJO;
	return (
		<AbsoluteFill>
			<Lienzo>
				<rect x={60} y={560} width={960} height={420} rx={24} fill="#06110d" stroke="#25473a" strokeWidth={8} />
				<clipPath id="pantalla">
					<rect x={64} y={564} width={952} height={412} rx={20} />
				</clipPath>
				<g clipPath="url(#pantalla)">
					<Monitor y={790} desde={despues} duracion={mejoro - despues + 6} color={color} />
				</g>
				{[300, 540, 780].map((x, i) => (
					<Fago key={x} x={x} y={535} escala={0.34} patas={0.3} opacidad={rampa(frame, mezclas + i * 5, 10)} flota={6} />
				))}
			</Lienzo>
			<Titular texto="Marzo de 2016" detalle="Mezclas de fagos" hasta={dos} />
			<Titular texto="2 días después" detalle="de recibirlas por la vena" desde={dos} />
			<Sello texto="Despertó" desde={mejoro} y={1060} color={VERDE} tamano={110} />
			<Pie fuente={escena.fuente} foto="Trazo ilustrativo, no es un registro real" />
		</AbsoluteFill>
	);
};

const Tarjeta: React.FC<{texto: string; desde: number; y: number; color: string; signo: string}> = ({texto, desde, y, color, signo}) => {
	const frame = useCurrentFrame();
	const entra = rampa(frame, desde, 12);
	return (
		<div style={{position: 'absolute', top: y + Math.sin(frame / 24 + y) * 4, left: 60, right: 60, display: 'flex', alignItems: 'center', gap: 26, padding: '22px 28px', borderRadius: 12, background: '#17212c', borderLeft: `14px solid ${color}`, opacity: entra, transform: `translateX(${(1 - entra) * -60}px)`}}>
			<div style={{fontFamily: FUERTE, fontSize: 64, color}}>{signo}</div>
			<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 44, lineHeight: 1.15, color: BLANCO}}>{texto}</div>
		</div>
	);
};

const Matiz: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Titular texto="No fue magia" />
			<Tarjeta signo="+" color={AMBAR} texto="También recibió antibióticos" desde={cue(escena, 'también', fps)} y={350} />
			<Tarjeta signo="!" color={ROJO} texto="La bacteria empezó a resistir a los fagos" desde={cue(escena, 'bacteria', fps)} y={560} />
			<Tarjeta signo="?" color={CIAN} texto="Sus médicos no pueden asegurar que fueran la causa" desde={cue(escena, 'médicos', fps)} y={790} />
			<Sello texto="A casa en agosto, tras 245 días" desde={cue(escena, 'volvió', fps)} y={1090} color={VERDE} tamano={44} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Historia: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const antibioticos = cue(escena, 'antibióticos', fps);
	const hoy = cue(escena, 'hoy', fps);
	const millon = cue(escena, 'millón', fps);
	const foto = 1 - rampa(frame, hoy, 14);
	const cifra = interpolate(frame, [hoy + 4, millon], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.quad)});
	const valor = (cifra * 1.27).toFixed(2).replace('.', ',');
	return (
		<AbsoluteFill>
			<div style={{opacity: foto}}>
				<Foto archivo="herelle.jpg" top={160} alto={760} posicion="center 20%" rotulo="Félix d'Hérelle, hacia 1905" />
				<div style={{position: 'absolute', top: 960, left: 60, right: 60, display: 'flex', justifyContent: 'space-between', fontFamily: FUERTE, color: BLANCO}}>
					<div style={{fontSize: 80, color: AMBAR}}>1917</div>
					<div style={{fontSize: 44, marginTop: 24, textAlign: 'right', opacity: rampa(frame, antibioticos - 6, 12)}}>Años 40: antibióticos</div>
				</div>
			</div>
			<div style={{position: 'absolute', top: 480, left: 40, right: 40, textAlign: 'center', opacity: 1 - foto, transform: `scale(${1 + frame * 0.0003})`}}>
				<div style={{fontFamily: FUERTE, fontSize: 170, lineHeight: 1, color: ROJO}}>{valor}</div>
				<div style={{fontFamily: FUERTE, fontSize: 62, color: BLANCO, marginTop: 10}}>millones de muertes</div>
				<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: TENUE, marginTop: 20}}>Atribuidas a la resistencia bacteriana. Estimación de 2019</div>
			</div>
			<Pie fuente={escena.fuente} foto={foto > 0.5 ? 'Foto: Institut Pasteur, dominio público' : 'Antimicrobial Resistance Collaborators, The Lancet 2022'} />
		</AbsoluteFill>
	);
};

const NUTRIENTES = Array.from({length: 26}, (_, i) => ({x: 90 + azar(i) * 900, ciclo: 40 + azar(i + 30) * 70, r: 5 + azar(i + 60) * 8}));

const Oceano: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const matan = cue(escena, 'matan', fps);
	const quinta = cue(escena, 'quinta', fps);
	const liberan = cue(escena, 'liberan', fps);
	const marcada = rampa(frame, matan, 24);
	const nutrientes = rampa(frame, liberan - 6, 14);
	const ola = (y: number, f: number) => `M 0 ${y} ${Array.from({length: 13}, (_, i) => `L ${i * 90} ${y + Math.sin(i * 0.8 + frame / 16 + f) * 18}`).join(' ')} L 1080 1920 L 0 1920 Z`;
	const filas = [0, 1, 2, 3, 4];
	return (
		<AbsoluteFill>
			<Lienzo>
				<path d={ola(400, 0)} fill="#0d4a6e" />
				<path d={ola(430, 2)} fill="#0a3a5a" />
				{filas.map((i) => {
					const cae = i === 2;
					const y = 660 + i * 130;
					const nada = Math.sin(frame / 26 + i * 1.7) * 26;
					return <Bacteria key={i} x={(i % 2 ? 620 : 420) + nada} y={y} escala={0.55} opacidad={cae ? 1 - marcada * 0.85 : 1} color={cae && marcada > 0 ? ROJO : BACTERIA} fase={i} />;
				})}
				{NUTRIENTES.map((n, i) => {
					const t = (frame % n.ciclo) / n.ciclo;
					return <circle key={i} cx={n.x + Math.sin(frame / 12 + i) * 10} cy={1300 - t * 800} r={n.r} fill={AMBAR} opacity={nutrientes * (1 - t) * 0.85} />;
				})}
			</Lienzo>
			<Titular texto="La guerra en el océano" />
			<Sello texto="Cerca del 20 % cada día" desde={quinta} y={1290} color={CIAN} tamano={52} />
			<Pie fuente={escena.fuente} foto="Estimación de biomasa microbiana. Ilustración simplificada" />
		</AbsoluteFill>
	);
};

const CierreFagos: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enemigo = cue(escena, 'enemigo', fps);
	const virus = cue(escena, 'virus', fps);
	const entra = rampa(frame, 0, enemigo + 10);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Bacteria x={540} y={1120} escala={1.1} opacidad={1 - rampa(frame, virus, 30) * 0.7} />
				<Fago x={entre(820, 540, entra)} y={entre(880, 1030, entra)} escala={1} giro={entre(14, 0, entra)} patas={entra} contraccion={rampa(frame, virus - 6, 12)} carga={1 - rampa(frame, virus, 24)} flota={(1 - entra) * 10} />
			</Lienzo>
			<Titular texto="No son una cura universal" detalle="Faltan más ensayos" />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const VISUALES: Record<string, React.FC<{escena: Escena}>> = {
	gancho: Gancho,
	idea: Idea,
	fago: FagoFicha,
	ataque: Ataque,
	lisis: Lisis,
	busqueda: Busqueda,
	despertar: Despertar,
	matiz: Matiz,
	historia: Historia,
	oceano: Oceano,
	cierre: CierreFagos,
};

const MOTAS = Array.from({length: 22}, (_, i) => ({x: azar(i) * 1080, y: azar(i + 50) * 1920, r: 3 + azar(i + 90) * 9, v: 0.25 + azar(i + 130) * 0.6}));

// Fondo continuo de todo el video: no se reinicia entre escenas, así el corte no se nota.
export const AmbienteFagos: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, #18222f, ${FONDO} 72%)`}}>
			<Lienzo>
				{MOTAS.map((m, i) => (
					<circle key={i} cx={m.x + Math.sin(frame / 40 + i) * 30} cy={(((m.y - frame * m.v) % 1920) + 1920) % 1920} r={m.r} fill={ACERO} opacity={0.1} />
				))}
			</Lienzo>
		</AbsoluteFill>
	);
};

export const EscenaFagos: React.FC<PropsVisual> = ({escena}) => {
	const Visual = VISUALES[escena.id];
	return <Visual escena={escena} />;
};
