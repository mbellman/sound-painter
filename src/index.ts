import SoundPainter from './SoundPainter';
import AudioFile from './AudioFile';
import './page.scss';

const painter = new SoundPainter();

painter.play(new AudioFile('assets/medallion-get.mp3'));