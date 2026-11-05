import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Escena, PropsVisual} from '../Armazon';

const FUERTE = '"Arial Black", Arial, sans-serif';
const SANS = 'Arial, sans-serif';
const FONDO = '#07131f';
const CELULA = '#12324a';
const CIAN = '#5fd8e8';
const ROSA = '#ff4f8b';
const ORO = '#f2c14e';
const VERDE = '#6fe08a';
const ROJO = '#e4572e';
const AZUL = '#4f8df0';
const BLANCO = '#f2f6f9';
const TENUE = '#8ea5b7';

// Cuadro en el que la narración dice una palabra, para que la imagen acompañe a la voz.
const cue = (escena: Escena, palabra: string, fps: number) => {
	const encontrada = escena.palabras.find((p) => p.t.toLowerCase().includes(palabra));
	return encontrada ? Math.round(encontrada.ini * fps) : 0;
};

const rampa = (frame: number, desde: number, duracion = 14) =>
	interpolate(frame, [desde, desde + duracion], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.cubic),
	});

const entre = (a: number, b: number, t: number) => a + (b - a) * t;

const useSalto = (desde: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - desde, fps, config: {damping: 12, stiffness: 170}});
};

const Lienzo: React.FC<{children: React.ReactNode}> = ({children}) => (
	<svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
		{children}
	</svg>
);

const Titular: React.FC<{texto: string; detalle?: string; desde?: number}> = ({texto, detalle, desde = 0}) => {
	const frame = useCurrentFrame();
	const entra = rampa(frame, desde, 10);
	return (
		<div style={{position: 'absolute', top: 170, left: 50, right: 50, textAlign: 'center', opacity: entra, transform: `translateY(${(1 - entra) * -20}px)`}}>
			<div style={{fontFamily: FUERTE, fontSize: 72, lineHeight: 1.08, color: BLANCO, textShadow: '0 4px 20px #000'}}>{texto}</div>
			{detalle ? <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: ORO, marginTop: 12, textShadow: '0 0 4px #000, 0 2px 12px #000'}}>{detalle}</div> : null}
		</div>
	);
};

const Sello: React.FC<{texto: string; desde: number; y: number; color?: string}> = ({texto, desde, y, color = ORO}) => {
	const salto = useSalto(desde);
	return (
		<div style={{position: 'absolute', top: y, left: 40, right: 40, display: 'flex', justifyContent: 'center'}}>
			<div style={{padding: '14px 30px', borderRadius: 8, background: color, color: FONDO, fontFamily: FUERTE, fontSize: 46, textAlign: 'center', opacity: Math.min(salto, 1), transform: `scale(${salto})`}}>{texto}</div>
		</div>
	);
};

const Pie: React.FC<{fuente?: string; foto?: string}> = ({fuente, foto}) => (
	<div style={{position: 'absolute', bottom: 190, left: 50, right: 50, textAlign: 'center', fontFamily: SANS, fontSize: 25, lineHeight: 1.3, color: '#d5dde6', textShadow: '0 1px 6px #000'}}>
		{fuente ? <div>Fuente: {fuente}</div> : null}
		<div>{foto ?? 'Ilustración simplificada'}</div>
	</div>
);

const Foto: React.FC<{nombre: string; top: number; alto: number; posicion?: string; rotulo: string; salida?: number}> = ({nombre, top, alto, posicion = 'center', rotulo, salida = 1}) => {
	const frame = useCurrentFrame();
	return (
		<div style={{position: 'absolute', top, left: 60, right: 60, height: alto, borderRadius: 10, overflow: 'hidden', background: '#000', opacity: salida}}>
			<Img src={staticFile(`fotos/virus/${nombre}.jpg`)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: posicion, transform: `scale(${1.03 + frame * 0.0005})`}} />
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 18px', background: 'rgba(7,19,31,0.82)', fontFamily: SANS, fontWeight: 700, fontSize: 31, color: BLANCO}}>{rotulo}</div>
		</div>
	);
};

const Virus: React.FC<{x: number; y: number; escala?: number; opacidad?: number; punta?: string}> = ({x, y, escala = 1, opacidad = 1, punta = ROSA}) => {
	const frame = useCurrentFrame();
	return (
		<g transform={`translate(${x} ${y}) scale(${escala}) rotate(${frame * 0.7})`} opacity={opacidad}>
			{Array.from({length: 12}, (_, i) => (
				<g key={i} transform={`rotate(${i * 30})`}>
					<line y1={-58} y2={-88} stroke={punta} strokeWidth={7} />
					<circle cy={-92} r={10} fill={punta} />
				</g>
			))}
			<circle r={62} fill="#7d1f49" stroke={ROSA} strokeWidth={7} />
			<path d="M -28 -12 C -10 -34 8 12 28 -10 M -28 14 C -10 -8 8 38 28 16" fill="none" stroke="#ffc2d8" strokeWidth={6} />
		</g>
	);
};

// Doble hélice vertical que sube sin fin; algunos peldaños son de origen viral.
const Helice: React.FC<{cx?: number; rosa: number; brillo?: number; opacidad?: number}> = ({cx = 540, rosa, brillo = 0, opacidad = 1}) => {
	const frame = useCurrentFrame();
	const paso = 34;
	const total = 62;
	return (
		<g opacity={opacidad} mask="url(#velo-helice)">
			<defs>
				<linearGradient id="grad-helice" x1={0} y1={0} x2={0} y2={1}>
					<stop offset="0.09" stopColor="#fff" stopOpacity={0.12} />
					<stop offset="0.2" stopColor="#fff" stopOpacity={1} />
					<stop offset="0.64" stopColor="#fff" stopOpacity={1} />
					<stop offset="0.74" stopColor="#fff" stopOpacity={0} />
				</linearGradient>
				<mask id="velo-helice" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
					<rect width={1080} height={1920} fill="url(#grad-helice)" />
				</mask>
			</defs>
			{Array.from({length: total}, (_, i) => {
				const y = ((i * paso - frame * 1.6) % (total * paso) + total * paso) % (total * paso) - 120;
				const fase = i * 0.42;
				const a = Math.sin(fase) * 210;
				const viral = i % 12 === 5;
				const color = viral && rosa > 0 ? ROSA : CIAN;
				return (
					<g key={i}>
						<line x1={cx - a} x2={cx + a} y1={y} y2={y} stroke={color} strokeWidth={viral ? entre(6, 13 + brillo * 6, rosa) : 6} opacity={viral ? entre(0.55, 1, rosa) : 0.45} />
						<circle cx={cx - a} cy={y} r={11} fill={CIAN} opacity={0.85} />
						<circle cx={cx + a} cy={y} r={11} fill={AZUL} opacity={0.85} />
					</g>
				);
			})}
		</g>
	);
};

type Tramo = {x: number; ancho: number; color: string; opacidad?: number};
// Cadena de ADN horizontal con tramos resaltados.
const Cadena: React.FC<{x: number; y: number; ancho: number; tramos?: Tramo[]; opacidad?: number}> = ({x, y, ancho, tramos = [], opacidad = 1}) => (
	<g opacity={opacidad}>
		{Array.from({length: Math.floor(ancho / 22)}, (_, i) => (
			<line key={i} x1={x + i * 22 + 8} x2={x + i * 22 + 8} y1={y - 22} y2={y + 22} stroke={CIAN} strokeWidth={5} opacity={0.55} />
		))}
		{tramos.map((t, i) => (
			<rect key={i} x={t.x} y={y - 28} width={t.ancho} height={56} rx={6} fill={t.color} opacity={t.opacidad ?? 1} />
		))}
		<line x1={x} x2={x + ancho} y1={y - 24} y2={y - 24} stroke={CIAN} strokeWidth={8} strokeLinecap="round" />
		<line x1={x} x2={x + ancho} y1={y + 24} y2={y + 24} stroke={AZUL} strokeWidth={8} strokeLinecap="round" />
	</g>
);

const Gancho: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ocho = cue(escena, 'ocho', fps);
	const salto = useSalto(ocho);
	const rosa = rampa(frame, ocho - 4, 10);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Helice rosa={rosa} brillo={rampa(frame, cue(escena, 'retrovirus', fps), 10)} />
			</Lienzo>
			<Titular texto="Virus en tu ADN" />
			<div style={{position: 'absolute', top: 620, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(salto, 1), transform: `scale(${salto})`}}>
				<div style={{padding: '20px 54px', borderRadius: 14, background: 'rgba(7,19,31,0.9)', textAlign: 'center'}}>
					<div style={{fontFamily: FUERTE, fontSize: 200, lineHeight: 1, color: ROSA}}>8 %</div>
					<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: BLANCO}}>de tu genoma, aprox.</div>
				</div>
			</div>
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Infeccion: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const entra = cue(escena, 'entra', fps);
	const copia = cue(escena, 'copia', fps);
	const ovulo = cue(escena, 'óvulo', fps);
	const hereda = cue(escena, 'hereda', fps);
	const generacion = cue(escena, 'generación', fps);

	const viaje = rampa(frame, entra - 6, 22);
	const fragmento = rampa(frame, copia, 24);
	const insertado = frame >= copia + 24;
	const celula = 1 - rampa(frame, ovulo - 4, 12);
	const herencia = rampa(frame, ovulo, 12);
	const filas = [
		{etiqueta: 'Óvulo o espermatozoide', desde: ovulo, y: 560},
		{etiqueta: 'Hijos', desde: hereda, y: 820},
		{etiqueta: 'Nietos', desde: generacion, y: 1080},
	];
	return (
		<AbsoluteFill>
			<Lienzo>
				<g opacity={celula}>
					<circle cx={540} cy={860} r={440} fill={CELULA} stroke={CIAN} strokeWidth={8} />
					<circle cx={540} cy={960} r={235} fill="#0b2235" stroke={AZUL} strokeWidth={6} />
					<Cadena x={350} y={960} ancho={380} tramos={insertado ? [{x: 495, ancho: 90, color: ROSA}] : []} />
					{frame >= copia && !insertado ? <rect x={495} y={entre(600, 932, fragmento)} width={90} height={56} rx={6} fill={ROSA} /> : null}
					<Virus x={540} y={entre(190, 520, viaje)} escala={0.95} opacidad={1 - rampa(frame, copia + 4, 16) * 0.75} />
				</g>
				{filas.map((f) => (
					<g key={f.etiqueta} opacity={herencia * rampa(frame, f.desde, 10)}>
						<text x={540} y={f.y - 60} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={44} fill={BLANCO}>{f.etiqueta}</text>
						<Cadena x={150} y={f.y} ancho={780} tramos={[{x: 495, ancho: 90, color: ROSA}]} />
					</g>
				))}
			</Lienzo>
			{herencia > 0 ? <Titular texto="La copia se hereda" desde={ovulo} /> : null}
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Restos: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const danadas = cue(escena, 'dañadas', fps);
	const reutilizo = cue(escena, 'reutilizó', fps);
	const apagado = rampa(frame, danadas, 18);
	const usa = useSalto(reutilizo);
	const posiciones = [[130, 560], [510, 560], [780, 560], [290, 840], [640, 840], [130, 1120], [470, 1120], [800, 1120]];
	return (
		<AbsoluteFill>
			<Lienzo>
				{[560, 840, 1120].map((y) => <Cadena key={y} x={80} y={y} ancho={920} />)}
				{posiciones.map(([x, y], i) => {
					const elegida = i === 4;
					return (
						<g key={i}>
							<rect x={x} y={y - 28} width={140} height={56} rx={6} fill={elegida && frame >= reutilizo ? ORO : ROSA} opacity={elegida && frame >= reutilizo ? 1 : entre(1, 0.28, apagado)} transform={elegida && frame >= reutilizo ? `translate(${x + 70} ${y}) scale(${1 + usa * 0.18}) translate(${-x - 70} ${-y})` : undefined} />
							{!elegida || frame < reutilizo ? <path d={`M ${x + 48} ${y - 22} L ${x + 92} ${y + 22} M ${x + 92} ${y - 22} L ${x + 48} ${y + 22}`} stroke={BLANCO} strokeWidth={8} opacity={apagado} /> : null}
						</g>
					);
				})}
			</Lienzo>
			<Titular texto="Copias dañadas" desde={danadas} />
			<Sello texto="Reutilizada" desde={reutilizo} y={920} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Llave: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const proteina = cue(escena, 'proteína', fps);
	const fusion = cue(escena, 'fusionarse', fps);
	const acerca = rampa(frame, proteina, Math.max(fusion - proteina, 8));
	const funde = rampa(frame, fusion, 24);
	return (
		<AbsoluteFill>
			<Foto nombre="retrovirus" top={170} alto={480} rotulo="Retrovirus al microscopio (VIH)" />
			<Lienzo>
				<path d="M 0 1270 Q 540 1160 1080 1270 L 1080 1460 L 0 1460 Z" fill={CELULA} />
				<path d="M 0 1270 Q 540 1160 1080 1270" fill="none" stroke={CIAN} strokeWidth={10} />
				<Virus x={540} y={entre(800, 1095, acerca) + funde * 150} escala={entre(1, 0.25, funde)} opacidad={1 - rampa(frame, fusion + 12, 12)} punta={ORO} />
				{funde > 0 ? <circle cx={540} cy={1215} r={funde * 100} fill={ORO} opacity={0.75 - funde * 0.55} /> : null}
				<text x={540} y={1390} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={44} fill={TENUE}>Célula</text>
			</Lienzo>
			<Pie fuente={escena.fuente} foto="Foto: CDC / C. Goldsmith, dominio público" />
		</AbsoluteFill>
	);
};

const Placenta: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const sincitina = cue(escena, 'sincitina', fps);
	const fusionar = cue(escena, 'fusionar', fps);
	const capa = cue(escena, 'capa', fps);
	const funde = rampa(frame, fusionar, 26);
	const rotulo = useSalto(sincitina);
	const sangre = rampa(frame, capa, 16);
	const celulas = [130, 295, 460, 625, 790, 955];
	const yCapa = 860;
	return (
		<AbsoluteFill>
			<Lienzo>
				<rect x={0} y={460} width={1080} height={290} fill={ROJO} opacity={sangre * 0.5} />
				<rect x={0} y={970} width={1080} height={290} fill={AZUL} opacity={sangre * 0.55} />
				<rect x={40} y={yCapa - 85} width={1000} height={170} rx={85} fill={CELULA} stroke={CIAN} strokeWidth={8} opacity={funde} />
				{celulas.map((x) => (
					<g key={x}>
						<circle cx={x} cy={yCapa} r={80} fill={CELULA} stroke={CIAN} strokeWidth={8} opacity={1 - funde} />
						<circle cx={x} cy={yCapa} r={23} fill={AZUL} />
					</g>
				))}
				{celulas.slice(0, 5).map((x) => (
					<g key={x} transform={`translate(${x + 82} ${yCapa}) scale(${rotulo})`}>
						<rect x={-13} y={-34} width={26} height={68} rx={8} fill={ORO} opacity={1 - funde * 0.85} />
					</g>
				))}
				<g opacity={sangre}>
					<text x={540} y={620} textAnchor="middle" fontFamily={FUERTE} fontSize={54} fill={BLANCO}>Sangre de la madre</text>
					<text x={540} y={1130} textAnchor="middle" fontFamily={FUERTE} fontSize={54} fill={BLANCO}>Sangre del feto</text>
				</g>
			</Lienzo>
			<Titular texto="Sincitina" detalle="Fusiona células de la placenta" desde={sincitina} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Matiz: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const evolucion = cue(escena, 'evolución', fps);
	const aprovecho = cue(escena, 'aprovechó', fps);
	const separa = rampa(frame, evolucion, 16);
	const encaja = rampa(frame, aprovecho, 18);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Virus x={540} y={560} escala={1.6} opacidad={1 - separa * 0.85} />
				<path d="M 180 1160 C 180 900 900 900 900 1160 Z" fill={CELULA} stroke={CIAN} strokeWidth={8} />
				<rect x={entre(525, 525, encaja) - 14} y={entre(630, 960, encaja)} width={58} height={110} rx={12} fill={ORO} opacity={separa} />
				<text x={540} y={1120} textAnchor="middle" fontFamily={FUERTE} fontSize={56} fill={BLANCO}>Placenta</text>
			</Lienzo>
			<Titular texto="No la crearon" detalle={frame >= evolucion ? 'La evolución aprovechó una pieza' : undefined} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Defensa: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const encender = cue(escena, 'encender', fps);
	const inmune = cue(escena, 'trabaja', fps);
	const genes = [{x: 420, ancho: 120}, {x: 620, ancho: 120}, {x: 820, ancho: 120}];
	const escudo = useSalto(inmune);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Cadena x={70} y={640} ancho={940} tramos={[
					{x: 150, ancho: 140, color: ROSA},
					...genes.map((g, i) => ({...g, color: frame >= encender + i * 8 ? VERDE : '#40586b'})),
				]} />
				<text x={220} y={570} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={36} fill={ROSA}>Resto viral</text>
				<text x={680} y={570} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={36} fill={frame >= encender ? VERDE : TENUE}>Genes de defensa</text>
				{genes.map((g, i) => (
					<path key={g.x} d={`M 290 700 Q ${(290 + g.x) / 2} ${780 + i * 40} ${g.x + 60} 700`} fill="none" stroke={ORO} strokeWidth={6} strokeDasharray="14 12" opacity={rampa(frame, encender + i * 8, 8)} />
				))}
				<g transform={`translate(540 1120) scale(${escudo * 1.7})`} opacity={Math.min(escudo, 1)}>
					<path d="M 0 -110 L 90 -76 V 10 C 90 66 44 98 0 118 C -44 98 -90 66 -90 10 V -76 Z" fill={VERDE} stroke={BLANCO} strokeWidth={6} />
					<path d="M -40 2 L -8 36 L 44 -32" fill="none" stroke={FONDO} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round" />
				</g>
			</Lienzo>
			<Titular texto="Interruptores de defensa" />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Seleccion: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const resistian = cue(escena, 'resistían', fps);
	const descendencia = cue(escena, 'descendencia', fps);
	const seleccion = cue(escena, 'selección', fps);
	const filas = [
		{y: 560, doradas: 3, desde: 0},
		{y: 800, doradas: 6, desde: descendencia},
		{y: 1040, doradas: 10, desde: descendencia + 14},
	];
	return (
		<AbsoluteFill>
			<Lienzo>
				{filas.map((fila) => (
					<g key={fila.y} opacity={rampa(frame, fila.desde, 12)}>
						{Array.from({length: 12}, (_, i) => {
							const fuerte = i < fila.doradas;
							const x = 110 + i * 78;
							return (
								<g key={i}>
									<circle cx={x} cy={fila.y} r={28} fill={fuerte && frame >= resistian ? ORO : TENUE} />
									<rect x={x - 25} y={fila.y + 32} width={50} height={74} rx={18} fill={fuerte && frame >= resistian ? ORO : TENUE} />
								</g>
							);
						})}
					</g>
				))}
				<Virus x={1000} y={260 + Math.sin(frame / 18) * 18} escala={0.65} />
			</Lienzo>
			<Titular texto="Generación tras generación" />
			<Sello texto="Selección natural" desde={seleccion} y={1270} />
			<Pie fuente={escena.fuente} foto="Ilustración simplificada: las proporciones no son datos reales" />
		</AbsoluteFill>
	);
};

const Viruela: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const diez = cue(escena, 'diez', fps);
	const tres = cue(escena, 'murieron', fps);
	return (
		<AbsoluteFill>
			<Foto nombre="variola" top={170} alto={720} rotulo="Virus de la viruela al microscopio" />
			<Lienzo>
				{Array.from({length: 10}, (_, i) => {
					const x = 140 + i % 5 * 200;
					const y = 980 + Math.floor(i / 5) * 210;
					const marcado = i < 3 && frame >= tres;
					return (
						<g key={i} opacity={rampa(frame, diez + i * 2, 8)}>
							<circle cx={x} cy={y} r={36} fill={marcado ? ROJO : BLANCO} />
							<rect x={x - 33} y={y + 42} width={66} height={92} rx={22} fill={marcado ? ROJO : BLANCO} />
						</g>
					);
				})}
			</Lienzo>
			<Pie fuente={escena.fuente} foto="Foto: CDC / F. Murphy y S. Whitfield, dominio público" />
		</AbsoluteFill>
	);
};

const Jenner: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const vacas = cue(escena, 'vacas', fps);
	const vacuna = cue(escena, 'palabra', fps);
	const palabra = useSalto(vacuna);
	return (
		<AbsoluteFill>
			<Foto nombre="jenner" top={170} alto={720} posicion="center 45%" rotulo="Jenner vacuna a un niño. G. Mélingue, 1879" salida={1 - rampa(frame, vacas, 12)} />
			<Foto nombre="nelmes" top={170} alto={720} posicion="72% 45%" rotulo="Mano con viruela vacuna, libro de Jenner, 1798" salida={rampa(frame, vacas, 12) * (1 - rampa(frame, vacuna + 8, 10) * 0.25)} />
			<div style={{position: 'absolute', top: 930, left: 0, right: 0, textAlign: 'center', fontFamily: FUERTE, fontSize: 120, color: ORO, opacity: rampa(frame, 0, 10)}}>1796</div>
			<div style={{position: 'absolute', top: 1110, left: 0, right: 0, textAlign: 'center', opacity: Math.min(palabra, 1), transform: `scale(${palabra})`}}>
				<span style={{fontFamily: SANS, fontWeight: 700, fontSize: 60, color: BLANCO}}>vaca → </span>
				<span style={{fontFamily: FUERTE, fontSize: 88, color: VERDE}}>vacuna</span>
			</div>
			<Pie fuente={escena.fuente} foto="Imágenes: dominio público; Wellcome Collection, CC BY 4.0" />
		</AbsoluteFill>
	);
};

const HITOS = [{anio: 1796, x: 110, texto: 'Jenner'}, {anio: 1967, x: 680, texto: 'Campaña'}, {anio: 1977, x: 840, texto: 'Último caso natural'}, {anio: 1980, x: 970, texto: 'Erradicada'}];

const Erradicacion: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const campana = cue(escena, 'campaña', fps);
	const erradicada = cue(escena, 'declarada', fps);
	const avance = rampa(frame, cue(escena, 'mil', fps), Math.max(erradicada - cue(escena, 'mil', fps), 10));
	return (
		<AbsoluteFill>
			<Foto nombre="vaccinia" top={170} alto={520} rotulo="Virus vaccinia al microscopio" />
			<Lienzo>
				<line x1={110} x2={970} y1={960} y2={960} stroke="rgba(255,255,255,0.25)" strokeWidth={8} />
				<line x1={110} x2={entre(110, 970, avance)} y1={960} y2={960} stroke={VERDE} strokeWidth={8} />
				{HITOS.map((h, i) => {
					const activo = entre(110, 970, avance) >= h.x - 1 || (i === 1 && frame >= campana);
					return (
						<g key={h.anio} opacity={activo ? 1 : 0.35}>
							<circle cx={h.x} cy={960} r={18} fill={activo ? VERDE : TENUE} />
							<text x={h.x} y={i % 2 ? 900 : 1034} textAnchor={i === 3 ? 'end' : i === 0 ? 'start' : 'middle'} fontFamily={FUERTE} fontSize={42} fill={BLANCO}>{h.anio}</text>
							<text x={h.x} y={i % 2 ? 860 : 1078} textAnchor={i === 3 ? 'end' : i === 0 ? 'start' : 'middle'} fontFamily={SANS} fontWeight={700} fontSize={30} fill={TENUE}>{h.texto}</text>
						</g>
					);
				})}
			</Lienzo>
			<Sello texto="Viruela: erradicada" desde={erradicada} y={1190} color={VERDE} />
			<Pie fuente={escena.fuente} foto="Foto: CDC / C. Goldsmith, dominio público" />
		</AbsoluteFill>
	);
};

const CierreVirus: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const parte = cue(escena, 'parte', fps);
	const somos = cue(escena, 'forma', fps);
	return (
		<AbsoluteFill>
			<Lienzo>
				<Helice rosa={rampa(frame, parte, 12)} brillo={rampa(frame, somos, 10)} />
				<Virus x={200} y={1240} escala={0.8} opacidad={1 - rampa(frame, parte, 18)} />
			</Lienzo>
			<Titular texto="Siguen siendo peligrosos" />
			<Sello texto="También son parte de nosotros" desde={somos} y={820} color={ROSA} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const VISUALES: Record<string, React.FC<{escena: Escena}>> = {
	gancho: Gancho,
	infeccion: Infeccion,
	restos: Restos,
	llave: Llave,
	placenta: Placenta,
	matiz: Matiz,
	defensa: Defensa,
	seleccion: Seleccion,
	viruela: Viruela,
	jenner: Jenner,
	erradicacion: Erradicacion,
	cierre: CierreVirus,
};

export const EscenaVirus: React.FC<PropsVisual> = ({escena}) => {
	const Visual = VISUALES[escena.id];
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, #10283c, ${FONDO} 72%)`}}>
			<Visual escena={escena} />
		</AbsoluteFill>
	);
};
