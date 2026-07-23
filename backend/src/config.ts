import process from "node:process"
import { getEnv } from "./utils.ts"

export const PORT = process.env["PORT"]
export const DOMAIN = getEnv("DOMAIN")
export const SCHEME = getEnv("SCHEME")
export const JWT_SECRET = getEnv("JWT_SECRET")

export const DISCORD_LOGIN_ENABLED =
  process.env["DISCORD_LOGIN_ENABLED"] === "true"
export const DISCORD_CLIENT_ID = DISCORD_LOGIN_ENABLED
  ? getEnv("DISCORD_CLIENT_ID")
  : ""
export const DISCORD_CLIENT_SECRET = DISCORD_LOGIN_ENABLED &&
  getEnv("DISCORD_CLIENT_SECRET")
export const DISCORD_API_ENDPOINT = "https://discord.com/api/v10"

// Render (and most PaaS) always sets PORT so the app knows which internal
// port to bind to - but that's never part of the public-facing URL, since
// Render's edge terminates TLS on 443 and proxies internally. Only include
// a port when running locally, mirroring the frontend's redirect_uri logic
// in menu.tsx (which only appends a port for hostname === "localhost").
export const DISCORD_REDIRECT_URI = `${SCHEME}://${DOMAIN}${
  DOMAIN === "localhost" && PORT ? `:${PORT}` : ""
}/api/discord`
