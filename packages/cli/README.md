# @devfactory/cli

Command-line interface for DevFactory v5.0 - Factory Floor Development

## Installation

```bash
npm install -g @devfactory/cli
```

## Commands

### `devfactory dashboard`

Start the Factory Floor dashboard web interface.

**Options:**
- `-p, --port <port>` - Server port (default: 3001)
- `--no-open` - Do not open browser automatically

**Example:**
```bash
devfactory dashboard
devfactory dashboard -p 3002 --no-open
```

### `devfactory beast`

Release the beast - start the automated build process.

**Options:**
- `-s, --spec <spec>` - Specific spec to build
- `--dashboard` - Also start dashboard

**Example:**
```bash
devfactory beast
devfactory beast -s user-auth --dashboard
```

### `devfactory report`

Generate an HTML build report.

**Options:**
- `-o, --output <file>` - Output file (default: report.html)

**Example:**
```bash
devfactory report
devfactory report -o build-summary.html
```

### `devfactory theater`

Open the Verification Theater for interactive testing.

**Options:**
- `-s, --scenario <scenario>` - Scenario to run

**Example:**
```bash
devfactory theater
devfactory theater -s checkout-flow
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build
```

## Package Structure

```
cli/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── commands/
│   │   ├── dashboard.ts      # Dashboard command
│   │   ├── beast.ts          # Beast command
│   │   └── report.ts         # Report command
│   └── utils/
│       └── browser-opener.ts # Browser utilities
├── package.json
└── tsconfig.json
```

## Architecture

The CLI package serves as the main entry point for DevFactory v5.0. It coordinates:

- **@devfactory/oracle** - Context-aware orchestration
- **@devfactory/server** - Web server for dashboard
- **@devfactory/theater** - Verification theater
- **@devfactory/dashboard** - React dashboard UI

## Version

5.0.0
