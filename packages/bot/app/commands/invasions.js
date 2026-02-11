import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } from 'discord.js'
import { InteractionResponseType } from 'discord-interactions'

export const data = new SlashCommandBuilder()
  .setName('invasions')
  .setDescription('Show invasion status in all districts.')
  .setIntegrationTypes([0, 1])
  .setContexts([0, 1, 2])

export async function execute(_req, res, _target) {
  const { embed, row } = await getInvEmbed()

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
      components: [row]
    }
  })
}

export async function handleButton(_req, _customId) {
  return await getInvEmbed()
}

async function getInvasions() {
  const response = await fetch('https://www.toontownrewritten.com/api/invasions', {
    headers: { 'User-Agent': process.env.USER_AGENT }
  })

  if (response.ok) {
    const resData = await response.json()
    return sanitize(resData)
  } else {
    console.error('Could not get invasion data.')
    return null
  }
}

const getInvEmbed = async () => {
  const inv = await getInvasions()
  const row = new ActionRowBuilder().addComponents(getRefreshButton())
  const embed = new EmbedBuilder()
    .setColor('DarkBlue')
    .setTitle('Current Invasions')
    .setTimestamp(new Date(inv.lastUpdated * 1000))

  if (!inv.error) {
    let districtText = ''
    let cogText = ''
    let progText = ''

    for (const [district, invasion] of Object.entries(inv.invasions)) {
      districtText += `${district}\n`
      cogText += `${invasion.type}\n`
      const [curr, req] = invasion.progress.split('/')
      progText += `${((curr / req) * 100).toFixed(0)}%\n`
    }

    embed.addFields(
      { name: 'Cog', value: cogText, inline: true },
      { name: 'District', value: districtText, inline: true },
      { name: 'Progress', value: progText, inline: true }
    )
  } else {
    embed.addFields({
      name: 'Status',
      value: 'No active invasions at this time.'
    })
  }

  return { embed, row }
}

function getRefreshButton() {
  return new ButtonBuilder().setCustomId('invasions-refresh').setLabel('Refresh').setStyle('Danger')
}

const sanitize = item => {
  const cleaned = JSON.stringify(item)
  return JSON.parse(cleaned.replace(/\\u[0-9a-fA-F]{4}/g, ''))
}
