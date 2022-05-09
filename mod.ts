import { config } from "./deps.ts";

const version = "0.0.1";
const env = config();
const base_url = env['api_base_url'];
const api_path = "api/v2";
const headers = new Headers();
headers.set("Referer", base_url);
headers.set("User-Agent", `denqbClient/${version}`);
headers.set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");


const post_data = ( d: any ) => {
  return Object.keys(d).map( k =>
    `${encodeURIComponent(k)}=${encodeURIComponent(d[k])}`
  ).join('&');
};
const use_api = async (method: string,  input?: any, debug?: boolean): Promise<any> => {
  var resp_data = ""; var data = ""; var resp: any = null;
  let full_url = `${base_url}/${api_path}/${method}`;
  if ( typeof input !== "undefined" ) {
    if ( 'params' in input ) {
      full_url += '?' + post_data(input['params']);
    } else if ( 'data' in input && !('file' in input) ) {
      data = post_data(input['data']);
    } else {
      console.error(`Unsupported "input" -> "${JSON.stringify(input)}"`); return
    }
  } else {
    input = {};
  }; if ( typeof debug !== 'undefined' && debug ) {
        console.log(full_url);
        if ( 'file' in input ) {
          console.log(input['file']);
        } if ( 'data' in input ) {
          console.log(data);
        }
  }; if ( 'file' in input ) {
      let file_content: any = await Deno.open(input['file'], { read: true });
      file_content = await Deno.readAll(file_content);
      let file_headers = new Headers();
      file_headers.set("Referer", base_url);
      file_headers.set("User-Agent", `denqbClient/${version}`);
      file_headers.set("Content-Type", "application/x-bittorrent"); // Since, that's all we need.
      let file = new File([file_content], input['file']);
      let form = new FormData();
      form.append('filename', file);
      if ( 'data' in input ) {
        let form_data = input['data'];
        for (let key in form_data) {
          form.append(key, form_data[key]);
        };
      }; if ( typeof debug !== 'undefined' && debug ) { console.log('File - POST'); }
      resp = await fetch(full_url, {
        method: 'POST',
        headers: file_headers,
        body: form,
        credentials: 'include'
      });
  } else if ( 'data' in input ) {
    if ( typeof debug !== 'undefined' && debug ) { console.log('POST'); }
    resp = await fetch(full_url, {
      method: 'POST',
      headers: headers,
      body: data,
      credentials: 'include'
    });
  } else {
      if ( typeof debug !== 'undefined' && debug ) { console.log('GET'); }
      resp = await fetch(full_url, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
  }; try {
    resp_data = await resp.text();
  } catch ( err ) {
    console.log(err);
    resp_data = await resp.text();
  }; if (resp.headers.get('Content-Type')==="application/json"){resp_data=JSON.parse(resp_data)}
  if ( typeof debug !== 'undefined' && debug ) {
        console.log(resp);
        console.log(resp_data);
  }; if ( method === "auth/login" ) {
    return resp.headers.get('set-cookie') || '';
  }; return resp_data
}


const login = async (username: string, password: string) => {
  let cookie = await use_api('auth/login', { data: {
    username: username,
    password: password
  }});
  headers.set("Cookie", cookie);
  return { "Cookie": cookie }
}

const logout = async () => {
  await use_api('auth/logout');
  headers.delete("Cookie");
}

const info_torrents = async ( hash?: string, options?: any ) => {
  if ( typeof hash !== "undefined" ) {
    return await use_api('torrents/properties', { params: {
      hash: hash
    }})
  } else if ( typeof options !== "undefined" ) {
    // Options: https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-(qBittorrent-4.1)#get-torrent-list
    return await use_api('torrents/info', { params: options });
  } else {
    return await use_api('torrents/info');
  }
}

const add_torrents = async (torrent_url: string | string[], torrent_filenames: string | string[]) => {
  let resp: any = {}; let resps: any[] = []
  if ( typeof(torrent_url) === "object" ) { torrent_url = torrent_url.join("\n"); }
  if (torrent_filenames) {
    if ( typeof torrent_filenames !== "object" ) {
      torrent_filenames = [ torrent_filenames ];
    }; torrent_filenames.forEach( async ( torrent_filename: any ) => {
        resp = await use_api('torrents/add', { file: {
          filename: torrent_filename
        }, data : {
          name: "torrents"
        }
      }); resps = resps.concat(resp);
    }); return resps
  }
  return await use_api('torrents/add', { data: {
    urls: torrent_url,
    savepath:'/downloads',
    skip_checking: false,
    paused: false,
    root_folder: false
  }}); 
}

const pause_torrents = async ( hash: string | string[] | "all" ) => {
  if ( typeof(hash) === "object" ) { hash = hash.join("|") }
  return await use_api('torrents/pause', { params: {
    hashes: hash
  }})
}

const resume_torrents = async ( hash: string | string[] | "all" ) => {
  if ( typeof(hash) === "object" ) { hash = hash.join("|") }
  return await use_api('torrents/resume', { params: {
    hashes: hash
  }})
}

const remove_torrents = async ( hash: string | string[], delete_files: boolean ) => {
  if ( typeof(hash) === "object" ) { hash = hash.join("|") }
  return await use_api('torrents/delete', { params: {
    hashes: hash,
    deleteFiles: delete_files
  }})
}; const delete_torrents = remove_torrents;

const recheck_torrents = async ( hash: string | string[] | "all" ) => {
  if ( typeof(hash) === "object" ) { hash = hash.join("|") }
  return await use_api('torrents/recheck', { params: {
    hashes: hash
  }})
}

const reannounce_torrents = async ( hash: string | string[] | "all" ) => {
  if ( typeof(hash) === "object" ) { hash = hash.join("|") }
  return await use_api('torrents/reannounce', { params: {
    hashes: hash
  }})
}

const get_torrent_trackers = async ( hash: string ) => {
  return await use_api('torrents/reannounce', { params: {
    hash: hash
  }});
}

const get_torrent_webseeds = async ( hash: string ) => {
  return await use_api('torrents/webseeds', { params: {
    hash: hash
  }});
}

const get_torrent_piece_states = async ( hash: string ) => {
  return await use_api('torrents/pieceStates', { params: {
    hash: hash
  }});
}

const get_torrent_contents = async ( hash: string, indexes?: string | string[] ) => {
  if ( typeof indexes !== "undefined" ) {
    if ( typeof indexes === "object" ) { indexes = indexes.join("|"); }
    return await use_api('torrents/files', { params: {
      hash: hash,
      indexes: indexes
    }})
  } else {
    return await use_api('torrents/files', { params: { hash: hash } });
  }
}

const get_app_version = async () => {
  return await use_api('app/version');
}

const get_web_api_version = async () => {
  return await use_api('app/webapiVersion');
}

const get_build_info = async () => {
  return await use_api('app/buildInfo');
}

const get_app_preferences = async () => {
  return await use_api('app/preferences');
}

const get_default_save_path = async () => {
  return await use_api('app/defaultSavePath');
}

const get_transfer_info = async () => {
  return await use_api('transfer/info');
}

const get_alternate_speed_limit_state = async () => {
  return await use_api('transfer/speedLimitsMode');
}

const get_download_limit = async (hashes?: string | string[]) => {
  if ( typeof hashes !== "undefined" ) {
    if ( typeof hashes === "object" ) { hashes = hashes.join("|"); }
    return await use_api('torrents/downloadLimit', { data: {
      hashes: hashes
    }});
  }; return await use_api('transfer/downloadLimit');
}

const set_torrent_name = async (hash: string, name: string) => {
  return await use_api('torrents/rename', {data: {
    hash: hash,
    name: name
  }});
}

const set_force_start = async (hashes: string | string[]) => {
  if ( typeof hashes !== "undefined" ) {
    if ( typeof hashes === "object" ) { hashes = hashes.join("|"); }
      return await use_api('torrents/setForceStart', {data: {
        hashes: hashes,
        value: true
      }});
  }
}

const set_super_seeding = async (hashes: string | string[]) => {
  if ( typeof hashes !== "undefined" ) {
    if ( typeof hashes === "object" ) { hashes = hashes.join("|"); }
      return await use_api('torrents/setSuperSeeding', {data: {
        hashes: hashes,
        value: true
      }});
  }
}

const get_upload_limit = async (hashes?: string | string[]) => {
  if ( typeof hashes !== "undefined" ) {
    if ( typeof hashes === "object" ) { hashes = hashes.join("|"); }
    return await use_api('torrents/uploadLimit', { data: {
      hashes: hashes
    }});
  }; return await use_api('transfer/uploadLimit');
}

const ping = async () => {
  let before_exec = +new Date;
  await get_build_info();
  let after_exec = +new Date;
  return {"pong": after_exec - before_exec}
}

export {
  login, logout,
  info_torrents,
  add_torrents,
  get_build_info,
  pause_torrents,
  resume_torrents,
  remove_torrents,
  delete_torrents,
  recheck_torrents,
  reannounce_torrents,
  get_torrent_contents,
  ping, env
}
