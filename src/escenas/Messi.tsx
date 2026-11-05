import {AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Escena, PropsVisual} from '../Armazon';

const FUERTE = '"Arial Black", Arial, sans-serif';
const SANS = 'Arial, sans-serif';
const NOCHE = '#0b1320';
const CELESTE = '#75aadb';
const ORO = '#f2c14e';
const BLANCO = '#f4f6f8';
const TENUE = '#9fb0c2';

const CREDITOS: Record<string, string> = {
	messi_barca: 'Ank Kumar, CC BY-SA 4.0',
	messi_arg: 'Bryan Berlin, CC BY-SA 4.0 · Argentina-Egipto, 2026',
	messi_arg2: 'Bryan Berlin, CC BY-SA 4.0 · Argentina-Egipto, 2026',
	messi_miami: 'Bryan Berlin, CC BY-SA 4.0',
	ronaldo: 'Анна Нэсси, CC BY-SA 3.0',
	maradona: 'Dominio público',
	pele: 'AP, dominio público',
	cruyff: 'Rob Mieremet / Anefo, CC0',
	distefano: 'Dominio público',
	mbappe: 'Bryan Berlin, CC BY-SA 4.0',
	haaland: 'Jacek Stanislawek, CC BY-SA 4.0',
};

// Cuadro en el que la narración dice una palabra, para que la imagen acompañe a la voz.
const cue = (escena: Escena, palabra: string, fps: number) => {
	const encontrada = escena.palabras.find((p) => p.t.toLowerCase().includes(palabra));
	return encontrada ? Math.round(encontrada.ini * fps) : 0;
};

const rampa = (frame: number, desde: number, duracion = 12) =>
	interpolate(frame, [desde, desde + duracion], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.cubic),
	});

const useSalto = (desde: number) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - desde, fps, config: {damping: 12, stiffness: 170}});
};

const Foto: React.FC<{nombre: string; posicion?: string; acercar?: number; oscuro?: number; bajar?: number}> = ({nombre, posicion = 'center', acercar = 1.04, oscuro = 0, bajar = 0}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const escala = interpolate(frame, [0, Math.max(durationInFrames, 240)], [acercar, acercar + 0.1]);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: NOCHE}}>
			<Img
				src={staticFile(`fotos/messi/${nombre}.jpg`)}
				style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: posicion, transform: `translateY(${bajar}px) scale(${escala})`, transformOrigin: posicion, maskImage: bajar ? 'linear-gradient(180deg, transparent 0, #000 16%)' : undefined}}
			/>
			<AbsoluteFill style={{background: `rgba(11,19,32,${oscuro})`}} />
		</AbsoluteFill>
	);
};

const Velo: React.FC = () => (
	<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,19,32,0.82) 0%, rgba(11,19,32,0) 24%, rgba(11,19,32,0) 58%, rgba(11,19,32,0.92) 86%)'}} />
);

const Titular: React.FC<{texto: string; detalle?: string; desde?: number}> = ({texto, detalle, desde = 0}) => {
	const frame = useCurrentFrame();
	const entra = rampa(frame, desde);
	return (
		<div style={{position: 'absolute', top: 170, left: 60, right: 60, textAlign: 'center', opacity: entra, transform: `translateY(${(1 - entra) * -24}px)`}}>
			<div style={{fontFamily: FUERTE, fontSize: 84, lineHeight: 1.05, color: BLANCO, textShadow: '0 4px 22px rgba(0,0,0,0.85)'}}>{texto}</div>
			{detalle ? <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: ORO, marginTop: 14, textShadow: '0 0 4px #000, 0 2px 12px #000'}}>{detalle}</div> : null}
		</div>
	);
};

const Sello: React.FC<{texto: string; desde: number; y: number; tenue?: boolean}> = ({texto, desde, y, tenue}) => {
	const salto = useSalto(desde);
	return (
		<div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
			<div
				style={{
					padding: '16px 34px',
					borderRadius: 8,
					background: tenue ? 'rgba(11,19,32,0.88)' : ORO,
					color: tenue ? BLANCO : NOCHE,
					fontFamily: FUERTE,
					fontSize: 50,
					opacity: Math.min(salto, 1),
					transform: `scale(${salto})`,
				}}
			>
				{texto}
			</div>
		</div>
	);
};

const Pie: React.FC<{fuente?: string; foto?: string}> = ({fuente, foto}) => (
	<div style={{position: 'absolute', bottom: 190, left: 50, right: 50, textAlign: 'center', fontFamily: SANS, fontSize: 25, lineHeight: 1.3, color: '#d5dde6', textShadow: '0 1px 6px #000'}}>
		{fuente ? <div>Fuente: {fuente}</div> : null}
		{foto ? <div>Foto: {CREDITOS[foto]}</div> : null}
	</div>
);

const Contador: React.FC<{hasta: number; desde: number; duracion?: number; sufijo?: string; tamano: number; color: string}> = ({hasta, desde, duracion = 26, sufijo = '', tamano, color}) => {
	const frame = useCurrentFrame();
	const valor = Math.round(rampa(frame, desde, duracion) * hasta);
	return <span style={{fontFamily: FUERTE, fontSize: tamano, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{valor}{sufijo}</span>;
};

// Dos jugadores, uno sobre otro, que entran por lados opuestos.
const Pareja: React.FC<{arriba: string; abajo: string; posArriba?: string; posAbajo?: string; desdeAbajo: number}> = ({arriba, abajo, posArriba = 'center', posAbajo = 'center', desdeAbajo}) => {
	const frame = useCurrentFrame();
	const a = rampa(frame, 0, 14);
	const b = rampa(frame, desdeAbajo, 14);
	return (
		<AbsoluteFill style={{background: NOCHE}}>
			<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 955, overflow: 'hidden', transform: `translateX(${(a - 1) * 1080}px)`}}>
				<Foto nombre={arriba} posicion={posArriba} />
			</div>
			<div style={{position: 'absolute', top: 965, left: 0, right: 0, bottom: 0, overflow: 'hidden', transform: `translateX(${(1 - b) * 1080}px)`}}>
				<Foto nombre={abajo} posicion={posAbajo} />
			</div>
		</AbsoluteFill>
	);
};

const Gancho: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	const goles = cue(escena, 'goles', fps);
	const messi = cue(escena, 'messi', fps);
	return (
		<>
			<Pareja arriba="ronaldo" abajo="messi_arg" posArriba="center 20%" posAbajo="center 12%" desdeAbajo={messi} />
			<Velo />
			<div style={{position: 'absolute', top: 760, left: 50, display: 'flex', alignItems: 'baseline', gap: 14, textShadow: '0 3px 16px #000', opacity: rampa(frame, goles, 6)}}>
				<Contador hasta={985} desde={goles} tamano={130} color={BLANCO} />
				<span style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: BLANCO}}>goles</span>
			</div>
			<div style={{position: 'absolute', top: 1320, right: 50, display: 'flex', alignItems: 'baseline', gap: 14, textShadow: '0 3px 16px #000', opacity: rampa(frame, messi, 6)}}>
				<Contador hasta={930} desde={messi} sufijo="+" tamano={130} color={CELESTE} />
				<span style={{fontFamily: SANS, fontWeight: 700, fontSize: 40, color: BLANCO}}>goles</span>
			</div>
			<Sello texto="¿El mejor de la historia?" desde={cue(escena, 'argumento', fps)} y={190} />
			<Pie fuente={escena.fuente} />
		</>
	);
};

const Numeros: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	const goles = cue(escena, 'novecientos', fps);
	const asistencias = cue(escena, 'cuatrocientas', fps);
	const bloque = (desde: number) => ({opacity: rampa(frame, desde), transform: `translateY(${(1 - rampa(frame, desde)) * 50}px)`});
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, #1c3350, ${NOCHE} 72%)`}}>
			<Titular texto="No es un número." detalle="Son dos." />
			<div style={{position: 'absolute', top: 500, left: 0, right: 0, textAlign: 'center', ...bloque(goles)}}>
				<Contador hasta={930} desde={goles} sufijo="+" tamano={210} color={BLANCO} />
				<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 56, color: TENUE}}>GOLES</div>
			</div>
			<div style={{position: 'absolute', top: 870, left: 0, right: 0, textAlign: 'center', ...bloque(asistencias)}}>
				<Contador hasta={420} desde={asistencias} sufijo="+" tamano={210} color={CELESTE} />
				<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 56, color: TENUE}}>ASISTENCIAS</div>
			</div>
			<Sello texto="Récord histórico" desde={cue(escena, 'nadie', fps)} y={1240} />
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

type Punto = [number, number];
const recorrer = (puntos: Punto[], t: number): Punto[] => {
	const tramos = (puntos.length - 1) * Math.min(Math.max(t, 0), 1);
	const i = Math.min(Math.floor(tramos), puntos.length - 2);
	const resto = tramos - i;
	const [a, b] = [puntos[i], puntos[i + 1]];
	return [...puntos.slice(0, i + 1), [a[0] + (b[0] - a[0]) * resto, a[1] + (b[1] - a[1]) * resto]];
};
const trazo = (puntos: Punto[]) => puntos.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');

const Jugador: React.FC<{x: number; y: number; numero: string; color: string; opacidad?: number; r?: number}> = ({x, y, numero, color, opacidad = 1, r = 54}) => (
	<g transform={`translate(${x} ${y})`} opacity={opacidad}>
		<circle r={r} fill={color} stroke={BLANCO} strokeWidth={6} />
		<text textAnchor="middle" y={r * 0.34} fontFamily={FUERTE} fontSize={r * 0.95} fill={NOCHE}>{numero}</text>
	</g>
);

const DEFENSAS: Punto[] = [[300, 860], [560, 800], [800, 880], [420, 590], [690, 600]];
const DIEZ: Punto = [540, 1180];
const NUEVE: Punto = [760, 480];
const ARCO: Punto = [540, 290];

const Fusion: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const crea = cue(escena, 'crea', fps);
	const termina = cue(escena, 'termina', fps);
	const messi = cue(escena, 'messi', fps);

	const pase = recorrer([DIEZ, [660, 820], NUEVE], rampa(frame, crea, 18));
	const remate = recorrer([NUEVE, ARCO], rampa(frame, termina, 12));
	const antesDeMessi = 1 - rampa(frame, messi, 8);

	const juntar = rampa(frame, messi, 12);
	const solo = interpolate(frame, [messi + 14, messi + 62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
	const ruta = recorrer([DIEZ, [430, 1010], [430, 790], [660, 700], [560, 520], [540, 420]], solo);
	const figura = ruta[ruta.length - 1];
	const tiro = recorrer([[540, 420], ARCO], rampa(frame, messi + 62, 8));
	const gol = rampa(frame, messi + 68, 6);
	const fusionado = useSalto(messi + 6);

	return (
		<AbsoluteFill style={{background: NOCHE}}>
			<svg viewBox="0 -80 1080 1920" style={{position: 'absolute', inset: 0}}>
				{Array.from({length: 8}, (_, i) => (
					<rect key={i} x={70} y={250 + i * 150} width={940} height={150} fill={i % 2 ? '#1c5b3a' : '#205f3f'} />
				))}
				<g fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth={5}>
					<rect x={70} y={250} width={940} height={1200} />
					<rect x={270} y={250} width={540} height={230} />
					<circle cx={540} cy={1450} r={150} />
				</g>
				<rect x={440} y={225} width={200} height={28} fill={gol > 0 ? ORO : BLANCO} />
				{DEFENSAS.map(([x, y], i) => (
					<circle key={i} cx={x} cy={y} r={32} fill="#5d6a78" stroke="#c3ccd6" strokeWidth={4} />
				))}
				<g opacity={antesDeMessi}>
					<path d={trazo(pase)} fill="none" stroke={CELESTE} strokeWidth={9} strokeDasharray="20 14" />
					{frame >= termina ? <path d={trazo(remate)} fill="none" stroke={ORO} strokeWidth={10} /> : null}
				</g>
				{juntar > 0 ? <path d={trazo(ruta)} fill="none" stroke={ORO} strokeWidth={11} strokeLinecap="round" /> : null}
				{frame >= messi + 62 ? <path d={trazo(tiro)} fill="none" stroke={ORO} strokeWidth={11} /> : null}
				{juntar < 1 ? (
					<>
						<Jugador x={DIEZ[0]} y={DIEZ[1]} numero="10" color={CELESTE} opacidad={rampa(frame, crea - 6)} />
						<Jugador
							x={NUEVE[0] + (DIEZ[0] - NUEVE[0]) * juntar}
							y={NUEVE[1] + (DIEZ[1] - NUEVE[1]) * juntar}
							numero="9"
							color={BLANCO}
							opacidad={rampa(frame, crea + 6)}
						/>
					</>
				) : (
					<Jugador x={figura[0]} y={figura[1]} numero="10·9" color={ORO} r={46 + fusionado * 16} />
				)}
			</svg>
			<Titular texto={frame >= messi ? 'Messi: los dos' : 'Crear o terminar'} />
			{gol > 0 ? <Sello texto="¡GOL!" desde={messi + 68} y={640} /> : null}
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Rival: React.FC<{escena: Escena; foto: string; posicion?: string; titular: string; detalle: string; children?: React.ReactNode}> = ({escena, foto, posicion, titular, detalle, children}) => (
	<>
		<Foto nombre={foto} posicion={posicion} />
		<Velo />
		<Titular texto={titular} detalle={detalle} />
		{children}
		<Pie fuente={escena.fuente} foto={foto} />
	</>
);

const Cristiano: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<Rival escena={escena} foto="ronaldo" posicion="center 15%" titular="Cristiano" detalle="985 goles, el récord">
			<Sello texto="Terminar jugadas ✔" desde={cue(escena, 'terminando', fps)} y={1130} />
			<Sello texto="Crearlas: menos" desde={cue(escena, 'creándolas', fps)} y={1250} tenue />
		</Rival>
	);
};

const Maradona: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<Rival escena={escena} foto="maradona" posicion="center 10%" titular="Maradona" detalle="Genio puro">
			<Sello texto="México 86" desde={cue(escena, 'méxico', fps)} y={1130} />
			<Sello texto="Una cima más breve" desde={cue(escena, 'breve', fps)} y={1250} tenue />
		</Rival>
	);
};

const Copas: React.FC<{cantidad: number; desde: number; y: number; tamano?: number}> = ({cantidad, desde, y, tamano = 130}) => (
	<div style={{position: 'absolute', top: y, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
		{Array.from({length: cantidad}, (_, i) => (
			<CopaSalto key={i} desde={desde + i * 6} tamano={tamano} />
		))}
	</div>
);

const CopaSalto: React.FC<{desde: number; tamano: number}> = ({desde, tamano}) => {
	const salto = useSalto(desde);
	return (
		<svg viewBox="0 0 100 120" width={tamano} height={tamano * 1.2} style={{opacity: Math.min(salto, 1), transform: `scale(${salto})`, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.75))'}}>
			<path d="M 26 10 H 74 V 40 C 74 60 62 70 50 72 C 38 70 26 60 26 40 Z" fill={ORO} />
			<path d="M 26 18 H 10 C 10 44 18 52 30 54 M 74 18 H 90 C 90 44 82 52 70 54" fill="none" stroke={ORO} strokeWidth={7} />
			<rect x={44} y={70} width={12} height={24} fill={ORO} />
			<rect x={28} y={92} width={44} height={16} rx={3} fill="#c99a2e" />
		</svg>
	);
};

const Pele: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<Rival escena={escena} foto="pele" posicion="35% center" titular="Pelé" detalle="El único con tres">
			<Copas cantidad={3} desde={cue(escena, 'tres', fps)} y={1110} />
		</Rival>
	);
};

const Cruyff: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<>
			<Pareja arriba="cruyff" abajo="distefano" posArriba="center 25%" posAbajo="center 18%" desdeAbajo={cue(escena, 'di', fps)} />
			<Velo />
			<Titular texto="Cruyff y Di Stéfano" />
			<Sello texto="Cambiaron el juego" desde={cue(escena, 'cambiaron', fps)} y={800} />
			<Sello texto="Menos goles" desde={cue(escena, 'cifras', fps)} y={1340} tenue />
			<Pie fuente={escena.fuente} />
		</>
	);
};

const Jovenes: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<>
			<Pareja arriba="mbappe" abajo="haaland" posArriba="center 0%" posAbajo="center 35%" desdeAbajo={cue(escena, 'haaland', fps)} />
			<Velo />
			<Titular texto="Mbappé y Haaland" />
			<Sello texto="La vara: 20 años" desde={cue(escena, 'vara', fps)} y={880} />
			<Pie fuente={escena.fuente} />
		</>
	);
};

const BALONES = [2009, 2010, 2011, 2012, 2015, 2019, 2021, 2023];
const INICIO_X = 110;
const ANCHO_LINEA = 860;
const xDeAnio = (anio: number) => INICIO_X + ((anio - 2009) / 14) * ANCHO_LINEA;

const Tiempo: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const inicio = cue(escena, 'dos', fps);
	const fin = cue(escena, 'veintitrés', fps) + 8;
	const avance = interpolate(frame, [inicio, fin], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const ganados = BALONES.filter((anio) => (anio - 2009) / 14 <= avance && frame >= inicio).length;
	const catorce = rampa(frame, cue(escena, 'catorce', fps));
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 35%, #1c3350, ${NOCHE} 75%)`}}>
			<div style={{position: 'absolute', top: 190, left: 0, right: 0, textAlign: 'center'}}>
				<div style={{fontFamily: FUERTE, fontSize: 280, lineHeight: 1, color: ORO}}>{ganados}</div>
				<div style={{fontFamily: FUERTE, fontSize: 62, color: BLANCO}}>Balones de Oro</div>
			</div>
			<svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
				<line x1={INICIO_X} x2={INICIO_X + ANCHO_LINEA} y1={800} y2={800} stroke="rgba(255,255,255,0.25)" strokeWidth={8} />
				<line x1={INICIO_X} x2={INICIO_X + ANCHO_LINEA * avance} y1={800} y2={800} stroke={CELESTE} strokeWidth={8} />
				{BALONES.map((anio) => {
					const activo = (anio - 2009) / 14 <= avance && frame >= inicio;
					return (
						<g key={anio} transform={`translate(${xDeAnio(anio)} 800)`} opacity={activo ? 1 : 0.2}>
							<circle r={activo ? 26 : 18} fill={activo ? ORO : TENUE} stroke={NOCHE} strokeWidth={4} />
							<text textAnchor="middle" y={72} fontFamily={SANS} fontWeight={700} fontSize={32} fill={BLANCO}>{String(anio).slice(2)}</text>
						</g>
					);
				})}
				<g opacity={catorce}>
					<path d={`M ${INICIO_X} 900 V 940 H ${INICIO_X + ANCHO_LINEA} V 900`} fill="none" stroke={ORO} strokeWidth={6} />
					<text x={540} y={1020} textAnchor="middle" fontFamily={FUERTE} fontSize={68} fill={ORO}>14 años</text>
				</g>
			</svg>
			<div style={{position: 'absolute', top: 1060, left: 110, right: 110, height: 370, borderRadius: 10, overflow: 'hidden'}}>
				<Foto nombre="messi_barca" posicion="42% 72%" acercar={1.1} />
			</div>
			<Pie fuente={escena.fuente} foto="messi_barca" />
		</AbsoluteFill>
	);
};

const Confeti: React.FC<{desde: number}> = ({desde}) => {
	const frame = useCurrentFrame();
	if (frame < desde) {
		return null;
	}
	return (
		<svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
			{Array.from({length: 70}, (_, i) => {
				const velocidad = 9 + random(`c-v-${i}`) * 9;
				const y = ((frame - desde) * velocidad + random(`c-y-${i}`) * 500 - 500) % 1950;
				const x = random(`c-x-${i}`) * 1080 + Math.sin((frame + i * 9) / 11) * 24;
				const color = [ORO, CELESTE, BLANCO][i % 3];
				return <rect key={i} x={x} y={y} width={16} height={26} fill={color} transform={`rotate(${frame * 6 + i * 40} ${x} ${y})`} />;
			})}
		</svg>
	);
};

const Titulos: React.FC<{escena: Escena}> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cuatro = cue(escena, 'cuatro', fps);
	const total = cue(escena, 'cuarenta', fps);
	const catar = cue(escena, 'catar', fps);
	const copa = useSalto(catar);
	const apagar = 1 - rampa(frame, catar, 8);
	return (
		<AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #27405f, ${NOCHE} 75%)`}}>
			<div style={{opacity: apagar}}>
				<Titular texto={frame >= cuatro ? '4 Champions' : 'Casi todo'} />
				<Copas cantidad={4} desde={cuatro} y={320} />
				<div style={{position: 'absolute', top: 560, left: 0, right: 0, textAlign: 'center', opacity: rampa(frame, total)}}>
					<Contador hasta={47} desde={total} duracion={20} tamano={190} color={BLANCO} />
					<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 52, color: TENUE}}>TÍTULOS</div>
				</div>
			</div>
			<div style={{position: 'absolute', top: 580, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: Math.min(copa, 1), transform: `scale(${copa})`}}>
				<CopaSalto desde={catar} tamano={560} />
			</div>
			<Confeti desde={catar} />
			{frame >= catar ? <Titular texto="Catar 2022" detalle="Campeón del mundo" desde={catar} /> : null}
			<Pie fuente={escena.fuente} />
		</AbsoluteFill>
	);
};

const Dato: React.FC<{valor: string; texto: string; desde: number}> = ({valor, texto, desde}) => {
	const salto = useSalto(desde);
	return (
		<div style={{flex: 1, textAlign: 'center', padding: '20px 8px', borderRadius: 10, background: 'rgba(11,19,32,0.88)', opacity: Math.min(salto, 1), transform: `scale(${salto})`}}>
			<div style={{fontFamily: FUERTE, fontSize: 80, color: ORO, lineHeight: 1.1}}>{valor}</div>
			<div style={{fontFamily: SANS, fontWeight: 700, fontSize: 32, color: BLANCO}}>{texto}</div>
		</div>
	);
};

const Ultimo: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<>
			<Foto nombre="messi_arg2" posicion="center 15%" bajar={120} />
			<Velo />
			<Titular texto="2026, 39 años" detalle="Subcampeón, ante España" desde={cue(escena, 'final', fps) - 10} />
			<div style={{position: 'absolute', top: 1180, left: 50, right: 50, display: 'flex', gap: 18}}>
				<Dato valor="8" texto="goles" desde={cue(escena, 'ocho', fps)} />
				<Dato valor="4" texto="asistencias" desde={cue(escena, 'cuatro', fps)} />
				<Dato valor="🥈" texto="Balón de Plata" desde={cue(escena, 'balón', fps)} />
			</div>
			<Pie fuente={escena.fuente} foto="messi_arg2" />
		</>
	);
};

const Fila: React.FC<{etiqueta: string; valor: string; desde: number}> = ({etiqueta, valor, desde}) => {
	const frame = useCurrentFrame();
	const entra = rampa(frame, desde);
	return (
		<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 34px', marginBottom: 18, borderRadius: 10, background: 'rgba(11,19,32,0.86)', opacity: entra, transform: `translateX(${(1 - entra) * -120}px)`}}>
			<span style={{fontFamily: SANS, fontWeight: 700, fontSize: 46, color: BLANCO}}>{etiqueta}</span>
			<span style={{fontFamily: FUERTE, fontSize: 66, color: ORO}}>{valor}</span>
		</div>
	);
};

const Cierre: React.FC<{escena: Escena}> = ({escena}) => {
	const {fps} = useVideoConfig();
	return (
		<>
			<Foto nombre="messi_arg" posicion="center 12%" bajar={210} />
			<Velo />
			<Titular texto="¿El mejor de la historia?" />
			<div style={{position: 'absolute', top: 960, left: 60, right: 60}}>
				<Fila etiqueta="Gol" valor="930+" desde={cue(escena, 'gol', fps)} />
				<Fila etiqueta="Creación" valor="420+" desde={cue(escena, 'creación', fps)} />
				<Fila etiqueta="Tiempo" valor="22 años" desde={cue(escena, 'tiempo', fps)} />
			</div>
			<Pie fuente={escena.fuente} foto="messi_arg" />
		</>
	);
};

const VISUALES: Record<string, React.FC<{escena: Escena}>> = {
	gancho: Gancho,
	numeros: Numeros,
	fusion: Fusion,
	cristiano: Cristiano,
	maradona: Maradona,
	pele: Pele,
	cruyff: Cruyff,
	jovenes: Jovenes,
	tiempo: Tiempo,
	titulos: Titulos,
	ultimo: Ultimo,
	cierre: Cierre,
};

export const EscenaMessi: React.FC<PropsVisual> = ({escena}) => {
	const Visual = VISUALES[escena.id];
	return (
		<AbsoluteFill style={{background: NOCHE}}>
			<Visual escena={escena} />
		</AbsoluteFill>
	);
};
