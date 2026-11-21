'use strict';
const assert=require('node:assert/strict'),S=require('../js/shanghai-rules'),R=require('../js/game-rules');
function parse(text){const tiles=[];for(const [,digits,suit] of text.matchAll(/(\d+)([mpsz])/g))for(const digit of digits){const order={m:0,p:9,s:18,z:27}[suit]+Number(digit)-1;tiles.push({...R.TILE_TYPES[order],order,id:tiles.length});}return tiles;}
function score(text,win,turn=1,context={}){const hand=parse(text),drawn=parse(win)[0];assert.equal(hand.length,14,text);const result=S.scoreHand(hand,drawn,turn,context);assert(result,text);assert(result.yaku.some(y=>y.name==='門前清自摸和'&&y.han===1),'mandatory menzen tsumo');return result;}
function names(r){return r.yaku.map(y=>y.name);}
function has(text,win,name,han){const r=score(text,win);assert(names(r).includes(name),`${text}: ${JSON.stringify(r)}`);if(han)assert.equal(r.han,han);return r;}
assert.equal(has('123456m23455p678s','1m','平和',2).score,200);
has('234m23455p234678s','2m','三色同順');
has('234m23455p234678s','2m','断么九');
has('123456789m234p55s','3p','一気通貫',3);
has('123m123p123789s55p','3m','三色同順',3);
has('123123m456p789s55z','3m','一盃口',2);
has('11223344556677m','7m','二盃口',11);
has('1122m3344p5566s77z','7z','七対子',3);
has('1199m1199p1199s11z','1z','混老頭',5);
has('111m222p333s789m55p','9m','三暗刻',3);
has('111m111p111s234m55p','2m','三色同刻');
has('123m555z456p789s22m','3m','役牌・白',2);
has('123m555666z77z456p','3m','小三元',5);
has('123m789p111z999s11p','3m','混全帯幺九',3);
has('123m789p111s999s11p','3m','純全帯幺九',4);
has('123123456m555z22m','6m','混一色');
assert(!names(score('123456m234p678s55z','1m')).includes('平和'),'dragon pair is valued');
assert(names(score('123456m234p678s11z','1m')).includes('平和'),'no seat/round wind in solo mode');
const yakuman=[
 ['123m555666777z22p','1m','大三元',1],
 ['111m222p333s444z55p','1m','四暗刻',1],
 ['111m222p333s444z55p','5p','四暗刻単騎',2],
 ['19m19p19s1234567z1m','1m','国士無双十三面待ち',2],
 ['19m19p19s1234567z1m','9m','国士無双',1],
 ['1112345678999m5m','5m','純正九蓮宝燈',2],
 ['1112345678999m5m','1m','九蓮宝燈',1],
 ['11223344556677z','7z','字一色',1],
 ['234234666888s66z','4s','緑一色',1],
 ['11122233344455z','5z','大四喜',5],
 ['111222333z44z123m','3m','小四喜',1],
 ['111999m111p999s11s','1m','清老頭',2],
];
for(const [hand,win,name,units] of yakuman){const r=has(hand,win,name);assert.equal(r.yakumanUnits,units,hand);assert.equal(r.score,1500*units);}
assert.equal(score('123456m23455p678s','1m',2).score,184);
assert.equal(score('123456m23455p678s','1m',9).score,Math.round(200*.92**8));
const last=score('123456m23455p678s','1m',1,{lastTile:true});assert(names(last).includes('海底摸月'));assert.equal(last.score,300);
assert.equal(S.scoreHand(parse('123m456p789s1122z'),parse('1z')[0],1),null,'13 tiles');
assert.equal(S.scoreHand(parse('11111m123p123s111z'),parse('1z')[0],1),null,'five copies');
assert.equal(S.scoreHand(parse('123456m23455p678s'),parse('1m')[0],0),null);
const layout=S.createLayout();assert.equal(layout.length,123);assert.equal(layout.filter(p=>p.z===0).length,81);assert.equal(layout.filter(p=>p.z===1).length,30);assert.equal(layout.filter(p=>p.z===2).length,12);
const at=(id,x,y,z=0)=>({id,x,y,z,active:true});
const row=[at(0,0,0),at(1,1,0),at(2,2,0)];assert(S.isFree(row,0));assert(!S.isFree(row,1));assert(S.isFree(row,2));
row.push(at(3,.5,0,1));assert(!S.isFree(row,0));assert(!S.isFree(row,1));assert(S.isFree(row,3));row[3].active=false;assert(S.isFree(row,0));row[0].active=false;assert(S.isFree(row,1));assert(!S.isFree(row,999));
assert(S.isFree([at(0,0,0),at(1,1,0,1)],0),'touching boundary is not overlap');
assert(!S.isFree([at(0,0,0),at(1,.5,.5,2)],0),'all higher levels block, including fractional overlap');
// Independent half-cell occupancy oracle checks fractional coverage and side contacts.
function oracleFree(board,t){
 if(!t.active)return false;
 const cells=[];for(const dx of [.25,.75])for(const dy of [.25,.75])cells.push([t.x+dx,t.y+dy]);
 const inside=(o,x,y)=>x>o.x&&x<o.x+1&&y>o.y&&y<o.y+1;
 const others=board.filter(o=>o.active&&o.id!==t.id);
 const above=others.some(o=>o.z>t.z&&cells.some(([x,y])=>inside(o,x,y)));
 const side=x=>others.some(o=>o.z===t.z&&[.25,.75].some(dy=>inside(o,x,t.y+dy)));
 return !above&&(!side(t.x-.001)||!side(t.x+1.001));
}
for(let seed=1;seed<=12;seed++){
 let x=seed;const rng=()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/2**32),game=S.newGame(rng);
 assert.equal(game.hand.length,13);assert.equal(game.board.length,123);assert.equal(new Set([...game.hand,...game.board].map(t=>t.id)).size,136);
 const counts=Array(34).fill(0);[...game.hand,...game.board].forEach(t=>counts[t.order]++);assert(counts.every(n=>n===4));
 for(let turn=1;turn<=123;turn++){
  for(const tile of game.board)assert.equal(S.isFree(game.board,tile.id),oracleFree(game.board,tile));
  const free=S.freeTiles(game.board);assert(free.length);const tile=free[Math.floor(rng()*free.length)];
  const blocked=game.board.find(t=>t.active&&!S.isFree(game.board,t.id));
  if(blocked){const before=JSON.stringify(game);assert(!S.takeTile(game,blocked.id));assert.equal(JSON.stringify(game),before);}
  assert(S.takeTile(game,tile.id));assert.equal(game.turn,turn);assert.equal(game.hand.length+1,14);
  assert(!S.takeTile(game,tile.id),'must discard before taking another');
  assert.equal(game.board.filter(t=>t.active).length+game.hand.length+1+game.discards.length,136);
  assert(S.discard(game,game.drawnTile.id));assert.equal(game.hand.length,13);
 }
 assert.equal(game.phase,'lost');assert.equal(game.discards.length,123);assert(!S.takeTile(game,game.board[0].id));
}
// Win is optional. On the last tile it remains available until the player discards.
for(const accept of [true,false]){
 const game=S.newGame();game.board.forEach(t=>t.active=false);
 const hand=parse('123456m23455p678s'),drawn=hand.shift();game.hand=hand;game.drawnTile=drawn;game.phase='discard';game.turn=1;
 assert(S.winningScore(game));
 if(accept){assert(S.win(game));assert.equal(game.phase,'won');assert(names(game.result).includes('海底摸月'));}
 else{assert(S.discard(game,drawn.id));assert.equal(game.phase,'lost');}
}
console.log('PASS: 123 tiles/3 layers, independent geometry oracle over 12 full games, all 136 physical tiles, legal turns/end states, optional last-tile win, normal yaku and best decomposition, yakuman/doubles/stacking, exact rounding');
