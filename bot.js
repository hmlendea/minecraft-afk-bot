// bot.js
const fileSystem = require('fs')
const pathModule = require('path')
const mineflayer = require('mineflayer')
const {
    DEFAULT_LOG_FILE_PATH,
    createLogger,
    applicationLogger: defaultApplicationLogger
} = require('./logger.js')

const DEFAULT_CONFIGURATION_FILE_NAME = 'configuration.json'
const DEFAULT_CONFIGURATION_TEMPLATE_FILE_NAME = 'configuration.example.json'
const MINUTES_PER_HOUR = 60
const SECONDS_PER_MINUTE = 60
const MILLISECONDS_PER_SECOND = 1000
const ZERO_MILLISECONDS = 0
const DEFAULT_SLEEP_PROBABILITY = 0.65
const BED_COMMAND = '/bed'
const BLOCK_BELOW_VERTICAL_OFFSET = -1
const CURRENT_BLOCK_VERTICAL_OFFSET = 0
const HORIZONTAL_OR_DEPTH_POSITION_OFFSET = 0
const BED_INTERACTION_RANGE = 4.5
const MAXIMUM_BED_SEARCH_RESULTS = 32
const BED_SEARCH_POSITION_OFFSETS = Object.freeze([
    Object.freeze({ horizontalOffset: HORIZONTAL_OR_DEPTH_POSITION_OFFSET, verticalOffset: CURRENT_BLOCK_VERTICAL_OFFSET, depthOffset: HORIZONTAL_OR_DEPTH_POSITION_OFFSET }),
    Object.freeze({ horizontalOffset: HORIZONTAL_OR_DEPTH_POSITION_OFFSET, verticalOffset: BLOCK_BELOW_VERTICAL_OFFSET, depthOffset: HORIZONTAL_OR_DEPTH_POSITION_OFFSET })
])
const AUTHENTICATION_COMMAND_PATTERN = /^\/auth(?:\s|$)/i
const REDACTED_AUTHENTICATION_COMMAND = '/auth [REDACTED]'

function ensureConfigurationExists(
    configurationFilePath = pathModule.join(__dirname, DEFAULT_CONFIGURATION_FILE_NAME),
    configurationTemplateFilePath = pathModule.join(__dirname, DEFAULT_CONFIGURATION_TEMPLATE_FILE_NAME),
    applicationLogger = defaultApplicationLogger
) {
    if (!fileSystem.existsSync(configurationFilePath) && fileSystem.existsSync(configurationTemplateFilePath)) {
        fileSystem.copyFileSync(configurationTemplateFilePath, configurationFilePath)
        applicationLogger.log('Generated `configuration.json` from the `configuration.example.json` template.')
    }
}

function loadConfiguration(
    configurationFilePath = pathModule.join(__dirname, DEFAULT_CONFIGURATION_FILE_NAME),
    applicationLogger = defaultApplicationLogger
) {
    ensureConfigurationExists(
        configurationFilePath,
        pathModule.join(pathModule.dirname(configurationFilePath), DEFAULT_CONFIGURATION_TEMPLATE_FILE_NAME),
        applicationLogger
    )

    const rawConfigurationContent = fileSystem.readFileSync(configurationFilePath, 'utf8')
    return JSON.parse(rawConfigurationContent)
}

function pause(milliseconds) {
    if (milliseconds <= ZERO_MILLISECONDS) {
        return Promise.resolve()
    }

    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function randomInteger(minimum, maximum) {
    if (minimum > maximum) {
        throw new RangeError('The minimum bound cannot exceed the maximum bound.')
    }

    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

function randomChoice(array) {
    if (!Array.isArray(array) || array.length === 0) {
        throw new TypeError('An array with at least one element is required.')
    }

    return array[Math.floor(Math.random() * array.length)]
}

function redactAuthenticationCommand(command) {
    if (typeof command === 'string' && AUTHENTICATION_COMMAND_PATTERN.test(command.trimStart())) {
        return REDACTED_AUTHENTICATION_COMMAND
    }

    return command
}

function resolveLogFilePath(loggingConfiguration, baseDirectoryPath = __dirname) {
    if (loggingConfiguration === undefined || loggingConfiguration === null) {
        return DEFAULT_LOG_FILE_PATH
    }

    const configuredLogFilePath = loggingConfiguration.filePath

    if (configuredLogFilePath === undefined) {
        return DEFAULT_LOG_FILE_PATH
    }

    if (typeof configuredLogFilePath !== 'string' || configuredLogFilePath.trim().length === 0) {
        throw new TypeError(`The logging file path must be a non-empty string. Received: ${configuredLogFilePath}.`)
    }

    return pathModule.resolve(baseDirectoryPath, configuredLogFilePath)
}

function isRestrictedByTimeWindow(currentDate, scheduleConfiguration) {
    if (!scheduleConfiguration) {
        return false
    }

    const { startHour, startMinute, endHour, endMinute } = scheduleConfiguration
    const evaluatedDate = currentDate || new Date()
    const currentMinutes = evaluatedDate.getHours() * MINUTES_PER_HOUR + evaluatedDate.getMinutes()
    const startMinutes = startHour * MINUTES_PER_HOUR + startMinute
    const endMinutes = endHour * MINUTES_PER_HOUR + endMinute

    if (startMinutes === endMinutes) {
        return false
    }

    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

async function executeCommand(bot, command, delayMilliseconds, applicationLogger = defaultApplicationLogger) {
    if (!bot || typeof bot.chat !== 'function') {
        throw new TypeError('A valid bot instance with a chat method is required.')
    }

    applicationLogger.log(`Executing command: ${redactAuthenticationCommand(command)}`)
    bot.chat(command)
    await pause(delayMilliseconds)
}

function resolveSleepProbability(sleepConfiguration) {
    const sleepProbability = sleepConfiguration?.probability ?? DEFAULT_SLEEP_PROBABILITY

    if (!Number.isFinite(sleepProbability) || sleepProbability < 0 || sleepProbability > 1) {
        throw new RangeError(`The sleep probability must be a finite number between 0 and 1. Received: ${sleepProbability}.`)
    }

    return sleepProbability
}

function* getReachableBedPositions(bot) {
    for (const positionOffset of BED_SEARCH_POSITION_OFFSETS) {
        yield bot.entity.position.offset(
            positionOffset.horizontalOffset,
            positionOffset.verticalOffset,
            positionOffset.depthOffset
        )
    }

    if (typeof bot.findBlocks !== 'function') {
        return
    }

    const reachableBedPositions = bot.findBlocks({
        matching: block => bot.isABed(block),
        maxDistance: BED_INTERACTION_RANGE,
        count: MAXIMUM_BED_SEARCH_RESULTS
    })

    if (Array.isArray(reachableBedPositions)) {
        yield* reachableBedPositions
    }
}

async function activateBedUnderBot(bot, applicationLogger = defaultApplicationLogger) {
    if (
        !bot?.entity?.position ||
        typeof bot.entity.position.offset !== 'function' ||
        typeof bot.blockAt !== 'function' ||
        typeof bot.isABed !== 'function' ||
        typeof bot.activateBlock !== 'function'
    ) {
        throw new TypeError('A valid bot instance with entity position and block interaction methods is required.')
    }

    const bedPositions = getReachableBedPositions(bot)

    for (const bedPosition of bedPositions) {
        const bedBlock = bot.blockAt(bedPosition)

        if (!bedBlock || !bot.isABed(bedBlock)) {
            continue
        }

        applicationLogger.log('A bed block was found:', bedBlock.name || 'unnamed bed')

        try {
            await bot.activateBlock(bedBlock)
            applicationLogger.log('Sleeping was initiated successfully.')
            return true
        } catch (error) {
            applicationLogger.error('Sleeping could not be initiated because bed activation failed:', error)
            throw error
        }
    }

    applicationLogger.log('No bed block was found within interaction range.')
    return false
}

function registerNightSleepHandler(
    bot,
    sleepConfiguration,
    commandDelayMilliseconds,
    zoneTeleportCommand,
    randomSupplier = Math.random,
    applicationLogger = defaultApplicationLogger
) {
    if (!bot || typeof bot.on !== 'function' || !bot.time) {
        throw new TypeError('A valid bot instance with time data and event handling is required.')
    }

    if (typeof zoneTeleportCommand !== 'string' || zoneTeleportCommand.trim().length === 0) {
        throw new TypeError(`The zone teleport command must be a non-empty string. Received: ${zoneTeleportCommand}.`)
    }

    if (typeof randomSupplier !== 'function') {
        throw new TypeError('The random supplier must be a function.')
    }

    const sleepProbability = resolveSleepProbability(sleepConfiguration)
    let previousIsDay = typeof bot.time.isDay === 'boolean' ? bot.time.isDay : null
    let isZoneTeleportPending = false
    let transitionSequence = Promise.resolve()

    bot.on('time', () => {
        const currentIsDay = bot.time.isDay

        if (typeof currentIsDay !== 'boolean') {
            return
        }

        if (previousIsDay === null) {
            previousIsDay = currentIsDay
            return
        }

        if (currentIsDay === previousIsDay) {
            return
        }

        previousIsDay = currentIsDay
        transitionSequence = transitionSequence
            .then(async () => {
                if (currentIsDay) {
                    if (!isZoneTeleportPending) {
                        return
                    }

                    await executeCommand(bot, zoneTeleportCommand, commandDelayMilliseconds, applicationLogger)
                    isZoneTeleportPending = false
                    return
                }

                if (randomSupplier() >= sleepProbability) {
                    applicationLogger.log('Night sleep was skipped because the configured probability condition was not met.')
                    return
                }

                applicationLogger.log('Night sleep was selected. Issuing the bed command.')
                await executeCommand(bot, BED_COMMAND, commandDelayMilliseconds, applicationLogger)
                isZoneTeleportPending = true
                const wasBedActivated = await activateBedUnderBot(bot, applicationLogger)

                if (!wasBedActivated) {
                    applicationLogger.log('Returning to the selected zone because no bed block was available.')
                    await executeCommand(bot, zoneTeleportCommand, commandDelayMilliseconds, applicationLogger)
                    isZoneTeleportPending = false
                    return
                }
            })
            .catch(error => {
                applicationLogger.error('The night sleep sequence failed:', error)
            })
    })
}

// =========================
// Main
// =========================
async function main(
    customConfiguration,
    botFactory = mineflayer.createBot,
    randomSupplier = Math.random,
    applicationLogger
) {
    const configurationLoadLogger = applicationLogger || defaultApplicationLogger
    const configuration = customConfiguration || loadConfiguration(undefined, configurationLoadLogger)
    const configuredLogFilePath = resolveLogFilePath(configuration.logging)
    const activeApplicationLogger = applicationLogger || (
        configuredLogFilePath === DEFAULT_LOG_FILE_PATH
            ? defaultApplicationLogger
            : createLogger({ logFilePath: configuredLogFilePath })
    )

    if (isRestrictedByTimeWindow(new Date(), configuration.schedule)) {
        const { startHour, startMinute, endHour, endMinute } = configuration.schedule
        const startHourFormatted = startHour.toString().padStart(2, '0')
        const startMinuteFormatted = startMinute.toString().padStart(2, '0')
        const endHourFormatted = endHour.toString().padStart(2, '0')
        const endMinuteFormatted = endMinute.toString().padStart(2, '0')
        activeApplicationLogger.log(`The current time falls within the restricted execution window (${startHourFormatted}:${startMinuteFormatted} - ${endHourFormatted}:${endMinuteFormatted}). The bot will not execute.`)
        return null
    }

    if (randomSupplier() < configuration.schedule.skipProbability) {
        activeApplicationLogger.log(`${configuration.schedule.skipProbability * 100}% random skip condition triggered. The bot will not execute.`)
        return null
    }

    const selectedZone = randomChoice(configuration.zones)
    const zoneTeleportCommand = `/zone tp ${selectedZone}`
    activeApplicationLogger.log(`Selected zone: ${selectedZone}`)

    const bot = botFactory({
        host: configuration.server.host,
        port: configuration.server.port,
        username: configuration.credentials.username,
        version: configuration.server.version
    })

    let isCompleted = false

    bot.once('login', () => {
        activeApplicationLogger.log(`Connected to the server at ${configuration.server.host}:${configuration.server.port} as ${configuration.credentials.username}.`)
    })

    bot.once('spawn', async () => {
        try {
            activeApplicationLogger.log('The world environment has loaded.')
            await pause(configuration.session.spawnDelayMilliseconds)

            await executeCommand(bot, `/auth ${configuration.credentials.password}`, configuration.session.commandDelayMilliseconds, activeApplicationLogger)
            await executeCommand(bot, `/op`, configuration.session.commandDelayMilliseconds, activeApplicationLogger)
            await executeCommand(bot, `/god`, configuration.session.commandDelayMilliseconds, activeApplicationLogger)
            await executeCommand(bot, zoneTeleportCommand, configuration.session.commandDelayMilliseconds, activeApplicationLogger)

            registerNightSleepHandler(
                bot,
                configuration.sleep,
                configuration.session.commandDelayMilliseconds,
                zoneTeleportCommand,
                randomSupplier,
                activeApplicationLogger
            )

            const onlineMinutes = randomInteger(
                configuration.session.minimumOnlineMinutes,
                configuration.session.maximumOnlineMinutes
            )
            activeApplicationLogger.log(`Remaining online for ${onlineMinutes} minutes.`)
            await pause(onlineMinutes * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND)

            isCompleted = true
            activeApplicationLogger.log('Disconnecting from the server.')
            bot.quit('Completed')
        } catch (error) {
            activeApplicationLogger.error('An error has occurred during bot execution:', error)
            isCompleted = true
            bot.quit('Error')
        }
    })

    bot.on('kicked', reason => {
        activeApplicationLogger.log('Kicked from the server:', reason)
    })

    bot.on('error', error => {
        activeApplicationLogger.error('The bot has encountered an error:', error)
    })

    bot.on('end', () => {
        if (!isCompleted) {
            activeApplicationLogger.log('Disconnected prior to normal completion.')
        } else {
            activeApplicationLogger.log('The bot session has concluded.')
        }
    })

    return bot
}

if (require.main === module) {
    main().catch(error => {
        defaultApplicationLogger.error('A fatal error has occurred during bot execution:', error)
    })
}

module.exports = {
    pause,
    randomInteger,
    randomChoice,
    resolveLogFilePath,
    isRestrictedByTimeWindow,
    executeCommand,
    resolveSleepProbability,
    activateBedUnderBot,
    registerNightSleepHandler,
    ensureConfigurationExists,
    loadConfiguration,
    main
}
