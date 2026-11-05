import {Fragment} from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const FPS = 30;
const PAUSA_S = 0.4;

type Palabra = {t: string; ini: number; fin: number};
export type Escena = {
	id: string;
	audio: string;
	duracion_s: number;
	pausa_s?: number;
	palabras: Palabra[];
	hora?: string;
	etiqueta?: string;
	fuente?: string;
};
export type VideoNarrado = {id: string; escenas: Escena[]};
export type PropsVisual = {escena: Escena; indice: number};
type Estilo = 'ninos' | 'caso';

export const cuadrosDe = (escena: Escena) => Math.ceil((escena.duracion_s + (escena.pausa_s ?? PAUSA_S)) * FPS);

export const duracionEnCuadros = (video: VideoNarrado) =>
	video.escenas.reduce((total, escena) => total + cuadrosDe(escena), 0);

const PALABRAS_POR_GRUPO = 4;

const Subtitulo: React.FC<{palabras: Palabra[]; estilo: Estilo}> = ({palabras, estilo}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ahora = frame / fps;
	const ninos = estilo === 'ninos';

	if (ahora > palabras[palabras.length - 1].fin + 0.6) {
		return null;
	}

	let actual = palabras.findIndex((p) => ahora < p.fin);
	if (actual === -1) {
		actual = palabras.length - 1;
	}
	const inicioGrupo = Math.floor(actual / PALABRAS_POR_GRUPO) * PALABRAS_POR_GRUPO;

	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 300}}>
			<div
				style={{
					maxWidth: 920,
					padding: '18px 34px',
					borderRadius: ninos ? 36 : 6,
					background: ninos ? 'rgba(255,255,255,0.94)' : 'rgba(8,10,14,0.88)',
					fontFamily: ninos ? '"Comic Sans MS", Arial, sans-serif' : 'Arial, sans-serif',
					fontSize: ninos ? 66 : 56,
					fontWeight: 700,
					lineHeight: 1.2,
					textAlign: 'center',
					color: ninos ? '#1f2d3d' : '#f2f4f7',
				}}
			>
				{palabras.slice(inicioGrupo, inicioGrupo + PALABRAS_POR_GRUPO).map((p, i) => (
					<span key={i} style={{color: inicioGrupo + i === actual ? (ninos ? '#e8590c' : '#ffc53d') : undefined}}>
						{p.t}{' '}
					</span>
				))}
			</div>
		</AbsoluteFill>
	);
};

// La imagen dura `solape` cuadros más que su escena y se funde con la siguiente.
const Fundido: React.FC<{duracion: number; solape: number; entrada: boolean; children: React.ReactNode}> = ({duracion, solape, entrada, children}) => {
	const frame = useCurrentFrame();
	const aparece = entrada ? interpolate(frame, [0, solape], [0, 1], {extrapolateRight: 'clamp'}) : 1;
	const sale = interpolate(frame, [duracion, duracion + solape], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return <AbsoluteFill style={{opacity: aparece * sale}}>{children}</AbsoluteFill>;
};

export const Armazon: React.FC<{
	video: VideoNarrado;
	Visual: React.FC<PropsVisual>;
	estilo: Estilo;
	solape?: number;
}> = ({video, Visual, estilo, solape = 0}) => {
	let desde = 0;
	return (
		<AbsoluteFill>
			{video.escenas.map((escena, indice) => {
				const duracion = cuadrosDe(escena);
				const secuencia = (
					<Fragment key={escena.id}>
						<Sequence from={desde} durationInFrames={duracion + solape}>
							{solape > 0 ? (
								<Fundido duracion={duracion} solape={solape} entrada={indice > 0}>
									<Visual escena={escena} indice={indice} />
								</Fundido>
							) : (
								<Visual escena={escena} indice={indice} />
							)}
						</Sequence>
						<Sequence from={desde} durationInFrames={duracion}>
							<Audio src={staticFile(escena.audio)} />
							<Subtitulo palabras={escena.palabras} estilo={estilo} />
						</Sequence>
					</Fragment>
				);
				desde += duracion;
				return secuencia;
			})}
		</AbsoluteFill>
	);
};
