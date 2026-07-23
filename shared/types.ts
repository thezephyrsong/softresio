export type CharacterWithId = {
  id: string
  character: Character
}

export interface Character {
  name: string
  class: string
  spec: string
}

export interface User {
  userId: string // uuidv4
  issuer: string
  username?: string
}

export interface SoftReserve {
  itemId: number
  srPlus: number | null
  comment: string | null
}

export interface Attendee {
  character: Character
  softReserves: SoftReserve[]
  user: User
}

export interface Password {
  salt: string
  hash: string
}

export type BaseActivity = {
  time: string // rfc3339
  byUser: User
}

export type Activity = RaidChanged | SrChanged | AdminChanged

export interface RaidChanged extends BaseActivity {
  type: "RaidChanged"
  change: "created" | "edited" | "locked" | "unlocked"
}

export interface SrChanged extends BaseActivity {
  type: "SrChanged"
  change: "created" | "deleted"
  itemId: number
  character?: Character
}

export interface AdminChanged extends BaseActivity {
  type: "AdminChanged"
  change: "promoted" | "removed"
  character?: Character
  user: User
}

export interface Raid {
  id: string
  deleted: boolean
  useSrPlus: boolean
  instanceId: number
  time: string // rfc 3339
  attendees: Attendee[]
  admins: User[]
  activityLog: Activity[]
  srCount: number
  description: string
  locked: boolean
  hardReserves: number[]
  allowDuplicateSr: boolean
  owner: User
  guildId?: string // uuidv4
}

interface GenericResponse<T> {
  data?: T
  error?: {
    message: string
    issues?: object
  }
  user: User
}

export interface CreateEditRaidRequest {
  raidId?: string // Only set if it's an edit
  instanceId: number
  description: string
  useSrPlus: boolean
  time: string //rfc 3339
  srCount: number
  hardReserves: number[]
  allowDuplicateSr: boolean
  guildId?: string //uuidv4
}

export interface CreateGuildRequest {
  name: string
}

export type GetInstancesResponse = GenericResponse<Instance[]>

export type CreateEditRaidResponse = GenericResponse<{ raidId: string }>

export type CreateSrResponse = GenericResponse<Raid>

export type GetRaidResponse = GenericResponse<Raid>

export type InfoResponse = GenericResponse<
  { discordClientId: string | undefined; discordLoginEnabled: boolean }
>

export type SignOutResponse = GenericResponse<void>

export type CreateGuildResponse = GenericResponse<void>

export type GetMyRaidsResponse = GenericResponse<Raid[]>

export type GetMyGuildsResponse = GenericResponse<Guild[]>

export type GetCharactersResponse = GenericResponse<Character[]>

export type EditAdminRequest = {
  raidId: string
  add?: User
  remove?: User
}
export type LockRaidResponse = GenericResponse<Raid>

export type DeleteRaidResponse = GenericResponse<void>

export type DeleteRaidRequest = {
  raidId: string
}

export type DeleteSrRequest = {
  raidId: string
  user: User
  itemId: number
}
export type DeleteSrResponse = GenericResponse<Raid>

export type EditAdminResponse = GenericResponse<Raid>

export interface CreateSrRequest {
  raidId: string
  character: Character
  selectedItemIds: number[]
}

export interface DropsFrom {
  npcId: number
  bossId: number
  chance: number
}

export interface Item {
  id: number
  tooltip: string
  icon: string
  name: string
  slots: string[]
  types: string[]
  dropsFrom: DropsFrom[]
  classes: string[]
  quality: 1 | 2 | 3 | 4 | 5
}

export interface Npc {
  id: number
  name: string
  bossId: number
}

export interface Boss {
  id: number
  name: string
}

export type GameServer = "triumvirate" | "turtlewow" | "epoch"

export interface Instance {
  id: number
  name: string
  shortname: string
  items: Item[]
  bosses: Boss[]
  npcs: Npc[]
  raid: boolean
  server: GameServer
}

export interface NpcItem {
  itemId: number
  npcId: number
}

export interface ItemPickerElementType {
  segment?: string
  item?: Item
  npcId?: number
}

export interface Guild {
  id: string // uuidv4
  name: string
  owner: User
  admins: User[]
  srPlus: SrPlusManual[]
}

export interface SrPlusManualChangeRequest {
  guildId: string //uuidv4
  characterName: string
  itemId: number
  value: number
}

export interface SrPlusManual {
  type: "manual"
  time: string // rfc3339
  characterName: string
  itemId: number
  value: number
}

export interface SrPlusRaid {
  type: "raid"
  characterName: string
  itemId: number
  raidId: Raid["id"]
  time: Raid["time"]
}

export type SrPlus = SrPlusRaid | SrPlusManual

export type GetSrPlusResponse = GenericResponse<SrPlus[]>

export type SrPlusManualChangeResponse = GenericResponse<Guild>

export interface LiveUpdate {
  raid?: Raid
  srPluses?: SrPlus[]
}
