import {AbsoluteFill} from 'remotion';

const FONDO = '#05060f';
const TINTA = '#f4f1e8';
const AMBAR = '#ffb627';
const CIAN = '#5fe1f2';
const CORTE = '#10122a';

// La pluma se dispara hacia arriba y a la derecha: entra por abajo a la izquierda y sale por arriba a la derecha.
const CENTRO = {x: 600, y: 470};
const EJE = {x: 0.8, y: -0.6};
const sobreEje = (d: number) => ({x: CENTRO.x + EJE.x * d, y: CENTRO.y + EJE.y * d});
const PUNTA = sobreEje(330);
const ENTRADA = sobreEje(-150);
const SALIDA = sobreEje(150);
const COLA = sobreEje(-440);

const VANE = 'M 0 -130 C -92 -210 -96 -440 -4 -650 C 66 -560 112 -360 68 -210 C 56 -170 28 -146 0 -130 Z';

// Foto de perfil del canal: la pluma venía escribiendo, y su trazo se convierte en el disparo que atraviesa el cráneo. Sin texto.
export const Perfil: React.FC = () => (
	<AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, #1d2146, ${FONDO} 72%)`}}>
		<svg viewBox="0 0 1080 1080" style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="plumaje" x1={0} y1={1} x2={0} y2={0}>
					<stop offset="0" stopColor={AMBAR} />
					<stop offset="1" stopColor={CIAN} />
				</linearGradient>
				<clipPath id="vane">
					<path d={VANE} />
				</clipPath>
			</defs>

			{/* Un solo trazo: la escritura se acelera, da la vuelta y sale en la dirección del disparo. */}
			<g fill="none" stroke={TINTA} strokeLinecap="round" strokeLinejoin="round">
				<path strokeWidth={9} d="M 192 900 C 188 948 226 950 244 900 C 258 864 288 868 278 916 C 272 950 308 948 328 904 C 342 874 370 880 360 922 C 354 950 392 950 416 918 C 440 892 470 900 500 915" />
				<path strokeWidth={13} d="M 500 915 C 600 950 640 850 540 835 C 440 822 300 860 220 835" />
				<path strokeWidth={18} d={`M 220 835 C 170 818 180 770 ${COLA.x} ${COLA.y}`} />
				<path strokeWidth={22} d={`M ${COLA.x} ${COLA.y} L ${ENTRADA.x} ${ENTRADA.y}`} />
			</g>

			<g transform={`translate(${CENTRO.x} ${CENTRO.y}) scale(0.72) translate(-510 -540)`}>
				<path
					d="M 510 330 C 365 330 285 430 285 545 C 285 615 320 665 382 700 L 382 790 C 382 815 404 830 434 830 L 586 830 C 616 830 638 815 638 790 L 638 700 C 700 665 735 615 735 545 C 735 430 655 330 510 330 Z"
					fill={TINTA}
				/>
				<ellipse cx={420} cy={545} rx={64} ry={72} fill={FONDO} />
				<ellipse cx={600} cy={545} rx={64} ry={72} fill={FONDO} />
				<circle cx={420} cy={550} r={20} fill={AMBAR} />
				<circle cx={600} cy={550} r={20} fill={CIAN} />
				<path d="M 510 622 L 478 684 L 542 684 Z" fill={FONDO} stroke={FONDO} strokeWidth={8} strokeLinejoin="round" />
				{[448, 494, 540, 586].map((x) => (
					<rect key={x} x={x - 6} y={752} width={12} height={78} rx={5} fill={FONDO} />
				))}
			</g>

			{/* Agujeros y grietas donde entró y salió. */}
			<g stroke={FONDO} strokeLinecap="round" strokeLinejoin="round" fill="none" strokeWidth={7}>
				<path d={`M ${ENTRADA.x} ${ENTRADA.y} l 34 16 l 22 -18`} />
				<path d={`M ${SALIDA.x} ${SALIDA.y} l -38 -10 l -18 -28`} />
				<path d={`M ${SALIDA.x} ${SALIDA.y} l -14 38 l 10 26`} />
			</g>
			<circle cx={ENTRADA.x} cy={ENTRADA.y} r={22} fill={FONDO} />
			<circle cx={SALIDA.x} cy={SALIDA.y} r={20} fill={FONDO} />

			{/* La tinta sale despedida hacia adelante, en la dirección del disparo. */}
			{[[60, -66, 11], [112, -44, 7], [40, -112, 7], [148, -96, 5], [92, -142, 6]].map(([dx, dy, r]) => (
				<circle key={`${dx}${dy}`} cx={SALIDA.x + dx} cy={SALIDA.y + dy} r={r} fill={TINTA} />
			))}

			{/* La pluma: el tramo dentro del cráneo no se dibuja. */}
			<g transform={`translate(${PUNTA.x} ${PUNTA.y}) rotate(-126.87)`}>
				<rect x={-6} y={-182} width={12} height={92} fill={TINTA} />
				<path d="M 0 0 C -8 -28 -26 -58 -24 -96 L 24 -96 C 26 -58 8 -28 0 0 Z" fill={AMBAR} />
				<rect x={-2} y={-58} width={4} height={56} fill={FONDO} />
				<circle cy={-62} r={7} fill={FONDO} />
				<rect x={-6} y={-772} width={12} height={294} rx={5} fill={TINTA} />
				<g transform="translate(0 -426) scale(0.62 0.529)">
					<path d={VANE} fill="url(#plumaje)" />
					<g clipPath="url(#vane)">
						{[-250, -340, -430, -520].map((y) => (
							<path key={y} d={`M -110 ${y - 54} L -8 ${y} L -110 ${y - 28} Z M 120 ${y - 54} L 8 ${y} L 120 ${y - 28} Z`} fill={CORTE} />
						))}
					</g>
					<rect x={-5} y={-640} width={10} height={510} rx={5} fill={FONDO} opacity={0.55} />
				</g>
			</g>

			{/* Gotas que caen de la punta. */}
			{[[0, 42, 9], [-4, 92, 11], [3, 158, 13], [-2, 240, 15]].map(([dx, dy, r]) => (
				<path key={dy} d={`M ${PUNTA.x + dx} ${PUNTA.y + dy - r * 2} C ${PUNTA.x + dx + r * 0.3} ${PUNTA.y + dy - r} ${PUNTA.x + dx + r} ${PUNTA.y + dy - r * 0.2} ${PUNTA.x + dx + r} ${PUNTA.y + dy + r * 0.3} A ${r} ${r} 0 1 1 ${PUNTA.x + dx - r} ${PUNTA.y + dy + r * 0.3} C ${PUNTA.x + dx - r} ${PUNTA.y + dy - r * 0.2} ${PUNTA.x + dx - r * 0.3} ${PUNTA.y + dy - r} ${PUNTA.x + dx} ${PUNTA.y + dy - r * 2} Z`} fill={TINTA} />
			))}
		</svg>
	</AbsoluteFill>
);
