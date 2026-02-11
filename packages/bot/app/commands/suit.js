import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js'
import { InteractionResponseType } from 'discord-interactions'
import { getToonRendition } from '../util/cmds.js'
import { getScoutToken } from '../util/api.js'
import { SuitsCalculator } from 'toonapi-calculator'

const ids = {
  name: 'suit',
  home: 'home',
  refresh: 'refresh',
  sell: 'sell',
  cash: 'cash',
  law: 'law',
  boss: 'boss'
}

const levels = {
  s: {
    'Cold Caller': 5,
    Telemarketer: 6,
    'Name Dropper': 7,
    'Glad Hander': 8,
    'Mover & Shaker': 9,
    'Two-Face': 10,
    'The Mingler': 11,
    'Mr. Hollywood': 50
  },
  m: {
    'Short Change': 5,
    'Penny Pincher': 6,
    Tightwad: 7,
    'Bean Counter': 8,
    'Number Cruncher': 9,
    'Money Bags': 10,
    'Loan Shark': 11,
    'Robber Baron': 50
  },
  l: {
    'Bottom Feeder': 5,
    Bloodsucker: 6,
    'Double Talker': 7,
    'Ambulance Chaser': 8,
    'Back Stabber': 9,
    'Spin Doctor': 10,
    'Legal Eagle': 11,
    'Big Wig': 50
  },
  c: {
    Flunky: 5,
    'Pencil Pusher': 6,
    Yesman: 7,
    Micromanager: 8,
    Downsizer: 9,
    'Head Hunter': 10,
    'Corporate Raider': 11,
    'The Big Cheese': 50
  }
}

const icons = {
  gear: 'https://scouttoon.info/images/coggear.png',
  sell: 'https://scouttoon.info/images/emblem_sell.png',
  cash: 'https://scouttoon.info/images/emblem_cash.png',
  law: 'https://scouttoon.info/images/emblem_law.png',
  boss: 'https://scouttoon.info/images/emblem_boss.png'
}

export const data = new SlashCommandBuilder()
  .setName(ids.name)
  .setDescription('Find information about your cog suits.')
  .setIntegrationTypes([0, 1])
  .setContexts([0, 1, 2])
  .addUserOption(option =>
    option.setName('user').setDescription("(Optional) Get the specified user's toon info.").setRequired(false)
  )

export async function execute(req, res, target) {
  const item = await getScoutToken(target)
  const row = getRow(target, ids.home)

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [getHomeEmbed(item)],
      components: [row]
    }
  })
}

export async function handleButton(req, customId) {
  const parts = customId.split(':')
  const action = parts[0]
  const state = parts.length === 3 ? parts[1] : null
  const target = parts.length === 3 ? parts[2] : parts[1]

  const item = await getScoutToken(target)

  const stateInfo = {
    [ids.home]: () => ({
      embed: getHomeEmbed(item),
      row: getRow(target, ids.home)
    }),
    [ids.sell]: () => ({
      embed: getSellEmbed(item),
      row: getRow(target, ids.sell)
    }),
    [ids.cash]: () => ({
      embed: getCashEmbed(item),
      row: getRow(target, ids.cash)
    }),
    [ids.law]: () => ({
      embed: getLawEmbed(item),
      row: getRow(target, ids.law)
    }),
    [ids.boss]: () => ({
      embed: getBossEmbed(item),
      row: getRow(target, ids.boss)
    })
  }

  let embed, row

  if (action === `${ids.name}-${ids.refresh}` && stateInfo[state]) {
    ;({ embed, row } = stateInfo[state]())
  } else if (stateInfo[action.replace(`${ids.name}-`, '')]) {
    ;({ embed, row } = stateInfo[action.replace(`${ids.name}-`, '')]())
  } else {
    return
  }

  return { embed, row }
}

function getRow(target, currentId) {
  const buttons = [
    getRefreshButton(currentId, target),
    getHomeButton(target),
    getSellButton(target),
    getCashButton(target),
    getLawButton(target),
    getBossButton(target)
  ]

  const filtered = buttons.filter(b => !b.data.custom_id.startsWith(`${ids.name}-${currentId}`))
  return new ActionRowBuilder().addComponents(filtered)
}

function getHomeEmbed(item) {
  const toon = item.data
  return new EmbedBuilder()
    .setColor('Red')
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, 'laffmeter')
    })
    .setTitle('Cog Suits')
    .setDescription('View your current suits or select department for more information.')
    .setThumbnail(icons.gear)
    .addFields(
      { name: 'Sellbot', value: getBasicSuitInfo(toon.cogsuits, 's') },
      { name: 'Cashbot', value: getBasicSuitInfo(toon.cogsuits, 'm') },
      { name: 'Lawbot', value: getBasicSuitInfo(toon.cogsuits, 'l') },
      { name: 'Bossbot', value: getBasicSuitInfo(toon.cogsuits, 'c') }
    )
    .setTimestamp(item.modified)
}

function getSellEmbed(item) {
  return getSuitEmbed(item, 'Sellbot', 's').setThumbnail(icons.sell)
}
function getCashEmbed(item) {
  return getSuitEmbed(item, 'Cashbot', 'm').setThumbnail(icons.cash)
}
function getLawEmbed(item) {
  return getSuitEmbed(item, 'Lawbot', 'l').setThumbnail(icons.law)
}
function getBossEmbed(item) {
  return getSuitEmbed(item, 'Bossbot', 'c').setThumbnail(icons.boss)
}

function getSuitEmbed(item, title, type) {
  const toon = item.data
  const suit = toon.cogsuits
  if (!suit[type].hasDisguise) {
    return new EmbedBuilder()
      .setColor('Red')
      .setAuthor({
        name: toon.toon.name,
        iconURL: getToonRendition(toon, 'laffmeter')
      })
      .setTitle(title)
      .setDescription(`This toon has no ${title} disguise.`)
      .setTimestamp(item.modified)
  }

  if (suit[type].level === 50) {
    return new EmbedBuilder()
      .setColor('Red')
      .setAuthor({
        name: toon.toon.name,
        iconURL: getToonRendition(toon, 'laffmeter')
      })
      .setTitle(getBasicSuitInfo(suit, type))
      .setDescription('Maxed!')
      .setFooter({
        text: 'Facility earnings are an estimate.',
        iconURL: icons.gear
      })
      .setTimestamp(item.modified)
  }

  return new EmbedBuilder()
    .setColor('Red')
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, 'laffmeter')
    })
    .setTitle(getBasicSuitInfo(suit, type))
    .setDescription(`${simplifyNeeded(suit, type)} to go!\nProgress: ${simplifyPromo(suit, type)}`)
    .addFields(getSuitPath(suit, type))
    .setFooter({
      text: 'Facility earnings are an estimate.',
      iconURL: icons.gear
    })
    .setTimestamp(item.modified)
}

// Buttons
function getHomeButton(target) {
  return new ButtonBuilder().setCustomId(`${ids.name}-home:${target}`).setLabel('Home').setStyle('Primary')
}
function getRefreshButton(type, target) {
  return new ButtonBuilder().setCustomId(`${ids.name}-refresh:${type}:${target}`).setLabel('Refresh').setStyle('Danger')
}
function getSellButton(target) {
  return new ButtonBuilder().setCustomId(`${ids.name}-sell:${target}`).setLabel('Sellbot').setStyle('Secondary')
}
function getCashButton(target) {
  return new ButtonBuilder().setCustomId(`${ids.name}-cash:${target}`).setLabel('Cashbot').setStyle('Secondary')
}
function getLawButton(target) {
  return new ButtonBuilder().setCustomId(`${ids.name}-law:${target}`).setLabel('Lawbot').setStyle('Secondary')
}
function getBossButton(target) {
  return new ButtonBuilder().setCustomId(`${ids.name}-boss:${target}`).setLabel('Bossbot').setStyle('Secondary')
}

// Helpers
function getSuitPath(toon, type) {
  const calc = new SuitsCalculator(JSON.stringify(toon))
  const { path, total } = calc.getBestPathWeighted(type)
  if (total == -2) {
    return {
      name: 'Recommended Activities',
      value: 'None.\n**You are ready for promotion!**'
    }
  }

  const weighted = {}
  path.forEach(item => (weighted[item] = (weighted[item] || 0) + 1))

  let result = ''
  for (const [item, count] of Object.entries(weighted)) {
    result += `(${count}) ${item}\n`
  }
  return {
    name: 'Recommended Activities',
    value: result + `**Estimated earnings:** ${total}`
  }
}

function getBasicSuitInfo(toon, type) {
  const suitType = toon[type]
  if (!suitType.hasDisguise) return 'No disguise!'
  const prestige = suitType.version === 2 ? ' v2.0' : ''
  return `${suitType.suit.name}, Level ${suitType.level} / ${getLevel(toon, type)}${prestige}`
}

function simplifyPromo(toon, type) {
  return `${new SuitsCalculator(JSON.stringify(toon)).getCurrent(
    type
  )} / ${new SuitsCalculator(JSON.stringify(toon)).getTarget(type)}`
}
function simplifyNeeded(toon, type) {
  return new SuitsCalculator(JSON.stringify(toon)).getNeeded(type)
}
function getLevel(toon, type) {
  return toon[type].version === 2 ? 50 : levels[type][toon[type].suit.name]
}
