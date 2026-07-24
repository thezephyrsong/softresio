import { Hono } from "hono"
import z from "zod"
import { diff, removeOne } from "../shared/utils.ts"
import {
  Attendee,
  Character,
  CreateSrRequest,
  CreateSrResponse,
  DeleteSrRequest,
  DeleteSrResponse,
  GetSrPlusResponse,
  Guild,
  Raid,
  SoftReserve,
  SrPlus,
  SrPlusManualChangeRequest,
  SrPlusManualChangeResponse,
} from "../shared/types.ts"
import { beginWithTimeout, sql } from "./database.ts"
import {
  characterSchema,
  raidIdSchema,
  userSchema,
  uuidSchema,
} from "./schemas.ts"
import { getOrCreateUser } from "./utils.ts"
import { ContentfulStatusCode } from "hono/utils/http-status"

const app = new Hono()

app.post("/api/sr/create", async (c) => {
  const user = await getOrCreateUser(c)
  const request = z
    .object({
      raidId: raidIdSchema,
      character: characterSchema,
      selectedItemIds: z.array(z.number()),
    })
    .safeParse(await c.req.json())

  if (!request.data) {
    const response: CreateSrResponse = {
      error: {
        message: "Invalid request",
        issues: request.error.issues,
      },
      user,
    }
    return c.json(response, 400)
  }

  const { raidId, character, selectedItemIds }: CreateSrRequest = request.data

  const softReserves: SoftReserve[] = selectedItemIds.map((itemId) => ({
    itemId,
    srPlus: null,
    comment: null,
  }))
  const attendee: Attendee = {
    character,
    softReserves,
    user,
  }
  const response: [CreateSrResponse, ContentfulStatusCode] =
    await beginWithTimeout(async (tx) => {
      const [result] = await tx<
        { raid: Raid }[]
      >`select raid from raids where raid @> ${{
        id: raidId,
        deleted: false,
      } as never} for update;`
      const raid = result?.raid
      if (!raid) return [{ user, error: { message: "Raid not found" } }, 404]
      if (raid.locked) {
        return [{ user, error: { message: "Raid is locked" } }, 400]
      }

      // need to delete all and add all new
      const oldNameCharacter = raid.attendees.find(
        (attendee) =>
          attendee.character.name != character.name &&
          attendee.user.userId == user.userId,
      )

      // need to diff
      const sameCharacter = raid.attendees.find(
        (attendee) => attendee.character.name == character.name,
      )

      let changes: { itemId: number; character: Character; remove: boolean }[] =
        []
      if (oldNameCharacter) {
        // remove all
        changes = changes.concat(
          oldNameCharacter.softReserves.map((sr) => ({
            itemId: sr.itemId,
            character: oldNameCharacter.character,
            remove: true,
          })),
        )
      }
      if (sameCharacter) {
        // log diff
        const { added, removed } = diff(
          sameCharacter.softReserves.map((sr) => sr.itemId),
          attendee.softReserves.map((sr) => sr.itemId),
        )
        changes = changes.concat(
          removed.map((itemId) => ({
            itemId: itemId,
            character: sameCharacter.character,
            remove: true,
          })),
        )
        changes = changes.concat(
          added.map((itemId) => ({
            itemId: itemId,
            character: sameCharacter.character,
            remove: false,
          })),
        )
      } else {
        // add all
        changes = changes.concat(
          attendee.softReserves.map((sr) => ({
            itemId: sr.itemId,
            character: attendee.character,
            remove: false,
          })),
        )
      }

      for (const { itemId, character, remove } of changes) {
        raid.activityLog.push({
          byUser: user,
          type: "SrChanged",
          time: new Date(new Date().getTime() + (remove ? 0 : 10))
            .toISOString(),
          change: remove ? "deleted" : "created",
          character,
          itemId,
        })
      }

      raid.attendees = raid.attendees.filter(
        (attendee) =>
          attendee.character.name !== character.name &&
          attendee.user.userId !== user.userId,
      )
      raid.attendees = [...raid.attendees, attendee]
      await tx`update raids set ${
        sql({ raid: raid } as never)
      } where raid @> ${{
        id: raidId,
      } as never}`
      return [{ user, data: raid }, 200]
    })
  return c.json(...response)
})

app.post("/api/sr/delete", async (c) => {
  const user = await getOrCreateUser(c)

  const requestRaw = z
    .object({
      raidId: z.string().length(5),
      user: userSchema,
      itemId: z.number(),
    })
    .safeParse(await c.req.json())

  if (!requestRaw.data) {
    const response: DeleteSrResponse = {
      error: {
        message: "Invalid request",
        issues: requestRaw.error.issues,
      },
      user,
    }
    return c.json(response, 400)
  }
  const request: DeleteSrRequest = requestRaw.data

  const response: [DeleteSrResponse, ContentfulStatusCode] =
    await beginWithTimeout(async (tx) => {
      const [result] = await tx<
        { raid: Raid }[]
      >`select raid from raids where raid @> ${{
        id: request.raidId,
        deleted: false,
      } as never} for update;`
      const raid = result?.raid
      if (!raid) return [{ user, error: { message: "Raid not found" } }, 404]

      if (
        raid.admins.some((u) => u.userId == user.userId) ||
        (request.user.userId == user.userId && !raid.locked)
      ) {
        raid.attendees = raid.attendees
          .map((attendee) => ({
            user: attendee.user,
            character: attendee.character,
            softReserves: removeOne(
              (softReserve) =>
                attendee.user.userId == request.user.userId &&
                softReserve.itemId == request.itemId,
              attendee.softReserves,
            ),
          }))
          .filter((attendee) => attendee.softReserves.length > 0)
        raid.activityLog.push({
          byUser: user,
          type: "SrChanged",
          time: new Date().toISOString(),
          change: "deleted",
          character: raid.attendees.find(
            (a) => a.user.userId == request.user.userId,
          )?.character,
          itemId: request.itemId,
        })
        await tx`update raids set ${
          sql({ raid: raid } as never)
        } where raid @> ${{
          id: request.raidId,
        } as never}`
        return [{ user, data: raid }, 200]
      } else {
        return [{
          user,
          error: { message: "You are not allowed to delete that SR" },
        }, 400]
      }
    })
  return c.json(response)
})

app.post("/api/srplus", async (c) => {
  const user = await getOrCreateUser(c)
  const request = z
    .object({
      guildId: uuidSchema,
      characterName: z.string().max(12).min(1),
      itemId: z.number(),
      value: z.number().min(-1000).max(1000),
    })
    .safeParse(await c.req.json())

  if (!request.data) {
    const response: SrPlusManualChangeResponse = {
      error: {
        message: "Invalid request",
        issues: request.error.issues,
      },
      user,
    }
    return c.json(response, 400)
  }

  const { guildId, characterName, itemId, value }: SrPlusManualChangeRequest =
    request.data

  const response: [SrPlusManualChangeResponse, ContentfulStatusCode] =
    await beginWithTimeout(
      async (tx) => {
        const [result] = await sql<{ guild: Guild }[]>`select guild
          from guilds
          where
            guild @> ${{
          admins: [{ userId: user.userId }],
          id: guildId,
        } as never} for update;`
        if (!result?.guild) {
          return [{
            error: {
              message: "You are not an admin of a guild with that id",
            },
            user,
          }, 400]
        }
        const guild = result.guild
        guild.srPlus.push({
          type: "manual",
          time: new Date().toISOString(),
          characterName,
          itemId,
          value,
        })
        await tx`insert into guilds ${
          sql({
            guild,
          } as never)
        } on conflict ((guild->>'id')) do update set guild = EXCLUDED.guild;`
        return [{ user, data: guild }, 200]
      },
    )
  return c.json(...response)
})

const MAX_SR_PLUS_CHAIN = 50 // guard against absurdly long or cyclic chains

const getGuildSrPluses = async (
  raid: Raid,
  guildId: string,
): Promise<SrPlus[]> => {
  const [guildResult] = await sql<{ guild: Guild }[]>`select guild
      from guilds
      where
        guild @> ${{
    id: guildId,
  } as never};`
  if (!guildResult?.guild) return []
  const guild = guildResult.guild
  const srPlus: SrPlus[] = []
  for (const attendee of raid.attendees) {
    for (
      const itemId of (new Set(attendee.softReserves.map((sr) => sr.itemId)))
        .values()
    ) {
      const raids = await sql<
        { id: string; time: string }[]
      >`select raid->'id' as id, raid->'time' as time from raids where raid @> ${{
        deleted: false,
        locked: true,
        guildId: raid.guildId,
        attendees: [
          {
            character: {
              name: attendee.character.name,
            },
            softReserves: [{ itemId }],
          },
        ],
      } as never} and raid->>'time' < ${raid.time};`
      for (const raid of raids) {
        srPlus.push({
          type: "raid",
          raidId: raid.id,
          time: raid.time,
          characterName: attendee.character.name,
          itemId,
        })
      }
      for (const srPlusChange of guild.srPlus) {
        if (
          srPlusChange.itemId == itemId &&
          srPlusChange.characterName == attendee.character.name
        ) {
          srPlus.push(srPlusChange)
        }
      }
    }
  }
  return srPlus
}

// For raids with no guild: instead of an automatic guild-wide search, the
// raid creator points at a specific earlier raid (or chain of raids, if that
// one also has a previousRaidId) to build SR+ priority on top of.
const getChainedSrPluses = async (raid: Raid): Promise<SrPlus[]> => {
  const srPlus: SrPlus[] = []
  const visited = new Set<string>([raid.id])
  let currentId = raid.previousRaidId

  for (let i = 0; i < MAX_SR_PLUS_CHAIN && currentId; i++) {
    if (visited.has(currentId)) break // cycle guard
    visited.add(currentId)

    const [result] = await sql<{ raid: Raid }[]>`select raid from raids where raid @> ${{
      id: currentId,
      deleted: false,
    } as never};`
    const previousRaid = result?.raid
    if (!previousRaid) break

    for (const attendee of previousRaid.attendees) {
      for (const sr of attendee.softReserves) {
        srPlus.push({
          type: "raid",
          raidId: previousRaid.id,
          time: previousRaid.time,
          characterName: attendee.character.name,
          itemId: sr.itemId,
        })
      }
    }

    currentId = previousRaid.previousRaidId
  }

  return srPlus
}

export const getSrPluses = async (raid: Raid): Promise<SrPlus[]> => {
  if (raid.guildId) return await getGuildSrPluses(raid, raid.guildId)
  if (raid.useSrPlus && raid.previousRaidId) {
    return await getChainedSrPluses(raid)
  }
  return []
}

app.get("/api/srplus/:raidId", async (c) => {
  const user = await getOrCreateUser(c)
  const request = z.string().length(5).safeParse(c.req.param("raidId"))
  if (!request.data) {
    const response: GetSrPlusResponse = {
      error: { message: "Missing raidId from request" },
      user,
    }
    return c.json(response)
  }
  const raidId = request.data
  const [raidResult] = await sql<
    { raid: Raid }[]
  >`select raid from raids where raid @> ${{
    id: raidId,
    deleted: false,
  } as never};`
  const raid = raidResult?.raid
  if (!raid) {
    return c.json({ error: { message: "Raid not found" } }, 404)
  }
  if (!raid.guildId && !raid.useSrPlus) {
    return c.json({ error: { message: "Raid does not use SR+" } }, 400)
  }
  const response: GetSrPlusResponse = {
    user,
    data: await getSrPluses(raid),
  }
  return c.json(response)
})

export default app
