import fs from 'node:fs';
import path from 'node:path';
import { Page } from 'puppeteer';
// @ts-ignore
import { startFlow, UserFlow } from 'lighthouse';
// @ts-ignore
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { devicesConfig } from '../config/devices.js';
import { LogsUtil } from '../utils/LogsUtil.js';

export class LighthouseUtil {
    private flow: UserFlow | null = null;
    private readonly flowName: string;
    private modoActual: 'desktop' | 'mobile' | 'tablet' = 'desktop';

    constructor(flowName: string = 'Auditoría de Flujo de Usuario') {
        this.flowName = flowName;
    }

    /**
     * Limpia y prepara exclusivamente la carpeta del dispositivo que va a ejecutarse.
     * Esto permite mantener los reportes de los demás dispositivos intactos.
     */
    public static prepareDeviceReportFolder(modo: 'desktop' | 'mobile' | 'tablet'): string {
        const reportsRoot = path.resolve('./reports');
        const devicePath = path.join(reportsRoot, modo);

        if (!fs.existsSync(reportsRoot)) {
            fs.mkdirSync(reportsRoot, { recursive: true });
        }

        if (fs.existsSync(devicePath)) {
            LogsUtil.info(`Previous folder detected for [${modo.toUpperCase()}]. Cleaning up old content...`);
            fs.rmSync(devicePath, { recursive: true, force: true });
        }
        fs.mkdirSync(devicePath, { recursive: true });
        LogsUtil.info(`Destination folder for [${modo.toUpperCase()}] initialized from scratch.`);

        return devicePath;
    }

    public static cleanAndPrepareReports(): void {
        const reportsPath = path.resolve('./reports');
        if (fs.existsSync(reportsPath)) {
            LogsUtil.info('Existing "reports" folder detected. Cleaning contents...');
            fs.rmSync(reportsPath, { recursive: true, force: true });
        }
        fs.mkdirSync(reportsPath, { recursive: true });
        LogsUtil.info('New "reports" folder initialized from scratch.');
    }

    public static generateFolderTimestamp(): string {
        const ahora = new Date();
        const dd = String(ahora.getDate()).padStart(2, '0');
        const yyyy = ahora.getFullYear();
        const mmShort = ahora.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').replace(/^\w/, (c) => c.toUpperCase());
        const hh = String(ahora.getHours()).padStart(2, '0');
        const min = String(ahora.getMinutes()).padStart(2, '0');
        const ss = String(ahora.getSeconds()).padStart(2, '0');

        return `${dd}-${mmShort}-${yyyy}_${hh}-${min}-${ss}`;
    }

    public async initFlow(page: Page, modo: 'desktop' | 'mobile' | 'tablet'): Promise<void> {
        this.modoActual = modo;

        const opcionesFlujo: any = {
            name: this.flowName,
            configContext: {
                settingsOverrides: {}
            }
        };

        if (modo === 'desktop') {
            LogsUtil.info(`Applying DESKTOP-CONFIG preset and locking screen emulation.`);
            opcionesFlujo.config = desktopConfig;
            opcionesFlujo.flags = {
                screenEmulation: { disabled: true }
            };
            opcionesFlujo.configContext.settingsOverrides = {
                formFactor: 'desktop'
            };
        } else {
            const specsDispositivo = modo === 'mobile' ? devicesConfig.mobile.specs : devicesConfig.tablet.specs;
            const nombreDispositivo = modo === 'mobile' ? devicesConfig.mobile.name : devicesConfig.tablet.name;
            const userAgentActual = await page.browser().userAgent();

            const width = specsDispositivo.viewport.width;
            const height = specsDispositivo.viewport.height;
            const dpr = specsDispositivo.viewport.deviceScaleFactor || 2;

            LogsUtil.info(`Synchronizing emulation metadata for: ${nombreDispositivo} (${width}x${height} @${dpr}x)`);

            opcionesFlujo.flags = {
                formFactor: 'desktop',
                screenEmulation: {
                    mobile: false,
                    width: width,
                    height: height,
                    deviceScaleFactor: dpr,
                    disabled: false
                },
                emulatedUserAgent: userAgentActual
            };

            opcionesFlujo.configContext.settingsOverrides = {
                formFactor: 'desktop',
                observedDevice: nombreDispositivo,
                screenEmulation: {
                    mobile: false,
                    width: width,
                    height: height,
                    deviceScaleFactor: dpr,
                    disabled: false
                }
            };
        }

        this.flow = await startFlow(page, opcionesFlujo);
        LogsUtil.info(`Flow "${this.flowName}" successfully initialized for mode ${modo.toUpperCase()}.`);
    }

    public async navigateTo(url: string, stepName: string): Promise<void> {
        if (!this.flow) {
            LogsUtil.error('The flow has not been initialized. First, call initFlow(page).');
            throw new Error('[LIGHTHOUSE ERROR] The flow has not been initialized. First, call initFlow(page).');
        }
        LogsUtil.info(`Auditing navigation towards: ${url} (${stepName})`);

        const opcionesNavegacion: any = {
            name: stepName,
            configContext: {
                settingsOverrides: {
                    disableStorageReset: true
                }
            }
        };

        if (this.modoActual !== 'desktop') {
            const specsDispositivo = this.modoActual === 'mobile' ? devicesConfig.mobile.specs : devicesConfig.tablet.specs;
            const nombreDispositivo = this.modoActual === 'mobile' ? devicesConfig.mobile.name : devicesConfig.tablet.name;

            opcionesNavegacion.configContext.settingsOverrides = {
                ...opcionesNavegacion.configContext.settingsOverrides,
                formFactor: 'desktop',
                observedDevice: nombreDispositivo,
                screenEmulation: {
                    mobile: false,
                    width: specsDispositivo.viewport.width,
                    height: specsDispositivo.viewport.height,
                    deviceScaleFactor: specsDispositivo.viewport.deviceScaleFactor || 2,
                    disabled: false
                }
            };
        }

        await this.flow.navigate(url, opcionesNavegacion);
    }

    public async generateAndSaveReports(targetDirectory: string, fileNamePrefix: string): Promise<void> {
        if (!this.flow) {
            LogsUtil.error('There is no active workflow for generating reports.');
            throw new Error('[LIGHTHOUSE ERROR] There is no active workflow for generating reports.');
        }

        try {
            LogsUtil.info(`Creating directories and saving in: ${targetDirectory}`);
            if (!fs.existsSync(targetDirectory)) {
                fs.mkdirSync(targetDirectory, { recursive: true });
            }

            const reportHtml: string = await this.flow.generateReport();
            const htmlPath = path.join(targetDirectory, `${fileNamePrefix}.html`);
            fs.writeFileSync(htmlPath, reportHtml);
            LogsUtil.info(`-> HTML report saved in: ${htmlPath}`);

            const flowResult: object = await this.flow.createFlowResult();
            const jsonPath = path.join(targetDirectory, `${fileNamePrefix}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(flowResult, null, 2));
            LogsUtil.info(`-> JSON report saved in: ${jsonPath}`);

        } catch (error: any) {
            LogsUtil.error(`Report creation failed: ${error.message}`);
        }
    }

    public getNativeFlow(): UserFlow {
        if (!this.flow) throw new Error('Uninitialized flow.');
        return this.flow;
    }
}