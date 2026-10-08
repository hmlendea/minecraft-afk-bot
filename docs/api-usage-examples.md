# API usage examples

## Basic usage

### Run the bot

```bash
# From project root
node bot.js
```

### With custom config location

```bash
# Config must be at configuration.json beside bot.js
cp /path/to/my-config.json configuration.json
node bot.js
```

## Programmatic usage

### Import and run main

```js
const { main } = require('./bot')

// Run as part of another application
await main()
```

### Use individual functions

```js
const {
    loadConfiguration,
    resolveLogFilePath,
    createLogger,
    isRestrictedByTimeWindow,
    executeCommand,
    resolveSleepProbability,
    pause,
    randomInteger,
    randomChoice,
    activateBedUnderBot,
    registerNightSleepHandler,
    ensureConfigurationExists
} = require('./bot')

const { createLogger } = require('./logger')

// Load config
const config = loadConfiguration()

// Create logger
const logger = createLogger({
    logFilePath: resolveLogFilePath(config)
})

// Check schedule
if (isRestrictedByTimeWindow(config)) {
    console.log('Time restricted')
    process.exit(0)
}

// Create bot (requires mineflayer)
const mineflayer = require('mineflayer')
const bot = mineflayer.createBot({
    host: config.server.host,
    port: config.server.port,
    username: config.credentials.username,
    version: config.server.version
})

// Execute commands
await executeCommand(bot, '/auth password', 5000, logger)

// Register sleep handler
const zoneCommand = `/zone tp ${randomChoice(config.zones)}`
registerNightSleepHandler(bot, config, logger, zoneCommand)
```

## Custom logger

### With custom timestamp

```js
const { createLogger } = require('./logger')

const logger = createLogger({
    logFilePath: 'custom.log',
    dateSupplier: () => new Date('2026-09-21T12:34:56.789Z')
})

logger.log('Deterministic timestamp')
```

### With mock console (testing)

```js
const { createLogger } = require('./logger')

const mockConsole = { log: [], error: [] }
const logger = createLogger({
    logFilePath: 'test.log',
    consoleOutput: {
        log: (...args) => mockConsole.log.push(args.join(' ')),
        error: (...args) => mockConsole.error.push(args.join(' '))
    }
})

logger.log('Test message')
console.log(mockConsole.log) // ['[2026-09-21T12:34:56.7890000Z] Test message']
```

## Configuration helpers

### Resolve sleep probability

```js
const { resolveSleepProbability } = require('./bot')

const config = { sleep: { probability: 0.7 } }
const prob = resolveSleepProbability(config) // 0.7

const config2 = {}
const prob2 = resolveSleepProbability(config2) // 0.65 (default)
```

### Random utilities

```js
const { randomInteger, randomChoice, pause } = require('./bot')

// Random integer
const sessionMinutes = randomInteger(30, 120)

// Random choice
const zone = randomChoice(['farm', 'spawn', 'mining'])

// Delay
await pause(5000) // 5 seconds
```

## Testing helpers

### Create mock bot for testing

```js
const { EventEmitter } = require('events')

function createMockBot(overrides = {}) {
    const bot = new EventEmitter()
    bot.time = { isDay: true }
    bot.game = { dimension: 'overworld' }
    bot.sentCommands = []
    bot.activatedBlocks = []
    bot.chat = (cmd) => bot.sentCommands.push(cmd)
    bot.blockAt = (pos) => overrides.blocks?.get(pos) ?? null
    bot.isABed = (block) => Boolean(block?.isBed)
    bot.activateBlock = async (block) => bot.activatedBlocks.push(block)
    bot.entity = {
        position: {
            offset: (x, y, z) => ({ x: x, y: y, z: z })
        }
    }
    return Object.assign(bot, overrides)
}
```

### Create recording logger

```js
function createRecordingLogger() {
    return {
        logMessages: [],
        errorMessages: [],
        log(...values) { this.logMessages.push(values) },
        error(...values) { this.errorMessages.push(values) }
    }
}
```

## Integration patterns

### Wrapper script with retry

```js
// run-bot.js
const { main } = require('./bot')

async function runWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await main()
            console.log('Bot completed successfully')
            return
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message)
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 10000)) // 10s backoff
            }
        }
    }
    console.error('All retries exhausted')
    process.exit(1)
}

runWithRetry()
```

### Health check endpoint

```js
// health.js
const http = require('http')
const { loadConfiguration } = require('./bot')

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        try {
            const config = loadConfiguration()
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ status: 'ok', config: !!config }))
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ status: 'error', message: e.message }))
        }
    }
})

server.listen(3000, () => console.log('Health check on :3000'))
```

## Related documentation

- [API reference: bot.js](../api-reference/bot.md)
- [API reference: logger.js](../api-reference/logger.md)
- [Testing](../testing.md)
- [Build and deployment](../build-and-deployment.md)