const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const cp = require("node:child_process");
const R = require("../js/game-rules.js");
const share = require("../js/result-share.js");
const root = require("node:path").resolve(__dirname, "..");
function baseline(file) {
  const source = cp.execFileSync("git", ["-c", "safe.directory=" + root.replaceAll("\\", "/"), "show", "HEAD:" + file], {cwd:root,encoding:"utf8"});
  const box = {module:{exports:{}}};
  vm.runInNewContext(source,box);
  return box.module.exports;
}
const old = baseline("js/game-rules.js");
const oldShare = baseline("js/result-share.js");
const plain = s => JSON.parse(JSON.stringify(s, (k,v) => k === "mode" ? undefined : v));
const rng = seed => () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function step(api,s,n) {
  if(s.pendingTenpai) return api.advanceAfterTenpai(s);
  const kans=api.getKanOptions(s);
  if(kans.length) return api.declareKan(s,kans[0]);
  return n%2 ? api.discardFromHand(s,n%s.hand.length) : api.discardDrawn(s);
}
for(let seed=1;seed<=100;seed++){
  const a=old.newGame(rng(seed)), b=R.newGame(rng(seed));
  for(let n=0;!a.finished;n++){
    assert.deepEqual(plain(b),plain(a));
    assert.equal(step(R,b,n),step(old,a,n));
    assert(n<200);
  }
  assert.deepEqual(plain(b),plain(a));
}
assert.equal(R.createWall().length,136);
assert.equal(R.createWall("sanma").length,108);
assert.equal(new Set(R.createWall("sanma").map(t=>t.order)).size,27);
for(const order of R.modeOrders("sanma")) assert.equal(R.createWall("sanma").filter(t=>t.order===order).length,4);
const allowed = t => t.order===0 || t.order>=8;
for(let seed=1;seed<=100;seed++){
  const s=R.newGame(rng(seed),"sanma");
  assert.equal(s.wall.length,94);
  for(let n=0;!s.finished;n++){
    assert.equal(R.physicalTileCount(s),108);
    assert([...s.wall,...s.hand,...s.discards,...s.removedTiles,...s.kans.flat(),...(s.drawnTile?[s.drawnTile]:[])].every(allowed));
    assert(s.waits.every(order=>allowed({order})));
    assert(s.tenpaiHistory.every(h=>h.hand.every(allowed)&&h.waits.every(order=>allowed({order}))));
    step(R,s,n); assert(n<200);
  }
  assert.equal(R.physicalTileCount(s),108);
}
function tiles(orders){return orders.map((order,id)=>({...R.TILE_TYPES[order],order,id}));}
for(let order=1;order<=7;order++){
  const hand=tiles([9,10,11,18,19,20,27,27,27,28,28,28,order]);
  assert(R.getTenpaiWaits(hand).includes(order));
  assert(!R.getTenpaiWaits(hand,0,"sanma").includes(order));
}
const hand=tiles([10,11,18,19,20,21,22,23,27,27,27,33,33]);
const state=R.newGame(rng(3),"sanma");
state.hand=hand; state.drawnTile=tiles([30])[0];
state.removedTiles=tiles([9,9,9,9,12,12,12,12]);
R.discardDrawn(state);
assert(state.pendingTenpai);
assert(state.waits.includes(9)&&state.waits.includes(12));
assert.equal(R.usedTileCounts(state)[9],4);
const kan=R.newGame(rng(4),"sanma");
kan.hand=tiles([0,0,0,0,9,10,11,18,19,20,27,27,28]); kan.drawnTile=tiles([29])[0];
assert(R.declareKan(kan,0)); assert.equal(kan.kans[0].length,4); assert.equal(kan.hand.length,10);
assert(R.getTenpaiWaits(tiles(R.ORPHAN_INDICES),0,"sanma").length===13);
assert.equal(share.postText(4),oldShare.postText(4));
assert(share.postText(4,"sanma").includes("三麻108枚"));
console.log("PASS: 100 full 136-mode regressions; 100 full sanma games; 108 tiles/27 types; excluded waits; exhausted waits; kan; kokushi; sharing.");
