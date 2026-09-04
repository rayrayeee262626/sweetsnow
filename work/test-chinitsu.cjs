const assert=require("node:assert/strict"),vm=require("node:vm"),cp=require("node:child_process"),path=require("node:path");
const R=require("../js/game-rules.js"),share=require("../js/result-share.js");
const root=path.resolve(__dirname,".."),box={module:{exports:{}}};
vm.runInNewContext(cp.execFileSync("git",["-c","safe.directory="+root.replaceAll("\\","/"),"show","7934f65:js/game-rules.js"],{cwd:root,encoding:"utf8"}),box);
const old=box.module.exports,plain=x=>JSON.parse(JSON.stringify(x));
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const tiles=digits=>[...digits.replaceAll(" ","")].map((n,id)=>({...R.TILE_TYPES[+n-1],order:+n-1,id}));
const waits=digits=>R.getTenpaiWaits(tiles(digits),0,"chinitsu");
assert.deepEqual(waits("111 111 111 111 2"),[1,2]);
assert.deepEqual(waits("123 123 123 123 4"),[0,1,2,3,4]);
for(const s of ["11112233445566","11111122334455","11111111223344","11111111111122"]){
 assert.equal(R.getWinningType(tiles(s),0,"chinitsu"),"七対子");
 for(const mode of ["yonma","sanma"])assert.notEqual(R.getWinningType(tiles(s),0,mode),"七対子");
 const hand=s.slice(0,-1);assert(waits(hand).includes(+s.at(-1)-1));
}
assert.deepEqual(R.getTenpaiWaits(R.ORPHAN_INDICES.map(order=>({...R.TILE_TYPES[order],order})),0,"chinitsu"),[]);
const wall=R.createWall("chinitsu");assert.equal(wall.length,108);assert.equal(new Set(wall.map(t=>t.id)).size,108);
assert.deepEqual(R.modeOrders("chinitsu"),[0,1,2,3,4,5,6,7,8]);
for(let i=0;i<9;i++)assert.equal(wall.filter(t=>t.order===i).length,12);
function step(api,s,n){if(s.pendingTenpai)return api.advanceAfterTenpai(s);const k=api.getKanOptions(s);if(k.length)return api.declareKan(s,k[0]);return n%2?api.discardFromHand(s,n%s.hand.length):api.discardDrawn(s);}
for(const mode of ["yonma","sanma"])for(let seed=1;seed<=100;seed++){
 const a=old.newGame(rng(seed),mode),b=R.newGame(rng(seed),mode);
 for(let n=0;!a.finished;n++){assert.deepEqual(plain(b),plain(a));assert.equal(step(R,b,n),step(old,a,n));assert(n<200);}
 assert.deepEqual(plain(b),plain(a));
}
for(const mode of ["yonma","sanma","chinitsu"]){
 const s=R.newGame(rng(3),mode);s.hand=tiles("1111234567899");s.drawnTile=tiles("2")[0];
 if(mode==="chinitsu"){const before=JSON.stringify(s);assert.deepEqual(R.getKanOptions(s),[]);assert.equal(R.declareKan(s,0),false);assert.equal(JSON.stringify(s),before);}
 else assert(R.declareKan(s,0));
}
for(let seed=1;seed<=100;seed++){
 const s=R.newGame(rng(seed),"chinitsu");assert.equal(s.hand.length,13);assert.equal(s.wall.length,94);
 for(let n=0;!s.finished;n++){
  assert.equal(R.physicalTileCount(s),108);assert.equal(s.kans.length,0);
  assert([...s.wall,...s.hand,...s.discards,...s.removedTiles,...(s.drawnTile?[s.drawnTile]:[])].every(t=>t.order<9));
  assert(s.waits.every(i=>i<9));assert(R.usedTileCounts(s).every(n=>n<=12));
  for(const h of s.tenpaiHistory){assert.equal(h.hand.length,13);assert(h.waits.every(i=>i<9));}
  step(R,s,n);assert(n<200);
 }
 assert.equal(s.tenpais,s.tenpaiHistory.length);assert.equal(R.physicalTileCount(s),108);
}
const exhausted=R.newGame(rng(9),"chinitsu");exhausted.hand=tiles("1111111111112");exhausted.drawnTile=tiles("9")[0];exhausted.removedTiles=tiles("222222222222");
R.discardDrawn(exhausted);assert(exhausted.pendingTenpai);assert.deepEqual(exhausted.waits,[1,2]);
for(let n=0;n<=12;n++){const s={discards:tiles("1".repeat(n))};assert.equal(R.usedTileCounts(s)[0],n);}
assert(share.postText(3,"chinitsu").includes("清一色108枚"));
// Independent oracle: enumerate every multiset of four melds + pair and seven pairs.
const winning=new Set(),c=Array(9).fill(0),melds=[];
for(let i=0;i<9;i++){const m=Array(9).fill(0);m[i]=3;melds.push(m);}
for(let i=0;i<7;i++){const m=Array(9).fill(0);m[i]=m[i+1]=m[i+2]=1;melds.push(m);}
function enumerate(left,start){if(!left){for(let i=0;i<9;i++){c[i]+=2;winning.add(c.join(","));c[i]-=2;}return;}
 for(let j=start;j<melds.length;j++){for(let i=0;i<9;i++)c[i]+=melds[j][i];enumerate(left-1,j);for(let i=0;i<9;i++)c[i]-=melds[j][i];}}
enumerate(4,0);
function pairs(left,start){if(!left){winning.add(c.join(","));return;}for(let i=start;i<9;i++){c[i]+=2;pairs(left-1,i);c[i]-=2;}}pairs(7,0);
const rand=rng(123);
for(let n=0;n<5000;n++){
 const hand=R.shuffle(R.createWall("chinitsu"),rand).slice(0,13),counts=Array(9).fill(0);for(const t of hand)counts[t.order]++;
 const expected=[];for(let i=0;i<9;i++){counts[i]++;if(winning.has(counts.join(",")))expected.push(i);counts[i]--;}
 assert.deepEqual(R.getTenpaiWaits(hand,0,"chinitsu"),expected);
}
console.log("PASS: examples, repeated pairs, 5000 independent-oracle wait comparisons, 200 old-mode full-game regressions, 100 chinitsu full games, 108/12 counts, used counts, exhausted waits, kans, sharing.");
