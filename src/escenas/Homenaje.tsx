import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Escena, PropsVisual} from '../Armazon';

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'Arial, sans-serif';
const CREMA = '#f1e7d3';
const TENUE = '#9c9587';
const VIOLETA = '#7d6a9e';

// Cuadro en el que la narración dice una palabra, para que la imagen acompañe a la voz.
const cuadroDePalabra = (escena: Escena, palabra: string, fps: number) => {
	const encontrada = escena.palabras.find((p) => p.t.toLowerCase().includes(palabra));
	return encontrada ? Math.round(encontrada.ini * fps) : 0;
};

const useAparicion = (desde: number, duracion = 14) => {
	const frame = useCurrentFrame();
	return interpolate(frame, [desde, desde + duracion], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
};

const Vela: React.FC<{x: number; y: number; escala?: number}> = ({x, y, escala = 1}) => {
	const frame = useCurrentFrame();
	const temblor = Math.sin(frame / 3.1) * 0.05 + Math.sin(frame / 7.3) * 0.07;
	return (
		<g transform={`translate(${x} ${y}) scale(${escala})`}>
			<circle cy={-120} r={170 + temblor * 120} fill="url(#halo)" />
			<rect x={-34} y={0} width={68} height={260} rx={8} fill="#d8ccb4" />
			<rect x={-34} y={0} width={68} height={26} rx={8} fill="#efe6d2" />
			<rect x={-3} y={-24} width={6} height={26} fill="#2a2522" />
			<path
				d="M 0 -112 C 24 -70 26 -44 0 -22 C -26 -44 -24 -70 0 -112 Z"
				fill="#ffc35c"
				transform={`translate(0 -22) scale(${1 + temblor} ${1 - temblor}) translate(0 22)`}
			/>
			<path d="M 0 -76 C 10 -56 11 -44 0 -30 C -11 -44 -10 -56 0 -76 Z" fill="#fff0c4" />
		</g>
	);
};

const Iglesia: React.FC = () => (
	<g fill="#050609">
		<rect x={210} y={420} width={480} height={380} />
		<path d="M 190 430 L 450 240 L 710 430 Z" />
		<rect x={395} y={140} width={110} height={300} />
		<path d="M 385 150 L 450 70 L 515 150 Z" />
		<rect x={444} y={10} width={12} height={70} />
		<rect x={426} y={28} width={48} height={12} />
		<path d="M 405 800 L 405 640 A 45 45 0 0 1 495 640 L 495 800 Z" fill="#c98f3e" opacity={0.75} />
		<path d="M 280 620 A 28 28 0 0 1 336 620 L 336 700 L 280 700 Z" fill="#c98f3e" opacity={0.45} />
		<path d="M 564 620 A 28 28 0 0 1 620 620 L 620 700 L 564 700 Z" fill="#c98f3e" opacity={0.45} />
		<rect x={0} y={800} width={900} height={100} fill="#030406" />
	</g>
);

const Estrellas: React.FC = () => (
	<>
		{Array.from({length: 40}, (_, i) => (
			<circle
				key={i}
				cx={random(`estrella-x-${i}`) * 900}
				cy={random(`estrella-y-${i}`) * 420}
				r={1 + random(`estrella-r-${i}`) * 2}
				fill={CREMA}
				opacity={0.25 + random(`estrella-o-${i}`) * 0.5}
			/>
		))}
	</>
);

const Reloj: React.FC<{cx: number; cy: number; r: number; velocidad: number}> = ({cx, cy, r, velocidad}) => {
	const frame = useCurrentFrame();
	return (
		<g transform={`translate(${cx} ${cy})`}>
			<circle r={r} fill="none" stroke={CREMA} strokeWidth={7} opacity={0.8} />
			{Array.from({length: 12}, (_, i) => (
				<rect key={i} x={-3} y={-r + 16} width={6} height={22} fill={CREMA} opacity={0.6} transform={`rotate(${i * 30})`} />
			))}
			<rect x={-5} y={-r * 0.5} width={10} height={r * 0.5} rx={5} fill={CREMA} transform={`rotate(${frame * velocidad * 0.083})`} />
			<rect x={-3} y={-r * 0.8} width={6} height={r * 0.8} rx={3} fill="#d9a441" transform={`rotate(${frame * velocidad})`} />
			<circle r={11} fill="#d9a441" />
		</g>
	);
};

const Lienzo: React.FC<{children: React.ReactNode}> = ({children}) => (
	<svg viewBox="0 0 900 900" style={{position: 'absolute', top: 210, left: 90, width: 900, height: 900}}>
		<defs>
			<radialGradient id="halo">
				<stop offset="0%" stopColor="#ffb44a" stopOpacity={0.5} />
				<stop offset="100%" stopColor="#ffb44a" stopOpacity={0} />
			</radialGradient>
		</defs>
		{children}
	</svg>
);

const VisualFrase: React.FC = () => {
	const nombre = useAparicion(150);
	return (
		<>
			<Lienzo>
				<Vela x={450} y={520} escala={1.15} />
			</Lienzo>
			<div style={{position: 'absolute', top: 1110, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, fontSize: 52, color: CREMA, opacity: nombre}}>
				Padre Patricio Sánchez Molinari
			</div>
		</>
	);
};

const VisualLugar: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const envivo = useAparicion(cuadroDePalabra(escena, 'transmit', fps));
	return (
		<>
			<Lienzo>
				<Estrellas />
				<Iglesia />
			</Lienzo>
			<div style={{position: 'absolute', top: 130, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, color: CREMA}}>
				<div style={{fontSize: 52}}>Guayaquil, Ecuador</div>
				<div style={{fontSize: 38, color: TENUE, marginTop: 8}}>17 de octubre de 2026</div>
			</div>
			<div style={{position: 'absolute', top: 1120, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: envivo}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: SANS, fontSize: 36, fontWeight: 700, letterSpacing: 3, color: CREMA}}>
					<span style={{width: 24, height: 24, borderRadius: 12, background: '#e03131', opacity: 0.45 + 0.55 * Math.abs(Math.sin(frame / 12))}} />
					MISA EN VIVO
				</div>
			</div>
		</>
	);
};

const Palabra: React.FC<{texto: string; desde: number; tachada?: boolean; color?: string}> = ({texto, desde, tachada, color = CREMA}) => {
	const aparicion = useAparicion(desde);
	return (
		<div
			style={{
				fontFamily: SERIF,
				fontSize: 56,
				color,
				opacity: aparicion * (tachada ? 0.55 : 1),
				textDecoration: tachada ? 'line-through' : 'none',
				transform: `translateY(${(1 - aparicion) * 16}px)`,
			}}
		>
			{texto}
		</div>
	);
};

const VisualHomilia: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const cuadro = (p: string) => cuadroDePalabra(escena, p, fps);
	return (
		<>
			<Lienzo>
				<Reloj cx={450} cy={300} r={240} velocidad={3} />
			</Lienzo>
			<div style={{position: 'absolute', top: 860, left: 90, right: 90, display: 'flex', justifyContent: 'space-between', textAlign: 'center'}}>
				<div>
					<Palabra texto="Lo material" desde={cuadro('materiales')} tachada />
					<Palabra texto="El trabajo" desde={cuadro('trabajo')} tachada />
				</div>
				<div>
					<Palabra texto="La familia" desde={cuadro('familia')} color="#e8c37c" />
					<Palabra texto="Dios" desde={cuadro('dios')} color="#e8c37c" />
				</div>
			</div>
		</>
	);
};

// Solo se ven la pared y la cruz: la imagen pasa a negro antes de cualquier impacto.
const VisualCaida: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const desprende = cuadroDePalabra(escena, 'desprendi', fps);
	const cae = cuadroDePalabra(escena, 'cayó', fps);
	const avance = interpolate(frame, [desprende, cae + 6], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.in(Easing.quad),
	});
	const negro = interpolate(frame, [cae - 8, cae + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const vibracion = frame >= desprende - 15 && frame < desprende ? Math.sin(frame * 2.4) * 1.2 : 0;
	return (
		<>
			<Lienzo>
				<rect x={110} y={20} width={680} height={740} fill="#1c1a1f" />
				<circle cx={450} cy={300} r={420} fill="url(#halo)" opacity={0.35} />
				<g transform={`translate(${450 + vibracion} ${110}) translate(0 ${avance * 300}) rotate(${avance * 7}) scale(${1 + avance * 0.9})`}>
					<rect x={-27} y={0} width={54} height={520} rx={3} fill="#4d3524" stroke="#2d1e14" strokeWidth={4} />
					<rect x={-175} y={120} width={350} height={54} rx={3} fill="#4d3524" stroke="#2d1e14" strokeWidth={4} />
				</g>
				<rect x={150} y={700} width={600} height={120} fill="#0c0b0e" />
				<rect x={130} y={690} width={640} height={18} fill="#2a262c" />
				<Vela x={220} y={560} escala={0.48} />
				<Vela x={680} y={560} escala={0.48} />
			</Lienzo>
			<div style={{position: 'absolute', top: 130, left: 70, fontFamily: 'Consolas, monospace', fontSize: 58, color: CREMA}}>Minuto 27</div>
			<AbsoluteFill style={{background: '#000', opacity: negro}} />
		</>
	);
};

const VisualAuxilio: React.FC = () => (
	<Lienzo>
		<Vela x={450} y={500} />
	</Lienzo>
);

const VisualQuien: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const cuadro = (p: string) => cuadroDePalabra(escena, p, fps);
	const Fila: React.FC<{desde: number; titulo: string; detalle: string}> = ({desde, titulo, detalle}) => {
		const aparicion = useAparicion(desde);
		return (
			<div style={{opacity: aparicion, marginTop: 56}}>
				<div style={{fontFamily: SANS, fontSize: 28, letterSpacing: 4, color: TENUE}}>{titulo}</div>
				<div style={{fontFamily: SERIF, fontSize: 56, color: CREMA, marginTop: 8}}>{detalle}</div>
			</div>
		);
	};
	return (
		<div style={{position: 'absolute', top: 230, left: 90, right: 90}}>
			<div style={{fontFamily: SERIF, fontSize: 78, lineHeight: 1.12, color: '#e8c37c'}}>Patricio Alfredo Sánchez Molinari</div>
			<Fila desde={cuadro('cuenca')} titulo="NACIÓ" detalle="Cuenca, 1973" />
			<Fila desde={cuadro('redentoristas')} titulo="CONGREGACIÓN" detalle="Padres redentoristas" />
			<Fila desde={cuadro('sencillo')} titulo="LO RECUERDAN COMO" detalle="Sencillo, humilde y cercano" />
		</div>
	);
};

const VisualDespues: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const revision = useAparicion(cuadroDePalabra(escena, 'revisión', fps));
	const causa = useAparicion(cuadroDePalabra(escena, 'causa', fps));
	const barrido = interpolate(frame, [0, durationInFrames], [40, 790]);
	return (
		<>
			<Lienzo>
				<Iglesia />
				<rect x={120} y={barrido} width={660} height={5} fill="#d9a441" opacity={0.85 * revision} />
			</Lienzo>
			<div style={{position: 'absolute', top: 130, left: 60, right: 60, textAlign: 'center', fontFamily: SERIF, fontSize: 48, color: CREMA, opacity: revision}}>
				Revisión técnica de los templos
			</div>
			<div style={{position: 'absolute', top: 1120, left: 60, right: 60, textAlign: 'center', fontFamily: SANS, fontSize: 38, fontWeight: 700, letterSpacing: 2, color: '#e8a04a', opacity: causa}}>
				CAUSA OFICIAL: NO INFORMADA
			</div>
		</>
	);
};

const VisualCierre: React.FC = () => (
	<Lienzo>
		<Reloj cx={450} cy={320} r={280} velocidad={0.6} />
		<Vela x={450} y={480} escala={0.55} />
	</Lienzo>
);

export const EscenaHomenaje: React.FC<PropsVisual> = ({escena}) => {
	const aparicion = useAparicion(0, 12);
	const visuales: Record<string, React.ReactNode> = {
		frase: <VisualFrase />,
		lugar: <VisualLugar escena={escena} />,
		homilia: <VisualHomilia escena={escena} />,
		caida: <VisualCaida escena={escena} />,
		auxilio: <VisualAuxilio />,
		quien: <VisualQuien escena={escena} />,
		despues: <VisualDespues escena={escena} />,
		cierre: <VisualCierre />,
	};
	return (
		<AbsoluteFill style={{background: 'radial-gradient(circle at 50% 35%, #1b1a22 0%, #08090c 70%)', opacity: aparicion}}>
			{visuales[escena.id]}
			<div style={{position: 'absolute', top: 1235, left: 70, right: 70, textAlign: 'center', fontFamily: SANS, fontSize: 30, color: TENUE}}>
				{escena.etiqueta} · {escena.fuente}
			</div>
			<div style={{position: 'absolute', bottom: 130, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: 28, letterSpacing: 3, color: VIOLETA}}>
				RECREACIÓN ILUSTRATIVA · NO SON IMÁGENES REALES
			</div>
		</AbsoluteFill>
	);
};
