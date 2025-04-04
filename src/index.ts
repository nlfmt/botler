import env from "@/env"
import { Botler } from "@/bot"
import logger from "./util/logger"

const bot = new Botler()

bot.on("ready", ({ user }) => {
  logger.info("Logged in as " + user.displayName)
})

void bot.login(env.TOKEN)

process.on("unhandledRejection", (error) => {
  logger.error("UNHANDLED", JSON.stringify(error, null, 2))
})
