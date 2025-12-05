import open from 'open';
import { platform } from 'os';

export async function openBrowser(url: string): Promise<void> {
  // Use 'open' package which handles cross-platform
  await open(url);
}

export function getDefaultBrowser(): string {
  const p = platform();
  if (p === 'darwin') return 'chrome';  // macOS
  if (p === 'win32') return 'chrome';   // Windows
  return 'google-chrome';                // Linux
}
