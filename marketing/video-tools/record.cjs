const { chromium } = require('playwright');
const OUT = process.argv[2];
const BASE = 'http://localhost:3000';
const ROOM = 'PARTY-' + Math.floor(Math.random()*900+100);

const SONGS = {
  'bohemian': [
    { videoId: 'demoBohem01', title: 'Bohemian Rhapsody (Karaoke Version)', author: 'Sing King Karaoke', duration: '5:58', c1:'#7c3aed', c2:'#db2777' },
    { videoId: 'demoBohem02', title: 'Bohemian Rhapsody - Queen | Lyrics', author: 'KaraFun', duration: '6:03', c1:'#0ea5e9', c2:'#6366f1' },
    { videoId: 'demoBohem03', title: 'Bohemian Rhapsody Karaoke HD', author: 'Party Tyme', duration: '5:55', c1:'#f59e0b', c2:'#ef4444' },
  ],
  'dancing': [
    { videoId: 'demoDance01', title: 'Dancing Queen (Karaoke Version)', author: 'Sing King Karaoke', duration: '3:52', c1:'#ec4899', c2:'#f59e0b' },
    { videoId: 'demoDance02', title: 'Dancing Queen - ABBA | Lyrics', author: 'KaraFun', duration: '3:49', c1:'#06b6d4', c2:'#a855f7' },
  ],
};
const byId = {};
for (const k in SONGS) for (const s of SONGS[k]) byId[s.videoId] = s;

function thumbSvg(s) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${s.c1}"/><stop offset="1" stop-color="${s.c2}"/></linearGradient></defs>
<rect width="480" height="360" fill="url(#g)"/><text x="240" y="170" font-family="Inter,Arial" font-weight="900" font-size="54" fill="white" text-anchor="middle">🎤</text>
<text x="240" y="240" font-family="Inter,Arial" font-weight="800" font-size="34" fill="white" text-anchor="middle">KARAOKE</text></svg>`;
}

// Stand-in for the YouTube IFrame API (YouTube is not reachable from the recording sandbox)
const FAKE_YT = `
(function(){
  var META = ${JSON.stringify(byId)};
  function Player(el, opts){
    var self=this; var node = typeof el==='string'?document.getElementById(el):el;
    var wrap=document.createElement('div');
    wrap.style.cssText='width:100%;height:100%;position:absolute;inset:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Outfit,Inter,sans-serif;color:#fff;background:radial-gradient(circle at 30% 30%,#4c1d95,#0b0f1d 70%)';
    node.replaceWith(wrap); wrap.id = typeof el==='string'?el:'';
    var t=0, dur=30, playing=false, vid=opts.videoId, last=Date.now(), muted=false;
    var LINES=['Turn the lights down low','Everybody sing along','This is our song tonight','Louder, louder, one more time'];
    function render(){
      var m=META[vid]||{title:'Karaoke'}; var i=Math.floor(t/1.6)%LINES.length;
      wrap.innerHTML='<div style="position:absolute;top:22px;left:28px;font-size:15px;opacity:.7;letter-spacing:.1em">♪ '+m.title.toUpperCase()+'</div>'+
        '<div style="font-size:44px;font-weight:800;text-shadow:0 0 24px #db2777;margin-bottom:18px">'+LINES[i]+'</div>'+
        '<div style="font-size:30px;font-weight:600;opacity:.45">'+LINES[(i+1)%LINES.length]+'</div>';
    }
    function fire(s){ opts.events&&opts.events.onStateChange&&opts.events.onStateChange({data:s,target:self}); }
    setInterval(function(){ var now=Date.now(); if(playing){ t+= (now-last)/1000; if(t>=dur){t=dur;playing=false;fire(0);} } last=now; render(); }, 200);
    var START=21;
    this.playVideo=function(){ if(!playing){playing=true; if(t<START)t=START; fire(1);} };
    this.pauseVideo=function(){ playing=false; fire(2); };
    this.stopVideo=function(){ playing=false; };
    this.seekTo=function(s){ t=s; };
    this.loadVideoById=function(v){ vid=v; t=START; playing=true; fire(1); };
    this.cueVideoById=function(v){ vid=v; t=0; playing=false; };
    this.setVolume=function(){}; this.getVolume=function(){return 80;};
    this.mute=function(){muted=true}; this.unMute=function(){muted=false}; this.isMuted=function(){return muted};
    this.getCurrentTime=function(){return t}; this.getDuration=function(){return dur};
    this.getPlayerState=function(){return playing?1:2}; this.destroy=function(){};
    render();
    setTimeout(function(){ opts.events&&opts.events.onReady&&opts.events.onReady({target:self}); },300);
  }
  window.YT={Player:Player,PlayerState:{UNSTARTED:-1,ENDED:0,PLAYING:1,PAUSED:2,BUFFERING:3,CUED:5}};
  setTimeout(function(){ window.onYouTubeIframeAPIReady&&window.onYouTubeIframeAPIReady(); },50);
})();`;

async function stub(ctx) {
  await ctx.route(/youtube\.com|ytimg|googlevideo|doubleclick/, r => r.abort());
  await ctx.route('https://www.youtube.com/iframe_api', r => r.fulfill({ contentType: 'text/javascript', body: FAKE_YT }));
  await ctx.route(/i\.ytimg\.com\/vi\/([^/]+)\//, r => {
    const id = r.request().url().match(/vi\/([^/]+)\//)[1];
    const s = byId[id] || { c1:'#334155', c2:'#0f172a' };
    r.fulfill({ contentType: 'image/svg+xml', body: thumbSvg(s) });
  });
  await ctx.route(/\/api\/search-youtube/, r => {
    const q = decodeURIComponent(r.request().url().split('q=')[1] || '').toLowerCase();
    const key = q.includes('danc') ? 'dancing' : 'bohemian';
    const results = SONGS[key].map(s => ({ videoId: s.videoId, title: s.title, author: s.author, duration: s.duration,
      thumbnailUrl: `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg`, isEmbeddable: true }));
    setTimeout(() => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ results }) }), 600);
  });
  await ctx.route(/\/api\/youtube-suggestions/, r => r.fulfill({ contentType: 'application/json', body: '{"suggestions":[]}' }));
}

(async () => {
  const b = await chromium.launch();
  const T0 = Date.now();
  const log = [];
  const mark = (name) => { const t = (Date.now()-T0)/1000; log.push({name, t}); console.log(t.toFixed(2), name); };

  const tvCtx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  const tvStart = (Date.now()-T0)/1000;
  await stub(tvCtx);
  const phCtx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const phStart = (Date.now()-T0)/1000;
  await stub(phCtx);

  const tv = await tvCtx.newPage();
  const ph = await phCtx.newPage();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const fs = require('fs');
  async function cast(page, name, w, h) {
    const dir = OUT + '/' + name; fs.mkdirSync(dir, { recursive: true });
    const cdp = await page.context().newCDPSession(page);
    const frames = []; let n = 0;
    cdp.on('Page.screencastFrame', async f => {
      const file = `${dir}/${String(n++).padStart(6,'0')}.jpg`;
      fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
      frames.push({ file, t: f.metadata.timestamp - T0/1000 });
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(()=>{});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: w, maxHeight: h, everyNthFrame: 1 });
    return { frames, cdp };
  }
  const tvCast = await cast(tv, 'tvf', 1920, 1080);
  const phCast = await cast(ph, 'phf', 780, 1688);

  await tv.goto(`${BASE}/?role=host&room=${ROOM}`);
  await ph.goto(`${BASE}/?role=guest&room=${ROOM}`);
  await sleep(2500);
  mark('tv_tap_screen');
  await sleep(2000);
  await tv.getByText('TAP TO START THE PARTY', { exact: false }).click();
  mark('tv_idle_qr');
  await sleep(4500);

  // Guest 1 queues a song
  mark('ph_type_name');
  await ph.getByPlaceholder('e.g. Sarah').tap();
  await ph.getByPlaceholder('e.g. Sarah').pressSequentially('Jess', { delay: 140 });
  await sleep(500);
  mark('ph_search');
  await ph.getByPlaceholder('Search song or artist...').tap();
  await ph.getByPlaceholder('Search song or artist...').pressSequentially('Bohemian Rhapsody', { delay: 90 });
  await sleep(400);
  await ph.getByRole('button', { name: /^Search$/ }).tap();
  await sleep(2200);
  mark('ph_queue_1');
  await ph.locator('button.bg-sky-600', { hasText: 'Queue' }).first().tap();
  mark('tv_intro_1');
  await sleep(1500);

  // Guest 2 queues next song while intro counts down
  await ph.getByPlaceholder('e.g. Sarah').fill('');
  await ph.getByPlaceholder('e.g. Sarah').pressSequentially('Carlo', { delay: 110 });
  await ph.getByPlaceholder('Search song or artist...').fill('');
  await ph.getByPlaceholder('Search song or artist...').pressSequentially('Dancing Queen', { delay: 70 });
  await ph.getByRole('button', { name: /^Search$/ }).tap();
  await sleep(1800);
  await ph.locator('button.bg-sky-600', { hasText: 'Queue' }).first().tap();
  mark('ph_queue_2');
  await sleep(2500);
  mark('tv_playing_1');
  await ph.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);
  // Crowd vote
  try { await ph.getByRole('button', { name: /95/ }).first().tap(); mark('ph_vote'); } catch (e) { console.log('vote fail', e.message); }
  await sleep(1500);
  try { await ph.getByRole('button', { name: /Cheer TV/ }).tap(); mark('ph_cheer'); } catch (e) { console.log('cheer fail', e.message); }

  // wait for score screen
  await tv.waitForSelector('text=/RANK|SCORE|Score/i', { timeout: 30000 }).catch(()=>{});
  mark('tv_score_maybe');
  await sleep(33000);
  mark('tv_after_score');
  // theme change from phone
  try {
    await ph.getByRole('button', { name: /TV Theme/ }).tap();
    await sleep(1200);
    mark('ph_theme_menu');
    await ph.getByText('Neon Tokyo').tap();
    mark('theme_neon');
    await sleep(3000);
    await ph.getByText('Disco Club').tap();
    mark('theme_disco');
    await sleep(3000);
    await ph.getByText('Cyber Matrix').tap();
    mark('theme_cyber');
    await sleep(3000);
  } catch (e) { console.log('theme fail', e.message); }
  await sleep(4000);
  mark('end');
  await tv.screenshot({ path: OUT + '/tv_end.png' });
  await ph.screenshot({ path: OUT + '/ph_end.png' });
  fs.writeFileSync(OUT + '/tvf.json', JSON.stringify(tvCast.frames));
  fs.writeFileSync(OUT + '/phf.json', JSON.stringify(phCast.frames));
  await tvCtx.close(); await phCtx.close(); await b.close();
  require('fs').writeFileSync(OUT + '/timeline.json', JSON.stringify({ tvStart, phStart, log }, null, 1));
})();
