const fileSystem = require('fs')
const pathModule = require('path')
const utility = require('util')

const DEFAULT_LOG_FILE_NAME = 'logfile.log'
const DEFAULT_LOG_FILE_PATH = pathModule.join(__dirname, DEFAULT_LOG_FILE_NAME)
const INFORMATION_LOG_LEVEL = 'INFO'
const ERROR_LOG_LEVEL = 'ERROR'
const LOG_FILE_ENCODING = 'utf8'

function formatTimestamp(date) {
    return date.toISOString().replace(/(\.\d{3})Z$/, '$10000Z')
}

function createLogger({
    logFilePath = DEFAULT_LOG_FILE_PATH,
    dateSupplier = () => new Date(),
    consoleOutput = console
} = {}) {
    if (typeof logFilePath !== 'string' || logFilePath.trim().length === 0) {
        throw new TypeError(`The log file path must be a non-empty string. Received: ${logFilePath}.`)
    }

    fileSystem.mkdirSync(pathModule.dirname(logFilePath), { recursive: true })

    function appendLog(logLevel, values) {
        const timestamp = formatTimestamp(dateSupplier())
        const message = utility.format(...values)
        fileSystem.appendFileSync(
            logFilePath,
            `${timestamp} [${logLevel}] ${message}\n`,
            LOG_FILE_ENCODING
        )
    }

    return {
        log(...values) {
            consoleOutput.log(...values)
            appendLog(INFORMATION_LOG_LEVEL, values)
        },
        error(...values) {
            consoleOutput.error(...values)
            appendLog(ERROR_LOG_LEVEL, values)
        }
    }
}

const applicationLogger = createLogger()

module.exports = {
    DEFAULT_LOG_FILE_PATH,
    createLogger,
    applicationLogger
}