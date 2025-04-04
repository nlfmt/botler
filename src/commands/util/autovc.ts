import { buildOptions, createCommand } from "@/util/command"
import { ChannelType, PermissionFlagsBits } from "discord.js"
import db from "@/util/db"
import logger from "@/util/logger"
import { $push } from "@nlfmt/stormdb"
import getGuildInfo from "@/middlewares/getGuildInfo"
import hasPermissions from "@/validators/hasPermissions"

export default createCommand({
  description: "Create an Auto VC that creates as many channels as needed",
  options: buildOptions()
    .subcommand({
      name: "add",
      description: "Add an Auto VC",
      options: buildOptions()
        .channel({
          name: "channel",
          channelTypes: [ChannelType.GuildVoice],
          description: "The channel that users have to join to create a new channel",
          required: true,
        })
        .channel({
          name: "category",
          channelTypes: [ChannelType.GuildCategory],
          description: "The category under which the voice channels will be created",
          required: true,
        })
        .build(),
    })
    .subcommand({
      name: "remove",
      description: "Remove an Auto VC",
      options: buildOptions()
        .channel({
          name: "channel",
          channelTypes: [ChannelType.GuildVoice],
          description: "The Auto VC channel to remove",
          required: true,
        })
        .build(),
    })
    .subcommand({
      name: "clear",
      description: "Clear all Auto VCs",
    })
    .subcommand({
      name: "list",
      description: "List all Auto VCs",
    })
    .build(),

  validators: [hasPermissions(PermissionFlagsBits.ManageGuild)],
  middleware: m => m.use(getGuildInfo),

  run: async ({ i, options, reply, data: { guildInfo } }) => {
    const { _id: id, channels } = guildInfo

    switch (options.__cmd) {
      case "add":
        if (channels.find(c => c.channel === options.channel.id)) return reply.warn("This channel is already bound.")
        await db.guildInfo.updateById(id, {
          channels: $push({ channel: options.channel.id, category: options.category.id }),
        })
        logger.info(`Creating Auto VC for ${options.channel.id} and category ${options.category.id} in guild '${i.guild.name}'`)
        return reply(`Created Auto VC from <#${options.channel.id}> to <#${options.category.id}>`, {
          flags: "Ephemeral",
          color: 0x22ff22,
        })

      case "remove":
        if (!channels.find(c => c.channel === options.channel.id)) {
          return reply.warn(`<#${options.channel.id}> is not an Auto VC`)
        }
        await db.guildInfo.updateById(id, {
          channels: (channels) => channels.filter((c) => c.channel !== options.channel.id),
        })
        logger.info(`Removing Auto VC ${options.channel.id} in guild '${i.member.guild.name}'`)
        return reply(`Removed Auto VC <#${options.channel.id}>`, {
          flags: "Ephemeral",
          color: 0x22ff22,
        })

      case "clear":
        logger.info(`Clearing Auto VCs in guild '${i.member.guild.name}'`)
        await db.guildInfo.updateById(id, {
          channels: [],
        })
        return reply("Cleared Auto VCs", {
          flags: "Ephemeral",
          color: 0x22ff22,
        })

      case "list":
        if (channels.length == 0) return reply("No Auto VCs")
        return reply(`Auto VCs: \n${channels.map((c) => `<#${c.channel}> -> <#${c.category}>`).join("\n")}`, {
          flags: "Ephemeral",
        })
    }
  },
})
