import { randomUUID } from "node:crypto"
import type {
  Attendee,
  Guild,
  Raid,
  SoftReserve,
  User,
} from "../shared/types.ts"
import { choice, randint, sample } from "../shared/utils.ts"
import { DOMAIN } from "./config.ts"
import { sql } from "./database.ts"
import { instances } from "./instances.ts"
import { generateRaidId } from "./utils.ts"
const generateRaids = async (myUserId?: string) => {
  // Users
  const users = Array.from({ length: 500 }, (_): User => ({
    userId: randomUUID(),
    issuer: DOMAIN,
  }))
  if (myUserId) {
    users.push({ userId: myUserId, issuer: DOMAIN })
  }

  // Guilds
  const guilds = Array.from({ length: 10 }, (_): Guild => {
    const owner = choice(users)
    return {
      id: randomUUID(),
      name: `Guild ${randint(100_000, 1_000_000)}`,
      owner: owner,
      admins: [owner, choice(users)],
      srPlus: [],
    }
  })
  await sql`insert into guilds ${
    sql(guilds.map((g) => ({ guild: g })) as never)
  };`
  console.log("Guilds", guilds.map((r) => r.id))

  // Raids
  const raids = Array.from({ length: 10_000 }, (_): Raid => {
    const instance = choice(instances)
    const owner = choice(users)
    const srCount = randint(1, 4)
    const [hardReserve1, hardReserve2, ...instanceItems] = instance.items
    const date = new Date(2020, randint(1, 12), randint(1, 28), 12, 0, 0)
    const raid: Raid = {
      id: generateRaidId(),
      useSrPlus: choice([true, false]),
      instanceId: instance.id,
      time: date.toISOString(),
      attendees: Array.from(
        sample(users, randint(0, 50)),
        (user): Attendee => ({
          character: {
            name: `Jeff${user.userId.slice(0, 5)}`,
            class: "Warrior",
            spec: "Arms",
          },
          softReserves: Array.from(
            { length: randint(1, srCount) },
            (_): SoftReserve => {
              const item = choice(instanceItems.slice(0, 5))
              return {
                itemId: item.id,
                srPlus: randint(0, 15) * 10,
                comment:
                  `I really hope I win ${item.name} in ${instance.name}!`,
              }
            },
          ),
          user: user,
        }),
      ),
      admins: [owner],
      activityLog: [],
      srCount: srCount,
      description:
        `${hardReserve1.name} and ${hardReserve2.name} is hard-reserved! 😬`,
      locked: choice([true, false]),
      hardReserves: [hardReserve1.id, hardReserve2.id],
      excludedBossIds: [],
      allowDuplicateSr: true,
      owner: owner,
      guildId: choice(guilds).id,
      deleted: false,
    }
    return raid
  })
  await sql`insert into raids ${sql(raids.map((r) => ({ raid: r })) as never)};`
  console.log("Raids", raids.map((r) => r.id))
}

const cli = async (args: string[]) => {
  const [command, ...commandArgs] = args
  switch (command) {
    case undefined:
      return // no command => no cli
    case "generate-raids":
      await generateRaids(...commandArgs)
      break
    default:
      console.log("Unknown command")
      break
  }
  Deno.exit()
}

await cli(Deno.args)
