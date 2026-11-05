import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const COLA_S = 8;
const ENTRADA_MUSICA_S = 5;
const ESPERA_VOZ_FINAL_S = 1.2;

// Cierre: la música entra bajo la última frase, la imagen se oscurece y todo se funde al terminar.
// Con `vozFinal`, una última locución dice el rótulo y luego el detalle, con la música por debajo.
export const Cierre: React.FC<{finVoz: number; musica: string; rotulo: string; detalle: string; vozFinal?: {archivo: string; detalle_s: number}; autoria?: string}> = ({finVoz, musica, rotulo, detalle, vozFinal, autoria}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const entrada = finVoz - ENTRADA_MUSICA_S * fps;
	const finMusica = durationInFrames - entrada;
	const velo = interpolate(frame, [finVoz, finVoz + 2.6 * fps], [0, 0.9], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.inOut(Easing.cubic),
	});
	const inicioVozFinal = finVoz + ESPERA_VOZ_FINAL_S * fps;
	const texto = vozFinal
		? interpolate(frame, [inicioVozFinal - 0.5 * fps, inicioVozFinal], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
		: interpolate(frame, [finVoz + 1.4 * fps, finVoz + 2.6 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const textoDetalle = vozFinal
		? interpolate(frame, [inicioVozFinal + (vozFinal.detalle_s - 0.3) * fps, inicioVozFinal + vozFinal.detalle_s * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
		: 1;
	const negro = interpolate(frame, [durationInFrames - 2.5 * fps, durationInFrames - 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill>
			<Sequence from={entrada} layout="none">
				<Audio
					src={staticFile(musica)}
					volume={(f) =>
						vozFinal
							? interpolate(f, [0, 1.5 * fps, ENTRADA_MUSICA_S * fps, (ENTRADA_MUSICA_S + 0.6) * fps, (ENTRADA_MUSICA_S + ESPERA_VOZ_FINAL_S + 3) * fps, finMusica - 2], [0, 0.16, 0.16, 0.38, 0.38, 0], {extrapolateRight: 'clamp'})
							: interpolate(f, [0, 1.5 * fps, ENTRADA_MUSICA_S * fps, (ENTRADA_MUSICA_S + 0.7) * fps, finMusica - 3 * fps, finMusica - 2], [0, 0.16, 0.16, 0.85, 0.85, 0], {extrapolateRight: 'clamp'})
					}
				/>
			</Sequence>
			{vozFinal ? (
				<Sequence from={inicioVozFinal} layout="none">
					<Audio src={staticFile(vozFinal.archivo)} />
				</Sequence>
			) : null}
			<AbsoluteFill style={{background: '#000', opacity: velo}} />
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: 80, opacity: texto}}>
				<div style={{fontFamily: 'Georgia, serif', fontSize: 66, lineHeight: 1.2, color: '#f1e7d3', textShadow: '0 2px 18px #000'}}>{rotulo}</div>
				<div style={{fontFamily: 'Georgia, serif', fontSize: vozFinal ? 66 : 44, color: '#d9c9a8', marginTop: 24, opacity: textoDetalle, textShadow: '0 2px 18px #000'}}>{detalle}</div>
			</AbsoluteFill>
			{autoria ? <div style={{position: 'absolute', bottom: 210, left: 60, right: 60, textAlign: 'center', fontFamily: 'Arial, sans-serif', fontSize: 34, color: '#d9dde6', opacity: texto}}>{autoria}</div> : null}
			<AbsoluteFill style={{background: '#000', opacity: negro}} />
		</AbsoluteFill>
	);
};
