# ContextLoader Implementation

## Overview

The `ContextLoader` class is responsible for loading full project context for the Oracle to understand everything about the project. It reads from the `.devfactory/` directory structure and provides comprehensive understanding of:

- **Product Context**: Mission, tech stack, and architectural patterns
- **Spec Contexts**: All specs with their tasks and acceptance criteria
- **Worker Contexts**: Active workers with their status and activity history
- **Beast State**: Current build state and progress

## Implementation

### Location
`/home/beastmode/projects/devfactory-v5/packages/oracle/src/context-loader.ts`

### Dependencies Added
```json
{
  "dependencies": {
    "js-yaml": "^4.1.0"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9"
  }
}
```

## API

### Constructor

```typescript
const loader = new ContextLoader(projectRoot: string)
```

Creates a new ContextLoader instance for the given project root directory.

**Parameters:**
- `projectRoot`: Absolute path to the project root (where `.devfactory/` is located)

### Main Method

#### `loadContext(): Promise<OracleContext>`

Loads complete Oracle context including product, specs, workers, and current state.

**Returns:** `Promise<OracleContext>` with:
- `product`: Product mission, tech stack, patterns
- `specs`: Array of spec contexts with tasks
- `workers`: Array of worker contexts with status
- `currentState`: Current beast state

**Example:**
```typescript
import { ContextLoader } from '@devfactory/oracle';

const loader = new ContextLoader('/path/to/project');
const context = await loader.loadContext();

console.log('Mission:', context.product.mission);
console.log('Specs:', context.specs.length);
console.log('Workers:', context.workers.length);
console.log('Status:', context.currentState.status);
```

### Component Methods

#### `loadProductContext(): Promise<ProductContext>`

Loads product mission, tech stack, and patterns from `.devfactory/product/`.

**Sources:**
- `mission.md` - Product mission statement
- `tech-stack.md` - Technology stack documentation

**Extracted Data:**
- Mission: Full markdown content
- Tech Stack: Dependencies and technologies mentioned
- Patterns: Core principles and architectural patterns

#### `loadSpecContexts(): Promise<SpecContext[]>`

Loads all spec contexts from `.devfactory/specs/*/`.

**For each spec directory, loads:**
- `orchestration.yml` - Tasks and dependencies
- `tasks.md` - Task descriptions and verification criteria

**Returns:** Array of spec contexts with:
- `id`: Spec identifier
- `name`: Spec directory name
- `phase`: Phase number (extracted from name)
- `tasks`: Array of task contexts
- `acceptanceCriteria`: Parsed from verification section

#### `loadWorkerContexts(): Promise<WorkerContext[]>`

Loads worker contexts from beast state and tmux sessions.

**Sources:**
- `.devfactory/beast/state.json` - Worker state and activity

**Calculates:**
- Stuck duration (time since last heartbeat for stuck workers)
- Recent activity (last 10 activity entries)

#### `loadBeastState(): Promise<BeastState>`

Loads current beast state from `.devfactory/beast/state.json`.

**Returns:**
- `status`: idle | running | paused | completed | failed
- `activeSpec`: Currently executing spec
- `startedAt`: Build start time
- `totalTasks`: Total number of tasks
- `completedTasks`: Number of completed tasks

## Error Handling

The ContextLoader handles missing files gracefully:

- **Missing mission.md**: Returns default "No mission statement available"
- **Missing tech-stack.md**: Returns empty tech stack array
- **Missing specs directory**: Returns empty specs array
- **Missing state.json**: Returns default idle state with no workers
- **Invalid YAML/JSON**: Logs warning and returns null/defaults

All errors are logged to console with `[ContextLoader]` prefix for easy debugging.

## Data Extraction

### Tech Stack Extraction

Extracts technologies from:
1. Package.json dependency blocks in markdown code snippets
2. Bold items in bullet lists (e.g., `- **React**: UI framework`)

### Pattern Extraction

Extracts patterns from:
1. "Core Principles" section in mission.md (numbered subsections)
2. Project structure indicators (monorepo, TypeScript, ESM)

### Acceptance Criteria Extraction

Extracts criteria from:
- "Verification Criteria" section in tasks.md
- Bullet points under verification headers

## Performance

- **Parallel Loading**: Product, specs, workers, and state load in parallel
- **Efficient Parsing**: Regex-based extraction with minimal overhead
- **Recent Activity**: Only last 10 activity entries kept per worker

## Testing

Run the example to test:

```bash
cd /home/beastmode/projects/devfactory-v5
npx tsx packages/oracle/src/context-loader.example.ts
```

**Expected Output:**
```
[ContextLoader] Loading full project context...
[ContextLoader] Loading product context...
[ContextLoader] Loading spec contexts...
[ContextLoader] Loading worker contexts...
[ContextLoader] Loading beast state...
[ContextLoader] Product context loaded: 18 technologies, 2 patterns
[ContextLoader] Loaded 4 spec contexts
[ContextLoader] Context loaded: 4 specs, 0 workers

=== Product Context ===
Mission: # DevFactory v5.0 "Factory Floor" - Mission...
Tech Stack: @anthropic-ai/sdk, chalk, chokidar, commander, express
Patterns: Monorepo structure with packages, TypeScript for type safety

=== Specs ===
Loaded 4 specs:
  - phase-1-enhanced-oracle (49 tasks)
  - phase-2-factory-floor (54 tasks)
  - phase-3-verification-theater (42 tasks)
  - phase-4-integration (34 tasks)

=== Workers ===
Active workers: 0

=== Beast State ===
Status: idle
Active Spec: None
Progress: 0/0
```

## Integration

The ContextLoader is exported from the main oracle package:

```typescript
import { ContextLoader, OracleContext } from '@devfactory/oracle';
```

## Future Enhancements

Potential improvements for future versions:

1. **Caching**: Cache loaded context with file modification time tracking
2. **Incremental Updates**: `refresh()` method to reload only changed files
3. **Context Summary**: `getSummary()` for condensed context within token limits
4. **Task-Specific Context**: `getTaskContext(taskId)` for focused context
5. **Watch Mode**: File watching to auto-reload on changes
6. **Validation**: Schema validation for loaded YAML/JSON files

## File Structure

```
.devfactory/
├── product/
│   ├── mission.md          # Product mission (loaded)
│   └── tech-stack.md       # Tech stack docs (loaded)
├── specs/
│   └── phase-*/
│       ├── orchestration.yml  # Tasks structure (loaded)
│       └── tasks.md          # Task details (loaded)
└── beast/
    └── state.json          # Current state (loaded)
```

## Implementation Details

### TypeScript Configuration

- **Target**: ES2022
- **Modules**: NodeNext (ESM with .js extensions)
- **Strict Mode**: Enabled
- **ESM Interop**: Enabled for proper imports

### Import Pattern

All imports use `.js` extensions for ESM compatibility:

```typescript
import { OracleContext } from './types.js';
export { ContextLoader } from './context-loader.js';
```

### Regular Expression Patterns

- **Dependencies**: `/"([^"]+)":\s*"\^?[\d.]+"/g`
- **Bold Items**: `/[-*]\s+\*\*([^*]+)\*\*/g`
- **Principles**: `/### \d+\. ([^\n]+)/g`
- **Criteria**: `/[-*]\s+([^\n]+)/g`

All regex patterns use `Array.from(str.matchAll(regex))` for ES2022 compatibility.

## Verification

✅ TypeScript compiles without errors
✅ Successfully loads real project context
✅ Handles missing files gracefully
✅ Extracts tech stack correctly (18 technologies)
✅ Loads all 4 specs with tasks
✅ Parses YAML orchestration files
✅ Handles idle state correctly

## Task Completion

This implementation fulfills **Task 2.1** from the Phase 1 orchestration:

- ✅ Implement ContextLoader class with constructor and file path resolution
- ✅ Load product context (mission, tech stack, patterns)
- ✅ Load spec contexts (all specs with tasks)
- ✅ Load worker contexts (status, activity)
- ✅ Load beast state (current status)
- ✅ Use fs/promises for async file operations
- ✅ Use js-yaml for YAML parsing
- ✅ Handle missing files gracefully
- ✅ Add proper error handling and logging
- ✅ Export from main package index
