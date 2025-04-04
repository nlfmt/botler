import db from "@/util/db"
import { ChannelType, type VoiceState } from "discord.js"

const createdChannels = new Map<string, Map<string, number>>()

export async function voiceStateUpdate(prev: VoiceState, next: VoiceState) {
  if (prev.channelId == next.channelId) return

  await onLeaveVC(prev)
  await onJoinVC(next)
}

async function onJoinVC(state: VoiceState) {
  const { channelId, guild, member } = state
  if (!channelId) return

  const createdChannels = getCreatedChannels(guild.id)
  const guildInfo = await db.guildInfo.find({ guildId: guild.id })
  const info = guildInfo?.channels.find(c => c.channel === channelId)

  // check if channel is an already created autovc
  if (createdChannels?.has(channelId)) {
    const userCount = createdChannels.get(channelId)!
    createdChannels.set(channelId, userCount + 1)
  } else if (info) {
    // check if channel is autovc trigger, then create new vc
    const channel = await guild.channels.create({
      name: `[ ${member?.displayName}'s channel ]`,
      type: ChannelType.GuildVoice,
      parent: info.category,
    })

    await state.setChannel(channel)
    createdChannels.set(channel.id, 1)
  }
}

async function onLeaveVC(state: VoiceState) {
  const { channelId, guild, channel } = state
  if (!channelId) return
  
  const createdChannels = getCreatedChannels(guild.id)
  if (createdChannels.has(channelId)) {
    const userCount = createdChannels.get(channelId)!

    if (userCount <= 1) {
      createdChannels.delete(channelId)
      await channel?.delete()
    } else {
      createdChannels.set(channelId, userCount - 1)
    }
  }
}  

function getCreatedChannels(guildId: string): Map<string, number> {
  if (!createdChannels.has(guildId)) {
    createdChannels.set(guildId, new Map())
  }
  return createdChannels.get(guildId)!
}