import { Page } from 'puppeteer';
import { LoginPage } from '../pages/LoginPage.js';
import { LighthouseUtil } from '../utils/LighthouseUtil.js';
import { LogsUtil } from '../utils/LogsUtil.js';
interface FlowOptions {
  page: Page;
  lhUtil: LighthouseUtil;
}

export async function executeFlow({ page, lhUtil }: FlowOptions): Promise<void> {
  const urlLogin = 'https://angular-dashboard-lime.vercel.app/';
  const username = "zoaib@zoaibkhan.com";
  const psw = "testing123";
  
  const loginPage = new LoginPage(page);

  LogsUtil.info('Iniciando paso 1: Carga de la página de Login...');
  await lhUtil.navigateTo(urlLogin, '1. Carga Inicial - Pantalla de Login');

  LogsUtil.info('Ingresando credenciales de acceso...');
  await loginPage.enterUsername(username);
  await loginPage.enterPassword(psw);

  LogsUtil.info('Enviando formulario de autenticación...');
  await loginPage.clickLogin();
  
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => {
    LogsUtil.warn('La navegación automática post-login tardó más de lo esperado o es una SPA estricta.');
  });

  LogsUtil.info('Iniciando paso 2: Auditoría de la zona privada...');
  const currentUrl = page.url();
  await lhUtil.navigateTo(currentUrl, '2. Carga Segura - Dashboard Interno');

  LogsUtil.info('Pasos de automatización completados con éxito.');
}