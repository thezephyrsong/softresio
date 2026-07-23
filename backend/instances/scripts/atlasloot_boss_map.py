"""
Maps boss names (as used in instances_wotlk.json) to AtlasLoot_Data table
keys, separately for 10-man and 25-man versions, for every raid where
instances_wotlk.json already has a 10/25 split.

A value can be either:
  - a single string key: "Sartharion"
  - a list of keys to merge together (paginated tables / faction variants):
    ["Naxx80Gluth1", "Naxx80Gluth2"]

Note: Vault of Archavon is deliberately NOT included. In this AtlasLoot data
file VoA is organized as class/token loot catalogs (no drop percentages),
not per-boss drop tables, so it doesn't fit this model. It'll keep using the
existing wotlkdb.com scrape.
"""

# instance shortname prefix (without the trailing 10/25) -> boss map
BOSS_MAPS = {
    "naxx": {
        "Anub'Rekhan": ("Naxx80AnubRekhan", "Naxx80AnubRekhan25Man"),
        "Grand Widow Faerlina": ("Naxx80Faerlina", "Naxx80Faerlina25Man"),
        "Maexxna": ("Naxx80Maexxna", "Naxx80Maexxna25Man"),
        "Noth the Plaguebringer": ("Naxx80Noth", "Naxx80Noth25Man"),
        "Heigan the Unclean": ("Naxx80Heigan", "Naxx80Heigan25Man"),
        "Loatheb": ("Naxx80Loatheb", "Naxx80Loatheb25Man"),
        "Instructor Razuvious": ("Naxx80Razuvious", "Naxx80Razuvious25Man"),
        "Gothik the Harvester": ("Naxx80Gothik", "Naxx80Gothik25Man"),
        "The Four Horsemen": ("Naxx80FourHorsemen", "Naxx80FourHorsemen25Man"),
        "Patchwerk": ("Naxx80Patchwerk", "Naxx80Patchwerk25Man"),
        "Grobbulus": ("Naxx80Grobbulus", "Naxx80Grobbulus25Man"),
        "Gluth": (["Naxx80Gluth1", "Naxx80Gluth2"], ["Naxx80Gluth125Man", "Naxx80Gluth225Man"]),
        "Thaddius": ("Naxx80Thaddius", "Naxx80Thaddius25Man"),
        "Sapphiron": ("Naxx80Sapphiron", "Naxx80Sapphiron25Man"),
        "Kel'Thuzad": ("Naxx80KelThuzad", "Naxx80KelThuzad25Man"),
    },
    "os": {
        "Sartharion": ("Sartharion", "Sartharion25Man"),
    },
    "eoe": {
        "Malygos": ("Malygos", "Malygos25Man"),
    },
    "uld": {
        "Flame Leviathan": ("UlduarLeviathan", "UlduarLeviathan25Man"),
        "Ignis the Furnace Master": ("UlduarIgnis", "UlduarIgnis25Man"),
        "Razorscale": ("UlduarRazorscale", "UlduarRazorscale25Man"),
        "XT-002 Deconstructor": ("UlduarDeconstructor", "UlduarDeconstructor25Man"),
        "Assembly of Iron": ("UlduarIronCouncil", "UlduarIronCouncil25Man"),
        "Kologarn": ("UlduarKologarn", "UlduarKologarn25Man"),
        "Auriaya": ("UlduarAuriaya", "UlduarAuriaya25Man"),
        "Freya": ("UlduarFreya", "UlduarFreya25Man"),
        "Thorim": ("UlduarThorim", "UlduarThorim25Man"),
        "Mimiron": ("UlduarMimiron", "UlduarMimiron25Man"),
        "General Vezax": ("UlduarVezax", "UlduarVezax25Man"),
        "Yogg-Saron": ("UlduarYoggSaron", "UlduarYoggSaron25Man"),
        "Algalon the Observer": ("UlduarAlgalon", "UlduarAlgalon25Man"),
    },
    "toc": {
        "The Northrend Beasts": (
            ["TrialoftheCrusaderNorthrendBeasts_A", "TrialoftheCrusaderNorthrendBeasts_H"],
            ["TrialoftheCrusaderNorthrendBeasts25Man_A", "TrialoftheCrusaderNorthrendBeasts25Man_H"],
        ),
        "Lord Jaraxxus": (
            ["TrialoftheCrusaderLordJaraxxus_A", "TrialoftheCrusaderLordJaraxxus_H"],
            ["TrialoftheCrusaderLordJaraxxus25Man_A", "TrialoftheCrusaderLordJaraxxus25Man_H"],
        ),
        "Faction Champions": (
            ["TrialoftheCrusaderFactionChampions_A", "TrialoftheCrusaderFactionChampions_H"],
            ["TrialoftheCrusaderFactionChampions25Man_A", "TrialoftheCrusaderFactionChampions25Man_H"],
        ),
        "Twin Val'kyr": (
            ["TrialoftheCrusaderTwinValkyrs_A", "TrialoftheCrusaderTwinValkyrs_H"],
            ["TrialoftheCrusaderTwinValkyrs25Man_A", "TrialoftheCrusaderTwinValkyrs25Man_H"],
        ),
        "Anub'arak": (
            ["TrialoftheCrusaderAnubarak_A", "TrialoftheCrusaderAnubarak_H"],
            ["TrialoftheCrusaderAnubarak25Man_A", "TrialoftheCrusaderAnubarak25Man_H"],
        ),
    },
    "ony": {
        "Onyxia": (["Onyxia_1", "Onyxia_2"], ["Onyxia_125Man", "Onyxia_225Man"]),
    },
    "icc": {
        "Lord Marrowgar": ("ICCLordMarrowgar", "ICCLordMarrowgar25Man"),
        "Lady Deathwhisper": ("ICCLadyDeathwhisper", "ICCLadyDeathwhisper25Man"),
        "Icecrown Gunship Battle": ("ICCGunshipBattle", "ICCGunshipBattle25Man"),
        "Deathbringer Saurfang": ("ICCSaurfang", "ICCSaurfang25Man"),
        "Festergut": ("ICCFestergut", "ICCFestergut25Man"),
        "Rotface": ("ICCRotface", "ICCRotface25Man"),
        "Professor Putricide": ("ICCPutricide", "ICCPutricide25Man"),
        "Blood Prince Council": ("ICCCouncil", "ICCCouncil25Man"),
        "Blood-Queen Lana'thel": ("ICCLanathel", "ICCLanathel25Man"),
        "Valithria Dreamwalker": ("ICCValithria", "ICCValithria25Man"),
        "Sindragosa": ("ICCSindragosa", "ICCSindragosa25Man"),
        "The Lich King": ("ICCLichKing", "ICCLichKing25Man"),
    },
    "rs": {
        "Halion": ("Halion", "Halion25Man"),
    },
}


def get_boss_atlasloot_keys(instance_prefix, boss_name, is_25man):
    """Returns a list of AtlasLoot_Data keys to pull loot from for this boss,
    or None if this boss isn't mapped (caller should fall back to scraping)."""
    boss_map = BOSS_MAPS.get(instance_prefix)
    if not boss_map or boss_name not in boss_map:
        return None
    keys_10, keys_25 = boss_map[boss_name]
    keys = keys_25 if is_25man else keys_10
    return keys if isinstance(keys, list) else [keys]
