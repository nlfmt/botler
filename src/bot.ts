import { ActivityType, Client, GatewayIntentBits, type Interaction } from "discord.js"
import { loadCommands, MiddlewareBuilder, parseOptions, type CommandContext } from "./util/command"
import { createAbortHelper, createReplyHelper, mockAbortHelper, mockReplyHelper, replyError } from "./util/reply"
import { runValidators } from "./util/validator"
import logger from "./util/logger"
import { voiceStateUpdate } from "./events/voiceStateUpdate"

export class Botler extends Client<true> {
  public commands!: Awaited<ReturnType<typeof loadCommands>>

  constructor() {
    super({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers] })
  }

  private async init() {
    this.commands = await loadCommands()
    logger.info(`Loaded ${this.commands.size} commands`)

    this.on("interactionCreate", this.interactionCreate.bind(this))
    this.on("voiceStateUpdate", voiceStateUpdate)

    setInterval(() => this.randomActivity(), 1000 * 15)
  }

  public async login(token?: string) {
    await this.init()
    return super.login(token)
  }

  public randomActivity() {
    const activities = [
      { type: ActivityType.Listening, name: "/help" },
      { type: ActivityType.Listening, name: "your commands" },
      { type: ActivityType.Watching, name: "the channels" },
    ]
    const activity = activities[Math.floor(Math.random() * activities.length)]
    this.user.setActivity(activity) 
  }


  private async interactionCreate(i: Interaction) {
    const isCommand = i.isChatInputCommand()
    if (!(isCommand || i.isButton()) || !i.inCachedGuild()) return

    const commandId = isCommand ? i.commandName : i.customId.split(":")[0]!
    const command = this.commands.get(commandId)
    if (!command) {
      logger.warn(`Command ${commandId} not found.`)
      return
    }
    if (i.isButton() && !command.allowButtons) {
      logger.warn(`Button interaction for ${command.name} is not allowed.`)
      return
    }

    const ctx: CommandContext<boolean, any, any> = {
      i,
      bot: this,
      reply: isCommand ? createReplyHelper(i) : mockReplyHelper(i),
      options: isCommand ? parseOptions(i) : {},
      data: {},
    }

    try {
      if (command.validators && !await runValidators(command.validators, ctx)) {
        if (!ctx.i.replied) {
          await ctx.reply.error("You cannot use this command.")
        }
        return
      }

      let aborted = false
      if (command.middleware) {
        const middlewares = command.middleware(new MiddlewareBuilder()).middlewares
        const onAbort = () => (aborted = true)
        
        for (const fn of middlewares) {
          const newData = await fn(ctx, isCommand ? createAbortHelper(i, onAbort) : mockAbortHelper(i, onAbort))
          if (aborted) {
            if (!ctx.i.replied) {
              await ctx.reply.error("You cannot use this commmand.")
            }
          }
          if (newData) ctx.data = { ...ctx.data, ...newData }
        }
      }

      await command.run(ctx)

    } catch (e) {
      logger.error("CMD ERROR", "Unhandled Exception in command:")
      logger.debug(e)

      if (isCommand)
        await replyError(i, "An internal error occured. Please contact <@339719840363184138> if the issue persists.")
    }
  }
}
