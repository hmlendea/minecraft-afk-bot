// bot.js
const fileSystem = require('fs')
const pathModule = require('path')
const mineflayer = require('mineflayer')

const configurationFilePath = pathModule.join(__dirname, 'configuration.json')
const configurationTemplateFilePath = pathModule.join(__dirname, 'configuration.example.json')

if (!fileSystem.existsSync(configurationFilePath) && fileSystem.existsSync(configurationTemplateFilePath)) {
    fileSystem.copyFileSync(configurationTemplateFilePath, configurationFilePath)
    console.log('Generated `configuration.json` from the `configuration.example.json` template.')
}

const configuration = require('./configuration.json')

// =========================
// Helpers
// =========================
function pause(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function randomInteger(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)]
}

function isRestrictedByTimeWindow(currentDate = new Date()) {
    const { startHour, startMinute, endHour, endMinute } = configuration.schedule
    const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes()
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute

    return currentMinutes >= startMinutes && currentMinutes < endMinutes
}

async function executeCommand(bot, command, delayMilliseconds) {
    console.log(`Executing command: ${command}`)
    bot.chat(command)
    await pause(delayMilliseconds)
}

// =========================
// Main
// =========================
async function main() {
    if (isRestrictedByTimeWindow()) {
        const { startHour, startMinute, endHour, endMinute } = configuration.schedule
        const startHourFormatted = startHour.toString().padStart(2, '0')
        const startMinuteFormatted = startMinute.toString().padStart(2, '0')
        const endHourFormatted = endHour.toString().padStart(2, '0')
        const endMinuteFormatted = endMinute.toString().padStart(2, '0')
        console.log(`The current time falls within the restricted execution window (${startHourFormatted}:${startMinuteFormatted} - ${endHourFormatted}:${endMinuteFormatted}). The bot will not execute.`)
        return
    }

    if (Math.random() < configuration.schedule.skipProbability) {
        console.log(`${configuration.schedule.skipProbability * 100}% random skip condition triggered. The bot will not execute.`)
        return
    }

    const selectedZone = randomChoice(configuration.zones)
    console.log(`Selected zone: ${selectedZone}`)

    const bot = mineflayer.createBot({
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
            await pause(onlineMinutes * 60 * 1000)

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
}

main().catch(error => {
    console.error('A fatal error has occurred during bot execution:', error)
})
