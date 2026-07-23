import postgres, { TransactionSql } from "postgres"
import { getEnv } from "./utils.ts"

const DATABASE_USER = getEnv("DATABASE_USER")
const DATABASE_PASSWORD = getEnv("DATABASE_PASSWORD")
const DATABASE_HOST = Deno.env.get("DATABASE_HOST") || Deno.env.get("DATABASE_HOSTNAME") || "database"
const DATABASE_NAME = Deno.env.get("DATABASE_NAME")
const DATABASE_PORT = Number(Deno.env.get("DATABASE_PORT") || 5432)

export const sql = postgres({
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  database: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
})

export const beginWithTimeout = <T>(
  body: (tx: TransactionSql<{}>) => Promise<T>,
) => {
  return sql.begin(async (tx) => {
    await tx`set local transaction_timeout = '1s';`
    return await body(tx)
  })
}

await sql`
  create table if not exists "raids" ( raid jsonb );
`

await sql`
  create index if not exists idxraids ON raids using gin ( raid );
`

await sql`
  create unique index if not exists idx_raidId ON raids ((raid->>'id'));
`

await sql`
  create table if not exists "guilds" ( guild jsonb );
`

await sql`
  create index if not exists idxguilds ON guilds using gin ( guild );
`

await sql`
  create unique index if not exists idx_guildid ON guilds ((guild->>'id'));
`

await sql`
create or replace function notify_raid_changed()
  returns trigger
as $$
begin
  perform pg_notify('raid_updated', (new.raid->>'id'));
  return null;
end;
$$ language plpgsql
`

await sql`
create or replace trigger raid_updated
  after update
  on raids
  for each row
  execute function notify_raid_changed();
`
