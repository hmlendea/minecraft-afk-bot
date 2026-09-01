// tests/bot.test.js
const test = require('node:test')
const assert = require('node:assert/strict')
const fileSystem = require('fs')
const pathModule = require('path')
const EventEmitter = require('events')

const {
    pause,
    randomInteger,
    randomChoice,
    isRestrictedByTimeWindow,
    executeCommand,
    ensureConfigurationExists,
    loadConfiguration,
    main
} = require('../bot.js')

test('pause resolves immediately for non-positive millisecond delays', async () => {
    const zeroStartTimestamp = Date.now()
    await pause(0)
    const zeroElapsedTime = Date.now() - zeroStartTimestamp
    assert.ok(zeroElapsedTime < 50)

    const negativeStartTimestamp = Date.now()
    await pause(-100)
    const negativeElapsedTime = Date.now() - negativeStartTimestamp
    assert.ok(negativeElapsedTime < 50)
})

test('pause waits for specified positive millisecond delay', async () => {
    const startTimestamp = Date.now()
    const targetDelayMilliseconds = 20
    await pause(targetDelayMilliseconds)
    const elapsedTime = Date.now() - startTimestamp
    assert.ok(elapsedTime >= 15)
})

test('randomInteger returns values within inclusive bounds', () => {
    const minimumBound = 5
    const maximumBound = 15

    for (let index = 0; index < 100; index += 1) {
        const generatedValue = randomInteger(minimumBound, maximumBound)
        assert.ok(generatedValue >= minimumBound)
        assert.ok(generatedValue <= maximumBound)
        assert.strictEqual(Number.isInteger(generatedValue), true)
    }
})

test('randomInteger handles identical minimum and maximum bounds', () => {
    const singleBoundValue = 42
    const generatedValue = randomInteger(singleBoundValue, singleBoundValue)
    assert.strictEqual(generatedValue, singleBoundValue)
})

test('randomInteger handles negative bounds', () => {
    const minimumBound = -20
    const maximumBound = -5

    for (let index = 0; index < 50; index += 1) {
        const generatedValue = randomInteger(minimumBound, maximumBound)
        assert.ok(generatedValue >= minimumBound)
        assert.ok(generatedValue <= maximumBound)
    }
})

test('randomInteger throws RangeError when minimum exceeds maximum', () => {
    assert.throws(() => {
        randomInteger(20, 10)
    }, RangeError)
})

test('randomChoice returns an element from the provided array', () => {
    const choices = ['solaire_of_astora', 'Angetenar', 'zezima', 'DummyUser']

    for (let index = 0; index < 50; index += 1) {
        const selectedChoice = randomChoice(choices)
        assert.ok(choices.includes(selectedChoice))
    }
})

test('randomChoice works with single-element arrays', () => {
    const singleElementArray = ['Yes Man']
    const selectedChoice = randomChoice(singleElementArray)
    assert.strictEqual(selectedChoice, 'Yes Man')
})

test('randomChoice throws TypeError when array is invalid or empty', () => {
    const invalidInputs = [null, undefined, [], 'Grumpy Cat', 123, {}]

    invalidInputs.forEach(invalidInput => {
        assert.throws(() => {
            randomChoice(invalidInput)
        }, TypeError)
    })
})

test('isRestrictedByTimeWindow returns false when schedule is missing', () => {
    assert.strictEqual(isRestrictedByTimeWindow(new Date(), null), false)
    assert.strictEqual(isRestrictedByTimeWindow(new Date(), undefined), false)
})

test('isRestrictedByTimeWindow returns false when start and end times are identical', () => {
    const scheduleConfiguration = {
        startHour: 10,
        startMinute: 0,
        endHour: 10,
        endMinute: 0
    }
    const testDate = new Date(2026, 8, 1, 10, 0)
    assert.strictEqual(isRestrictedByTimeWindow(testDate, scheduleConfiguration), false)
})

test('isRestrictedByTimeWindow accurately evaluates same-day time windows', () => {
    const scheduleConfiguration = {
        startHour: 1,
        startMinute: 30,
        endHour: 17,
        endMinute: 0
    }

    const dateBeforeWindow = new Date(2026, 8, 1, 1, 15)
    assert.strictEqual(isRestrictedByTimeWindow(dateBeforeWindow, scheduleConfiguration), false)

    const dateAtWindowStart = new Date(2026, 8, 1, 1, 30)
    assert.strictEqual(isRestrictedByTimeWindow(dateAtWindowStart, scheduleConfiguration), true)

    const dateInsideWindow = new Date(2026, 8, 1, 12, 0)
    assert.strictEqual(isRestrictedByTimeWindow(dateInsideWindow, scheduleConfiguration), true)

    const dateAtWindowEnd = new Date(2026, 8, 1, 17, 0)
    assert.strictEqual(isRestrictedByTimeWindow(dateAtWindowEnd, scheduleConfiguration), false)

    const dateAfterWindow = new Date(2026, 8, 1, 18, 0)
    assert.strictEqual(isRestrictedByTimeWindow(dateAfterWindow, scheduleConfiguration), false)
})

test('isRestrictedByTimeWindow accurately evaluates overnight time windows', () => {
    const scheduleConfiguration = {
        startHour: 22,
        startMinute: 0,
        endHour: 6,
        endMinute: 0
    }

    const eveningInsideWindow = new Date(2026, 8, 1, 23, 0)
    assert.strictEqual(isRestrictedByTimeWindow(eveningInsideWindow, scheduleConfiguration), true)

    const morningInsideWindow = new Date(2026, 8, 1, 4, 30)
    assert.strictEqual(isRestrictedByTimeWindow(morningInsideWindow, scheduleConfiguration), true)

    const daytimeOutsideWindow = new Date(2026, 8, 1, 14, 0)
    assert.strictEqual(isRestrictedByTimeWindow(daytimeOutsideWindow, scheduleConfiguration), false)
})

test('executeCommand issues chat command and resolves after delay', async () => {
    let executedChatCommand = ''
    const mockBot = {
        chat(commandText) {
            executedChatCommand = commandText
        }
    }

    const testCommand = '/zone tp solar_forge'
    await executeCommand(mockBot, testCommand, 1)

    assert.strictEqual(executedChatCommand, testCommand)
})

test('executeCommand throws TypeError when bot instance is invalid', async () => {
    const invalidBots = [null, undefined, {}, { chat: 'not-a-function' }]

    for (const invalidBot of invalidBots) {
        await assert.rejects(async () => {
            await executeCommand(invalidBot, '/op', 1)
        }, TypeError)
    }
})

test('ensureConfigurationExists creates target file from template when missing', () => {
    const temporaryDirectoryPath = fileSystem.mkdtempSync(pathModule.join(__dirname, 'test-temp-'))
    const configurationFilePath = pathModule.join(temporaryDirectoryPath, 'configuration.json')
    const templateFilePath = pathModule.join(temporaryDirectoryPath, 'configuration.example.json')

    const sampleTemplateContent = JSON.stringify({ server: { host: 'mc.example.com' } })
    fileSystem.writeFileSync(templateFilePath, sampleTemplateContent, 'utf8')

    ensureConfigurationExists(configurationFilePath, templateFilePath)

    assert.strictEqual(fileSystem.existsSync(configurationFilePath), true)
    assert.strictEqual(fileSystem.readFileSync(configurationFilePath, 'utf8'), sampleTemplateContent)

    fileSystem.rmSync(temporaryDirectoryPath, { recursive: true, force: true })
})

test('ensureConfigurationExists preserves existing configuration file', () => {
    const temporaryDirectoryPath = fileSystem.mkdtempSync(pathModule.join(__dirname, 'test-temp-'))
    const configurationFilePath = pathModule.join(temporaryDirectoryPath, 'configuration.json')
    const templateFilePath = pathModule.join(temporaryDirectoryPath, 'configuration.example.json')

    const existingContent = JSON.stringify({ server: { host: 'existing.server.ro' } })
    const templateContent = JSON.stringify({ server: { host: 'template.server.ro' } })

    fileSystem.writeFileSync(configurationFilePath, existingContent, 'utf8')
    fileSystem.writeFileSync(templateFilePath, templateContent, 'utf8')

    ensureConfigurationExists(configurationFilePath, templateFilePath)

    assert.strictEqual(fileSystem.readFileSync(configurationFilePath, 'utf8'), existingContent)

    fileSystem.rmSync(temporaryDirectoryPath, { recursive: true, force: true })
})

test('loadConfiguration loads and parses configuration file correctly', () => {
    const temporaryDirectoryPath = fileSystem.mkdtempSync(pathModule.join(__dirname, 'test-temp-'))
    const configurationFilePath = pathModule.join(temporaryDirectoryPath, 'configuration.json')
    const templateFilePath = pathModule.join(temporaryDirectoryPath, 'configuration.example.json')

    const configurationData = {
        server: { host: 'mc.example.com', port: 25565, version: '1.20.1' },
        credentials: { username: 'Testy McTestface', password: 'secret-password' }
    }

    fileSystem.writeFileSync(configurationFilePath, JSON.stringify(configurationData), 'utf8')
    fileSystem.writeFileSync(templateFilePath, JSON.stringify(configurationData), 'utf8')

    const loadedConfiguration = loadConfiguration(configurationFilePath)
    assert.strictEqual(loadedConfiguration.server.host, 'mc.example.com')
    assert.strictEqual(loadedConfiguration.credentials.username, 'Testy McTestface')

    fileSystem.rmSync(temporaryDirectoryPath, { recursive: true, force: true })
})

test('main returns null when time restriction applies', async () => {
    const mockConfiguration = {
        server: { host: 'mc.example.com', port: 25565, version: '1.20.1' },
        credentials: { username: 'Angetenar', password: 'password' },
        zones: ['zone_one'],
        schedule: {
            startHour: 0,
            startMinute: 0,
            endHour: 23,
            endMinute: 59,
            skipProbability: 0.0
        },
        session: {
            minimumOnlineMinutes: 1,
            maximumOnlineMinutes: 2,
            spawnDelayMilliseconds: 1,
            commandDelayMilliseconds: 1
        }
    }

    const botResult = await main(mockConfiguration)
    assert.strictEqual(botResult, null)
})

test('main returns null when skip probability is triggered', async () => {
    const mockConfiguration = {
        server: { host: 'mc.example.com', port: 25565, version: '1.20.1' },
        credentials: { username: 'solaire_of_astora', password: 'password' },
        zones: ['zone_one'],
        schedule: {
            startHour: 10,
            startMinute: 0,
            endHour: 10,
            endMinute: 0,
            skipProbability: 0.9
        },
        session: {
            minimumOnlineMinutes: 1,
            maximumOnlineMinutes: 2,
            spawnDelayMilliseconds: 1,
            commandDelayMilliseconds: 1
        }
    }

    const alwaysTriggerRandom = () => 0.1
    const botResult = await main(mockConfiguration, undefined, alwaysTriggerRandom)
    assert.strictEqual(botResult, null)
})

test('main creates bot and executes spawn workflow when unrestricted', async () => {
    const mockConfiguration = {
        server: { host: 'mc.example.com', port: 25565, version: '1.20.1' },
        credentials: { username: 'Bob Ross', password: 'password123' },
        zones: ['zone_one'],
        schedule: {
            startHour: 10,
            startMinute: 0,
            endHour: 10,
            endMinute: 0,
            skipProbability: 0.5
        },
        session: {
            minimumOnlineMinutes: 1,
            maximumOnlineMinutes: 2,
            spawnDelayMilliseconds: 1,
            commandDelayMilliseconds: 1
        }
    }

    class MockBot extends EventEmitter {
        constructor() {
            super()
            this.sentCommands = []
            this.quitReason = null
        }

        chat(commandText) {
            this.sentCommands.push(commandText)
        }

        quit(reason) {
            this.quitReason = reason
            this.emit('end')
        }
    }

    let createdBotInstance = null
    const mockBotFactory = () => {
        createdBotInstance = new MockBot()
        return createdBotInstance
    }

    const neverTriggerRandom = () => 0.99
    const botResult = await main(mockConfiguration, mockBotFactory, neverTriggerRandom)

    assert.ok(botResult)
    assert.strictEqual(botResult, createdBotInstance)

    botResult.emit('login')
    botResult.emit('kicked', 'Maintenance')
    botResult.emit('error', new Error('Connection error'))

    await new Promise(resolve => setImmediate(resolve))
})

test('main handles errors thrown during spawn sequence gracefully', async () => {
    const mockConfiguration = {
        server: { host: 'mc.example.com', port: 25565, version: '1.20.1' },
        credentials: { username: 'Gică Contra', password: 'password123' },
        zones: ['zone_one'],
        schedule: {
            startHour: 10,
            startMinute: 0,
            endHour: 10,
            endMinute: 0,
            skipProbability: 0.0
        },
        session: {
            minimumOnlineMinutes: 1,
            maximumOnlineMinutes: 2,
            spawnDelayMilliseconds: 1,
            commandDelayMilliseconds: 1
        }
    }

    class FaultyBot extends EventEmitter {
        chat() {
            throw new Error('Chat failure')
        }

        quit(reason) {
            this.quitReason = reason
            this.emit('end')
        }
    }

    let faultyBotInstance = null
    const faultyBotFactory = () => {
        faultyBotInstance = new FaultyBot()
        return faultyBotInstance
    }

    const neverTriggerRandom = () => 0.99
    const botResult = await main(mockConfiguration, faultyBotFactory, neverTriggerRandom)

    assert.ok(botResult)
    botResult.emit('spawn')

    await new Promise(resolve => setTimeout(resolve, 50))

    assert.strictEqual(faultyBotInstance.quitReason, 'Error')
})
