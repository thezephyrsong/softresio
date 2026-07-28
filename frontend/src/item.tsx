import type { ReactElement } from "react"
import { useHover } from "@mantine/hooks"
import { LongPressCallbackReason, useLongPress } from "use-long-press"
import type {
  Attendee,
  Item,
  ItemPickerElementType,
  NpcItem,
  User,
} from "../shared/types.ts"
import { type RowComponentProps } from "react-window"
import {
  ActionIcon,
  Badge,
  Box,
  Checkbox,
  CloseButton,
  Divider,
  Flex,
  Group,
  Image,
  Text,
  Title,
  Tooltip,
} from "@mantine/core"

export const ItemNameAndIcon = (
  {
    item,
    npcId,
    showTooltipElement,
    highlight,
    onClick,
    onLongClick,
    rightSection,
    onRightSectionClick,
    allowImageClick = true,
  }: {
    item: Item
    npcId?: number
    showTooltipElement?: NpcItem
    highlight: boolean
    allowImageClick?: boolean
    onClick?: () => void
    onLongClick?: () => void
    rightSection?: ReactElement
    onRightSectionClick?: () => void
    onMiddleRightSectionClick?: () => void
  },
) => {
  const { hovered, ref } = useHover()
  const isTouchScreen = globalThis.matchMedia("(pointer: coarse)").matches
  const handlers = useLongPress(() => onLongClick?.(), {
    onCancel: (_, meta) => {
      if (meta.reason == LongPressCallbackReason.CancelledByRelease) {
        setTimeout(() => onClick?.(), 50)
      }
    },
  })

  const padding = 6

  return (
    <Tooltip
      m={0}
      p={0}
      multiline
      opened={((showTooltipElement?.itemId == item.id &&
        showTooltipElement?.npcId == npcId) ||
        (!isTouchScreen && hovered)) && item.tooltip != ""}
      position="bottom"
      label={
        <div
          className="tooltip"
          dangerouslySetInnerHTML={{ __html: item.tooltip }}
        />
      }
    >
      <Flex
        justify="space-between"
        wrap="nowrap"
        className={`list-element ${
          highlight || (hovered && !isTouchScreen)
            ? "list-element-highlight"
            : ""
        }`}
      >
        <Box
          p={padding}
          onClick={(e) => {
            if (allowImageClick) {
              globalThis.open(
                `https://wotlkdb.com/?item=${item.id}`,
              )
              e.stopPropagation()
            }
          }}
        >
          {(item.id == 0)
            ? (
              <Box h={24} w={24}>
              </Box>
            )
            : (
              <Image
                style={{
                  filter: "drop-shadow(0px 0px 2px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
                className={`q${item.quality}`}
                radius="sm"
                h={24}
                w={24}
                src={`https://wow.zamimg.com/images/wow/icons/large/${item.icon}`}
              />
            )}
        </Box>
        <Box
          ref={ref}
          flex={1}
          p={padding}
          {...handlers()}
        >
          <Text
            fs={(item.id == 0) ? "italic" : undefined}
            fw={(item.id == 0) ? 200 : undefined}
            size="sm"
            flex={1}
            className={`q${item.quality}`}
            style={{ overflowWrap: "anywhere" }}
            lineClamp={1}
          >
            {item.name}
          </Text>
        </Box>
        {rightSection
          ? (
            <Flex
              onClick={onRightSectionClick}
              px={padding}
              align="center"
            >
              {rightSection}
            </Flex>
          )
          : null}
      </Flex>
    </Tooltip>
  )
}

const ReservedByOthers = (
  { itemId, user, attendees }: {
    itemId: number
    user: User
    attendees: Attendee[]
  },
) => {
  const otherSRs =
    attendees.flatMap((attendee) =>
      attendee.softReserves.map((softReserve) => ({
        softReserve,
        userId: attendee.user.userId,
      }))
    ).filter(({ softReserve, userId }) =>
      softReserve.itemId == itemId && userId !== user.userId
    ).length
  return otherSRs > 0 ? <Badge circle color="orange">{otherSRs}</Badge> : null
}

export const SelectableItem = ({
  item,
  npcId,
  onClick,
  onLongClick,
  onRightSectionClick,
  selectedItemIds,
  showTooltipElement,
  user,
  attendees,
  deleteMode,
  hideChance,
  sameItemLimit = 0,
  selectMode,
  hardReserves = [],
}: {
  onClick?: () => void
  onLongClick?: () => void
  onRightSectionClick?: () => void
  selectedItemIds?: number[]
  showTooltipElement?: NpcItem
  item: Item
  npcId?: number
  user?: User
  attendees?: Attendee[]
  deleteMode?: boolean
  hideChance?: boolean
  selectMode?: boolean
  hardReserves?: number[]
  sameItemLimit?: number
}) => {
  const highlight = (showTooltipElement?.itemId == item.id &&
    showTooltipElement.npcId == npcId) ||
    (selectedItemIds || []).includes(item.id)
  const itemCount = selectedItemIds?.filter((id) => item.id == id).length || 0
  const chance = item.dropsFrom[0].chance
  return (
    <ItemNameAndIcon
      item={item}
      npcId={npcId}
      showTooltipElement={showTooltipElement}
      highlight={highlight}
      onClick={onClick}
      onLongClick={onLongClick}
      onRightSectionClick={onRightSectionClick}
      rightSection={((attendees && user) || !hideChance || hardReserves ||
          deleteMode || selectMode)
        ? (
          <Group wrap="nowrap" mr={selectMode ? 5 : 0} gap="xs">
            {attendees && user
              ? (
                <ReservedByOthers
                  itemId={item.id}
                  user={user}
                  attendees={attendees}
                />
              )
              : null}
            {!hideChance && !hardReserves.includes(item.id)
              ? (
                <Text w={30} size="xs" c="grey" ta="right">
                  {chance ? `${chance}%` : "<1%"}
                </Text>
              )
              : null}
            {hardReserves.includes(item.id)
              ? <Badge color="red">HR</Badge>
              : null}
            {deleteMode ? <CloseButton /> : null}
            {(selectMode && !hardReserves.includes(item.id) &&
                sameItemLimit > 1 && itemCount > 0)
              ? (
                <ActionIcon size={25}>
                  <Title order={6}>{itemCount}</Title>
                </ActionIcon>
              )
              : null}
            {(selectMode && !hardReserves.includes(item.id) &&
                (sameItemLimit === 1 || itemCount == 0))
              ? (
                <Checkbox
                  checked={selectedItemIds?.includes(item.id)}
                  size="md"
                />
              )
              : null}
          </Group>
        )
        : undefined}
    />
  )
}

export const ItemPickerElement = ({
  index,
  selectedItemIds,
  onClick,
  onLongClick,
  onRightSectionClick,
  showTooltipElement,
  user,
  style,
  deleteMode = false,
  selectMode = false,
  elements,
  attendees,
  hardReserves = [],
  sameItemLimit,
}: RowComponentProps<{
  onClick: (element: NpcItem) => void
  onLongClick: (element: NpcItem) => void
  onRightSectionClick: (element: NpcItem) => void
  selectedItemIds?: number[]
  user?: User
  showTooltipElement?: NpcItem
  deleteMode?: boolean
  selectMode?: boolean
  elements: ItemPickerElementType[]
  attendees?: Attendee[]
  hardReserves?: number[]
  sameItemLimit: number
}>) => {
  const element = elements[index]
  const segment = element.segment
  const item = element.item
  const npcId = element.npcId
  return (
    <Box style={style}>
      {segment
        ? (
          <Divider
            labelPosition="center"
            py={5}
            label={
              <Text size="md" c="var(--mantine-color-gray-6)">
                {element.segment}
              </Text>
            }
          />
        )
        : null}
      {item && npcId !== undefined
        ? (
          <SelectableItem
            item={item}
            npcId={npcId}
            selectedItemIds={selectedItemIds}
            onLongClick={() => onLongClick({ itemId: item.id, npcId: npcId })}
            onClick={() => onClick({ itemId: item.id, npcId: npcId })}
            onRightSectionClick={() =>
              onRightSectionClick({ itemId: item.id, npcId: npcId })}
            showTooltipElement={showTooltipElement}
            user={user}
            deleteMode={deleteMode}
            selectMode={selectMode}
            attendees={attendees}
            hardReserves={hardReserves}
            sameItemLimit={sameItemLimit}
          />
        )
        : null}
    </Box>
  )
}
