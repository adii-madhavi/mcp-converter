export const MAX_BYTES = 256 * 1024;
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const sensitive = k => /token|secret|password|passwd|credential|api.?key|authorization|cookie|private.?key/i.test(k);
const credentialValue = v => typeof v === 'string' && (/^(?:Bearer\s|sk-|gh[pousr]_|github_pat_|AKIA[0-9A-Z]{16})/.test(v) || /-----BEGIN .*PRIVATE KEY-----/.test(v) || /[?&](?:token|api[_-]?key|secret|password|signature|sig)=/i.test(v) || /^[a-z][a-z0-9+.-]*:\/\/[^/\s]+:[^/\s]+@/i.test(v));
const reference = v => typeof v === 'string' && /^\$\{[^}]+\}$/.test(v);
export const examples = {
 mcp: JSON.stringify({mcpServers:{filesystem:{command:'cmd',args:['/c','npx','-y','@modelcontextprotocol/server-filesystem','C:\\Users\\Alex\\Documents']},'local-tools':{command:'python',args:['C:\\Users\\Alex\\projects\\tools\\server.py'],env:{API_KEY:'example-secret-replace-me'}}}},null,2),
 json: JSON.stringify({workspace:'C:\\Users\\Alex\\projects',cacheDir:'C:\\Users\\Alex\\AppData\\Local\\MyApp',theme:'system',apiKey:'example-secret-replace-me'},null,2)
};
export function convert(text, options = {}) {
 const opt = {mode:'mcp',source:'windows',target:'macos',format:'preserve',username:'alex',redact:true,...options};
 if (!['mcp','json'].includes(opt.mode) || !['windows','macos','linux'].includes(opt.source) || !['windows','macos','linux'].includes(opt.target) || !['preserve','mcpServers','servers'].includes(opt.format)) throw Error('Unsupported conversion options.');
 if (!/^[a-zA-Z0-9._-]{1,64}$/.test(opt.username) || ['.','..'].includes(opt.username)) throw Error('Enter a valid target account name (letters, numbers, dots, underscores or hyphens).');
 if (new TextEncoder().encode(text).length > MAX_BYTES) throw Error('Configuration exceeds the 256 KB limit.');
 let data; try {data=JSON.parse(text);} catch {throw Error('Invalid JSON. Check commas, quotes and escaped Windows backslashes. JSON comments are not supported.');}
 if (!object(data)) throw Error('Use a JSON object at the top level.');
 let nodes=0;
 function validate(v,d=0) {if (++nodes>20000 || d>40) throw Error('Configuration is too deeply nested or too large.'); if (v && typeof v==='object') for (const [k,x] of Object.entries(v)) {if (['__proto__','prototype','constructor'].includes(k)) throw Error('Configuration contains a reserved object key.');validate(x,d+1);}}
 validate(data);
 const issues=[], changes=[];
 const issue=(level,path,message)=>issues.push({level,path,message});
 const change=(path,message)=>changes.push({path,message});
 const home=opt.target==='windows'?`C:\\Users\\${opt.username}`:opt.target==='macos'?`/Users/${opt.username}`:`/home/${opt.username}`;
 function pathValue(v,path) {
  if (opt.source===opt.target) return v;
  let result=v;
  if (opt.source==='windows' && /[a-z]:\\.*;[a-z]:\\/i.test(v)) {issue('review',path,'Windows path list needs individual directory mappings and a target-specific delimiter. Kept unchanged.');return v;}
  if (opt.source==='windows' && /^(?:[a-z]:\\|\\\\|%(?:USERPROFILE|APPDATA|LOCALAPPDATA)%)/i.test(v)) {
   if (/^\\\\/.test(v)) {issue('review',path,'Network share path needs an explicit mount on the target device. Kept unchanged.');return v;}
   let suffix;
   const match=v.match(/^[a-z]:\\Users\\[^\\]+(.*)$/i);
   if (match) suffix=match[1];
   else if (/^%USERPROFILE%/i.test(v)) suffix=v.replace(/^%USERPROFILE%/i,'');
   else if (/^%APPDATA%/i.test(v)) suffix='\\AppData\\Roaming'+v.replace(/^%APPDATA%/i,'');
   else if (/^%LOCALAPPDATA%/i.test(v)) suffix='\\AppData\\Local'+v.replace(/^%LOCALAPPDATA%/i,'');
   else {issue('review',path,'Drive-specific path has no known target mapping. Kept unchanged.');return v;}
   if (opt.target!=='windows') {
    suffix=suffix.replace(/\\/g,'/');
    if (/^\/AppData\/(Roaming|Local)(?:\/|$)/i.test(suffix)) {suffix=suffix.replace(/^\/AppData\/(Roaming|Local)/i,opt.target==='macos'?'/Library/Application Support':'/.config');issue('review',path,'App data location is an estimate. Confirm the app’s target directory.');}
    result=home+suffix;
   }
  } else if (opt.source!=='windows' && /^(?:\/Users\/[^/]+|\/home\/[^/]+)(?:\/|$)/.test(v)) {
   let suffix=v.replace(/^\/(?:Users|home)\/[^/]+/,'');
   if (opt.target==='windows') {
    if (suffix.startsWith('/Library/Application Support')) {suffix=suffix.replace('/Library/Application Support','/AppData/Roaming');issue('review',path,'App data location is an estimate. Confirm the app’s target directory.');}
    else if (suffix.startsWith('/.config')) {suffix=suffix.replace('/.config','/AppData/Roaming');issue('review',path,'App data location is an estimate. Confirm the app’s target directory.');}
    result=home+suffix.replace(/\//g,'\\');
   } else {
    if (opt.source==='macos' && suffix.startsWith('/Library/Application Support')) {suffix=suffix.replace('/Library/Application Support','/.config');issue('review',path,'Confirm the app’s Linux configuration directory.');}
    if (opt.source==='linux' && suffix.startsWith('/.config')) {suffix=suffix.replace('/.config','/Library/Application Support');issue('review',path,'Confirm the app’s macOS configuration directory.');}
    result=home+suffix;
   }
  } else if (/^~[\\/]|^\$(?:HOME|\{HOME\})|%[A-Z_]+%/.test(v)) issue('review',path,'Variable or tilde expansion depends on the host app. Kept unchanged.');
  if (result===v && opt.source!==opt.target && opt.source!=='windows' && /^\//.test(v) && !/^\/(?:Users|home)\//.test(v)) issue('review',path,'Absolute system or mount path has no verified target mapping. Kept unchanged.');
  if (result!==v) {change(path,'Mapped user path to the target account.');if (/\/\.\.(?:\/|$)|\\\.\.(?:\\|$)/.test(result)) issue('review',path,'Path contains parent traversal. Review its final access scope.');}
  return result;
 }
 function walk(v,path='',key='') {
  if ((sensitive(key)||credentialValue(v)) && v!==null && v!=='' && !reference(v)) {
   if(opt.redact) {change(path,'Redacted a likely credential.');issue('review',path,'Replace the redacted credential locally before using this configuration.');return 'REPLACE_LOCALLY';}
   issue('review',path,'A likely credential is included in the output. Keep the exported file private.');return v;
  }
  if(typeof v==='string') {if (/^https?:\/\//i.test(v)) {if(/^http:\/\//i.test(v) && !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(?=[:/]|$)/i.test(v)) issue('review',path,'Unencrypted remote endpoint. Verify its trust and transport.');return v;} return pathValue(v,path);}
  if (Array.isArray(v)) return v.map((x,i)=>walk(x,`${path}[${i}]`,key));
  if(object(v)) return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(x,path?`${path}.${k}`:k,k)]));
  return v;
 }
 let rootKey;
 if(opt.mode==='mcp') {
  const keys=['mcpServers','servers'].filter(k=>Object.hasOwn(data,k));
  if(keys.length!==1 || !object(data[keys[0]])) throw Error('MCP JSON must contain one server map: "mcpServers" or "servers".');
  rootKey=keys[0];
  const entries=Object.entries(data[rootKey]);
  if(!entries.length) throw Error('Add at least one MCP server.');
  if(entries.length>100) throw Error('Use at most 100 servers per conversion.');
  for(const [name,s] of entries) {
   if(!object(s)) throw Error(`Server ${name} must be an object.`);
   if (typeof s.command!=='string' && typeof s.url!=='string') throw Error(`Server ${name} needs a command or URL.`);
   if(s.command!==undefined && (typeof s.command!=='string'||!s.command.trim())) throw Error(`Server ${name} has an invalid command.`);
   if(s.args!==undefined && (!Array.isArray(s.args)||s.args.some(a=>typeof a!=='string'))) throw Error(`Server ${name} args must be an array of strings.`);
   if(s.env!==undefined && (!object(s.env)||Object.values(s.env).some(v=>v!==null && !['string','number'].includes(typeof v)))) throw Error(`Server ${name} env must contain strings, numbers or null.`);
   if(s.url!==undefined) {let u;try {u=new URL(s.url);}catch{throw Error(`Server ${name} has an invalid URL.`);}if(!['https:','http:'].includes(u.protocol))throw Error(`Server ${name} URL must use HTTP or HTTPS.`);}
  }
 }
 let out=walk(data);
 if(opt.mode==='mcp') {
  for(const [name,s] of Object.entries(out[rootKey])) {
   const p=`${rootKey}.${name}`;
   if(s.command) {
    const raw=data[rootKey][name];
    const base=raw.command.split(/[\\/]/).pop().toLowerCase();
    if(opt.source==='windows' && opt.target!=='windows' && /^(cmd|cmd\.exe)$/.test(base)) {
     const a=raw.args||[];
     if(a[0]?.toLowerCase()==='/c' && a.length>=2 && /^(npx|npx\.cmd|node|node\.exe|uvx|uvx\.exe|python|python\.exe|python3)$/.test(a[1]) && !a.slice(2).some(v=>/[&|<>\r\n]/.test(v))) {
      s.command=a[1].replace(/\.(cmd|exe)$/,'').replace(/^python$/,'python3');s.args=s.args.slice(2);change(`${p}.command`,'Removed the Windows cmd wrapper; kept arguments separate.');
     } else issue('review',`${p}.command`,'Complex Windows shell command cannot be converted safely. Kept unchanged.');
    } else if(opt.source==='windows' && opt.target!=='windows' && /^(npx\.cmd|node\.exe|uvx\.exe|python(?:3)?\.exe|python)$/.test(base) && !/[\\/]/.test(raw.command)) {
     s.command=base.replace(/\.(cmd|exe)$/,'').replace(/^python$/,'python3');change(`${p}.command`,'Mapped a known cross-platform runtime command.');
    } else if (opt.source==='windows' && opt.target!=='windows' && /\.(exe|bat|cmd)$/i.test(raw.command) && !/^(cmd|cmd\.exe)$/.test(base)) issue('review',`${p}.command`,'Windows executable or script requires a target-platform replacement.');
    if (/powershell|pwsh|wsl|bash|sh\.exe/i.test(base) || /^(sh|zsh)$/.test(base)) issue('review',`${p}.command`,'Shell launcher requires manual review of syntax and dependencies.');
    if(opt.target==='windows' && /^(npx|npm)$/.test(s.command)) issue('review',`${p}.command`,'Windows launch behavior depends on the host. Confirm cmd /c or an absolute runtime path.');
    issue('info',p,'Install and verify the server runtime and package on the target device.');
   } else issue('info',p,'Remote endpoint preserved. Connection and authentication have not been tested.');
  }
  const targetKey=opt.format==='preserve'?rootKey:opt.format;
  if(targetKey!==rootKey) {
   if(data.inputs || data.sandbox || Object.values(data[rootKey]).some(s=>s.type || s.dev || s.sandboxEnabled || s.envFile)) issue('review',rootKey,'Host-specific fields were preserved. The destination app may not support them.');
   out[targetKey]=out[rootKey];delete out[rootKey];change(targetKey,'Changed the server map for the selected app format.');
  }
  if(targetKey==='servers') for(const [name,s] of Object.entries(out[targetKey])) if(!s.type) {s.type=s.command?'stdio':'http';change(`servers.${name}.type`,'Added the VS Code transport type.');}
  const encoded=JSON.stringify(out);
  if(targetKey!=='servers' && /\$\{(?:input:|workspaceFolder|env:)/.test(encoded)) issue('review',targetKey,'Host-specific variable references may not resolve in the target app.');
 }
 return {output:JSON.stringify(out,null,2),issues,changes,servers:rootKey?Object.keys(data[rootKey]).length:0,review:issues.some(i=>i.level==='review')};
}
