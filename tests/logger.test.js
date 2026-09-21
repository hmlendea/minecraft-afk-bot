const test = require('node:test')
const assert = require('node:assert/strict')
const fileSystem = require('fs')
const pathModule = require('path')
const utility = require('util')

const { DEFAULT_LOG_FILE_PATH, createLogger } = require('../logger.js')

test('default log file is logfile.log beside bot.js', () => {
    const botFilePath = require.resolve('../bot.js')

    assert.strictEqual(pathModule.basename(DEFAULT_LOG_FILE_PATH), 'logfile.log')
    assert.strictEqual(pathModule.dirname(DEFAULT_LOG_FILE_PATH), pathModule.dirname(botFilePath))
})

test('logger mirrors informational and error messages to the console and log file', () => {
    const temporaryDirectoryPath = fileSystem.mkdtempSync(pathModule.join(__dirname, 'test-temp-'))
    const logFilePath = pathModule.join(temporaryDirectoryPath, 'test.log')
    const consoleLogCalls = []
    const consoleErrorCalls = []
    const consoleOutput = {
        log(...values) {
            consoleLogCalls.push(values)
        },
        error(...values) {
            consoleErrorCalls.push(values)
        }
    }
    const timestamp = new Date('2026-09-21T12:34:56.789Z')
    const logger = createLogger({
        logFilePath,
        dateSupplier: () => timestamp,
        consoleOutput
    })
    const connectionError = new Error('Connection failure')

    try {
        logger.log('Selected zone:', 'zone_one')
        logger.error('The bot has encountered an error:', connectionError)

        assert.deepStrictEqual(consoleLogCalls, [['Selected zone:', 'zone_one']])
        assert.deepStrictEqual(consoleErrorCalls, [['The bot has encountered an error:', connectionError]])

        const formattedTimestamp = '2026-09-21T12:34:56.7890000Z'
        const expectedLogContent = [
            `${formattedTimestamp} [INFO] ${utility.format('Selected zone:', 'zone_one')}`,
            `${formattedTimestamp} [ERROR] ${utility.format('The bot has encountered an error:', connectionError)}`,
            ''
        ].join('\n')
        assert.strictEqual(fileSystem.readFileSync(logFilePath, 'utf8'), expectedLogContent)
    } finally {
        fileSystem.rmSync(temporaryDirectoryPath, { recursive: true, force: true })
    }
})