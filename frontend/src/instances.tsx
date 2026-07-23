import type { ComboboxItem, OptionsFilter, SelectProps } from "@mantine/core"
import { Title } from "@mantine/core"
import type { GameServer, Instance } from "../shared/types.ts"

export const SERVER_LABELS: Record<GameServer, string> = {
  triumvirate: "Triumvirate",
  // turtlewow: "Turtle WoW", // temporarily disabled, no instance data
  // epoch: "Project Epoch", // temporarily disabled, no instance data
}

export const instanceOrder = [
  // Vanilla & Classic --
  "Molten Core",
  "Blackwing Lair",
  "Zul'Gurub",
  "Ruins of Ahn'Qiraj",
  "Temple of Ahn'Qiraj",
  "Onyxia's Lair",
  
  // The Burning Crusade --
  "Lower Karazhan Halls",
  "Tower of Karazhan",
  "Emerald Sanctum",
  "Karazhan",
  "Gruul's Lair",
  "Magtheridon's Lair",
  "Serpentshrine Cavern",
  "Tempest Keep: The Eye",
  "Battle for Mount Hyjal",
  "Black Temple",
  "Zul'Aman",
  "Sunwell Plateau",

  // Wrath of the Lich King --
  "Vault of Archavon (10 Player)",
  "Vault of Archavon (25 Player)",
  "Naxxramas (10 Player)",
  "Naxxramas (25 Player)",
  "The Obsidian Sanctuary",
  "The Eye of Eternity",
  "Ulduar (10 Player)",
  "Ulduar (25 Player)",
  "Trial of the Crusader (10 Player)",
  "Trial of the Crusader (25 Player)",
  "Icecrown Citadel (10 Player)",
  "Icecrown Citadel (25 Player)",
  "The Ruby Sanctum (10 Player)",
  "The Ruby Sanctum (25 Player)",
]

export const renderInstance: (
  instances: Instance[],
) => SelectProps["renderOption"] = (instances) =>
(
  { option },
) => {
  const instance = instances.filter((i) => i.id.toString() == option.value)[0]
  return (
    <>
      <Title order={6} w={45}>{instance.shortname.toUpperCase()}</Title>
      {instance.name}
    </>
  )
}

export const instanceFilter: (instances: Instance[]) => OptionsFilter =
  (instances) => ({ options, search }) => {
    return (options as ComboboxItem[]).filter((option) => {
      const instance = instances.find((instance) =>
        instance.id == Number(option.value)
      )
      return instance?.name.toLowerCase().includes(search.toLowerCase()) ||
        instance?.shortname.toLowerCase().includes(search.toLowerCase())
    })
  }
