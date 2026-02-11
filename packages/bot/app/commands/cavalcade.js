import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import { InteractionResponseType } from 'discord-interactions'
import { carnivalStatus } from '../util/api.js'
import { carnivalEnums } from '../util/cmds.js'

export const data = new SlashCommandBuilder()
  .setName('cavalcade')
  .setDescription('Check the status of the Cavalcade.')
  .setIntegrationTypes([0, 1])
  .setContexts([0, 1, 2])

export async function execute(res) {
  const embed = new EmbedBuilder().setColor('Blue').setDescription(await cavalcadeStatus())

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed]
    }
  })
}

const cavalcadeStatus = async () => {
  const res = await carnivalStatus()
  const status = res.status
  const timestamp = `<t:${res.timestamp}:t>`

  if (status == null || status == carnivalEnums.INACTIVE) {
    return res.message
  }

  if (status == carnivalEnums.RECHARGING) {
    return res.message + ` come back at ${timestamp} to find out the next location!`
  }

  if (status == carnivalEnums.IN_TRANSIT) {
    return res.message + ` starting at ${timestamp}!`
  }

  if (status == carnivalEnums.ACTIVE) {
    return res.message
  }

  return 'Uh oh! An error occured. Please try again later.'
}
