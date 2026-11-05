import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Escena, PropsVisual} from '../Armazon';

const TINTA = '#0f3442';
const CLARO = '#f4f9f4';
const CUERPO = '#efe0bd';
const ACENTO = '#ffb347';
const NIVEL = 900;

const FIJO = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Avance de 0 a 1 de una acción: arranca en el cuadro `desde`.
const avance = (frame: number, desde: number, duracion = 18) => interpolate(frame, [desde, desde + duracion], [0, 1], FIJO);

// Cuadro en el que la narración dice una palabra.
const cuePalabra = (escena: Escena, fps: number) => (palabra: string) => {
	const encontrada = escena.palabras.find((p) => p.t.toLowerCase().includes(palabra));
	return encontrada ? Math.round(encontrada.ini * fps) : 0;
};

const Rotulo: React.FC<{x: number; y: number; texto: string; opacidad?: number; color?: string; tam?: number; ancla?: 'start' | 'middle' | 'end'}> = ({
	x,
	y,
	texto,
	opacidad = 1,
	color = CLARO,
	tam = 44,
	ancla = 'middle',
}) => (
	<text x={x} y={y} textAnchor={ancla} fontFamily="Arial, sans-serif" fontWeight={700} fontSize={tam} fill={color} opacity={opacidad}>
		{texto}
	</text>
);

const Agua: React.FC<{nivel?: number}> = ({nivel = NIVEL}) => {
	const frame = useCurrentFrame();
	let d = `M 0 ${nivel}`;
	for (let x = 0; x <= 1080; x += 30) {
		d += ` L ${x} ${nivel + Math.sin(x / 80 + frame / 12) * 7}`;
	}
	d += ' L 1080 1920 L 0 1920 Z';
	return (
		<>
			<path d={d} fill="url(#agua)" />
			{Array.from({length: 26}, (_, i) => {
				const y = nivel + 40 + random(`p-y-${i}`) * (1900 - nivel);
				return (
					<circle
						key={i}
						cx={(random(`p-x-${i}`) * 1080 + frame * (0.2 + random(`p-v-${i}`) * 0.5)) % 1080}
						cy={y + Math.sin(frame / 25 + i) * 8}
						r={2 + random(`p-r-${i}`) * 3}
						fill="#bdeaf0"
						opacity={0.25}
					/>
				);
			})}
		</>
	);
};

const Huevo: React.FC<{x: number; y: number; angulo?: number; escala?: number; abierto?: number}> = ({x, y, angulo = 0, escala = 1, abierto = 0}) => (
	<g transform={`translate(${x} ${y}) rotate(${angulo}) scale(${escala})`}>
		<path d="M -22 0 A 22 10 0 0 1 22 0 Z" fill="#2b2019" transform={`translate(${abierto * 8} ${-abierto * 16}) rotate(${-abierto * 26})`} />
		<path d="M -22 0 A 22 10 0 0 0 22 0 Z" fill="#3a2b21" transform={`translate(${-abierto * 4} ${abierto * 8})`} />
	</g>
);

// Dibujada hacia la derecha desde la cabeza; `angulo` -90 la deja colgando con la cola arriba.
const Larva: React.FC<{x: number; y: number; escala?: number; angulo?: number; ondula?: number; opacidad?: number; contorno?: boolean}> = ({
	x,
	y,
	escala = 1,
	angulo = 0,
	ondula = 1,
	opacidad = 1,
	contorno = false,
}) => {
	const frame = useCurrentFrame();
	const relleno = contorno ? 'none' : CUERPO;
	const trazo = contorno ? '#ffffff' : '#a8906a';
	return (
		<g transform={`translate(${x} ${y}) rotate(${angulo}) scale(${escala})`} opacity={opacidad}>
			{Array.from({length: 9}, (_, i) => {
				const cx = 54 + i * 25;
				const cy = Math.sin(i * 0.8 + frame / 4) * 12 * ondula;
				return (
					<g key={i}>
						<line x1={cx} y1={cy - 14} x2={cx - 4} y2={cy - 28} stroke={trazo} strokeWidth={2} />
						<line x1={cx} y1={cy + 14} x2={cx - 4} y2={cy + 28} stroke={trazo} strokeWidth={2} />
						<circle cx={cx} cy={cy} r={17 - i * 0.9} fill={relleno} stroke={trazo} strokeWidth={2} />
					</g>
				);
			})}
			<ellipse cx={24} cy={0} rx={30} ry={25} fill={relleno} stroke={trazo} strokeWidth={2} />
			<circle cx={-14} cy={0} r={16} fill={contorno ? 'none' : '#4b3a2a'} stroke={trazo} strokeWidth={2} />
			{contorno ? null : <circle cx={-18} cy={-5} r={4} fill={CLARO} />}
		</g>
	);
};

const Pupa: React.FC<{x: number; y: number; escala?: number; angulo?: number; interior?: number; opacidad?: number}> = ({x, y, escala = 1, angulo = 0, interior = 0, opacidad = 1}) => (
	<g transform={`translate(${x} ${y}) rotate(${angulo}) scale(${escala})`} opacity={opacidad}>
		<path d="M 20 40 C 80 60 90 130 40 170 C 20 185 -6 180 -14 162 C 18 158 40 130 28 92 C 22 72 8 62 -14 56 Z" fill={CUERPO} stroke="#a8906a" strokeWidth={3} />
		<circle cx={0} cy={0} r={70} fill={CUERPO} stroke="#a8906a" strokeWidth={3} />
		<path d="M -22 -64 L -30 -92 L -18 -92 L -8 -68 Z M 18 -68 L 26 -94 L 38 -92 L 32 -62 Z" fill="#c9b189" />
		<circle cx={-34} cy={-10} r={10} fill="#4b3a2a" />
		<g opacity={interior} transform="translate(8 8) scale(0.5)">
			<Mosquito x={0} y={0} alas={0.6} aleteo={0} silueta />
		</g>
	</g>
);

const Mosquito: React.FC<{x: number; y: number; escala?: number; alas?: number; aleteo?: number; angulo?: number; hembra?: boolean; silueta?: boolean; lleno?: number}> = ({
	x,
	y,
	escala = 1,
	alas = 1,
	aleteo = 1,
	angulo = 0,
	hembra = true,
	silueta = false,
	lleno = 0,
}) => {
	const frame = useCurrentFrame();
	const color = silueta ? '#6d5a3f' : '#2c2a2e';
	const giro = aleteo > 0 ? Math.sin(frame * 2.2) * 26 * aleteo : 0;
	const patas: [number, number, number, number, number, number][] = [
		[18, 12, 58, 34, 76, 96],
		[2, 16, 22, 60, 16, 118],
		[-14, 14, -40, 60, -74, 112],
	];
	return (
		<g transform={`translate(${x} ${y}) rotate(${angulo}) scale(${escala})`}>
			<g transform={`rotate(${-18 - giro})`}>
				<ellipse cx={-72} cy={-44 * alas} rx={92 * alas} ry={24 * alas} fill="#d7eef5" stroke="#7fa6b3" strokeWidth={2} opacity={0.8} transform="rotate(14)" />
			</g>
			{patas.map(([a, b, c, d, e, f], i) => (
				<polyline key={i} points={`${a},${b} ${c},${d} ${e},${f}`} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" />
			))}
			<ellipse cx={-86} cy={12} rx={68} ry={17} fill={color} transform="rotate(-6 -86 12)" />
			<ellipse cx={-86} cy={12} rx={60} ry={13} fill="#c0392b" opacity={lleno} transform="rotate(-6 -86 12)" />
			{[0, 1, 2, 3].map((i) => (
				<rect key={i} x={-126 + i * 24} y={-2} width={8} height={28} fill={silueta ? '#8d7a5b' : '#e8e6df'} opacity={0.75} />
			))}
			<ellipse cx={0} cy={0} rx={34} ry={25} fill={color} />
			<circle cx={42} cy={-6} r={17} fill={color} />
			<circle cx={49} cy={-10} r={7} fill={silueta ? '#c9b189' : '#a43d33'} />
			<line x1={54} y1={0} x2={124} y2={24} stroke={color} strokeWidth={4} strokeLinecap="round" />
			<path d={hembra ? 'M 48 -18 Q 74 -40 94 -30' : 'M 48 -18 Q 66 -60 92 -44 M 52 -18 Q 82 -46 100 -24'} fill="none" stroke={color} strokeWidth={hembra ? 3 : 5} />
			<g transform={`rotate(${-10 + giro})`}>
				<ellipse cx={-64} cy={-54 * alas} rx={96 * alas} ry={25 * alas} fill="#eaf7fb" stroke="#7fa6b3" strokeWidth={2} opacity={0.85} transform="rotate(14)" />
			</g>
		</g>
	);
};

const Bacteria: React.FC<{x: number; y: number; opacidad?: number; indice: number}> = ({x, y, opacidad = 1, indice}) => (
	<ellipse cx={x} cy={y} rx={13} ry={6} fill="#a3e8b5" opacity={opacidad} transform={`rotate(${indice * 47} ${x} ${y})`} />
);

const Pared: React.FC = () => <rect x={90} y={280} width={44} height={1640} fill="#d6e6e6" stroke="#a9c3c6" strokeWidth={3} />;

const HUEVOS: [number, number, number][] = [
	[168, 772, -12],
	[172, 804, 8],
	[166, 836, -6],
	[186, 760, 16],
	[192, 792, -14],
	[190, 824, 10],
	[176, 860, -8],
];

const CicloAnillo: React.FC<{cx: number; cy: number; r: number; aparicion: number; giro: number; roto?: number}> = ({cx, cy, r, aparicion, giro, roto = 0}) => {
	const etapas: [string, number][] = [
		['HUEVO', -90],
		['LARVA', 0],
		['PUPA', 90],
		['ADULTO', 180],
	];
	return (
		<g transform={`translate(${cx} ${cy}) scale(${0.6 + aparicion * 0.4})`} opacity={aparicion}>
			<circle r={r} fill="rgba(10,40,52,0.88)" />
			<circle r={r - 70} fill="none" stroke={ACENTO} strokeWidth={10} strokeDasharray="60 22" transform={`rotate(${giro})`} />
			{etapas.map(([nombre, angulo]) => {
				const x = Math.cos((angulo * Math.PI) / 180) * (r - 70);
				const y = Math.sin((angulo * Math.PI) / 180) * (r - 70);
				return (
					<g key={nombre} transform={`translate(${x} ${y})`}>
						<circle r={92} fill="#134b5e" stroke={ACENTO} strokeWidth={4} />
						{nombre === 'HUEVO' ? <Huevo x={0} y={-16} escala={1.5} /> : null}
						{nombre === 'LARVA' ? <Larva x={-34} y={-18} escala={0.3} /> : null}
						{nombre === 'PUPA' ? <Pupa x={-4} y={-30} escala={0.32} /> : null}
						{nombre === 'ADULTO' ? <Mosquito x={8} y={-28} escala={0.36} aleteo={0.4} /> : null}
						<Rotulo x={0} y={52} texto={nombre} tam={26} />
					</g>
				);
			})}
			{roto > 0 ? (
				<>
					<line x1={-r * 0.8 * roto} y1={-r * 0.8 * roto} x2={r * 0.8 * roto} y2={r * 0.8 * roto} stroke="#ff5a4f" strokeWidth={34} strokeLinecap="round" />
					<line x1={r * 0.8 * roto} y1={-r * 0.8 * roto} x2={-r * 0.8 * roto} y2={r * 0.8 * roto} stroke="#ff5a4f" strokeWidth={34} strokeLinecap="round" />
				</>
			) : null}
		</g>
	);
};

type PropsEscena = {cue: (palabra: string) => number; frame: number; duracion: number};

const VisualGancho: React.FC<PropsEscena> = ({frame, duracion}) => {
	const etapas = ['HUEVO', 'LARVA', 'PUPA', 'ADULTO'];
	const encendida = Math.min(3, Math.floor((frame / duracion) * 4.4));
	return (
		<>
			<Agua nivel={640} />
			<Rotulo x={540} y={300} texto="7 a 10 días" tam={118} color={TINTA} opacidad={avance(frame, 0)} />
			<Rotulo x={540} y={378} texto="de huevo a mosquito" tam={46} color={TINTA} opacidad={avance(frame, 12)} />
			<Mosquito x={420 + Math.sin(frame / 16) * 260} y={520 + Math.sin(frame / 7) * 44} escala={0.62} hembra={false} />
			{etapas.map((nombre, i) => {
				const x = 150 + i * 260;
				const activa = i <= encendida;
				return (
					<g key={nombre} opacity={activa ? 1 : 0.28}>
						<circle cx={x} cy={950} r={108} fill={i === encendida ? '#1b6b82' : '#114455'} stroke={activa ? ACENTO : '#7fb0bd'} strokeWidth={5} />
						{i === 0 ? <Huevo x={x} y={944} escala={2} /> : null}
						{i === 1 ? <Larva x={x - 44} y={942} escala={0.38} /> : null}
						{i === 2 ? <Pupa x={x - 4} y={916} escala={0.42} /> : null}
						{i === 3 ? <Mosquito x={x + 14} y={920} escala={0.42} aleteo={0.5} /> : null}
						<Rotulo x={x} y={1110} texto={nombre} tam={34} />
						{i < 3 ? <Rotulo x={x + 130} y={966} texto="›" tam={70} color={ACENTO} opacidad={activa ? 1 : 0.3} /> : null}
					</g>
				);
			})}
		</>
	);
};

const VisualHuevos: React.FC<PropsEscena> = ({cue, frame}) => {
	const llegada = avance(frame, 0, 40);
	const nivelBaja = avance(frame, cue('secos'), 40);
	const nivel = NIVEL + nivelBaja * 170;
	const oscila = Math.sin(frame / 8) * 8;
	return (
		<>
			<Agua nivel={nivel} />
			<Pared />
			{HUEVOS.map(([x, y, a], i) => {
				const p = avance(frame, cue('algunas') + i * 8, 10);
				return <Huevo key={i} x={x} y={y} angulo={a} escala={p} />;
			})}
			<Mosquito x={interpolate(llegada, [0, 1], [920, 460])} y={interpolate(llegada, [0, 1], [320, 500]) + oscila} escala={1.05} angulo={-10} />
			<line x1={134} x2={1080} y1={NIVEL} y2={NIVEL} stroke={TINTA} strokeWidth={4} strokeDasharray="18 14" opacity={avance(frame, cue('nivel'))} />
			<Rotulo x={1040} y={NIVEL - 20} texto="nivel del agua" tam={40} color={TINTA} ancla="end" opacidad={avance(frame, cue('nivel'))} />
			<Rotulo x={250} y={825} texto="huevos" tam={50} color={TINTA} ancla="start" opacidad={avance(frame, cue('justo'))} />
			<Rotulo x={620} y={1000} texto="Secos, durante meses" tam={50} color={TINTA} opacidad={interpolate(nivelBaja, [0.5, 1], [0, 1], FIJO)} />
		</>
	);
};

const VisualEclosion: React.FC<PropsEscena> = ({cue, frame}) => {
	const sube = avance(frame, cue('sube'), 36);
	const nivel = interpolate(sube, [0, 1], [NIVEL + 170, 660]);
	const abre = cue('abren');
	return (
		<>
			<Agua nivel={nivel} />
			<Pared />
			{HUEVOS.map(([x, y, a], i) => {
				const inicio = abre + i * 5;
				const p = avance(frame, inicio, 14);
				const nado = avance(frame, inicio + 4, 70);
				return (
					<g key={i}>
						<Larva
							x={x + 16 + nado * (260 + i * 90)}
							y={y + nado * (i * 62 - 70)}
							escala={0.18 + nado * 0.34}
							opacidad={avance(frame, inicio + 2, 8)}
							angulo={Math.sin(frame / 9 + i) * 10}
						/>
						<Huevo x={x} y={y} angulo={a} abierto={p} />
					</g>
				);
			})}
			<Rotulo x={620} y={nivel - 34} texto="el agua los cubre" tam={46} color={TINTA} opacidad={interpolate(sube, [0.2, 0.7], [0, 1], FIJO)} />
			<Rotulo x={700} y={1340} texto="larvas" tam={64} opacidad={avance(frame, cue('larvas'))} />
		</>
	);
};

const VisualLarva: React.FC<PropsEscena> = ({cue, frame}) => {
	const superficie = cue('superficie');
	const subir = interpolate(frame, [superficie - 8, superficie + 26], [0, 1], {...FIJO, easing: Easing.inOut(Easing.cubic)});
	const nivel = 520;
	const xLibre = 500 + Math.sin(frame / 15) * 210;
	const yLibre = 950 + Math.sin(frame / 7) * 90;
	const x = interpolate(subir, [0, 1], [xLibre, 540]);
	const y = interpolate(subir, [0, 1], [yLibre, nivel + 306]);
	const come = avance(frame, cue('come'), 6);
	return (
		<>
			<Agua nivel={nivel} />
			{Array.from({length: 16}, (_, i) => {
				const bx = 90 + random(`b-x-${i}`) * 900;
				const by = 640 + random(`b-y-${i}`) * 700;
				const distancia = Math.hypot(bx - xLibre, by - yLibre);
				const engullida = come > 0 && subir < 1 && distancia < 130;
				return <Bacteria key={i} indice={i} x={bx + Math.sin(frame / 18 + i) * 16} y={by + Math.cos(frame / 21 + i) * 12} opacidad={come * (engullida ? 0.12 : 0.95)} />;
			})}
			<Larva x={x} y={y} escala={1.05} angulo={interpolate(subir, [0, 1], [Math.sin(frame / 15) * 14, -90])} ondula={1 - subir * 0.8} />
			<Rotulo x={540} y={300} texto="LARVA" tam={92} color={TINTA} opacidad={avance(frame, 0)} />
			<Rotulo x={760} y={720} texto="bacterias y" tam={40} opacidad={come * (1 - subir)} />
			<Rotulo x={760} y={768} texto="organismos diminutos" tam={40} opacidad={come * (1 - subir)} />
			<Rotulo x={540} y={440} texto="respira aire en la superficie" tam={46} color={TINTA} opacidad={avance(frame, cue('respirar'))} />
		</>
	);
};

const VisualMuda: React.FC<PropsEscena> = ({frame, duracion}) => {
	const mudas = [0.18, 0.46, 0.72].map((f) => f * duracion);
	const tam = mudas.reduce((t, m) => t + avance(frame, m, 8) * 0.28, 0.7);
	return (
		<>
			<Agua nivel={420} />
			<Rotulo x={540} y={270} texto="Muda" tam={92} color={TINTA} opacidad={avance(frame, 0)} />
			{mudas.map((m, i) => {
				const p = avance(frame, m, 40);
				return p > 0 ? (
					<Larva key={i} x={260 - p * 60} y={760 + i * 170 + p * 240} escala={0.7 + i * 0.28} angulo={p * 22} ondula={0} contorno opacidad={0.75 * (1 - p * 0.75)} />
				) : null;
			})}
			<Larva x={330} y={850} escala={tam} ondula={0.7} />
		</>
	);
};

const VisualPupa: React.FC<PropsEscena> = ({cue, frame}) => {
	const cambia = avance(frame, cue('pupa') - 4, 20);
	const noCome = cue('ya');
	const interior = avance(frame, cue('transforma') - 8, 36);
	return (
		<>
			<Agua nivel={520} />
			<Larva x={360} y={880} escala={1.05} ondula={0.6} opacidad={1 - cambia} />
			{Array.from({length: 7}, (_, i) => {
				const x = 1120 - ((frame * 3.4 + i * 180) % 1240);
				return <Bacteria key={i} indice={i} x={x} y={1110 + i * 26 - (i % 3) * 460} opacidad={avance(frame, noCome - 20, 15)} />;
			})}
			<Pupa
				x={540 + Math.sin(frame / 13) * 80}
				y={840 + Math.cos(frame / 11) * 70}
				escala={1.75 * cambia + 0.0001}
				angulo={frame * 3.2 * (1 - interior * 0.95)}
				interior={interior}
				opacidad={cambia}
			/>
			<Rotulo x={540} y={300} texto="PUPA" tam={92} color={TINTA} opacidad={cambia} />
			<Rotulo x={540} y={440} texto="ya no come" tam={54} color={TINTA} opacidad={avance(frame, noCome)} />
		</>
	);
};

const VisualAdulto: React.FC<PropsEscena> = ({cue, frame}) => {
	const nivel = 900;
	const emerge = interpolate(frame, [cue('emerge') - 5, cue('espera') - 3], [0, 1], {...FIJO, easing: Easing.out(Easing.cubic)});
	const alas = interpolate(avance(frame, cue('endurezca') - 12, 30), [0, 1], [0.45, 1]);
	const vuelo = interpolate(frame, [cue('levanta') - 6, cue('levanta') + 26], [0, 1], {...FIJO, easing: Easing.in(Easing.quad)});
	return (
		<>
			<Agua nivel={nivel} />
			<Pupa x={530} y={nivel + 80} escala={1.3} angulo={-4} opacidad={1 - emerge * 0.68} />
			<Mosquito
				x={560 + vuelo * 500}
				y={nivel + 30 - emerge * 145 - vuelo * 880 + Math.sin(frame / 3) * 10 * vuelo}
				escala={0.6 + emerge * 0.65}
				alas={alas}
				aleteo={vuelo}
				angulo={-vuelo * 22}
				hembra={false}
			/>
			<Rotulo x={540} y={300} texto="ADULTO" tam={92} color={TINTA} opacidad={avance(frame, cue('adulto'))} />
			<Rotulo x={540} y={1180} texto="su cuerpo se endurece" tam={46} opacidad={avance(frame, cue('endurezca')) * (1 - vuelo)} />
		</>
	);
};

const Flor: React.FC<{x: number; y: number; p: number}> = ({x, y, p}) => (
	<g transform={`translate(${x} ${y}) scale(${p})`}>
		<path d="M 0 0 C 12 170 -14 280 0 520" fill="none" stroke="#39824f" strokeWidth={15} />
		<path d="M 0 250 C 60 200 110 210 130 240 C 90 280 40 290 0 250 Z" fill="#4da366" />
		{Array.from({length: 8}, (_, i) => (
			<ellipse key={i} cx={0} cy={-64} rx={32} ry={58} fill="#ff8fa5" transform={`rotate(${i * 45})`} />
		))}
		<circle r={36} fill="#ffc846" />
	</g>
);

const VisualComida: React.FC<PropsEscena> = ({cue, frame}) => {
	const solo = avance(frame, cue('solo') - 6, 14);
	const flor = avance(frame, cue('azúcares') - 40, 24);
	return (
		<>
			<Agua nivel={1420} />
			<Flor x={290} y={760} p={flor} />
			<Flor x={760} y={760} p={flor} />
			<Mosquito x={172} y={720} escala={0.92} aleteo={0.15} hembra={false} />
			<Mosquito x={642 - solo * 30} y={720 - solo * 130} escala={0.92 + solo * 0.2} aleteo={0.15 + solo * 0.6} />
			<Rotulo x={290} y={470} texto="MACHO" tam={50} color={TINTA} />
			<Rotulo x={760} y={470 - solo * 110} texto="HEMBRA" tam={50} color={TINTA} />
			<Rotulo x={540} y={300} texto="Azúcares de las plantas" tam={56} color={TINTA} opacidad={flor * (1 - solo)} />
			<Rotulo x={540} y={270} texto="Solo ella pica" tam={70} color="#b32418" opacidad={solo} />
		</>
	);
};

const VisualHembra: React.FC<PropsEscena> = ({cue, frame}) => {
	const proteinas = cue('proteínas');
	const lleno = avance(frame, proteinas - 18, 30);
	const huevos = avance(frame, cue('producir'), 18);
	const parte = avance(frame, cue('busca') - 4, 34);
	const ciclo = avance(frame, cue('ciclo') - 2, 18);
	return (
		<>
			<rect x={0} y={1060} width={1080} height={900} fill="#d9a07c" />
			<rect x={0} y={1060} width={1080} height={24} fill="#c88c67" />
			<Mosquito x={430 + parte * 700} y={930 - parte * 620} escala={1.6} aleteo={parte} angulo={28 - parte * 46} lleno={lleno} />
			<Rotulo x={540} y={300} texto="Proteínas para sus huevos" tam={60} color={TINTA} opacidad={avance(frame, proteinas) * (1 - ciclo)} />
			<g opacity={huevos * Math.max(0, 1 - parte * 3)}>
				<circle cx={780} cy={560} r={170} fill="#fff8e8" stroke={TINTA} strokeWidth={5} />
				{Array.from({length: 7}, (_, i) => (
					<Huevo key={i} x={700 + (i % 4) * 50} y={520 + Math.floor(i / 4) * 60 + (i % 2) * 14} escala={1.25} angulo={i * 24} />
				))}
				<Rotulo x={780} y={680} texto="dentro de ella" tam={32} color={TINTA} />
			</g>
			<CicloAnillo cx={540} cy={740} r={420} aparicion={ciclo} giro={frame * 1.2} />
		</>
	);
};

const VisualCierre: React.FC<PropsEscena> = ({cue, frame}) => {
	const inclina = avance(frame, cue('vaciar') - 3, 24);
	const chorro = interpolate(inclina, [0.45, 0.9], [0, 1], FIJO);
	const corta = avance(frame, cue('cortar') - 4, 18);
	const palabras = ['baldes', 'macetas', 'recipientes'];
	const textos = ['Baldes', 'Macetas', 'Recipientes'];
	return (
		<>
			<Agua nivel={1250} />
			<Rotulo x={540} y={280} texto="Agua estancada" tam={84} color={TINTA} opacidad={avance(frame, cue('estancada')) * (1 - corta)} />
			<g opacity={1 - corta}>
				<g transform={`translate(420 860) rotate(${inclina * 108})`}>
					<path d="M -150 -160 L 150 -160 L 112 170 L -112 170 Z" fill="#6c8f9e" stroke={TINTA} strokeWidth={6} />
					<path d="M -150 -160 A 150 150 0 0 1 150 -160" fill="none" stroke={TINTA} strokeWidth={8} />
					<path d="M -128 -110 L 128 -110 L 104 150 L -104 150 Z" fill="#2d8ba4" opacity={1 - chorro} />
				</g>
				{chorro > 0 ? <path d={`M 600 830 C 720 880 750 1010 780 ${1010 + chorro * 300}`} fill="none" stroke="#2d8ba4" strokeWidth={46 * (1 - chorro * 0.35)} strokeLinecap="round" /> : null}
			</g>
			{palabras.map((p, i) => (
				<Rotulo key={p} x={860} y={520 + i * 76} texto={textos[i]} tam={50} color={TINTA} opacidad={avance(frame, cue(p)) * (1 - corta)} />
			))}
			<CicloAnillo cx={540} cy={760} r={420} aparicion={corta} giro={frame * (1 - corta * 0.9)} roto={avance(frame, cue('cortar') + 10, 12)} />
		</>
	);
};

const VISUALES: Record<string, React.FC<PropsEscena>> = {
	gancho: VisualGancho,
	huevos: VisualHuevos,
	eclosion: VisualEclosion,
	larva: VisualLarva,
	muda: VisualMuda,
	pupa: VisualPupa,
	adulto: VisualAdulto,
	comida: VisualComida,
	hembra: VisualHembra,
	cierre: VisualCierre,
};

export const EscenaMosquito: React.FC<PropsVisual> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const Visual = VISUALES[escena.id];
	return (
		<AbsoluteFill style={{background: 'linear-gradient(#f3efd9, #cfe9e6)', opacity: avance(frame, 0, 8)}}>
			<svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
				<defs>
					<linearGradient id="agua" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#2f9bb2" />
						<stop offset="100%" stopColor="#0a3a4e" />
					</linearGradient>
				</defs>
				<Visual cue={cuePalabra(escena, fps)} frame={frame} duracion={durationInFrames} />
			</svg>
			<div style={{position: 'absolute', bottom: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
				<div style={{padding: '6px 18px', borderRadius: 6, background: 'rgba(8,30,40,0.72)', fontFamily: 'Arial, sans-serif', fontSize: 28, color: '#e6f3f5'}}>
					{escena.fuente} · Ilustración simplificada
				</div>
			</div>
		</AbsoluteFill>
	);
};
