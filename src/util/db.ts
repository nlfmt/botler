import StormDB, { FileSaveLocation, JsonFile, type DocType } from "@nlfmt/stormdb"
import { z } from "zod"

const models = {
  guildInfo: z.object({
    guildId: z.string(),
    channels: z.array(z.object({
      channel: z.string(),
      category: z.string(),
    }))
  }),
}

export type GuildInfo = DocType<typeof models.guildInfo>

const storage = new JsonFile(
  new FileSaveLocation("db.json", {
    createIfNotExists: true,
  })
)

export default StormDB(models, { storage })
