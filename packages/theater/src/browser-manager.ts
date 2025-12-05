import { chromium, Browser, Page } from 'playwright';
import type { BrowserConfig } from './types.js';

export class BrowserManager {
  private browser?: Browser;
  private page?: Page;
  private config: BrowserConfig;

  constructor(config?: Partial<BrowserConfig>) {
    this.config = {
      headless: false,
      viewport: {
        width: 1920,
        height: 1080
      },
      slowMo: 50,
      devtools: false,
      ...config
    };
  }

  async launch(): Promise<Page> {
    this.browser = await chromium.launch({
      headless: this.config.headless,
      devtools: this.config.devtools,
      slowMo: this.config.slowMo
    });

    this.page = await this.browser.newPage();

    if (this.config.viewport) {
      await this.page.setViewportSize(this.config.viewport);
    }

    return this.page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
    }
  }

  getPage(): Page | undefined {
    return this.page;
  }

  async screenshot(): Promise<string> {
    if (!this.page) {
      throw new Error('Browser not launched');
    }
    const screenshot = await this.page.screenshot();
    return screenshot.toString('base64');
  }
}
