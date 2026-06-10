import { Page, ElementHandle } from 'puppeteer';
import path from 'node:path';
import fs from 'node:fs';
import { LogsUtil } from '../utils/LogsUtil.js';

export class BasePage {
    protected page: Page;
    protected timeoutEstandar = 15000;

    constructor(page: Page) {
        this.page = page;
    }

    protected async waitVisible(selector: string): Promise<ElementHandle<Element>> {
        try {
            const elemento = await this.page.waitForSelector(selector, {
                visible: true,
                timeout: this.timeoutEstandar
            });
            if (!elemento) throw new Error();
            return elemento;
        } catch (error) {
            LogsUtil.error(`Element not visible: ${selector}`);
            throw new Error(`[ERROR] Element not visible: ${selector}`);
        }
    }

    protected async safeClick(selector: string): Promise<void> {
        try {
            await this.waitVisible(selector);
            await this.page.click(selector);
            LogsUtil.info(`Normal click successful on: ${selector}`);
        } catch (error) {
            LogsUtil.warn(`Normal click on element failed — Retrying with JS fallback...`);
            try {
                await this.page.$eval(selector, (el: any) => el.click());
                LogsUtil.info(`JS Fallback click successful on: ${selector}`);
            } catch (jsEx) {
                LogsUtil.error(`The element could not be clicked, even via JS: ${selector}`);
                throw new Error(`[ERROR] The element could not be clicked, even via JS: ${selector}`);
            }
        }
    }

    public async waitForElementToLoad(selector: string, pageName: string): Promise<void> {
        try {
            await this.waitVisible(selector);
            LogsUtil.info(`Page element [${pageName}] loaded.`);
        } catch (error: any) {
            LogsUtil.error(`The page could not be loaded [${pageName}]: ${error.message}`);
        }
    }

    public getTimestamp(): string {
        const ahora = new Date();
        const opciones: Intl.DateTimeFormatOptions = {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        };
        return ahora.toLocaleDateString('es-ES', opciones).replace(',', '');
    }

    protected async selectByText(selector: string, opcion: string): Promise<void> {
        try {
            await this.waitVisible(selector);
            await this.page.evaluate((sel, text) => {
                const selectEl = document.querySelector(sel) as HTMLSelectElement;
                if (!selectEl) return;
                const optionToSelect = Array.from(selectEl.options).find(opt => opt.text === text);
                if (optionToSelect) {
                    selectEl.value = optionToSelect.value;
                    selectEl.dispatchEvent(new Event('change'));
                }
            }, selector, opcion);

            LogsUtil.info(`Selected option: [${opcion}] in the selector: ${selector}`);
        } catch (error) {
            LogsUtil.error(`The option could not be selected '${opcion}' in: ${selector}`);
            throw new Error(`Failure to interact with the selector: ${selector}`);
        }
    }

    protected async selectByIndex(selector: string, index: number): Promise<void> {
        try {
            await this.waitVisible(selector);
            await this.page.evaluate((sel, idx) => {
                const selectEl = document.querySelector(sel) as HTMLSelectElement;
                if (selectEl && selectEl.options[idx]) {
                    selectEl.value = selectEl.options[idx].value;
                    selectEl.dispatchEvent(new Event('change'));
                }
            }, selector, index);
            LogsUtil.info(`Selecting option by index [${index}] in: ${selector}`);
        } catch (error) {
            LogsUtil.error(`The index could not be selected ${index} in: ${selector}`);
            throw error;
        }
    }

    public async uploadFile(selector: string, relativePath: string): Promise<void> {
        try {
            const rutaAbsoluta = path.resolve(relativePath);
            if (!fs.existsSync(rutaAbsoluta)) {
                LogsUtil.error(`The file does not exist in the path: ${relativePath}`);
                throw new Error(`The file does not exist in the path: ${relativePath}`);
            }

            await this.page.waitForSelector(selector, { timeout: this.timeoutEstandar });

            await this.page.$eval(selector, (el: any) => {
                el.style.display = 'block';
                el.style.visibility = 'visible';
                el.style.opacity = '1';
            });

            const rawElement = await this.page.$(selector);

            if (rawElement) {
                const inputElement = rawElement as unknown as ElementHandle<HTMLInputElement>;
                await inputElement.uploadFile(rutaAbsoluta);
                LogsUtil.info(`File uploaded: ${rutaAbsoluta}`);
            }
        } catch (error: any) {
            LogsUtil.error(`Error uploading file: ${error.message}`);
        }
    }

    protected async selectNgSelect(selector: string, texto: string, index: number = 1): Promise<void> {
        try {
            await this.waitVisible(selector);

            await this.page.click(selector);
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('A');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');

            await this.page.type(selector, texto);

            const opcionesLocator = 'div.ng-option';
            await this.page.waitForSelector(opcionesLocator, { timeout: this.timeoutEstandar });

            const opcionEspecifica = `div.ng-option:nth-of-type(${index})`;
            await this.safeClick(opcionEspecifica);

            LogsUtil.info(`Selected in ng-select: [${texto}] in position: ${index}`);
        } catch (error: any) {
            LogsUtil.error(`Error en ng-select: ${error.message}`);
            throw new Error(`ng-select failed: ${texto}`);
        }
    }

    protected async scrollToElement(selector: string): Promise<void> {
        try {
            await this.page.$eval(selector, (el: any) => {
                el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            });
            await new Promise(resolve => setTimeout(resolve, 300));
            await this.waitVisible(selector);
            LogsUtil.info(`Scroll performed towards the element: ${selector}`);
        } catch (error) {
            LogsUtil.error(`Unable to scroll to the element: ${selector}`);
            throw new Error(`Scroll failed to: ${selector}`);
        }
    }

    protected async safeType(selector: string, text: string): Promise<void> {
        try {
            await this.waitVisible(selector);
            await this.page.focus(selector);

            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('A');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.press('Backspace');

            await this.page.type(selector, text);
            LogsUtil.info(`Text successfully typed into: ${selector}`);
        } catch (error: any) {
            LogsUtil.error(`Failed to type text into ${selector}: ${error.message}`);
            throw new Error(`[ERROR] Failed to type text into ${selector}: ${error.message}`);
        }
    }

    // =========================================================================
    // DATE UTILS
    // =========================================================================

    private formatearFecha(fecha: Date): string {
        const dd = String(fecha.getDate()).padStart(2, '0');
        const mm = String(fecha.getMonth() + 1).padStart(2, '0');
        const yyyy = fecha.getFullYear();
        return `${dd}${mm}${yyyy}`;
    }

    public getFechaCalendarioPosterior(): string {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + 10);
        return this.formatearFecha(fecha);
    }

    public getFechaHabilesPosterior(): string {
        const fecha = new Date();
        let diasAgregados = 0;

        while (diasAgregados < 5) {
            fecha.setDate(fecha.getDate() + 1);
            const diaSemana = fecha.getDay();
            if (diaSemana !== 0 && diaSemana !== 6) {
                diasAgregados++;
            }
        }
        return this.formatearFecha(fecha);
    }

    public sumarDiasAFecha(fechaStr: string, diasASumar: number): string {
        const dd = parseInt(fechaStr.substring(0, 2), 10);
        const mm = parseInt(fechaStr.substring(2, 4), 10) - 1;
        const yyyy = parseInt(fechaStr.substring(4, 8), 10);

        const fecha = new Date(yyyy, mm, dd);
        fecha.setDate(fecha.getDate() + diasASumar);
        return this.formatearFecha(fecha);
    }
}