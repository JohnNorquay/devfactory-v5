#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { startDashboard } from './commands/dashboard.js';
import { startBeast } from './commands/beast.js';
import { generateReport } from './commands/report.js';

const program = new Command();

program
  .name('devfactory')
  .description('DevFactory v5.0 - Factory Floor Development')
  .version('5.0.0');

program
  .command('dashboard')
  .description('Start the Factory Floor dashboard')
  .option('-p, --port <port>', 'Server port', '3001')
  .option('--no-open', 'Do not open browser automatically')
  .action(startDashboard);

program
  .command('beast')
  .description('Release the beast (start build)')
  .option('-s, --spec <spec>', 'Specific spec to build')
  .option('--dashboard', 'Also start dashboard')
  .action(startBeast);

program
  .command('report')
  .description('Generate build report')
  .option('-o, --output <file>', 'Output file', 'report.html')
  .action(generateReport);

program
  .command('theater')
  .description('Open Verification Theater')
  .option('-s, --scenario <scenario>', 'Scenario to run')
  .action(async (options) => {
    console.log(chalk.magenta('🎭 Opening Verification Theater...'));
    // Launch theater
  });

program.parse();
