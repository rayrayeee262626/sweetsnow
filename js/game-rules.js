(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MahjongRules = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const TILE_TYPES = [
    ...Array.from({length:9},(_,i)=>({suit:"man",value:i+1})),
    ...Array.from({length:9},(_,i)=>({suit:"pin",value:i+1})),
    ...Array.from({length:9},(_,i)=>({suit:"sou",value:i+1})),
    ...["東","南","西","北","白","發","中"].map(value=>({suit:"honor",value})),
  ];
  const ORPHAN_INDICES=[0,8,9,17,18,26,27,28,29,30,31,32,33];
  function createWall(){let id=0;return TILE_TYPES.flatMap((type,order)=>Array.from({length:4},()=>({...type,order,id:id++})));}
  function shuffle(tiles,random=Math.random){for(let i=tiles.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[tiles[i],tiles[j]]=[tiles[j],tiles[i]];}return tiles;}
  function countsFromTiles(tiles){const counts=Array(34).fill(0);for(const tile of tiles)counts[tile.order]++;return counts;}
  function isSevenPairs(c){return c.filter(n=>n===2).length===7&&c.every(n=>n===0||n===2);}
  function isThirteenOrphans(c){const set=new Set(ORPHAN_INDICES);return !c.some((n,i)=>n>0&&!set.has(i))&&ORPHAN_INDICES.every(i=>c[i]>=1)&&ORPHAN_INDICES.some(i=>c[i]===2);}
  function canFormMelds(c,left){if(left===0)return c.every(n=>n===0);const first=c.findIndex(n=>n>0);if(first<0)return false;if(c[first]>=3){c[first]-=3;if(canFormMelds(c,left-1)){c[first]+=3;return true;}c[first]+=3;}if(first<27&&first%9<=6&&c[first+1]>0&&c[first+2]>0){c[first]--;c[first+1]--;c[first+2]--;if(canFormMelds(c,left-1)){c[first]++;c[first+1]++;c[first+2]++;return true;}c[first]++;c[first+1]++;c[first+2]++;}return false;}
  function isStandardHand(c,melds=4){for(let pair=0;pair<34;pair++){if(c[pair]<2)continue;const rest=c.slice();rest[pair]-=2;if(canFormMelds(rest,melds))return true;}return false;}
  function getWinningType(tiles,kans=0){if(!Array.isArray(tiles)||kans<0||kans>4||tiles.length!==14-kans*3)return null;const c=countsFromTiles(tiles);if(c.some(n=>n>4))return null;if(kans===0&&isThirteenOrphans(c))return"国士無双";if(kans===0&&isSevenPairs(c))return"七対子";return isStandardHand(c,4-kans)?"通常形":null;}
  function getTenpaiWaits(tiles,kans=0){if(!Array.isArray(tiles)||tiles.length!==13-kans*3)return[];return TILE_TYPES.flatMap((type,order)=>getWinningType([...tiles,{...type,order,id:-1}],kans)?[order]:[]);}
  function sortHand(hand){hand.sort((a,b)=>a.order-b.order||a.id-b.id);}
  function draw(state){state.drawnTile=state.wall.pop()??null;if(!state.drawnTile){state.finished=true;state.finishReason="wall-empty";}}
  function dealRound(state){state.kans=[];state.hand=state.wall.splice(-13);state.turn=0;state.pendingTenpai=false;state.waits=[];sortHand(state.hand);draw(state);}
  function newGame(random=Math.random){const state={wall:shuffle(createWall(),random),hand:[],drawnTile:null,discards:[],kans:[],removedTiles:[],tenpaiHistory:[],tenpais:0,totalKans:0,turn:0,pendingTenpai:false,waits:[],finished:false,finishReason:null};dealRound(state);return state;}
  function resolveDiscard(state){state.turn++;state.waits=getTenpaiWaits(state.hand,(state.kans||[]).length);if(state.waits.length){state.tenpais++;state.pendingTenpai=true;const historyHand=[...state.hand,...state.kans.flatMap(kan=>kan.slice(0,3))].sort((a,b)=>a.order-b.order||a.id-b.id);(state.tenpaiHistory??=[]).push({number:state.tenpais,hand:historyHand,waits:state.waits.slice()});state.removedTiles.push(...state.kans.flat(),...state.hand);state.hand=[];state.kans=[];return;}if(state.wall.length>0)draw(state);else{state.finished=true;state.finishReason="wall-empty";}}
  function discardFromHand(state,index){if(state.finished||state.pendingTenpai||!state.drawnTile||index<0||index>=state.hand.length)return false;const discarded=state.hand[index];state.hand.splice(index,1,state.drawnTile);state.drawnTile=null;state.discards.push(discarded);sortHand(state.hand);resolveDiscard(state);return true;}
  function discardDrawn(state){if(state.finished||state.pendingTenpai||!state.drawnTile)return false;state.discards.push(state.drawnTile);state.drawnTile=null;resolveDiscard(state);return true;}
  function getKanOptions(state){if(state.finished||state.pendingTenpai||!state.drawnTile||state.wall.length===0)return[];const c=countsFromTiles([...state.hand,state.drawnTile]);return c.flatMap((n,order)=>n===4?[order]:[]);}
  function declareKan(state,order){if(!getKanOptions(state).includes(order))return false;const concealed=[...state.hand,state.drawnTile];const kan=concealed.filter(t=>t.order===order);state.hand=concealed.filter(t=>t.order!==order);state.drawnTile=null;state.kans.push(kan);state.totalKans++;sortHand(state.hand);draw(state);return true;}
  function advanceAfterTenpai(state){if(!state.pendingTenpai||state.finished)return false;state.pendingTenpai=false;state.waits=[];if(state.wall.length<13){state.finished=true;state.finishReason="not-enough-for-deal";return true;}dealRound(state);return true;}
  function usedTiles(state){return[...(state.discards||[]),...(state.removedTiles||[]),...(state.kans||[]).flat()];}
  function usedTileCounts(state){return countsFromTiles(usedTiles(state));}
  function usedTileCount(state){return usedTiles(state).length;}
  function physicalTileCount(state){return(state.wall?.length||0)+(state.hand?.length||0)+(state.drawnTile?1:0)+usedTileCount(state);}
  return{TILE_TYPES,ORPHAN_INDICES,createWall,shuffle,getWinningType,getTenpaiWaits,newGame,discardFromHand,discardDrawn,getKanOptions,declareKan,advanceAfterTenpai,usedTileCounts,usedTileCount,physicalTileCount};
});
