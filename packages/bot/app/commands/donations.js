import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import { InteractionResponseType } from 'discord-interactions'
import { carnivalStatus } from '../util/api.js'
import { carnivalEnums } from '../util/cmds.js'

export const data = new SlashCommandBuilder()
  .setName('donations')
  .setDescription('Check how many tokens have been donated to Riggy')
  .setIntegrationTypes([0, 1])
  .setContexts([0, 1, 2])

export async function execute(res) {
  const embed = new EmbedBuilder().setColor('Blue').setDescription(await getFund())

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed]
    }
  })
}

const getFund = async () => {
  const res = await carnivalStatus()
  const status = res.status
  if (status == null || status.paradeStatus == carnivalEnums.INACTIVE) {
    return res.message
  }

  const response = await fetch('https://toontownrewritten.com/api/riggydonations')
  if (!response.ok) {
    throw new Error('Fetch failed:', response.statusText)
  }
  const resData = await response.json()
  return `**${resData.tokensDonated}** tokens have been donated!`
}
