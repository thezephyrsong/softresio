import { useState } from "react"
import type {
  Item,
  SrPlus,
  SrPlusManualChangeRequest,
  SrPlusManualChangeResponse,
} from "../shared/types.ts"
import {
  Anchor,
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core"
import { formatDistanceToNow } from "date-fns"
import { formatTime, raidIdToUrl, sumSrPlus } from "../shared/utils.ts"
import { nothingItem } from "./mock-item.ts"

export const SrPlusLog = (
  { srPluses, open, onClose, characterName, itemId, guildId, items }: {
    srPluses: SrPlus[]
    characterName: string
    items: Item[]
    itemId: number
    guildId?: string
    open: boolean
    onClose: () => void
  },
) => {
  const [changeSrPlus, setChangeSrPlus] = useState(sumSrPlus(srPluses))

  const submit = () => {
    if (!guildId) return
    const request: SrPlusManualChangeRequest = {
      guildId,
      characterName,
      itemId,
      value: changeSrPlus - sumSrPlus(srPluses),
    }

    fetch(`/api/srplus`, { method: "POST", body: JSON.stringify(request) })
      .then(
        (r) => r.json(),
      ).then(
        (j: SrPlusManualChangeResponse) => {
          if (j.error) {
            alert(j.error.message)
          } else if (j.data) {
            alert("SR+ set")
          }
        },
      )
  }

  return (
    <Modal
      title={
        <Text size="sm">
          <b>{srPluses[0]?.characterName}</b>
          {"'s soft-reserves of "}
          <b
            className={`q${
              (items.find((i) => i.id == itemId) ||
                nothingItem).quality
            }`}
          >
            [{(items.find((i) => i.id == itemId) || nothingItem).name}]
          </b>
        </Text>
      }
      size="auto"
      opened={open}
      onClose={onClose}
      withCloseButton
      padding="sm"
    >
      <Stack mb="md" display="none">
        <Group justify="right">
          <NumberInput
            w={100}
            value={changeSrPlus}
            onChange={(e) => setChangeSrPlus(Number(e))}
            step={10}
            max={1000}
          />
        </Group>
        <Group justify="right">
          <Button
            w={100}
            onClick={submit}
            disabled={!guildId || changeSrPlus === (sumSrPlus(srPluses))}
          >
            Set SR+
          </Button>
        </Group>
      </Stack>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Time</Table.Th>
            <Table.Th>Source</Table.Th>
            <Table.Th>Change</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {srPluses.sort((a, b) => b.time.localeCompare(a.time)).map((
            srPlus,
          ) => (
            <Table.Tr>
              <Table.Td>
                <Tooltip label={formatTime(srPlus.time)}>
                  <Text size="sm">
                    {formatDistanceToNow(srPlus.time, { addSuffix: true })}
                  </Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>
                {srPlus.type == "raid"
                  ? (
                    <Anchor size="sm" href={raidIdToUrl(srPlus.raidId)}>
                      {raidIdToUrl(srPlus.raidId)}
                    </Anchor>
                  )
                  : "Manual"}
              </Table.Td>
              <Table.Td>
                <Text size="sm">
                  {srPlus.type == "raid"
                    ? "+10"
                    : (srPlus.value > 0 ? "+" : "") + srPlus.value}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Modal>
  )
}
