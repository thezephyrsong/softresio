"""
Item IDs to drop from the scraped output entirely, regardless of which boss
or instance they came from. This runs *before* an item is ever written to
the instance JSON, so excluded items never show up in SR pickers, HR
pickers, or the loot browser for anyone.
"""

# Hidden from every instance, no matter where they drop.
EXCLUDED_ITEM_IDS: set[int] = set([
    16720,  # Wildheart Cowl
    16718,  # Wildheart Spaulders
    16706,  # Wildheart Vest
    16714,  # Wildheart Bracers
    16717,  # Wildheart Gloves
    16716,  # Wildheart Belt
    16719,  # Wildheart Kilt
    16715,  # Wildheart Boots
    22109,  # Feralheart Cowl
    22112,  # Feralheart Spaulders
    22113,  # Feralheart Vest
    22108,  # Feralheart Bracers
    22110,  # Feralheart Gloves
    22106,  # Feralheart Belt
    22111,  # Feralheart Kilt
    22107,  # Feralheart Boots
    16677,  # Beaststalker's Cap
    16679,  # Beaststalker's Mantle
    16674,  # Beaststalker's Tunic
    16681,  # Beaststalker's Bindings
    16676,  # Beaststalker's Gloves
    16680,  # Beaststalker's Belt
    16678,  # Beaststalker's Pants
    16675,  # Beaststalker's Boots
    22013,  # Beastmaster's Cap
    22016,  # Beastmaster's Mantle
    22060,  # Beastmaster's Tunic
    22011,  # Beastmaster's Bindings
    22015,  # Beastmaster's Gloves
    22010,  # Beastmaster's Belt
    22017,  # Beastmaster's Pants
    22061,  # Beastmaster's Boots
    16686,  # Magister's Crown
    16689,  # Magister's Mantle
    16688,  # Magister's Robes
    16683,  # Magister's Bindings
    16684,  # Magister's Gloves
    16685,  # Magister's Belt
    16687,  # Magister's Leggings
    16682,  # Magister's Boots
    22065,  # Sorcerer's Crown
    22068,  # Sorcerer's Mantle
    22069,  # Sorcerer's Robes
    22063,  # Sorcerer's Bindings
    22066,  # Sorcerer's Gloves
    22062,  # Sorcerer's Belt
    22067,  # Sorcerer's Leggings
    22064,  # Sorcerer's Boots
    16727,  # Lightforge Helm
    16729,  # Lightforge Spaulders
    16726,  # Lightforge Breastplate
    16722,  # Lightforge Bracers
    16724,  # Lightforge Gauntlets
    16723,  # Lightforge Belt
    16728,  # Lightforge Legplates
    16725,  # Lightforge Boots
    22091,  # Soulforge Helm
    22093,  # Soulforge Spaulders
    22089,  # Soulforge Breastplate
    22088,  # Soulforge Bracers
    22090,  # Soulforge Gauntlets
    22086,  # Soulforge Belt
    22092,  # Soulforge Legplates
    22087,  # Soulforge Boots
    16693,  # Devout Crown
    16695,  # Devout Mantle
    16690,  # Devout Robe
    16697,  # Devout Bracers
    16692,  # Devout Gloves
    16696,  # Devout Belt
    16694,  # Devout Skirt
    16691,  # Devout Sandals
    22080,  # Virtuous Crown
    22082,  # Virtuous Mantle
    22083,  # Virtuous Robe
    22079,  # Virtuous Bracers
    22081,  # Virtuous Gloves
    22078,  # Virtuous Belt
    22085,  # Virtuous Skirt
    22084,  # Virtuous Sandals
    16707,  # Shadowcraft Cap
    16708,  # Shadowcraft Spaulders
    16721,  # Shadowcraft Tunic
    16710,  # Shadowcraft Bracers
    16712,  # Shadowcraft Gloves
    16713,  # Shadowcraft Belt
    16709,  # Shadowcraft Pants
    16711,  # Shadowcraft Boots
    22005,  # Darkmantle Cap
    22008,  # Darkmantle Spaulders
    22009,  # Darkmantle Tunic
    22004,  # Darkmantle Bracers
    22006,  # Darkmantle Gloves
    22002,  # Darkmantle Belt
    22007,  # Darkmantle Pants
    22003,  # Darkmantle Boots
    16667,  # Coif of Elements
    16669,  # Pauldrons of Elements
    16666,  # Vest of Elements
    16671,  # Bindings of Elements
    16672,  # Gauntlets of Elements
    16673,  # Cord of Elements
    16668,  # Kilt of Elements
    16670,  # Boots of Elements
    22097,  # Coif of The Five Thunders
    22101,  # Pauldrons of The Five Thunders
    22102,  # Vest of The Five Thunders
    22095,  # Bindings of The Five Thunders
    22099,  # Gauntlets of The Five Thunders
    22098,  # Cord of The Five Thunders
    22100,  # Kilt of The Five Thunders
    22096,  # Boots of The Five Thunders
    16698,  # Dreadmist Mask
    16701,  # Dreadmist Mantle
    16700,  # Dreadmist Robe
    16703,  # Dreadmist Bracers
    16705,  # Dreadmist Wraps
    16702,  # Dreadmist Belt
    16699,  # Dreadmist Leggings
    16704,  # Dreadmist Sandals
    22074,  # Deathmist Mask
    22073,  # Deathmist Mantle
    22075,  # Deathmist Robe
    22071,  # Deathmist Bracers
    22077,  # Deathmist Wraps
    22070,  # Deathmist Belt
    22072,  # Deathmist Leggings
    22076,  # Deathmist Sandals
    16731,  # Helm of Valor
    16733,  # Spaulders of Valor
    16730,  # Breastplate of Valor
    16735,  # Bracers of Valor
    16737,  # Gauntlets of Valor
    16736,  # Belt of Valor
    16732,  # Legplates of Valor
    16734,  # Boots of Valor
    21999,  # Helm of Heroism
    22001,  # Spaulders of Heroism
    21997,  # Breastplate of Heroism
    21996,  # Bracers of Heroism
    21998,  # Gauntlets of Heroism
    21994,  # Belt of Heroism
    22000,  # Legplates of Heroism
    21995,  # Boots of Heroism
    16834,  # Cenarion Helm
    16836,  # Cenarion Spaulders
    16833,  # Cenarion Vestments
    16830,  # Cenarion Bracers
    16831,  # Cenarion Gloves
    16828,  # Cenarion Belt
    16835,  # Cenarion Leggings
    16829,  # Cenarion Boots
    16900,  # Stormrage Cover
    16902,  # Stormrage Pauldrons
    16897,  # Stormrage Chestguard
    16904,  # Stormrage Bracers
    16899,  # Stormrage Handguards
    16903,  # Stormrage Belt
    16901,  # Stormrage Legguards
    16898,  # Stormrage Boots
    16846,  # Giantstalker's Helmet
    16848,  # Giantstalker's Epaulets
    16845,  # Giantstalker's Breastplate
    16850,  # Giantstalker's Bracers
    16852,  # Giantstalker's Gloves
    16851,  # Giantstalker's Belt
    16847,  # Giantstalker's Leggings
    16849,  # Giantstalker's Boots
    16939,  # Dragonstalker's Helm
    16937,  # Dragonstalker's Spaulders
    16942,  # Dragonstalker's Breastplate
    16935,  # Dragonstalker's Bracers
    16940,  # Dragonstalker's Gauntlets
    16936,  # Dragonstalker's Belt
    16938,  # Dragonstalker's Legguards
    16941,  # Dragonstalker's Greaves
    16795,  # Arcanist Crown
    16797,  # Arcanist Mantle
    16798,  # Arcanist Robes
    16799,  # Arcanist Bindings
    16801,  # Arcanist Gloves
    16802,  # Arcanist Belt
    16796,  # Arcanist Leggings
    16800,  # Arcanist Boots
    16914,  # Netherwind Crown
    16917,  # Netherwind Mantle
    16916,  # Netherwind Robes
    16918,  # Netherwind Bindings
    16913,  # Netherwind Gloves
    16818,  # Netherwind Belt
    16915,  # Netherwind Pants
    16912,  # Netherwind Boots
    16854,  # Lawbringer Helm
    16856,  # Lawbringer Spaulders
    16853,  # Lawbringer Chestguard
    16857,  # Lawbringer Bracers
    16860,  # Lawbringer Gauntlets
    16858,  # Lawbringer Belt
    16855,  # Lawbringer Legplates
    16859,  # Lawbringer Boots
    16955,  # Judgement Crown
    16953,  # Judgement Spaulders
    16958,  # Judgement Breastplate
    16951,  # Judgement Bindings
    16956,  # Judgement Gauntlets
    16952,  # Judgement Belt
    16954,  # Judgement Legplates
    16957,  # Judgement Sabatons
    16813,  # Circlet of Prophecy
    16816,  # Mantle of Prophecy
    16815,  # Robes of Prophecy
    16819,  # Vambraces of Prophecy
    16812,  # Gloves of Prophecy
    16817,  # Girdle of Prophecy
    16814,  # Pants of Prophecy
    16811,  # Boots of Prophecy
    16921,  # Halo of Transcendence
    16924,  # Pauldrons of Transcendence
    16923,  # Robes of Transcendence
    16926,  # Bindings of Transcendence
    16920,  # Handguards of Transcendence
    16925,  # Belt of Transcendence
    16922,  # Leggings of Transcendence
    16919,  # Boots of Transcendence
    16821,  # Nightslayer Cover
    16823,  # Nightslayer Shoulder Pads
    16820,  # Nightslayer Chestpiece
    16825,  # Nightslayer Bracelets
    16826,  # Nightslayer Gloves
    16827,  # Nightslayer Belt
    16822,  # Nightslayer Pants
    16824,  # Nightslayer Boots
    16908,  # Bloodfang Hood
    16832,  # Bloodfang Spaulders
    16905,  # Bloodfang Chestpiece
    16911,  # Bloodfang Bracers
    16907,  # Bloodfang Gloves
    16910,  # Bloodfang Belt
    16909,  # Bloodfang Pants
    16906,  # Bloodfang Boots
    16842,  # Earthfury Helmet
    16844,  # Earthfury Epaulets
    16841,  # Earthfury Vestments
    16840,  # Earthfury Bracers
    16839,  # Earthfury Gauntlets
    16838,  # Earthfury Belt
    16843,  # Earthfury Legguards
    16837,  # Earthfury Boots
    16947,  # Helmet of Ten Storms
    16945,  # Epaulets of Ten Storms
    16950,  # Breastplate of Ten Storms
    16943,  # Bracers of Ten Storms
    16948,  # Gauntlets of Ten Storms
    16944,  # Belt of Ten Storms
    16946,  # Legplates of Ten Storms
    16949,  # Greaves of Ten Storms
    16808,  # Felheart Horns
    16807,  # Felheart Shoulder Pads
    16809,  # Felheart Robes
    16804,  # Felheart Bracers
    16805,  # Felheart Gloves
    16806,  # Felheart Belt
    16810,  # Felheart Pants
    16803,  # Felheart Slippers
    16929,  # Nemesis Skullcap
    16932,  # Nemesis Spaulders
    16931,  # Nemesis Robes
    16934,  # Nemesis Bracers
    16928,  # Nemesis Gloves
    16933,  # Nemesis Belt
    16930,  # Nemesis Leggings
    16927,  # Nemesis Boots
    16866,  # Helm of Might
    16868,  # Pauldrons of Might
    16865,  # Breastplate of Might
    16861,  # Bracers of Might
    16863,  # Gauntlets of Might
    16864,  # Belt of Might
    16867,  # Legplates of Might
    16862,  # Sabatons of Might
    16963,  # Helm of Wrath
    16961,  # Pauldrons of Wrath
    16966,  # Breastplate of Wrath
    16959,  # Bracelets of Wrath
    16964,  # Gauntlets of Wrath
    16960,  # Waistband of Wrath
    16962,  # Legplates of Wrath
    16965,  # Sabatons of Wrath
    22490,  # Dreamwalker Headpiece
    22491,  # Dreamwalker Spaulders
    22488,  # Dreamwalker Tunic
    22495,  # Dreamwalker Wristguards
    22493,  # Dreamwalker Handguards
    22494,  # Dreamwalker Girdle
    22489,  # Dreamwalker Legguards
    22492,  # Dreamwalker Boots
    23064,  # Ring of the Dreamwalker
    22438,  # Cryptstalker Headpiece
    22439,  # Cryptstalker Spaulders
    22436,  # Cryptstalker Tunic
    22443,  # Cryptstalker Wristguards
    22441,  # Cryptstalker Handguards
    22442,  # Cryptstalker Girdle
    22437,  # Cryptstalker Legguards
    22440,  # Cryptstalker Boots
    23067,  # Ring of the Cryptstalker
    22498,  # Frostfire Circlet
    22499,  # Frostfire Shoulderpads
    22496,  # Frostfire Robe
    22503,  # Frostfire Bindings
    22501,  # Frostfire Gloves
    22502,  # Frostfire Belt
    22497,  # Frostfire Leggings
    22500,  # Frostfire Sandals
    23062,  # Frostfire Ring
    22428,  # Redemption Headpiece
    22429,  # Redemption Spaulders
    22425,  # Redemption Tunic
    22424,  # Redemption Wristguards
    22426,  # Redemption Handguards
    22431,  # Redemption Girdle
    22427,  # Redemption Legguards
    22430,  # Redemption Boots
    23066,  # Ring of Redemption
    22514,  # Circlet of Faith
    22515,  # Shoulderpads of Faith
    22512,  # Robe of Faith
    22519,  # Bindings of Faith
    22517,  # Gloves of Faith
    22518,  # Belt of Faith
    22513,  # Leggings of Faith
    22516,  # Sandals of Faith
    23061,  # Ring of Faith
    22478,  # Bonescythe Helmet
    22479,  # Bonescythe Pauldrons
    22476,  # Bonescythe Breastplate
    22483,  # Bonescythe Bracers
    22481,  # Bonescythe Gauntlets
    22482,  # Bonescythe Waistguard
    22477,  # Bonescythe Legplates
    22480,  # Bonescythe Sabatons
    23060,  # Bonescythe Ring
    22466,  # Earthshatter Headpiece
    22467,  # Earthshatter Spaulders
    22464,  # Earthshatter Tunic
    22471,  # Earthshatter Wristguards
    22469,  # Earthshatter Handguards
    22470,  # Earthshatter Girdle
    22465,  # Earthshatter Legguards
    22468,  # Earthshatter Boots
    23065,  # Ring of the Earthshatterer
    22506,  # Plagueheart Circlet
    22507,  # Plagueheart Shoulderpads
    22504,  # Plagueheart Robe
    22511,  # Plagueheart Bindings
    22509,  # Plagueheart Gloves
    22510,  # Plagueheart Belt
    22505,  # Plagueheart Leggings
    22508,  # Plagueheart Sandals
    23063,  # Plagueheart Ring
    22418,  # Dreadnaught Helmet
    22419,  # Dreadnaught Pauldrons
    22416,  # Dreadnaught Breastplate
    22423,  # Dreadnaught Bracers
    22421,  # Dreadnaught Gauntlets
    22422,  # Dreadnaught Waistguard
    22417,  # Dreadnaught Legplates
    22420,  # Dreadnaught Sabatons
    23059,  # Ring of the Dreadnaught
    20873,  # Alabaster Idol
    20869,  # Amber Idol
    20866,  # Azure Idol
    20870,  # Jasper Idol
    20868,  # Lambent Idol
    20871,  # Obsidian Idol
    20867,  # Onyx Idol
    20872,  # Vermillion Idol
    22202,  # Small Obsidian Shard
    22203,  # Large Obsidian Shard
    20864,  # Bone Scarab
    20861,  # Bronze Scarab
    20863,  # Clay Scarab
    20862,  # Crystal Scarab
    20859,  # Gold Scarab
    20865,  # Ivory Scarab
    20860,  # Silver Scarab
    20858,  # Stone Scarab
    21761,  # Scarab Coffer Key
    21294,  # Book of Healing Touch XI
    21296,  # Book of Rejuvenation XI
    21295,  # Book of Starfire VII
    21306,  # Guide: Serpent Sting IX
    21304,  # Guide: Multi-Shot V
    21307,  # Guide: Aspect of the Hawk VII
    21279,  # Tome of Fireball XII
    21214,  # Tome of Frostbolt XI
    21280,  # Tome of Arcane Missiles VIII
    21288,  # Libram: Blessing of Wisdom VI
    21289,  # Libram: Blessing of Might VII
    21290,  # Libram: Holy Light IX
    21284,  # Codex of Greater Heal V
    21287,  # Codex of Prayer of Healing V
    21285,  # Codex of Renew X
    21300,  # Handbook of Backstab IX
    21303,  # Handbook of Feint V
    21302,  # Handbook of Deadly Poison V
    21291,  # Tablet of Healing Wave X
    21292,  # Tablet of Strength of Earth Totem V
    21293,  # Tablet of Grace of Air Totem III
    21281,  # Grimoire of Shadow Bolt X
    21283,  # Grimoire of Corruption VII
    21282,  # Grimoire of Immolate VIII
    21298,  # Manual of Battle Shout VII
    21299,  # Manual of Revenge VI
    21297,  # Manual of Heroic Strike IX
    20886,  # Qiraji Spiked Hilt
    20890,  # Qiraji Ornate Hilt
    20884,  # Qiraji Magisterial Ring
    20888,  # Qiraji Ceremonial Ring
    20889,  # Qiraji Regal Drape
    20885,  # Qiraji Martial Drape
    40628,  # Gauntlets of the Lost Conqueror
    40629,  # Gauntlets of the Lost Protector
    40630,  # Gauntlets of the Lost Vanquisher
])

# Hidden only within the listed instance(s)
PER_INSTANCE_EXCLUDED_ITEM_IDS: dict[str, set[int]] = {
    # "mc": {12345},  # Example: Tier 1 token, Molten Core only
}


def is_item_excluded(item_id: int, instance_shortname: str) -> bool:
    """True if this item should be dropped from the scrape output for the
    given instance (checks both the global list and per-instance list).
    """
    if item_id in EXCLUDED_ITEM_IDS:
        return True
    instance_excluded = PER_INSTANCE_EXCLUDED_ITEM_IDS.get(instance_shortname, set())
    return item_id in instance_excluded
