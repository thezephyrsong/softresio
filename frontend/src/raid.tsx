import { useEffect, useState } from "react"
import type {
  Attendee,
  DeleteRaidRequest,
  DeleteRaidResponse,
  DeleteSrRequest,
  DeleteSrResponse,
  EditAdminRequest,
  EditAdminResponse,
  GetInstancesResponse,
  GetRaidResponse,
  GetSrPlusResponse,
  Instance,
  LiveUpdate,
  Raid,
  SrPlus,
  User,
} from "../shared/types.ts"
import { useParams } from "react-router"
import naxx from "./assets/naxx.png"
import kara40 from "./assets/kara40.png"
import bwl from "./assets/bwl.png"
import mc from "./assets/mc.png"
import ony from "./assets/ony.png"
import zg from "./assets/zg.png"
import kara10 from "./assets/kara10.png"
import aq40 from "./assets/aq40.png"
import aq20 from "./assets/aq20.png"
import es from "./assets/es.png"
import {
  Badge,
  Button,
  Group,
  Image,
  Paper,
  Skeleton,
  Stack,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"
import { modals } from "@mantine/modals"
import { CopyClipboardButton, raidIdToUrl } from "./copy-clipboard-button.tsx"
import { CreateSr } from "./create-sr.tsx"
import { SrList } from "./sr-list.tsx"
import { ActivityLog } from "./activity-log.tsx"
import { rollForExport } from "./rollfor-export.ts"
import useWebSocket from "react-use-websocket"
import {
  IconCopy,
  IconLogs,
  IconRefreshAlert,
  IconUserFilled,
} from "@tabler/icons-react"
import { formatTime } from "../shared/utils.ts"
import { IconLock, IconLockOpen2, IconShieldFilled } from "@tabler/icons-react"
import { useNavigate } from "react-router"
import { deepEqual } from "fast-equals"
import { HardReserves } from "./hard-reserves.tsx"

const raidImage = (key: string) => {
  switch (key) {
    case "BWL":
      return bwl
    case "K40":
      return kara40
    case "AQ40":
      return aq40
    case "AQ20":
      return aq20
    case "ES":
      return es
    case "MC":
      return mc
    case "NAXX":
      return naxx
    case "ONY":
      return ony
    case "ZG":
      return zg
    case "K10":
      return kara10
    default:
      return undefined
  }
}

export const RaidUpdater = (
  { loadRaid, raidId, setSrPluses }: {
    loadRaid: (raid: Raid) => void
    raidId: string
    setSrPluses: (srPluses: SrPlus[]) => void
  },
) => {
  const { lastMessage } = useWebSocket(`/api/ws/${raidId}`, {
    shouldReconnect: (_) => true,
  })
  useEffect(() => {
    if (lastMessage?.data) {
      const liveUpdate: LiveUpdate = JSON.parse(lastMessage.data)
      if (liveUpdate.raid) {
        loadRaid(liveUpdate.raid)
      }
      if (liveUpdate.srPluses) {
        setSrPluses(liveUpdate.srPluses)
      }
    }
  }, [lastMessage])
  return null
}

export const RaidElement = (
  { itemPickerOpen = false, user }: { itemPickerOpen?: boolean; user: User },
) => {
  const params = useParams()
  const [logOpen, setLogOpen] = useState(false)
  const [showHardReserves, setShowHardReserves] = useState(false)
  const [raid, setRaid] = useState<Raid>()
  const [srPluses, setSrPluses] = useState<SrPlus[]>()
  const [instance, setInstance] = useState<Instance>()
  const [instances, setInstances] = useState<Instance[]>()
  const [exportedLast, setExportedLast] = useState<{
    attendees: Attendee[]
    hardReserves: number[]
  }>()
  const navigate = useNavigate()

  const loadRaid = (raid?: Raid) => {
    if (raid) {
      return setRaid(raid)
    }
    if (!params.raidId) return
    if (params.raidId.toUpperCase() !== params.raidId) {
      navigate(`/${params.raidId.toUpperCase()}`)
    } else {
      fetch(`/api/raid/${params.raidId}`).then((r) => r.json()).then(
        (j: GetRaidResponse) => {
          if (j.error) {
            alert(j.error.message)
          } else if (j.data) {
            setRaid(j.data)
          }
        },
      )
    }
  }

  const lockRaid = () => {
    fetch(`/api/raid/${params.raidId}/lock`, { method: "POST" }).then((r) =>
      r.json()
    ).then(
      (j: GetRaidResponse) => {
        if (j.error) {
          alert(j.error.message)
        } else if (j.data) {
          loadRaid(j.data)
        }
      },
    )
  }

  const editAdmin = (user: User, remove: boolean) => {
    if (!raid) return
    const request: EditAdminRequest = {
      raidId: raid.id,
      [remove ? "remove" : "add"]: user,
    }

    fetch(`/api/admin`, { method: "POST", body: JSON.stringify(request) }).then(
      (r) => r.json(),
    ).then(
      (j: EditAdminResponse) => {
        if (j.error) {
          alert(j.error.message)
        } else if (j.data) {
          loadRaid(j.data)
        }
      },
    )
  }

  const deleteSr = (user: User, itemId: number) => {
    if (!raid) return
    const request: DeleteSrRequest = { raidId: raid.id, itemId, user }
    fetch(`/api/sr/delete`, { method: "POST", body: JSON.stringify(request) })
      .then((r) => r.json()).then(
        (j: DeleteSrResponse) => {
          if (j.error) {
            alert(j.error.message)
          } else if (j.data) {
            loadRaid(j.data)
          }
        },
      )
  }

  const deleteRaid = () => {
    if (!raid) return
    const request: DeleteRaidRequest = { raidId: raid.id }
    fetch(`/api/raid/delete`, { method: "POST", body: JSON.stringify(request) })
      .then((r) => r.json()).then(
        (j: DeleteRaidResponse) => {
          if (j.error) {
            alert(j.error.message)
          } else {
            navigate("/")
          }
        },
      )
  }

  useEffect(loadRaid, [params.raidId])

  useEffect(() => {
    if (raid?.useSrPlus && !srPluses) {
      fetch(`/api/srplus/${raid.id}`)
        .then((r) => r.json())
        .then((j: GetSrPlusResponse) => {
          if (j.error) {
            alert(j.error.message)
          } else if (j.data) {
            setSrPluses(j.data)
          }
        })
    }
  }, [raid])

  useEffect(() => {
    fetch("/api/instances")
      .then((r) => r.json())
      .then((j: GetInstancesResponse) => {
        if (j.error) {
          alert(j.error.message)
        } else if (j.data) {
          setInstances(j.data)
        }
      })
  }, [])

  useEffect(() => {
    if (raid && instances) {
      const matches = instances.filter((i: Instance) => i.id == raid.instanceId)
      if (matches.length == 1) {
        setInstance(matches[0])
      } else {
        alert("Could not find instance")
      }
    }
  }, [raid, instances])

  const isAdmin = raid?.admins.some((u) => u.userId == user?.userId) || false

  if (raid && instance && user) {
    return (
      <Stack>
        <Paper shadow="sm" p="sm">
          <Stack>
            <Group justify="space-between">
              <Group>
                <Title c="orange" lineClamp={1} order={2}>
                  {instance.shortname.toUpperCase()}
                </Title>
                <Title lineClamp={1} order={3}>{instance.name}</Title>
                <Image
                  src={raidImage(instance.shortname.toUpperCase())}
                  visibleFrom="md"
                  style={{
                    position: "absolute",
                    top: "15%",
                    right: "10%",
                    zIndex: -1,
                    opacity: 0.1,
                    width: "30%",
                  }}
                />
              </Group>
              {raid.locked ? <Badge color="red">Locked</Badge> : null}
            </Group>
            <Group>
              <Badge color="var(--mantine-color-dark-5)" radius="xs">
                {formatTime(raid.time)}
              </Badge>
              {raid.hardReserves.length > 0
                ? (
                  <Tooltip
                    label={`Click to ${
                      showHardReserves ? "hide" : "show"
                    } hard-reserved items`}
                  >
                    <Badge
                      color="orange"
                      style={{ userSelect: "none", cursor: "pointer" }}
                      onClick={() => setShowHardReserves(!showHardReserves)}
                    >
                      {`${raid.hardReserves.length} HR`}
                    </Badge>
                  </Tooltip>
                )
                : null}
            </Group>
            <HardReserves
              items={instance.items}
              show={showHardReserves}
              hardReserves={raid.hardReserves}
            />
            {raid.description
              ? (
                <Text span style={{ whiteSpace: "pre-line" }}>
                  {raid.description}
                </Text>
              )
              : null}
          </Stack>
        </Paper>
        <CreateSr
          loadRaid={loadRaid}
          instance={instance}
          raid={raid}
          user={user}
          itemPickerOpen={itemPickerOpen}
        />
        <Paper shadow="sm" p="sm" display={isAdmin ? "block" : "none"}>
          <Stack gap={0}>
            <Group justify="space-between">
              <Group>
                <CopyClipboardButton
                  toClipboard={raidIdToUrl(params.raidId || "")}
                  label={"Share"}
                  tooltip="Copy link to raid"
                  orange={false}
                />
                <Button
                  variant="default"
                  onClick={() => navigate(`/edit/${params.raidId}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="default"
                  onClick={() => navigate(`/copy/${params.raidId}`)}
                >
                  Clone
                </Button>
                {raid.locked
                  ? (
                    <Button
                      variant="default"
                      onClick={() =>
                        navigate(`/copy/${params.raidId}?nextSrPlus=true`)}
                    >
                      Make Next SR+
                    </Button>
                  )
                  : null}
                {raid.owner.userId == user.userId
                  ? (
                    <Button
                      variant="default"
                      onClick={() => {
                        modals.openConfirmModal({
                          title: "Are you sure?",
                          centered: true,
                          children: (
                            <Text size="sm">
                              You want to permanently delete this raid?
                            </Text>
                          ),
                          labels: { confirm: "Confirm", cancel: "Cancel" },
                          confirmProps: { color: "red" },
                          onConfirm: () => deleteRaid(),
                        })
                      }}
                    >
                      Delete
                    </Button>
                  )
                  : null}
                <Button
                  onClick={lockRaid}
                  variant={raid.locked ? "" : "default"}
                  color="red"
                  leftSection={raid.locked ? <IconLock /> : <IconLockOpen2 />}
                >
                  {raid.locked ? "Locked" : "Unlocked"}
                </Button>
              </Group>
              <IconShieldFilled size={20} />
            </Group>
          </Stack>
        </Paper>
        <Paper shadow="sm" mb="md" style={{ overflow: "hidden" }}>
          <Group p="sm" justify="space-between">
            <Button
              disabled={raid.activityLog.length == 0}
              onClick={() => setLogOpen(true)}
              variant="default"
              leftSection={<IconLogs size={16} />}
            >
              Log
            </Button>
            <Group>
              <CopyClipboardButton
                toClipboard={rollForExport(raid, srPluses)}
                label="RollFor"
                tooltip="Copy RollFor export"
                onClick={() =>
                  setExportedLast({
                    attendees: raid.attendees,
                    hardReserves: raid.hardReserves.sort(),
                  })}
                icon={exportedLast &&
                    !deepEqual(exportedLast, {
                      attendees: raid.attendees,
                      hardReserves: raid.hardReserves.sort(),
                    })
                  ? <IconRefreshAlert size={16} />
                  : <IconCopy size={16} />}
                orange={exportedLast &&
                  !deepEqual(exportedLast, {
                    attendees: raid.attendees,
                    hardReserves: raid.hardReserves.sort(),
                  })}
              />
              <Group gap={3} miw={45}>
                <IconUserFilled size={20} />
                <Title order={6}>{raid.attendees.length}</Title>
              </Group>
            </Group>
          </Group>
          {raid.attendees.length > 0
            ? (
              <SrList
                raid={raid}
                items={instance.items}
                user={user}
                deleteSr={deleteSr}
                editAdmin={editAdmin}
                srPluses={srPluses || []}
              />
            )
            : null}
        </Paper>
        <RaidUpdater
          raidId={raid.id}
          loadRaid={loadRaid}
          setSrPluses={setSrPluses}
        />
        <ActivityLog
          attendees={raid.attendees}
          items={instance.items}
          admins={raid.admins}
          owner={raid.owner}
          open={logOpen}
          onClose={() => setLogOpen(false)}
          activityLog={raid.activityLog}
        />
      </Stack>
    )
  } else {
    return (
      <Stack>
        <Skeleton h={68}>
        </Skeleton>
        <Skeleton h={404}>
        </Skeleton>
      </Stack>
    )
  }
}
