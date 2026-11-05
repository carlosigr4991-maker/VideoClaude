import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {PropsVisual} from '../Armazon';

type Punto = [number, number];

// Coordenadas del plano (viewBox 900×900). Para un caso real, se redibuja a partir de una fuente documentada.
const RECORRIDOS: Record<string, {nombre: string; color: string; camino: Punto[]}> = {
	a: {nombre: 'A', color: '#4dabf7', camino: [[450, 860], [450, 620], [230, 620], [230, 300]]},
	b: {nombre: 'B', color: '#ff922b', camino: [[840, 700], [690, 700], [690, 520], [600, 420]]},
};

const COLORES_ETIQUETA: Record<string, string> = {
	CONFIRMADO: '#2f9e44',
	'SIN CONFIRMAR': '#e8590c',
	'CASO FICTICIO': '#868e96',
};

const posicionEn = (camino: Punto[], t: number): Punto => {
	const tramo = Math.min(Math.floor(t * (camino.length - 1)), camino.length - 2);
	const local = t * (camino.length - 1) - tramo;
	const [x1, y1] = camino[tramo];
	const [x2, y2] = camino[tramo + 1];
	return [x1 + (x2 - x1) * local, y1 + (y2 - y1) * local];
};

const Persona: React.FC<{id: string; t: number}> = ({id, t}) => {
	const {nombre, color, camino} = RECORRIDOS[id];
	const [x, y] = posicionEn(camino, t);
	return (
		<g>
			<polyline points={camino.map((p) => p.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={5} strokeDasharray="14 12" opacity={0.65} />
			<circle cx={x} cy={y} r={32} fill={color} />
			<text x={x} y={y + 13} textAnchor="middle" fontFamily="Arial" fontSize={38} fontWeight={700} fill="#0b0e13">
				{nombre}
			</text>
		</g>
	);
};

const Habitacion: React.FC<{x: number; y: number; w: number; h: number; nombre: string}> = ({x, y, w, h, nombre}) => (
	<>
		<rect x={x} y={y} width={w} height={h} fill="#171c24" stroke="#c7d0db" strokeWidth={7} />
		<text x={x + 20} y={y + 44} fontFamily="Arial" fontSize={28} letterSpacing={2} fill="#8b97a6">
			{nombre}
		</text>
	</>
);

export const EscenaPlano: React.FC<PropsVisual> = ({escena}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const avance = interpolate(frame, [15, durationInFrames * 0.85], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const aparicion = interpolate(frame, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
	const parpadeo = 0.45 + 0.55 * Math.abs(Math.sin(frame / 9));

	// Lo ya contado queda visible en su posición final.
	const tA = escena.id === 'a' ? avance : escena.id === 'b' || escena.id === 'alarma' ? 1 : null;
	const tB = escena.id === 'b' ? avance : escena.id === 'alarma' ? 1 : null;

	return (
		<AbsoluteFill style={{background: '#0b0e13', color: '#f2f4f7', fontFamily: 'Arial, sans-serif', opacity: aparicion}}>
			<div style={{position: 'absolute', top: 130, left: 70, right: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<div style={{fontFamily: 'Consolas, monospace', fontSize: 92, fontWeight: 700}}>{escena.hora || '--:--'}</div>
				<div
					style={{
						padding: '12px 22px',
						borderRadius: 6,
						fontSize: 32,
						fontWeight: 700,
						letterSpacing: 2,
						background: COLORES_ETIQUETA[escena.etiqueta ?? ''] ?? '#868e96',
					}}
				>
					{escena.etiqueta}
				</div>
			</div>

			<svg viewBox="0 0 900 900" style={{position: 'absolute', top: 290, left: 90, width: 900, height: 900}}>
				<Habitacion x={40} y={130} w={380} h={340} nombre="COCINA" />
				<Habitacion x={420} y={130} w={440} h={420} nombre="SALA" />
				<Habitacion x={40} y={470} w={560} h={350} nombre="RECIBIDOR" />
				<Habitacion x={600} y={550} w={260} h={270} nombre="GARAJE" />
				<rect x={410} y={806} width={80} height={28} fill="#0b0e13" stroke="#c7d0db" strokeWidth={4} />
				{escena.id === 'alarma' ? (
					<>
						<rect x={190} y={116} width={90} height={28} fill="#fa5252" opacity={parpadeo} />
						<text x={235} y={96} textAnchor="middle" fontSize={28} fontWeight={700} fill="#ff8787">
							PUERTA TRASERA
						</text>
					</>
				) : null}
				{tA !== null ? <Persona id="a" t={tA} /> : null}
				{tB !== null ? <Persona id="b" t={tB} /> : null}
			</svg>

			<div style={{position: 'absolute', top: 1215, left: 70, right: 70, fontSize: 40, color: '#c3ccd6', textAlign: 'center'}}>
				{escena.fuente}
			</div>
			<div style={{position: 'absolute', bottom: 130, left: 0, right: 0, fontSize: 28, letterSpacing: 3, color: '#7d8896', textAlign: 'center'}}>
				RECREACIÓN ILUSTRATIVA · NO ES EVIDENCIA
			</div>
		</AbsoluteFill>
	);
};
