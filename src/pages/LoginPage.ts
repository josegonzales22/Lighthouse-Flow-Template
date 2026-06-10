import { BasePage } from './BasePage.js';
import { Page } from 'puppeteer';
import { LogsUtil } from '../utils/LogsUtil.js';

export class LoginPage extends BasePage {
  private readonly userInput = 'xpath///input[contains(@name, "email")]';
  private readonly pswInput = 'xpath///input[contains(@name, "password")]';
  private readonly logInButton = 'xpath///button[.//text()[contains(., "Login")]]';

  constructor(page: Page) {
    super(page);
  }

  public async loadPage(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    const title = await this.page.title();
    LogsUtil.info(`Page Loaded: ${title}`);
    await this.waitVisible('body');
  }

  public async enterUsername(username: string): Promise<void> {
    await this.safeType(this.userInput, username);
    LogsUtil.info(`Username entered: ${username}`);
  }

  public async enterPassword(password: string): Promise<void> {
    await this.safeType(this.pswInput, password);
    LogsUtil.info('Password entered');
  }

  public async clickLogin(): Promise<void> {
    await this.safeClick(this.logInButton);
    LogsUtil.info('Login button clicked');
  }
}