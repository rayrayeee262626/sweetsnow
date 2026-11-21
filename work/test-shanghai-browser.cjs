'use strict';
const {chromium,devices}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 for(const dimensions of [[320,568],[360,640],[393,727],[412,732],[412,839]]){
  const context=await browser.newContext({...devices['Pixel 7'],viewport:{width:dimensions[0],height:dimensions[1]}}),page=await context.newPage(),errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
  await page.goto(process.env.HAIJIN_SHANGHAI_URL||'http://127.0.0.1:4174/shanghai.html');
  await page.locator('#board .board-tile').last().waitFor();
  const initial=await page.evaluate(()=>({hand:shanghaiGame.hand.length,board:shanghaiGame.board.length,turn:shanghaiGame.turn,free:Shanghai.freeTiles(shanghaiGame.board).length}));
  assert.equal(initial.hand,13);assert.equal(initial.board,123);assert.equal(initial.turn,0);assert(initial.free>0);
  assert.equal(await page.locator('#board .board-tile').count(),123);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight+1),dimensions.join('x'));
  const stacked=await page.evaluate(()=>{const layers=[0,1,2].map(z=>Array.from(document.querySelectorAll(`#board [data-z="${z}"]`)).map(n=>Number(getComputedStyle(n).zIndex)));return Math.max(...layers[0])<Math.min(...layers[1])&&Math.max(...layers[1])<Math.min(...layers[2]);});assert(stacked,'upper layers actually paint above lower ones');
  // Blocked tiles cannot be taken, even if a click is dispatched directly.
  await page.locator('#board [data-free="false"]').first().dispatchEvent('click');assert.equal(await page.evaluate(()=>shanghaiGame.turn),0);
  const target=page.locator('#board [data-free="true"]').last();
  await target.tap();assert.equal(await page.evaluate(()=>shanghaiGame.turn),1);assert.equal(await page.locator('#hand .tile').count(),14);
  assert.equal(await page.locator('#board .board-tile').count(),122);
  await page.locator('#board [data-free="true"]').last().dispatchEvent('click');assert.equal(await page.evaluate(()=>shanghaiGame.turn),1,'must discard before taking another');
  await page.locator('#hand .drawn').tap();assert(await page.locator('#discard').isEnabled());await page.locator('#discard').tap();
  assert.equal(await page.locator('#hand .tile').count(),13);assert.equal(await page.evaluate(()=>shanghaiGame.discards.length),1);
  // Zoom/pan and dialogs are usable using touch alone.
  await page.locator('#zoom-in').tap();assert.equal(await page.evaluate(()=>zoom),1.25);await page.locator('#zoom-out').tap();
  await page.locator('#discards-button').tap();assert(await page.locator('#discards-dialog').isVisible());assert.equal(await page.locator('#discard-list .tile').count(),1);await page.locator('#discards-close').tap();
  await page.locator('#help').tap();assert(await page.locator('#help-dialog').isVisible());await page.locator('#help-close').tap();
  await page.locator('#restart').tap();await page.locator('#restart-cancel').tap();assert.equal(await page.evaluate(()=>shanghaiGame.turn),1);
  // Inject a deterministic first-draw pinfu hand; the score and result must agree.
  await page.evaluate(()=>{
   const orders=[1,2,3,4,5,10,11,12,13,13,23,24,25];
   shanghaiGame.hand=orders.map((order,id)=>({...MahjongRules.TILE_TYPES[order],order,id:id+1000}));
   shanghaiGame.drawnTile={...MahjongRules.TILE_TYPES[0],order:0,id:2000};shanghaiGame.turn=1;shanghaiGame.phase='discard';selectedDiscard=null;renderShanghai();
  });
  assert(await page.locator('#win').isVisible());assert.match(await page.locator('#win').textContent(),/200点/);
  // Players may keep playing rather than accepting a win.
  await page.locator('#hand .drawn').tap();await page.locator('#discard').tap();assert.equal(await page.evaluate(()=>shanghaiGame.phase),'take');
  await page.evaluate(()=>{shanghaiGame.hand=[1,2,3,4,5,10,11,12,13,13,23,24,25].map((order,id)=>({...MahjongRules.TILE_TYPES[order],order,id:id+1000}));shanghaiGame.drawnTile={...MahjongRules.TILE_TYPES[0],order:0,id:2000};shanghaiGame.turn=2;shanghaiGame.phase='discard';renderShanghai();});
  await page.locator('#win').tap();assert(await page.locator('#result-dialog').isVisible());assert.match(await page.locator('#result-score').textContent(),/184点/);assert.match(await page.locator('#result-yaku').textContent(),/門前清自摸和/);assert.match(await page.locator('#result-yaku').textContent(),/平和/);assert.match(await page.locator('#result-han').textContent(),/2翻 · 2巡目/);
  await page.locator('#result-again').tap();assert.equal(await page.evaluate(()=>shanghaiGame.turn),0);assert.equal(await page.locator('#board .board-tile').count(),123);
  // Last tile: cannot win, discard -> loss. It is impossible to take a second tile.
  await page.evaluate(()=>{
   shanghaiGame.board.forEach(t=>t.active=false);
   shanghaiGame.hand=[0,1,4,5,9,10,13,14,18,19,22,27,31].map((order,id)=>({...MahjongRules.TILE_TYPES[order],order,id:id+1000}));
   shanghaiGame.drawnTile={...MahjongRules.TILE_TYPES[33],order:33,id:2000};shanghaiGame.turn=123;shanghaiGame.phase='discard';renderShanghai();
  });
  assert(await page.locator('#win').isHidden());await page.locator('#hand .drawn').tap();await page.locator('#discard').tap();assert.equal(await page.evaluate(()=>shanghaiGame.phase),'lost');assert.match(await page.locator('#result-title').textContent(),/和了ならず/);
  await page.locator('#result-again').tap();
  for(let step=0;step<5;step++){await page.locator('#board [data-free="true"]').last().tap();await page.locator('#hand .drawn').tap();await page.locator('#hand .drawn').tap();}
  assert.equal(await page.evaluate(()=>shanghaiGame.turn),5);
  if(dimensions[0]===393)await page.screenshot({path:'/workspace/haijin-shanghai/work/shanghai-android.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);await context.close();
 }
 await browser.close();console.log('PASS: Android Pixel 7 touch emulation at 5 sizes; 123 tiles, stacking, blocked taps, draw/discard lock, optional win, score/yaku/turn, last-tile loss, zoom, dialogs, replay; no JS or asset failures');
})().catch(e=>{console.error(e);process.exit(1)});
