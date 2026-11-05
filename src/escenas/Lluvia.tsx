import {AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {PropsVisual} from '../Armazon';

const Sol: React.FC<{x: number; y: number}> = ({x, y}) => {
	const frame = useCurrentFrame();
	return (
		<g transform={`translate(${x} ${y})`}>
			<g transform={`rotate(${frame * 1.2})`}>
				{Array.from({length: 12}, (_, i) => (
					<rect key={i} x={-9} y={-175} width={18} height={50} rx={9} fill="#ffb703" transform={`rotate(${i * 30})`} />
				))}
			</g>
			<circle r={110} fill="#ffd166" />
			<circle cx={-36} cy={-16} r={11} fill="#1f2d3d" />
			<circle cx={36} cy={-16} r={11} fill="#1f2d3d" />
			<path d="M -38 26 Q 0 66 38 26" stroke="#1f2d3d" strokeWidth={9} fill="none" strokeLinecap="round" />
		</g>
	);
};

const Nube: React.FC<{x: number; y: number; escala: number; color?: string}> = ({x, y, escala, color = '#ffffff'}) => (
	<g transform={`translate(${x} ${y}) scale(${escala})`} fill={color}>
		<circle cx={-130} cy={20} r={85} />
		<circle cx={-20} cy={-35} r={120} />
		<circle cx={110} cy={15} r={95} />
		<rect x={-210} y={20} width={420} height={85} rx={42} />
		<circle cx={-55} cy={0} r={11} fill="#1f2d3d" />
		<circle cx={45} cy={0} r={11} fill="#1f2d3d" />
		<path d="M -30 38 Q 0 64 28 38" stroke="#1f2d3d" strokeWidth={8} fill="none" strokeLinecap="round" />
	</g>
);

const Gota: React.FC<{x: number; y: number; opacidad?: number; escala?: number}> = ({x, y, opacidad = 1, escala = 1}) => (
	<path
		d="M 0 -30 C 16 -6 22 6 22 16 A 22 22 0 0 1 -22 16 C -22 6 -16 -6 0 -30 Z"
		transform={`translate(${x} ${y}) scale(${escala})`}
		fill="#3a86ff"
		opacity={opacidad}
	/>
);

const Mar: React.FC = () => {
	const frame = useCurrentFrame();
	const onda = (base: number, fase: number) => {
		let d = `M 0 ${base}`;
		for (let x = 0; x <= 1080; x += 30) {
			d += ` L ${x} ${base + Math.sin(x / 90 + frame / 14 + fase) * 16}`;
		}
		return `${d} L 1080 1920 L 0 1920 Z`;
	};
	return (
		<>
			<path d={onda(1180, 0)} fill="#74c0fc" />
			<path d={onda(1250, 2)} fill="#339af0" />
		</>
	);
};

export const EscenaLluvia: React.FC<PropsVisual> = ({escena}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const entrada = spring({frame, fps, config: {damping: 13}});

	return (
		<AbsoluteFill style={{background: escena.id === 'lluvia' ? '#a5b8cc' : escena.id === 'nube' ? '#a9dcf5' : '#c9ecff'}}>
			<svg viewBox="0 0 1080 1920" width="100%" height="100%">
				{escena.id !== 'lluvia' && escena.id !== 'nube' ? <Sol x={810} y={290} /> : null}

				{escena.id === 'mar'
					? [0, 1, 2].map((i) => {
							const salto = Math.abs(Math.sin((frame + i * 18) / 15));
							return <Gota key={i} x={300 + i * 240} y={1170 - salto * 260} escala={2 * entrada} />;
						})
					: null}

				{escena.id === 'vapor'
					? Array.from({length: 16}, (_, i) => {
							const ciclo = ((frame + i * 11) % 90) / 90;
							return (
								<circle
									key={i}
									cx={110 + random(`vapor-x-${i}`) * 860 + Math.sin(ciclo * 7 + i) * 26}
									cy={1180 - ciclo * 800}
									r={16 + ciclo * 24}
									fill="#ffffff"
									opacity={Math.sin(ciclo * Math.PI) * 0.85}
								/>
							);
						})
					: null}

				{escena.id === 'nube' ? (
					<>
						{Array.from({length: 18}, (_, i) => {
							const t = interpolate(frame, [i * 3, durationInFrames * 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
							return (
								<Gota
									key={i}
									x={interpolate(t, [0, 1], [80 + random(`nube-x-${i}`) * 920, 540])}
									y={interpolate(t, [0, 1], [1050 - random(`nube-y-${i}`) * 300, 480])}
									opacidad={1 - t}
									escala={0.7}
								/>
							);
						})}
						<Nube x={540} y={460} escala={0.5 + entrada * 0.9} />
					</>
				) : null}

				{escena.id === 'lluvia' ? (
					<>
						<Nube x={300} y={340} escala={1.15} color="#dfe7ef" />
						<Nube x={790} y={410} escala={1.05} color="#eef2f6" />
						{Array.from({length: 34}, (_, i) => (
							<Gota
								key={i}
								x={40 + random(`lluvia-x-${i}`) * 1000}
								y={500 + ((frame * 17 + random(`lluvia-y-${i}`) * 800) % 750)}
								escala={0.9}
							/>
						))}
					</>
				) : null}

				<Mar />
			</svg>
		</AbsoluteFill>
	);
};
