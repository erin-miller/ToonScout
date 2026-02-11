import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import { InteractionResponseType } from 'discord-interactions'
import { getToonRendition } from '../util/cmds.js'
import { getScoutToken } from '../util/api.js'

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription("Show your toon's name, laff, and location.")
  .setIntegrationTypes([0, 1])
  .setContexts([0, 1, 2])
  .addUserOption(option =>
    option.setName('user').setDescription("(Optional) Get the specified user's toon info.").setRequired(false)
  )

export async function execute(_req, res, target) {
  const item = await getScoutToken(target)
  const toon = item.data
  const embed = new EmbedBuilder()
    .setColor('Greyple')
    .setAuthor({
      name: toon.toon.name,
      iconURL: getToonRendition(toon, 'laffmeter')
    })
    .setThumbnail(getToonRendition(toon, 'waving'))
    .addFields(
      { name: 'Laff', value: simplifyLaff(toon) },
      { name: 'Location', value: simplifyLocation(toon) },
      { name: 'Cattlelog', value: simplifyCattlelog(toon) },
      { name: 'Jellybeans', value: simplifyJellybeans(toon) }
    )
    .setTimestamp(item.modified)

  if (toon.tokens && toon.tokens > 0) {
    embed.addFields({ name: 'Cartoonival Tokens', value: toon.tokens.toString() })
  }

  return res.send({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed]
    }
  })
}

function simplifyLaff(toon) {
  return `${toon.laff.current}/${toon.laff.max}`
}

function simplifyLocation(toon) {
  const loc = toon.location
  let msg = `${loc.district}, ${loc.zone}`
  if (loc.zone !== loc.neighborhood) {
    msg += `, ${loc.neighborhood}`
  }
  return msg
}

function simplifyCattlelog(toon) {
  return `Series ${toon.cattlelog.series} Issue #${toon.cattlelog.issue}`
}

function simplifyJellybeans(toon) {
  return `Jar: ${toon.beans.jar.current}\nBank: ${toon.beans.bank.current}`
}
