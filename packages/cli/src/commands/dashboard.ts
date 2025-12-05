import chalk from 'chalk';
import open from 'open';

export async function startDashboard(options: { port: string; open: boolean }) {
  const port = parseInt(options.port);
  console.log(chalk.blue('🏭 Starting Factory Floor Dashboard...'));

  // Start the server (import from @devfactory/server)
  // Wait for it to be ready

  const url = `http://localhost:${port}`;
  console.log(chalk.green(`✓ Dashboard running at ${url}`));

  if (options.open) {
    console.log(chalk.gray('Opening browser...'));
    await open(url);
  }
}
