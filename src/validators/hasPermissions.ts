import { createValidator, type Validator } from "@/util/validator"
import type { PermissionResolvable } from "discord.js"

export default createValidator(
  async (ctx, permissions: PermissionResolvable, checkAdmin?: boolean) => {
    if (ctx.i.member.permissions.has(permissions, checkAdmin)) return true
    await ctx.reply.warn("You are not authorized to use this command.")
    return false
  }
) as (...args: any[]) => Validator<false>