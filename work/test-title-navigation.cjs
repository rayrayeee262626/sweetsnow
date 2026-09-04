const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
class Element {
  constructor(){this.hidden=false;this.children=[];this.style={};this.dataset={};this.handlers={};this.classList={add(){}};this.textContent="";this.returnValue="";}
  addEventListener(event,fn){this.handlers[event]=fn;}
  append(...els){this.children.push(...els);}
  replaceChildren(...els){this.children=els;}
  setAttribute(){}
  focus(){}
  showModal(){this.open=true;}
  close(value){this.open=false;this.returnValue=value;this.handlers.close();}
  click(){this.handlers.click?.();}
}
const els={};const document={querySelector:id=>els[id]??=(new Element()),createElement:()=>new Element()};
const context=vm.createContext({document,window:{MahjongRules:require("../js/game-rules.js"),TileAssets:require("../js/tile-assets.js"),ResultShare:require("../js/result-share.js")}});
vm.runInContext(fs.readFileSync(require("node:path").join(__dirname,"../js/app.js"),"utf8"),context);
const read=code=>vm.runInContext(code,context);
for(const [button,mode,total] of [["#start-button","yonma",136],["#sanma-start-button","sanma",108]]){
  els[button].click();
  assert.equal(read("gameState.mode"),mode);
  assert.equal(read("Rules.physicalTileCount(gameState)"),total);
  read('chooseTile("drawn",0)');
  const before=read("JSON.stringify({gameState,selectedTile})");
  els["#restart-button"].click();
  assert(els["#return-title-dialog"].open);
  els["#return-title-dialog"].close("no");
  assert.equal(read("JSON.stringify({gameState,selectedTile})"),before);
  els["#restart-button"].click();els["#return-title-dialog"].close("");
  assert.equal(read("JSON.stringify({gameState,selectedTile})"),before);
  els["#restart-button"].click();els["#return-title-dialog"].close("yes");
  assert.equal(read("gameState"),null);assert(!els["#start-screen"].hidden);assert(els["#play-screen"].hidden);
  els[button].click();read("gameState.finished=true;render()");
  assert(!els["#result-screen"].hidden);
  els["#again-button"].click();
  assert(!els["#start-screen"].hidden);assert(els["#result-screen"].hidden);assert(els["#history-section"].hidden);
}
console.log("PASS: both start modes; No/Escape unchanged; Yes returns to title; results replay returns without confirmation.");
