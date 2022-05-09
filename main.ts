import {
  login, remove_torrents, ping,
  logout, info_torrents,
  get_build_info, env
} from "./mod.ts";

console.log(await login(env['username'], env['password']));
console.log(await info_torrents());
console.log(await ping());
await logout()
