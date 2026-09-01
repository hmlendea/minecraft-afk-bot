// bot.js
const fileSystem = require('fs')
const pathModule = require('path')
const mineflayer = require('mineflayer')

const DEFAULT_CONFIGURATION_FILE_NAME = 'configuration.json'
const DEFAULT_CONFIGURATION_TEMPLATE_FILE_NAME = 'configuration.example.json'
const MINUTES_PER_HOUR = 60
const SECONDS_PER_MINUTE = 60
const MILLISECONDS_PER_SECOND = 1000
const ZERO_MILLISECONDS = 0

function ensureConfigurationExists(
    configurationFilePath = pathModule.join(__dirname, DEFAULT_CONFIGURATION_FILE_NAME),
    configurationTemplateFilePath = pathModule.join(__dirname, DEFAULT_CONFIGURATION_TEMPLATE_FILE_NAME)
) {
    if (!fileSystem.existsSync(configurationFilePath) && fileSystem.existsSync(configurationTemplateFilePath)) {
        fileSystem.copyFileSync(configurationTemplateFilePath, configurationFilePath)
        console.log('Generated `configuration.json` from the `configuration.example.json` template.')
    }
}

function loadConfiguration(configurationFilePath = pathModule.join(__dirname, DEFAULT_CONFIGURATION_FILE_NAME)) {
    ensureConfigurationExists(
        configurationFilePath,
        pathModule.join(pathModule.dirname(configurationFilePath), DEFAULT_CONFIGURATION_TEMPLATE_FILE_NAME)
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

async function executeCommand(bot, command, delayMilliseconds) {
    if (!bot || typeof bot.chat !== 'function') {
        throw new TypeError('A valid bot instance with a chat method is required.')
    }

    console.log(`Executing command: ${command}`)
    bot.chat(command)
    await pause(delayMilliseconds)
}

// =========================
// Main
// =========================
async function main(customConfiguration, botFactory = mineflayer.createBot, randomSupplier = Math.random) {
    const configuration = customConfiguration || loadConfiguration()

    if (isRestrictedByTimeWindow(new Date(), configuration.schedule)) {
        const { startHour, startMinute, endHour, endMinute } = configuration.schedule
        const startHourFormatted = startHour.toString().padStart(2, '0')
        const startMinuteFormatted = startMinute.toString().padStart(2, '0')
        const endHourFormatted = endHour.toString().padStart(2, '0')
        const endMinuteFormatted = endMinute.toString().padStart(2, '0')
        console.log(`The current time falls within the restricted execution window (${startHourFormatted}:${startMinuteFormatted} - ${endHourFormatted}:${endMinuteFormatted}). The bot will not execute.`)
        return null
    }

    if (randomSupplier() < configuration.schedule.skipProbability) {
        console.log(`${configuration.schedule.skipProbability * 100}% random skip condition triggered. The bot will not execute.`)
        return null
    }

    const selectedZone = randomChoice(configuration.zones)
    console.log(`Selected zone: ${selectedZone}`)

    const bot = botFactory({
        host: configuration.server.host,
        port: configuration.server.port,
        username: configuration.credentials.username,
        version: configuration.server.version
    })

    let isCompleted = false

    bot.once('login', () => {
        console.log(`Connected to the server at ${configuration.server.host}:${configuration.server.port} as ${configuration.credentials.username}.`)
    })

    bot.once('spawn', async () => {
        try {
            console.log('The world environment has loaded.')
            await pause(configuration.session.spawnDelayMilliseconds)

            await executeCommand(bot, `/auth ${configuration.credentials.password}`, configuration.session.commandDelayMilliseconds)
            await executeCommand(bot, `/op`, configuration.session.commandDelayMilliseconds)
            await executeCommand(bot, `/god`, configuration.session.commandDelayMilliseconds)
            await executeCommand(bot, `/zone tp ${selectedZone}`, configuration.session.commandDelayMilliseconds)

            const onlineMinutes = randomInteger(
                configuration.session.minimumOnlineMinutes,
                configuration.session.maximumOnlineMinutes
            )
            console.log(`Remaining online for ${onlineMinutes} minutes.`)
            await pause(onlineMinutes * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND)

            isCompleted = true
            console.log('Disconnecting from the server.')
            bot.quit('Completed')
        } catch (error) {
            console.error('An error has occurred during bot execution:', error)
            isCompleted = true
            bot.quit('Error')
        }
    })

    bot.on('kicked', reason => {
        console.log('Kicked from the server:', reason)
    })

    bot.on('error', error => {
        console.error('The bot has encountered an error:', error)
    })

    bot.on('end', () => {
        if (!isCompleted) {
            console.log('Disconnected prior to normal completion.')
        } else {
            console.log('The bot session has concluded.')
        }
    })

    return bot
}

if (require.main === module) {
    main().catch(error => {
        console.error('A fatal error has occurred during bot execution:', error)
    })
}

module.exports = {
    pause,
    randomInteger,
    randomChoice,
    isRestrictedByTimeWindow,
    executeCommand,
    ensureConfigurationExists,
    loadConfiguration,
    main
}

