import * as fs from "node:fs"
import type { GameServer, Instance } from "../shared/types.ts"

export const instances: Instance[] = []

const serverFolders: GameServer[] = ["triumvirate"] // "turtlewow", "epoch" temporarily disabled, no instance data

for (const server of serverFolders) {
  fs.glob(`./instances/${server}/*.json`, async (err, matches) => {
    if (err) {
      throw err
    }
    for (const file of matches) {
      const instance: Instance = JSON.parse(await Deno.readTextFile(file))
      instance.server = server
      instances.push(instance)
    }
  })
}
