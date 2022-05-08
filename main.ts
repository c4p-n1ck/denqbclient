import {
  login, remove_torrents,
  logout, info_torrents, env
} from "https://deno.land/x/denqbclient/mod.ts";

await login(env['username'], env['password']);
console.log(await info_torrents());
await logout()
