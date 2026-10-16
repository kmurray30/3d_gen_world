import './styles.css';
import { startApp } from './app';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const hud = document.getElementById('hud')!;
void startApp(canvas, hud);
