import type { Instance, SrPlus } from "../shared/types.ts"

type RemoveOneType = <T>(filter: (e: T) => boolean, list: T[]) => T[]

export const removeOne: RemoveOneType = (filter, list) => {
  const match = list.find((e) => filter(e))
  if (!match) return list
  const idx = list.indexOf(match)
  return [...list.slice(0, idx), ...list.slice(idx + 1)]
}

export const formatTime = (time: string) =>
  Intl.DateTimeFormat(navigator.language, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(time))

export const diff = (before: number[], after: number[]) => {
  const added = before.reduce((acc, cur) => removeOne((e) => e == cur, acc), [
    ...after,
  ])
  const removed = after.reduce((acc, cur) => removeOne((e) => e == cur, acc), [
    ...before,
  ])
  return { added, removed }
}

export const raidIdToUrl = (raidId: string): string => {
  const { protocol, hostname, port } = globalThis.location
  return `${protocol}//${hostname}${
    hostname == "localhost" ? `:${port}` : ""
  }/${raidId}`
}

export const parseRaidIdFromLink = (link: string): string | undefined => {
  const trimmed = link.trim()
  if (!trimmed) return undefined
  const segments = trimmed.split("/").filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  if (!lastSegment || lastSegment.length !== 5) return undefined
  return lastSegment.toUpperCase()
}

export const choice = <T>(array: readonly T[]): T => {
  // Return a random element
  return array[Math.floor(Math.random() * array.length)]
}

export const sample = <T>(array: readonly T[], k: number): T[] => {
  // Return a k length array of unique elements
  // Partial Fisher-Yates shuffle (which I implemented myself)
  const result = [...array]
  const n = result.length
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(Math.random() * (n - i))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result.slice(0, k)
}

const sum = (array: number[]) =>
  array.reduce((accumulator, currentValue) => (accumulator + currentValue), 0)

export const randint = (min: number, max: number): number => {
  // Return a random integer between two values, inclusive
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values_inclusive
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export const sumSrPlus = (srPluses: SrPlus[]) => {
  return sum(
    srPluses.map((srPlus) => srPlus.type == "manual" ? srPlus.value : 10),
  )
}

export const formatCharacterName = (characterName: string) => {
  const cleaned = characterName.toLowerCase().replace(/[^a-zA-Z]/g, "")
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}

// Generic "this boss wasn't attempted this raid" filter. Used for any
// instance where a raid lead needs to scope the SR/HR item pool down to
// only the bosses they're actually planning to kill - e.g. Obsidian
// Sanctum's Sartharion drake-tier variants, or Zul'Aman's timed-event
// chests. Removes the excluded bosses, any NPCs belonging to them, and
// trims dropsFrom entries for those bosses off every item (dropping the
// item entirely if that leaves it with no valid drop source left).
export const filterInstanceBosses = (
  instance: Instance,
  excludedBossIds: number[],
): Instance => {
  if (!excludedBossIds || excludedBossIds.length === 0) return instance
  const excluded = new Set(excludedBossIds)
  return {
    ...instance,
    bosses: instance.bosses.filter((boss) => !excluded.has(boss.id)),
    npcs: instance.npcs.filter((npc) => !excluded.has(npc.bossId)),
    items: instance.items
      .map((item) => ({
        ...item,
        dropsFrom: item.dropsFrom.filter((df) => !excluded.has(df.bossId)),
      }))
      .filter((item) => item.dropsFrom.length > 0),
  }
}
