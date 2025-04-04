import { createMiddleware } from "@/util/middleware"
import db from "@/util/db"

export default createMiddleware(async ({ i }) => {
  const guildInfo =
    (await db.guildInfo.find({
      guildId: i.guild.id,
    })) ??
    (await db.guildInfo.create({
      channels: [],
      guildId: i.guild.id,
    }))

  return { guildInfo }
})
