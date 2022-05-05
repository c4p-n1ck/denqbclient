import { env, login, logout, info_torrents } from "https://deno.land/x/denqbclient/mod.ts";

console.log(await login(env['username'], env['password']));
console.log(await info_torrents());
await logout()
