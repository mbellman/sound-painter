import UI from './UI';
import AudioFile from './AudioFile';
import './page.scss';

new UI();

const audio = new AudioFile('assets/medallion-get.mp3');

audio.play();