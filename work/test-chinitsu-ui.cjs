const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
class Element{
 constructor(){this.hidden=false;this.children=[];this.style={};this.dataset={};this.handlers={};this.attributes={};this.classList={add(){}};this.textContent="";}
 addEventListener(e,f){this.handlers[e]=f;}append(...x){this.children.push(...x);}replaceChildren(...x){this.children=x;}setAttribute(k,v){this.attributes[k]=v;}focus(){}click(){return this.handlers.click?.();}
}
const els={},document={querySelector:id=>els[id]??=new Element(),createElement:()=>new Element()},R=require("../js/game-rules.js");
const ctx=vm.createContext({document,window:{MahjongRules:R,TileAssets:require("../js/tile-assets.js"),ResultShare:require("../js/result-share.js")}});
vm.runInContext(fs.readFileSync(path.join(__dirname,"../js/app.js"),"utf8"),ctx);
const run=s=>vm.runInContext(s,ctx);
els["#chinitsu-start-button"].click();
assert.match(els["#mode-label"].textContent,/清一色108枚/);assert.equal(els["#discards"].children.length,1);assert.equal(els["#discards"].children[0].children.length,9);
for(let n=0;n<=12;n++){run('gameState.discards=Rules.createWall("chinitsu").slice(0,'+n+');render()');assert.equal(els["#discards"].children[0].children[0].children[1].textContent,"×"+n);}
run('gameState.hand=Rules.createWall("chinitsu").slice(0,12).concat({...Rules.TILE_TYPES[1],order:1,id:1000});gameState.drawnTile={...Rules.TILE_TYPES[8],order:8,id:1001};render()');
assert.equal(els["#kan-buttons"].children.length,0);
run('Rules.discardDrawn(gameState);render()');
assert(!els["#tenpai-panel"].hidden);assert.equal(els["#waits"].children.length,2);assert.equal(els["#history-list"]?.children.length,undefined);assert.equal(els["#tenpai-history-list"].children.length,1);
run('gameState.wall=[];Rules.advanceAfterTenpai(gameState);render()');assert(!els["#result-screen"].hidden);assert.equal(els["#result-tenpais"].textContent,1);els["#again-button"].click();assert(!els["#start-screen"].hidden);
// Canvas generation verifies mode labels and all history tile assets without posting externally.
const texts=[],gradient={addColorStop(){}},draw=new Proxy({fillText:s=>texts.push(s),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]??(()=>{})});
const canvas={getContext:()=>draw},shareBox={module:{exports:{}},document:{createElement:()=>canvas},Image:class{set src(v){this.onload();}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../js/result-share.js"),"utf8"),shareBox);
(async()=>{await shareBox.module.exports.generateCanvas({mode:"chinitsu",tenpais:1,tenpaiHistory:[{number:1,hand:R.createWall("chinitsu").slice(0,13),waits:[0,1,2,3,4,5,6,7,8]}]},R,require("../js/tile-assets.js"));assert(texts.some(s=>s.includes("清一色108枚")));assert.equal(canvas.width,1080);assert.equal(canvas.height,1350);console.log("PASS: chinitsu start, 9 used types and 0..12 labels, no kan UI, tenpai/history/results/title, share canvas.");})();

