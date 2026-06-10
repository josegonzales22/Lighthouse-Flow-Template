import { KnownDevices, type Device } from 'puppeteer';

export type PuppeteerDeviceName = keyof typeof KnownDevices;

interface FrameworkDevices {
    mobile: { name: PuppeteerDeviceName; specs: Device };
    tablet: { name: PuppeteerDeviceName; specs: Device };
}

export const devicesConfig: FrameworkDevices = {
    mobile: {
        name: 'iPhone 11',
        specs: KnownDevices['iPhone 11']
    },
    tablet: {
        name: 'iPad Mini',
        specs: KnownDevices['iPad Mini']
    }
};

export const viewports = {
    mobile: devicesConfig.mobile.specs.viewport,
    tablet: devicesConfig.tablet.specs.viewport
};