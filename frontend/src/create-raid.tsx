import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router"
import {
  Button,
  Collapse,
  Group,
  MultiSelect,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core"
import { DateTimePicker } from "@mantine/dates"
import { modals } from "@mantine/modals"
import {
  instanceFilter,
  instanceOrder,
  renderInstance,
  SERVER_LABELS,
} from "./instances.tsx"
import { ItemSelect } from "./item-select.tsx"
import type {
  CreateEditRaidRequest,
  CreateEditRaidResponse,
  GameServer,
  GetInstancesResponse,
  GetMyGuildsResponse,
  GetRaidResponse,
  Guild,
  Instance,
  Raid,
} from "../shared/types.ts"
import { deepEqual } from "fast-equals"
import {
  filterInstanceBosses,
  parseRaidIdFromLink,
  raidIdToUrl,
} from "../shared/utils.ts"

export const CreateRaid = (
  { itemPickerOpen = false, edit = false }: {
    itemPickerOpen?: boolean
    edit?: boolean
  },
) => {
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const nextSrPlus = searchParams.get("nextSrPlus") === "true"

  const [raidBeforeEdit, setRaidBeforeEdit] = useState<Raid>()
  const [instances, setInstances] = useState<Instance[]>()
  const [instance, setInstance] = useState<Instance>()
  const [worldBoss, setWorldBoss] = useState(false)
  const [guilds, setGuilds] = useState<Guild[]>([])
  const [selectedGuildId, setSelectedGuildId] = useState<string>()
  const [hardReserves, setHardReserves] = useState<number[]>([])
  const [excludedBossIds, setExcludedBossIds] = useState<number[]>([])
  const [selectedServer, setSelectedServer] = useState<GameServer | null>(
    () => {
      const saved = localStorage.getItem("selectedServer")
      // Only one server (triumvirate) right now, so default straight to it
      // instead of making the user pick it manually.
      return saved === "triumvirate" ? saved : "triumvirate"
    },
  )

  const [description, setDescription] = useState("")
  const [useSrPlus, setUseSrPlus] = useState(false)
  const [previousRaidLink, setPreviousRaidLink] = useState("")
  const [allowDuplicateSr, setAllowDuplicateSr] = useState(false)
  const [useHr, setUseHr] = useState(false)
  const [srCount, setSrCount] = useState<number | undefined>()
  const [time, setTime] = useState<Date>(
    new Date(
      Math.ceil((new Date()).getTime() / (60 * 30 * 1000)) * 60 * 30 * 1000,
    ),
  )

  const createRaid = () => {
    if (
      instance == undefined || srCount == undefined
    ) {
      alert("Missing information")
      return
    }
    const previousRaidId = selectedGuildId
      ? undefined
      : parseRaidIdFromLink(previousRaidLink)
    if (useSrPlus && !selectedGuildId && previousRaidLink && !previousRaidId) {
      alert("That doesn't look like a valid raid link")
      return
    }
    const request: CreateEditRaidRequest = {
      raidId: edit ? params.raidId : undefined,
      instanceId: instance.id,
      useSrPlus,
      description,
      time: time.toISOString(),
      srCount,
      hardReserves,
      allowDuplicateSr,
      guildId: selectedGuildId,
      previousRaidId,
      excludedBossIds,
    }
    fetch("/api/raid/create", { method: "POST", body: JSON.stringify(request) })
      .then((r) => r.json())
      .then((j: CreateEditRaidResponse) => {
        if (j.error) {
          alert(j.error.message)
        } else if (j.data) {
          navigate(`/${j.data.raidId}`)
        }
      })
  }

  useEffect(() => {
    fetch("/api/instances")
      .then((r) => r.json())
      .then((j: GetInstancesResponse) => {
        if (j.error) {
          alert(j.error.message)
        } else if (j.data) {
          setInstances(
            j.data.sort((a, b) =>
              instanceOrder.indexOf(a.name) - instanceOrder.indexOf(b.name)
            ),
          )
        }
      })
  }, [])

  useEffect(() => {
    fetch("/api/guilds")
      .then((r) => r.json())
      .then((j: GetMyGuildsResponse) => {
        if (j.error) {
          alert(j.error.message)
        } else if (j.data) {
          setGuilds(j.data)
        }
      })
  }, [])

  useEffect(() => {
    if (params.raidId && instances) {
      fetch(`/api/raid/${params.raidId}`).then((r) => r.json()).then(
        (j: GetRaidResponse) => {
          if (j.error) {
            alert(j.error.message)
          } else if (j.data) {
            const raid = j.data
            setInstance(instances.find((i) => i.id == raid.instanceId))
            setHardReserves(raid.hardReserves)
            setExcludedBossIds(raid.excludedBossIds || [])
            setDescription(raid.description)
            setAllowDuplicateSr(raid.allowDuplicateSr)
            setUseHr(raid.hardReserves.length > 0)
            setSrCount(raid.srCount)
            setSelectedGuildId(raid.guildId)

            if (nextSrPlus) {
              // Carry SR+ forward onto the raid we just copied from (not
              // whatever it itself was chained on top of), and default the
              // time to a week later instead of the usual "next half hour".
              setUseSrPlus(true)
              setPreviousRaidLink(raidIdToUrl(raid.id))
              setTime(
                new Date(
                  new Date(raid.time).getTime() + 7 * 24 * 60 * 60 * 1000,
                ),
              )
            } else {
              setUseSrPlus(raid.useSrPlus)
              setPreviousRaidLink(
                raid.previousRaidId ? raidIdToUrl(raid.previousRaidId) : "",
              )
            }

            if (edit && !nextSrPlus) {
              setTime(new Date(raid.time))
              setRaidBeforeEdit(raid)
            } else if (edit) {
              setRaidBeforeEdit(raid)
            }
          }
        },
      )
    }
  }, [instances])

  const raidChanged = () => {
    if (!raidBeforeEdit) return true
    const a = {
      instanceId: raidBeforeEdit.instanceId,
      hardReserves: raidBeforeEdit.hardReserves.sort(),
      excludedBossIds: (raidBeforeEdit.excludedBossIds || []).sort(),
      description: raidBeforeEdit.description,
      useSrPlus: raidBeforeEdit.useSrPlus,
      allowDuplicateSr: raidBeforeEdit.allowDuplicateSr,
      srCount: raidBeforeEdit.srCount,
      time: raidBeforeEdit.time,
      selectedGuildId: raidBeforeEdit.guildId,
      previousRaidId: raidBeforeEdit.previousRaidId,
    }
    const b = {
      instanceId: instance?.id,
      hardReserves: hardReserves.sort(),
      excludedBossIds: excludedBossIds.sort(),
      description,
      useSrPlus,
      allowDuplicateSr,
      srCount,
      time: time.toISOString(),
      selectedGuildId,
      previousRaidId: selectedGuildId
        ? undefined
        : parseRaidIdFromLink(previousRaidLink),
    }
    return !deepEqual(a, b)
  }

  const filteredInstances = instances?.filter((i) =>
    selectedServer ? i.server === selectedServer : false
  )

  const filteredInstance = instance
    ? filterInstanceBosses(instance, excludedBossIds)
    : undefined

  return (
    <>
      <Paper shadow="sm" p="sm">
        <Stack>
          <SegmentedControl
            defaultValue=""
            data={["Raid", "World Boss"]}
            size="md"
            withItemsBorders={false}
            value={worldBoss ? "World Boss" : "Raid"}
            onChange={(value: string) => setWorldBoss(value == "World Boss")}
          />
          <Select
            w="100%"
            withAsterisk={selectedServer == null}
            label="Server"
            placeholder="Select server"
            data={Object.entries(SERVER_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            value={selectedServer}
            onChange={(v) => {
              const server = v as GameServer | null
              setSelectedServer(server)
              if (server) localStorage.setItem("selectedServer", server)
              else localStorage.removeItem("selectedServer")
              setInstance(undefined)
              setHardReserves([])
              setExcludedBossIds([])
            }}
          />
          <Select
            w="100%"
            withAsterisk={instance == undefined}
            label="Instance"
            searchable
            placeholder={selectedServer
              ? "Select instance"
              : "Select a server first"}
            disabled={!selectedServer}
            maxDropdownHeight={1000}
            data={filteredInstances?.filter((e) => e.raid != worldBoss).map(
              (e) => {
                return { value: e.id.toString(), label: e.name }
              },
            )}
            value={instance?.id.toString() || null}
            renderOption={renderInstance(filteredInstances || [])}
            filter={instanceFilter(filteredInstances || [])}
            onChange={(v) => {
              const newInstance = filteredInstances?.find((i) =>
                i.id == Number(v)
              )
              setInstance(newInstance)
              if (newInstance?.id == raidBeforeEdit?.instanceId) {
                if (useHr) setHardReserves(raidBeforeEdit?.hardReserves || [])
                setExcludedBossIds(raidBeforeEdit?.excludedBossIds || [])
              } else {
                setHardReserves([])
                setExcludedBossIds([])
              }
            }}
          />
          <Collapse in={(instance?.bosses.length || 0) > 1}>
            <MultiSelect
              label="Bosses not being attempted"
              description="Hide loot from bosses you won't kill this raid (e.g. only 1 Sartharion drake left alive, or Zul'Aman chests you won't get to) from soft-reserve and hard-reserve pickers"
              placeholder={excludedBossIds.length
                ? undefined
                : "None - full instance loot pool"}
              searchable
              clearable
              data={(instance?.bosses || []).map((b) => ({
                value: b.id.toString(),
                label: b.name,
              }))}
              value={excludedBossIds.map((id) => id.toString())}
              onChange={(values) => {
                const newExcluded = values.map((v) => Number(v))
                setExcludedBossIds(newExcluded)
                if (instance) {
                  const stillAllowed = filterInstanceBosses(
                    instance,
                    newExcluded,
                  )
                  setHardReserves((prev) =>
                    prev.filter((id) =>
                      stillAllowed.items.some((i) => i.id == id)
                    )
                  )
                }
              }}
            />
          </Collapse>
          <Textarea
            label="Description"
            value={description}
            autosize
            minRows={3}
            maxLength={280}
            onChange={(event) => setDescription(event.currentTarget.value)}
          />
          <DateTimePicker
            value={time}
            onChange={(value) => {
              if (value) setTime(new Date(value))
            }}
            label="Date and time"
            placeholder="Pick date and time"
          />

          <Stack gap={0}>
            <Group mb={3} p={0} gap={3}>
              <Text size="sm">
                Number of soft-reserves
              </Text>
              <Text
                size="sm"
                c="var(--mantine-color-error)"
                hidden={!!srCount}
              >
                *
              </Text>
            </Group>
            <SegmentedControl
              defaultValue=""
              data={["1", "2", "3", "4"]}
              w="100%"
              withItemsBorders={false}
              value={srCount?.toString()}
              onChange={(value: string) => setSrCount(Number(value))}
            />
          </Stack>
          <Collapse in={(srCount || 0) > 1}>
            <Switch
              checked={allowDuplicateSr}
              onChange={(event) =>
                setAllowDuplicateSr(event.currentTarget.checked)}
              label="Allow duplicate soft-reserves"
            />
          </Collapse>
          <Switch
            checked={useHr}
            disabled={!instance}
            onChange={(event) => {
              setUseHr(event.target.checked)
              if (!event.target.checked) setHardReserves([])
            }}
            label="Hard-reserve items"
          />
          <Switch
            checked={useSrPlus}
            onChange={(event) => setUseSrPlus(event.currentTarget.checked)}
            label="Use SR+"
            description="Give priority to characters who soft-reserved an item before but didn't win it"
          />
          {guilds.length > 0
            ? (
              <Select
                label="Select Guild"
                placeholder="No guild"
                value={selectedGuildId}
                onChange={(v) => setSelectedGuildId(v || undefined)}
                data={guilds.map((g) => ({
                  label: g.name,
                  value: g.id,
                }))}
              />
            )
            : null}
          <Collapse in={useSrPlus && !selectedGuildId}>
            <TextInput
              label="Previous raid link"
              description="Paste the link of a previous raid to build SR+ priority on top of it. Leave blank to start fresh."
              placeholder="https://.../ABCDE"
              value={previousRaidLink}
              onChange={(event) =>
                setPreviousRaidLink(event.currentTarget.value)}
              error={previousRaidLink &&
                  !parseRaidIdFromLink(previousRaidLink)
                ? "Doesn't look like a valid raid link"
                : undefined}
            />
          </Collapse>
          <Collapse in={useHr && filteredInstance ? true : false}>
            {filteredInstance
              ? (
                <ItemSelect
                  withAsterisk={hardReserves.length == 0}
                  label="Select the item's you want to hard-reserve"
                  value={hardReserves}
                  onChange={setHardReserves}
                  sameItemLimit={1}
                  instance={filteredInstance}
                  itemPickerOpen={itemPickerOpen}
                />
              )
              : null}
          </Collapse>
          <Button
            mt="sm"
            onClick={() => {
              if (
                edit && (raidBeforeEdit?.instanceId != instance?.id)
              ) {
                modals.openConfirmModal({
                  title: "Are you sure?",
                  centered: true,
                  children: (
                    <Text size="sm">
                      Changing the instance will remove all exisiting
                      soft-reserves
                    </Text>
                  ),
                  labels: { confirm: "Confirm", cancel: "Cancel" },
                  confirmProps: { color: "red" },
                  onConfirm: () => createRaid(),
                })
              } else {
                createRaid()
              }
            }}
            disabled={!instance || !srCount ||
              (useHr && hardReserves.length == 0) || !raidChanged()}
          >
            {edit ? "Save Changes" : "Create Raid"}
          </Button>
        </Stack>
      </Paper>
    </>
  )
}
