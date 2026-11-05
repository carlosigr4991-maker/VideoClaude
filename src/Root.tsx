import {AbsoluteFill, Composition, Still} from 'remotion';
import {duracionEnCuadros, FPS, Armazon} from './Armazon';
import type {VideoNarrado} from './Armazon';
import {Cierre, COLA_S} from './Cierre';
import {AmbienteFagos, EscenaFagos} from './escenas/Fagos';
import {EscenaHomenaje} from './escenas/Homenaje';
import {EscenaLluvia} from './escenas/Lluvia';
import {EscenaMessi} from './escenas/Messi';
import {EscenaMosquito} from './escenas/Mosquito';
import {Perfil} from './escenas/Perfil';
import {EscenaPlano} from './escenas/Plano';
import {AmbienteRendija, EscenaRendija} from './escenas/Rendija';
import {AmbienteTeseo, EscenaTeseo} from './escenas/Teseo';
import {CampoVida, EscenaVida, RotuloParte} from './escenas/Vida';
import {EscenaVirus} from './escenas/Virus';
import vida from './generado/vida-voz.json';
import teseo from './generado/teseo-voz.json';
import rendija from './generado/rendija-voz.json';
import fagos from './generado/fagos-voz.json';
import virus from './generado/virus.json';
import casoDemo from './generado/caso-demo.json';
import messiVoz from './generado/messi-voz.json';
import mosquito from './generado/mosquito-voz.json';
import padrePatricio from './generado/padre-patricio-sabio.json';
import lluviaValentino from './generado/lluvia-valentino.json';
import lluvia from './generado/lluvia.json';

// La última escena sigue visible durante la cola, hasta que el telón la cubre.
const conCola = (video: VideoNarrado): VideoNarrado => ({
	...video,
	escenas: video.escenas.map((escena, i) => (i === video.escenas.length - 1 ? {...escena, pausa_s: COLA_S} : escena)),
});

// El audio externo no trae pausas: esta deja ver el último dato antes de cambiar de escena.
const messi: VideoNarrado = {
	...messiVoz,
	escenas: messiVoz.escenas.map((escena) => (escena.id === 'ultimo' ? {...escena, pausa_s: 1} : escena)),
};

// El mismo audio dividido en dos videos, justo antes de "Y entonces ocurrió algo más extraordinario".
const vidaParte1: VideoNarrado = {...vida, escenas: vida.escenas.slice(0, 10)};
const vidaParte2: VideoNarrado = {...vida, escenas: vida.escenas.slice(10)};

const ParteVida: React.FC<{video: VideoNarrado; numero: number; autoria: string}> = ({video, numero, autoria}) => (
	<AbsoluteFill style={{background: '#05060f'}}>
		<CampoVida video={video} />
		<Armazon video={conCola(video)} Visual={EscenaVida} estilo="caso" solape={10} />
		<RotuloParte numero={numero} />
		<Cierre
			finVoz={duracionEnCuadros(video)}
			musica="fotos/vida/cortina.wav"
			rotulo="Vive aprendiendo."
			detalle="Muere sabiendo."
			vozFinal={{archivo: 'fotos/vida/voz_final.wav', detalle_s: 1.5}}
			autoria={autoria}
		/>
	</AbsoluteFill>
);

// Cada video nuevo es una entrada más: su JSON de `npm run narrar` y la plantilla que lo dibuja.
export const Root: React.FC = () => (
	<>
		<Composition
			id="Lluvia"
			component={() => <Armazon video={lluvia} Visual={EscenaLluvia} estilo="ninos" />}
			durationInFrames={duracionEnCuadros(lluvia)}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="LluviaValentino"
			component={() => <Armazon video={lluviaValentino} Visual={EscenaLluvia} estilo="ninos" />}
			durationInFrames={duracionEnCuadros(lluviaValentino)}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="PadrePatricio"
			component={() => (
				<AbsoluteFill style={{background: '#000'}}>
					<Armazon video={conCola(padrePatricio)} Visual={EscenaHomenaje} estilo="caso" />
					<Cierre
						finVoz={duracionEnCuadros(padrePatricio)}
						musica="generado/padre-patricio-sabio/cortina.wav"
						rotulo="Padre Patricio Sánchez Molinari"
						detalle="1973 – 2026"
					/>
				</AbsoluteFill>
			)}
			durationInFrames={duracionEnCuadros(padrePatricio) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="Mosquito"
			component={() => (
				<AbsoluteFill style={{background: '#cfe9e6'}}>
					<Armazon video={conCola(mosquito)} Visual={EscenaMosquito} estilo="caso" />
					<Cierre
						finVoz={duracionEnCuadros(mosquito)}
						musica="generado/mosquito-voz/cortina.wav"
						rotulo="Sin agua estancada, se corta el ciclo"
						detalle="Vida de un mosquito"
					/>
				</AbsoluteFill>
			)}
			durationInFrames={duracionEnCuadros(mosquito) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="Messi"
			component={() => (
				<AbsoluteFill style={{background: '#0b1320'}}>
					<Armazon video={conCola(messi)} Visual={EscenaMessi} estilo="caso" />
					<Cierre
						finVoz={duracionEnCuadros(messi)}
						musica="fotos/messi/cortina.wav"
						rotulo="El diez y el nueve en un mismo cuerpo"
						detalle="¿A quién elegirías tú?"
					/>
				</AbsoluteFill>
			)}
			durationInFrames={duracionEnCuadros(messi) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="Virus"
			component={() => (
				<AbsoluteFill style={{background: '#07131f'}}>
					<Armazon video={conCola(virus)} Visual={EscenaVirus} estilo="caso" />
					<Cierre
						finVoz={duracionEnCuadros(virus)}
						musica="fotos/virus/cortina.wav"
						rotulo="Lo que combatimos también es parte de lo que somos"
						detalle="La paradoja viral"
					/>
				</AbsoluteFill>
			)}
			durationInFrames={duracionEnCuadros(virus) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="Fagos"
			component={() => (
				<AbsoluteFill style={{background: '#0a0d14'}}>
					<AmbienteFagos />
					<Armazon video={conCola(fagos)} Visual={EscenaFagos} estilo="caso" solape={10} />
					<Cierre
						finVoz={duracionEnCuadros(fagos)}
						musica="fotos/fagos/cortina.wav"
						rotulo="El enemigo de tu enemigo"
						detalle="Bacteriófagos"
					/>
				</AbsoluteFill>
			)}
			durationInFrames={duracionEnCuadros(fagos) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="Rendija"
			component={() => (
				<AbsoluteFill style={{background: '#0b0a1a'}}>
					<AmbienteRendija />
					<Armazon video={conCola(rendija)} Visual={EscenaRendija} estilo="caso" solape={10} />
					<Cierre
						finVoz={duracionEnCuadros(rendija)}
						musica="fotos/rendija/cortina.wav"
						rotulo="Medir es interactuar"
						detalle="El experimento de la doble rendija"
					/>
				</AbsoluteFill>
			)}
			durationInFrames={duracionEnCuadros(rendija) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="Teseo"
			component={() => (
				<AbsoluteFill style={{background: '#0a1420'}}>
					<AmbienteTeseo />
					<Armazon video={conCola(teseo)} Visual={EscenaTeseo} estilo="caso" solape={10} />
					<Cierre
						finVoz={duracionEnCuadros(teseo)}
						musica="fotos/teseo/cortina.wav"
						rotulo="Vive aprendiendo."
						detalle="Muere sabiendo."
						vozFinal={{archivo: 'fotos/teseo/voz_final.wav', detalle_s: 1.5}}
					/>
				</AbsoluteFill>
			)}
			durationInFrames={duracionEnCuadros(teseo) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="Vida"
			component={() => (
				<AbsoluteFill style={{background: '#05060f'}}>
					<CampoVida video={vida} />
					<Armazon video={conCola(vida)} Visual={EscenaVida} estilo="caso" solape={10} />
					<Cierre
						finVoz={duracionEnCuadros(vida)}
						musica="fotos/vida/cortina.wav"
						rotulo="Vive aprendiendo."
						detalle="Muere sabiendo."
						vozFinal={{archivo: 'fotos/vida/voz_final.wav', detalle_s: 1.5}}
						autoria="Hipótesis y guion de Carlos I. Gonzalez"
					/>
				</AbsoluteFill>
			)}
			durationInFrames={duracionEnCuadros(vida) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="VidaParte1"
			component={() => <ParteVida video={vidaParte1} numero={1} autoria="Continúa en la parte 2 · Hipótesis y guion de Carlos I. Gonzalez" />}
			durationInFrames={duracionEnCuadros(vidaParte1) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Composition
			id="VidaParte2"
			component={() => <ParteVida video={vidaParte2} numero={2} autoria="Hipótesis y guion de Carlos I. Gonzalez" />}
			durationInFrames={duracionEnCuadros(vidaParte2) + COLA_S * FPS}
			fps={FPS}
			width={1080}
			height={1920}
		/>
		<Still id="Perfil" component={Perfil} width={1080} height={1080} />
		<Composition
			id="CasoDemo"
			component={() => <Armazon video={casoDemo} Visual={EscenaPlano} estilo="caso" />}
			durationInFrames={duracionEnCuadros(casoDemo)}
			fps={FPS}
			width={1080}
			height={1920}
		/>
	</>
);
