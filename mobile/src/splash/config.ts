// Настройки 3D-заставки и подстановка их в страницу. Положение глобуса и букв — в единицах сцены (камера z 9.6, угол 40°),
// по ним экран считает, где поставить подпись под буквами.
import { SPLASH_HTML } from './splash-html';

export type SplashConfig = { final: boolean; globeY: number; letterY: number };
export type SplashEvent = { type: 'ready' | 'count' | 'stage' | 'skip' | 'error'; n?: number; stage?: string; message?: string };

export const GLOBE_Y = -0.2;
export const LETTER_Y = 0.75;
export const LETTER_H = 1.5;
/** Сколько точек экрана в единице сцены на уровне букв (по высоте экрана). */
export const unitPx = (height: number) => height / (2 * 9.6 * Math.tan((20 * Math.PI) / 180));
export const splashHtml = (cfg: SplashConfig) => SPLASH_HTML.replace('/*CFG*/{}/*CFG*/', JSON.stringify(cfg));
