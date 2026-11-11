const { chromium } = require('playwright');
const fs = require('fs');
const dir = process.argv[2];
const scenes = JSON.parse(fs.readFileSync(dir + '/scenes.json'));
const css = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;900&family=Righteous&display=swap');
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1920px;font-family:Outfit,sans-serif;color:#fff;overflow:hidden;
 background:radial-gradient(circle at 20% 10%,#5b21b6 0%,transparent 45%),radial-gradient(circle at 90% 85%,#0e7490 0%,transparent 45%),#0b0f1d;}
.top{position:absolute;top:150px;left:0;right:0;text-align:center;padding:0 60px}
.step{display:inline-block;padding:10px 26px;border-radius:999px;background:linear-gradient(90deg,#0ea5e9,#d946ef);font-weight:900;font-size:34px;letter-spacing:.12em;margin-bottom:28px}
h1{font-weight:900;font-size:92px;line-height:1.02;letter-spacing:-.01em;text-shadow:0 6px 30px rgba(0,0,0,.5)}
h1 span{background:linear-gradient(90deg,#f0abfc,#67e8f9);-webkit-background-clip:text;color:transparent}
.sub{margin-top:26px;font-size:44px;font-weight:500;color:#cbd5e1}
.brand{position:absolute;bottom:120px;left:0;right:0;text-align:center;font-family:Righteous;font-size:46px;opacity:.85}
.slot{position:absolute;border-radius:28px;box-shadow:0 0 0 6px #1e293b,0 0 80px rgba(217,70,239,.45)}
.tv{left:30px;width:1020px;height:574px;top:900px}
.phone{left:247px;width:586px;height:1268px;top:560px;border-radius:44px;box-shadow:0 0 0 14px #111827,0 0 0 16px #334155,0 0 80px rgba(14,165,233,.45)}
.cta{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.mic{font-size:170px}
.logo{font-family:Righteous;font-size:170px;line-height:1;margin:10px 0 40px}
.pills{display:flex;flex-direction:column;gap:22px;font-size:52px;font-weight:700}
.pills div{padding:14px 40px;border-radius:999px;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.18)}
.link{margin-top:70px;padding:26px 60px;border-radius:999px;background:linear-gradient(90deg,#0ea5e9,#d946ef);font-weight:900;font-size:60px;box-shadow:0 0 60px rgba(217,70,239,.6)}
`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const s of scenes) {
    let body;
    if (s.src === 'cta') {
      body = `<div class="cta"><div class="logo">PartyCue</div><div class="pills"><div>Free</div><div>No app download</div><div>Works on any TV</div></div><div class="link">Link in bio</div></div>`;
    } else {
      body = `<div class="top">${s.step ? `<div class="step">${s.step}</div><br>` : ''}<h1>${s.title}</h1>${s.sub ? `<div class="sub">${s.sub}</div>` : ''}</div>
      <div class="slot ${s.src}"></div>${s.src === 'tv' ? '<div class="brand">PartyCue</div>' : ''}`;
    }
    await p.setContent(`<html><head><style>${css}</style></head><body>${body}</body></html>`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${dir}/${s.id}.png` });
  }
  await b.close();
})();
