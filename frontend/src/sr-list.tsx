import { useState } from "react"
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Menu,
  Select,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core"
import { useHover } from "@mantine/hooks"
import type {
  Attendee,
  Item,
  Raid,
  SoftReserve,
  SrPlus,
  User,
} from "../shared/types.ts"
import { ItemNameAndIcon } from "./item.tsx"
import { ClassIcon } from "./class.tsx"
import {
  IconArrowsSort,
  IconSortAscendingLetters,
  IconSortDescendingLetters,
  IconX,
} from "@tabler/icons-react"
import { classes, renderClass } from "./class.tsx"
import { nothingItem } from "./mock-item.ts"
import { sumSrPlus } from "../shared/utils.ts"
import { SrPlusLog } from "./sr-plus-log.tsx"
import { IconShieldFilled, IconTrash } from "@tabler/icons-react"
import { modals } from "@mantine/modals"

type ListElement = { attendee: Attendee; softReserve: SoftReserve }

export const SrListElement = (
  {
    visible,
    item,
    items,
    attendee,
    admins,
    user,
    owner,
    editAdmin,
    deleteSr,
    locked,
    srPluses,
    guildId,
    showSrPlus,
  }: {
    srPluses: SrPlus[]
    visible: boolean
    locked: boolean
    item: Item
    items: Item[]
    attendee: Attendee
    admins: User[]
    owner: User
    user: User
    editAdmin: (user: User, remove: boolean) => void
    deleteSr: () => void
    guildId?: string
    showSrPlus?: boolean
  },
) => {
  const { ref, hovered } = useHover()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const openConfirmDeleteSrModal = () =>
    modals.openConfirmModal({
      title: "Are you sure?",
      centered: true,
      children: (
        <Text size="sm">
          Do you want to remove{" "}
          <b className={`q${item.quality}`}>[{item.name}]</b> from{" "}
          <b>{attendee.character.name}</b>'s SRs?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => console.log("Cancel"),
      onConfirm: deleteSr,
    })

  const openConfirmPromoteAdmin = () =>
    modals.openConfirmModal({
      title: "Are you sure?",
      centered: true,
      children: (
        <Text size="sm">
          Do you want to promote <b>{attendee.character.name}</b> to admin?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onCancel: () => console.log("Cancel"),
      onConfirm: () => editAdmin(attendee.user, false),
    })

  const openConfirmDemoteAdmin = () =>
    modals.openConfirmModal({
      title: "Are you sure?",
      centered: true,
      children: (
        <Text size="sm">
          Do you want to remove admin privileges from{" "}
          <b>{attendee.character.name}</b>?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => console.log("Cancel"),
      onConfirm: () => editAdmin(attendee.user, true),
    })

  const promoteRemoveAdmin = () => {
    if (!admins.find((a) => a.userId == user.userId)) {
      return null
    }
    if (!admins.find((a) => a.userId == attendee.user.userId)) {
      return (
        <Menu.Item
          leftSection={<IconShieldFilled size={14} />}
          onClick={openConfirmPromoteAdmin}
        >
          Promote to Admin
        </Menu.Item>
      )
    } else {
      return (
        <Tooltip
          label={owner.userId == attendee.user.userId
            ? "You cannot remove owner as Admin"
            : ""}
          disabled={owner.userId != attendee.user.userId}
        >
          <Menu.Item
            onClick={openConfirmDemoteAdmin}
            disabled={owner.userId == attendee.user.userId}
            leftSection={<IconShieldFilled size={14} />}
          >
            Remove as Admin
          </Menu.Item>
        </Tooltip>
      )
    }
  }

  return (
    <Menu
      opened={menuOpen}
      onChange={setMenuOpen}
      position="bottom-start"
    >
      <Menu.Target>
        <Table.Tr
          ref={ref}
          className={hovered || menuOpen
            ? "list-element-highlight"
            : "list-element"}
          style={{ visibility: visible ? "visible" : "hidden" }}
        >
          <Table.Td>
            <Tooltip
              label={`${attendee.character.spec} ${attendee.character.class}`}
            >
              <Group gap={2} wrap="nowrap">
                <ClassIcon xclass={attendee.character.class} />
                <ClassIcon
                  xclass={attendee.character.class}
                  spec={attendee.character.spec}
                />
              </Group>
            </Tooltip>
          </Table.Td>
          <Table.Td>
            <Group gap={4} wrap="nowrap">
              <Title order={6} lineClamp={1}>
                {attendee.character.name}
              </Title>
              {admins.find((a) => a.userId == attendee.user.userId)
                ? (
                  <Tooltip
                    label={owner.userId == attendee.user.userId
                      ? "Owner"
                      : "Admin"}
                  >
                    <IconShieldFilled
                      color={owner.userId == attendee.user.userId
                        ? "var(--mantine-color-orange-text)"
                        : undefined}
                      size={16}
                    />
                  </Tooltip>
                )
                : null}
            </Group>
          </Table.Td>
          <Table.Td>
            <ItemNameAndIcon
              item={item}
              highlight={false}
            />
          </Table.Td>
          {showSrPlus
            ? (
              <Table.Td ta="center" onClick={(e) => e.stopPropagation()}>
                <Button
                  onClick={() => {
                    setLogOpen(true)
                  }}
                  size="xs"
                  px={8}
                  color="lightgrey"
                  variant="subtle"
                >
                  {sumSrPlus(srPluses)}
                </Button>
                {srPluses.length > 0
                  ? (
                    <SrPlusLog
                      items={items}
                      open={logOpen}
                      onClose={() => setLogOpen(false)}
                      characterName={attendee.character.name}
                      guildId={guildId}
                      itemId={item.id}
                      srPluses={srPluses}
                    />
                  )
                  : null}
              </Table.Td>
            )
            : null}
        </Table.Tr>
      </Menu.Target>
      <Menu.Dropdown>
        {promoteRemoveAdmin()}
        <Menu.Item
          onClick={openConfirmDeleteSrModal}
          disabled={(attendee.user.userId == user.userId && !locked) ||
              admins.find((a) => a.userId == user.userId)
            ? false
            : true}
          color="red"
          leftSection={<IconTrash size={14} />}
        >
          Delete SR
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

export const SrList = (
  { raid, items, user, editAdmin, deleteSr, srPluses }: {
    srPluses: SrPlus[]
    raid: Raid
    items: Item[]
    user: User
    editAdmin: (user: User, remove: boolean) => void
    deleteSr: (user: User, itemId: number) => void
  },
) => {
  const [classFilter, setClassFilter] = useState<string>()
  const [nameFilter, setNameFilter] = useState<string>()
  const [itemFilter, setItemFilter] = useState<string>()
  const [sortBy, setSortBy] = useState<"name" | "item" | "class">()
  const [sortDesc, setSortDesc] = useState<boolean>(false)

  const filter = (
    { attendee, softReserve }: ListElement,
  ) => ((!classFilter || attendee.character.class == classFilter) &&
    (!nameFilter ||
      attendee.character.name.toLowerCase().startsWith(
        nameFilter.toLowerCase(),
      )) &&
    (!itemFilter ||
      (items.find((item) => item.id == softReserve.itemId) || nothingItem).name
        .toLowerCase()
        .includes(itemFilter.toLowerCase())))

  const sort = (a: ListElement, b: ListElement) => {
    let valueA = ""
    let valueB = ""
    if (sortBy == "name") {
      valueA = a.attendee.character.name
      valueB = b.attendee.character.name
    } else if (sortBy == "item") {
      valueA = (items.find((item) =>
        item.id == a.softReserve.itemId
      ) || nothingItem).name
      valueB = (items.find((item) =>
        item.id == b.softReserve.itemId
      ) || nothingItem).name
    } else {
      // defaults to sort by "class"
      valueA = a.attendee.character.class
      valueB = b.attendee.character.class
    }
    return valueA.localeCompare(valueB) * (sortDesc ? -1 : 1)
  }

  const elements = raid.attendees.flatMap((attendee) =>
    attendee.softReserves.map((softReserve, index) => ({
      softReserve,
      attendee,
      index,
    }))
  ).sort(sort).sort((a, b) => (Number(filter(a)) * -1 + Number(filter(b))))

  return (
    <Table
      horizontalSpacing={5}
      verticalSpacing={0}
      striped
      withRowBorders={false}
    >
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={30}>
            <Select
              pb="sm"
              data={Object.keys(classes)}
              onChange={(value) => setClassFilter(value || undefined)}
              value={classFilter}
              rightSectionWidth={30}
              rightSection={classFilter
                ? (
                  <Box pr={12}>
                    <ClassIcon xclass={classFilter} />
                  </Box>
                )
                : undefined}
              rightSectionPointerEvents="none"
              renderOption={renderClass(classFilter)}
              comboboxProps={{ width: 140, position: "bottom-start" }}
            />
          </Table.Th>
          <Table.Th w={100}>
            <Group wrap="nowrap" gap={0}>
              <TextInput
                pb="sm"
                placeholder="Name"
                onChange={(event) =>
                  setNameFilter(event.currentTarget.value || undefined)}
                value={nameFilter || ""}
                rightSection={
                  <SortButton
                    active={sortBy == "name"}
                    activate={() => setSortBy("name")}
                    asc={!sortDesc}
                    sortDesc={() => setSortDesc(true)}
                    reset={() => {
                      setSortBy(undefined)
                      setSortDesc(false)
                    }}
                  />
                }
              />
            </Group>
          </Table.Th>
          <Table.Th>
            <Group wrap="nowrap" gap={3}>
              <TextInput
                pb="sm"
                placeholder="Item"
                onChange={(event) =>
                  setItemFilter(event.currentTarget.value || undefined)}
                value={itemFilter || ""}
                w="100%"
                rightSection={
                  <SortButton
                    active={sortBy == "item"}
                    activate={() => setSortBy("item")}
                    asc={!sortDesc}
                    sortDesc={() => setSortDesc(true)}
                    reset={() => {
                      setSortBy(undefined)
                      setSortDesc(false)
                    }}
                  />
                }
              />
              <ActionIcon
                mb="sm"
                variant={classFilter || nameFilter || itemFilter || sortDesc ||
                    sortBy
                  ? ""
                  : "subtle"}
                color={classFilter || nameFilter || itemFilter || sortDesc ||
                    sortBy
                  ? ""
                  : "lightgrey"}
                onClick={() => {
                  setClassFilter(undefined)
                  setNameFilter(undefined)
                  setItemFilter(undefined)
                  setSortBy(undefined)
                  setSortDesc(false)
                }}
              >
                <IconX />
              </ActionIcon>
            </Group>
          </Table.Th>
          {raid.useSrPlus
            ? (
              <Table.Th ta="center" pb="sm" px={0} w={40}>
                SR+
              </Table.Th>
            )
            : null}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {elements.map((e) => (
          <SrListElement
            items={items}
            guildId={raid.guildId}
            showSrPlus={raid.useSrPlus}
            locked={raid.locked}
            key={`${e.attendee.character.name}|${e.softReserve.itemId}|${e.index}`}
            visible={filter(e)}
            attendee={e.attendee}
            item={items.find((i) => i.id == e.softReserve.itemId) ||
              nothingItem}
            user={user}
            admins={raid.admins}
            owner={raid.owner}
            editAdmin={editAdmin}
            srPluses={srPluses?.filter((sr) =>
              sr.characterName == e.attendee.character.name &&
              sr.itemId == e.softReserve.itemId
            )}
            deleteSr={() => deleteSr(e.attendee.user, e.softReserve.itemId)}
          />
        ))}
      </Table.Tbody>
    </Table>
  )
}

export const SortButton = (
  { active, activate, sortDesc, reset, asc }: {
    active: boolean
    activate: () => void
    reset: () => void
    sortDesc: () => void
    asc: boolean
  },
) => (
  <ActionIcon
    color={active ? "" : "lightgray"}
    variant={active ? "" : "subtle"}
    onClick={() => {
      if (!active) {
        activate()
      } else if (!asc) {
        reset()
      } else {
        sortDesc()
      }
    }}
  >
    {active
      ? asc ? <IconSortAscendingLetters /> : <IconSortDescendingLetters />
      : <IconArrowsSort />}
  </ActionIcon>
)
