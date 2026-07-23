import type { Character, CharacterWithId } from "../shared/types.ts"
import { CheckIcon, Group, Image, Title, Tooltip } from "@mantine/core"
import { IconCheck } from "@tabler/icons-react"
import type { AutocompleteProps, SelectProps } from "@mantine/core"

export const CharacterNameClassSpec = (
  { character }: { character: Character },
) => (
  <Tooltip label={`${character.name} (${character.spec} ${character.class})`}>
    <Group wrap="nowrap" gap={0}>
      <ClassIcon xclass={character.class} />
      <ClassIcon xclass={character.class} spec={character.spec} />
      <Title order={6} lineClamp={1} ml="sm">
        {character.name}
      </Title>
    </Group>
  </Tooltip>
)

export const renderClassSpec: (
  myCharacters: CharacterWithId[],
) => AutocompleteProps["renderOption"] = (myCharacters) =>
(
  { option },
) => {
  const choice = myCharacters.filter((e) => e.id == option.value)[0]
  return (
    <Group gap="xs" w="100%" wrap="nowrap">
      <Group gap={2} wrap="nowrap">
        <ClassIcon xclass={choice.character.class} />
        <ClassIcon
          xclass={choice.character.class}
          spec={choice.character.spec}
        />
      </Group>
      {choice.character.name}
    </Group>
  )
}

export const renderClass: (
  selectedClass?: string,
) => SelectProps["renderOption"] = (selectedClass) =>
(
  { option },
) => (
  <Group gap="xs" w="100%" wrap="nowrap">
    <ClassIcon xclass={option.value} />
    {option.label}
    <Group justify="right" w="100%">
      {selectedClass == option.value ? <IconCheck /> : null}
    </Group>
  </Group>
)

export const renderSpec: (
  selectedClass: string,
  selectedSpec?: string | null,
) => SelectProps["renderOption"] = (selectedClass, selectedSpec) =>
(
  { option },
) => (selectedClass
  ? (
    <Group gap="xs" w="100%" wrap="nowrap">
      <ClassIcon xclass={selectedClass} spec={option.value || null} />
      {option.label}
      <Group justify="right" w="100%">
        {selectedSpec == option.value ? <CheckIcon height={10} /> : null}
      </Group>
    </Group>
  )
  : null)

export const ClassIcon = (
  { spec, xclass }: { xclass?: string | null; spec?: string | null },
) => {
  const icon = !xclass || spec === null
    ? "inv_misc_questionmark.jpg"
    : classIcons[`${xclass}${spec ? spec.replace(" ", "") : ""}`]
  return (
    <Image
      radius={2}
      h={20}
      w={20}
      src={`https://wotlkdb.com/static/images/wow/icons/medium/${icon}`}
    />
  )
}

export const classes: { [className: string]: string[] } = {
  "Death Knight": [
    "Blood",
    "Frost",
    "Unholy",
  ],
  "Warrior": [
    "Arms",
    "Fury",
    "Protection",
  ],
  "Priest": [
    "Discipline",
    "Holy",
    "Shadow",
  ],
  "Mage": [
    "Arcane",
    "Fire",
    "Frost",
  ],
  "Rogue": [
    "Assassination",
    "Combat",
    "Subtlety",
  ],
  "Druid": [
    "Balance",
    "Cat",
    "Bear",
    "Restoration",
  ],
  "Paladin": [
    "Holy",
    "Protection",
    "Retribution",
  ],
  "Shaman": [
    "Elemental",
    "Enhancement",
    "Restoration",
    "Tank",
  ],
  "Warlock": [
    "Affliction",
    "Demonology",
    "Destruction",
  ],
  "Hunter": [
    "Beast Mastery",
    "Marksmanship",
    "Survival",
  ],
}

export const classIcons: { [classSpec: string]: string } = {
  // Death Knight
  "Death Knight": "class_deathknight.jpg",
  "Death KnightBlood": "spell_deathknight_bloodpresence.jpg",
  "Death KnightFrost": "spell_deathknight_frostpresence.jpg",
  "Death KnightUnholy": "spell_deathknight_unholypresence.jpg",

  // Warrior
  "Warrior": "class_warrior.jpg",
  "WarriorArms": "ability_warrior_savageblow.jpg",
  "WarriorFury": "ability_warrior_innerrage.jpg",
  "WarriorProtection": "inv_shield_06.jpg",

  // Paladin
  "Paladin": "class_paladin.jpg",
  "PaladinHoly": "spell_holy_holybolt.jpg",
  "PaladinProtection": "spell_holy_devotionaura.jpg",
  "PaladinRetribution": "spell_holy_auraoflight.jpg",

  // Hunter
  "Hunter": "class_hunter.jpg",
  "HunterBeastMastery": "ability_hunter_beasttaming.jpg",
  "HunterMarksmanship": "ability_marksmanship.jpg",
  "HunterSurvival": "ability_hunter_swiftstrike.jpg",

  // Rogue
  "Rogue": "class_rogue.jpg",
  "RogueAssassination": "ability_rogue_eviscerate.jpg",
  "RogueCombat": "ability_backstab.jpg",
  "RogueSubtlety": "ability_stealth.jpg",

  // Priest
  "Priest": "class_priest.jpg",
  "PriestDiscipline": "spell_holy_wordfortitude.jpg",
  "PriestHoly": "spell_holy_holybolt.jpg",
  "PriestShadow": "spell_shadow_shadowwordpain.jpg",

  // Shaman
  "Shaman": "class_shaman.jpg",
  "ShamanElemental": "spell_nature_lightning.jpg",
  "ShamanEnhancement": "spell_nature_lightningshield.jpg",
  "ShamanTank": "inv_shield_06.jpg",
  "ShamanRestoration": "spell_nature_magicimmunity.jpg",

  // Mage
  "Mage": "class_mage.jpg",
  "MageArcane": "spell_holy_magicalsentry.jpg",
  "MageFire": "spell_fire_flamebolt.jpg",
  "MageFrost": "spell_frost_frostbolt02.jpg",

  // Warlock
  "Warlock": "class_warlock.jpg",
  "WarlockAffliction": "spell_shadow_deathcoil.jpg",
  "WarlockDemonology": "spell_shadow_metamorphosis.jpg",
  "WarlockDestruction": "spell_shadow_rainoffire.jpg",

  // Druid
  "Druid": "class_druid.jpg",
  "DruidBalance": "spell_nature_starfall.jpg",
  "DruidCat": "ability_druid_catform.jpg",
  "DruidRestoration": "spell_nature_healingtouch.jpg",
  "DruidBear": "ability_racial_bearform.jpg",
}
