import puppeteer, { Page } from 'puppeteer';
import { LighthouseUtil } from './utils/LighthouseUtil.js';
import { executeFlow } from './steps/Flow.js';
import { devicesConfig } from './config/devices.js';
import { LogsUtil } from './utils/LogsUtil.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

type ModoPerfil = 'desktop' | 'mobile' | 'tablet';

let executionFolder = `execution_${LighthouseUtil.generateFolderTimestamp()}`;

async function runTestPorPerfil(modo: ModoPerfil): Promise<void> {
    LogsUtil.initialize();
    LogsUtil.info(`======================================================================`);
    LogsUtil.info(`Starting automation in mode: ${modo.toUpperCase()}`);
    LogsUtil.info(`======================================================================`);

    const rutaDestinoReporte = LighthouseUtil.prepareDeviceReportFolder(modo);

    const argsLaunch = [
        '--remote-debugging-port=8041',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--disable-save-password-bubble',
        '--disable-autofill-keyboard-accessory-view',
        '--no-default-browser-check',
        '--disable-blink-features=AutomationControlled'
    ];

    if (modo === 'desktop') {
        argsLaunch.push('--start-maximized');
    }

    const tempUserDataDir = path.join(os.tmpdir(), `puppeteer_profile_${modo}_${Date.now()}`);

    const defaultProfilePath = path.join(tempUserDataDir, 'Default');
    fs.mkdirSync(defaultProfilePath, { recursive: true });

    const chromePrefs = {
        profile: {
            password_manager_enabled: false,
            password_manager_leak_detection: false,
        },
        credentials_enable_service: false
    };

    fs.writeFileSync(
        path.join(defaultProfilePath, 'Preferences'),
        JSON.stringify(chromePrefs)
    );

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: argsLaunch,
        userDataDir: tempUserDataDir
    });

    try {
        const targets = await browser.pages();
        const page: Page = targets[0] || await browser.newPage();

        page.on('dialog', async dialog => {
            LogsUtil.warn(`Cerrando diálogo inesperado tipo: ${dialog.type()} -> "${dialog.message()}"`);
            await dialog.dismiss();
        });

        if (modo === 'desktop') {
            LogsUtil.info('Using the monitor maximum native resolution.');
        } else if (modo === 'mobile') {
            await page.emulate(devicesConfig.mobile.specs);
        } else if (modo === 'tablet') {
            await page.emulate(devicesConfig.tablet.specs);
        }

        const nombreReporte = `Report (${modo.toUpperCase()})`;
        const lhUtil = new LighthouseUtil(nombreReporte);

        await lhUtil.initFlow(page, modo);

        await executeFlow({ page, lhUtil });

        const prefijoArchivo = `audit_result_${modo}`;

        await lhUtil.generateAndSaveReports(rutaDestinoReporte, prefijoArchivo);

        LogsUtil.info(`Test flow successfully completed for: ${modo.toUpperCase()}`);

    } catch (error:any) {
        LogsUtil.error(`There was a profile failure ${modo.toUpperCase()}: ${error.message}`);
    } finally {
        await browser.close();
        LogsUtil.info(`Browser closed for profile: ${modo.toUpperCase()}`);

        try {
            fs.rmSync(tempUserDataDir, { recursive: true, force: true });
        } catch (e) {
            // Ignore if the system retains any Chromium logs for the time being
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function main() {
    const modoEnv = (process.env.MODO || 'desktop').toLowerCase();

    if (modoEnv === 'all') {
        LogsUtil.info('Starting the complete multi-device suite sequentially...');
        const perfiles: ModoPerfil[] = ['desktop', 'tablet', 'mobile'];

        for (const perfil of perfiles) {
            await runTestPorPerfil(perfil);
        }
        LogsUtil.info('Complete execution of the suite finished.');
    } else {
        await runTestPorPerfil(modoEnv as ModoPerfil);
    }
}

main().catch(console.error);