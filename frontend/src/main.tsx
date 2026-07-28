import { StrictMode, useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import type { InfoResponse, User } from "../shared/types.ts"
import "../css/index.css"
import { CreateRaid } from "./create-raid.tsx"
import { CreateGuild } from "./create-guild.tsx"
import { RaidElement } from "./raid.tsx"
import { MyRaids } from "./my-raids.tsx"
import { LootBrowser } from "./loot-browser.tsx"
import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import { ModalsProvider } from "@mantine/modals"
import {
  IconBrandDiscordFilled,
  IconBrandGithubFilled,
} from "@tabler/icons-react"
import {
  Anchor,
  createTheme,
  Divider,
  Grid,
  Group,
  MantineProvider,
  Stack,
} from "@mantine/core"
import { useHover } from "@mantine/hooks"
import { Menu } from "./menu.tsx"
import { BrowserRouter, Route, Routes } from "react-router"

const theme = createTheme({
  primaryColor: "orange",
  cursorType: "pointer",
})

function App() {
  const { hovered: githubHovered, ref: githubRef } = useHover()
  const { hovered: discordHovered, ref: discordRef } = useHover()
  const [user, setUser] = useState<User>()
  const [discordClientId, setDiscordClientId] = useState<string>()
  const [discordLoginEnabled, setDiscordLoginEnabled] = useState<boolean>()

  useEffect(() => {
    fetch("/api/info").then((r) => r.json()).then(
      (j: InfoResponse) => {
        if (j.error) {
          alert(j.error.message)
        } else if (j.data) {
          setDiscordLoginEnabled(j.data.discordLoginEnabled)
          setDiscordClientId(j.data.discordClientId)
          setUser(j.user)
        }
      },
    )
  }, [])

  return (
    <MantineProvider defaultColorScheme="dark" theme={theme}>
      <ModalsProvider>
        <BrowserRouter>
          <Stack h="100dvh" justify="space-between">
            {user && discordLoginEnabled !== undefined
              ? (
                <Stack>
                  <Menu
                    user={user}
                    setUser={setUser}
                    discordClientId={discordClientId || ""}
                    discordLoginEnabled={discordLoginEnabled}
                  />
                  <Grid gutter={0} justify="center">
                    <Grid.Col span={{ base: 11, md: 4, xl: 4 }}>
                      <Routes>
                        <Route path="/" element={<MyRaids user={user} />} />
                        <Route path="/guild/create" element={<CreateGuild />} />
                        <Route path="/create" element={<CreateRaid />} />
                        <Route
                          path="/create/items"
                          element={<CreateRaid itemPickerOpen />}
                        />
                        <Route path="/copy/:raidId" element={<CreateRaid />} />
                        <Route
                          path="/copy/:raidId/items"
                          element={<CreateRaid itemPickerOpen />}
                        />
                        <Route
                          path="/edit/:raidId"
                          element={<CreateRaid edit={true} />}
                        />
                        <Route
                          path="/edit/:raidId/items"
                          element={<CreateRaid itemPickerOpen />}
                        />
                        <Route
                          path="/:raidId"
                          element={<RaidElement user={user} />}
                        />
                        <Route
                          path="/:raidId/items"
                          element={<RaidElement user={user} itemPickerOpen />}
                        />
                        <Route
                          path="/raids"
                          element={<MyRaids user={user} />}
                        />
                        <Route path="/loot" element={<LootBrowser />} />
                        <Route
                          path="/loot/items"
                          element={<LootBrowser itemPickerOpen />}
                        />
                      </Routes>
                    </Grid.Col>
                  </Grid>
                </Stack>
              )
              : null}
            <Stack>
              <Divider />
              <Group gap="sm" mb="md" justify="center">
                <Group gap="xs" mx="lg" ref={githubRef}>
                  <IconBrandGithubFilled
                    size={18}
                    color={githubHovered
                      ? "var(--mantine-primary-color-filled)"
                      : "grey"}
                  />
                  <Anchor
                    size="sm"
                    href="https://github.com/thezephyrsong/softresio"
                    underline="never"
                    c={githubHovered ? "lightgray" : "grey"}
                  >
                    This project is an open-source fork for Triumvirate
                  </Anchor>
                </Group>
                <Group gap="xs" mx="lg" ref={discordRef}>
                  <IconBrandDiscordFilled
                    size={18}
                    color={discordHovered
                      ? "var(--mantine-primary-color-filled)"
                      : "grey"}
                  />
                  <Anchor
                    size="sm"
                    href="https://discord.gg/DbfRrGGQ7J"
                    underline="never"
                    c={discordHovered ? "lightgray" : "grey"}
                  >
                    Give feedback on Discord
                  </Anchor>
                </Group>
              </Group>
            </Stack>
          </Stack>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
