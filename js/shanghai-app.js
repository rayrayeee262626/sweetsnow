'use strict';
const Shanghai=window.ShanghaiRules,Assets=window.TileAssets;
const $=id=>document.getElementById(id);
let shanghaiGame=Shanghai.newGame(),selectedDiscard=null,zoom=1;
const tileName=t=>t.suit==='honor'?t.value:`${t.value}${{man:'萬',pin:'筒',sou:'索'}[t.suit]}`;
function tileElement(tile,tag='span'){
  const node=document.createElement(tag);node.className='tile';node.dataset.tileId=tile.id;
  node.setAttribute('aria-label',tileName(tile));
  const img=document.createElement('img');img.src=Assets.imagePath(tile);img.alt='';img.draggable=false;node.append(img);
  if(tag==='button')node.type='button';return node;
}
function sizeBoard(){
  const view=$('board-viewport');
  const unit=Math.max(10,Math.min((view.clientWidth-18)/9.3,(view.clientHeight-22)/12))*zoom;
  const height=unit*4/3;
  $('board').style.width=`${unit*9+16}px`;$('board').style.height=`${height*9+20}px`;
  $('board').style.setProperty('--tile-width',`${unit}px`);$('board').style.setProperty('--tile-height',`${height}px`);
  for(const node of $('board').children){
    node.style.left=`${Number(node.dataset.x)*unit+5+Number(node.dataset.z)*2}px`;
    node.style.top=`${Number(node.dataset.y)*height+12-Number(node.dataset.z)*3}px`;
  }
  $('zoom-out').disabled=zoom<=1;$('zoom-in').disabled=zoom>=2;
}
function renderShanghai(){
  const game=shanghaiGame,active=game.board.filter(t=>t.active),free=new Set(Shanghai.freeTiles(game.board).map(t=>t.id));
  const taking=game.phase==='take',discarding=game.phase==='discard',score=Shanghai.winningScore(game);
  $('turn').textContent=game.turn;
  $('multiplier').textContent=`×${Math.pow(.92,Math.max(0,game.turn-1)).toFixed(3)}`;
  $('remaining').replaceChildren(document.createTextNode(String(active.length)),Object.assign(document.createElement('small'),{textContent:'枚'}));
  $('available').replaceChildren(document.createTextNode(String(free.size)),Object.assign(document.createElement('small'),{textContent:'枚'}));
  $('board').dataset.locked=String(!taking);
  $('board').replaceChildren(...active.map(tile=>{
    const node=tileElement(tile,'button');node.classList.add('board-tile');
    node.dataset.x=tile.x;node.dataset.y=tile.y;node.dataset.z=tile.z;node.dataset.free=String(free.has(tile.id));
    node.style.zIndex=String(tile.z*1000+Math.round(tile.y*10+tile.x*2));
    node.setAttribute('aria-label',`${tileName(tile)}・${tile.z+1}段目・${free.has(tile.id)?'取り出せる':'重なりまたは左右が塞がっています'}`);
    node.setAttribute('aria-disabled',String(!taking||!free.has(tile.id)));
    node.tabIndex=taking&&free.has(tile.id)?0:-1;
    node.addEventListener('click',()=>{if(Shanghai.takeTile(game,tile.id)){selectedDiscard=null;renderShanghai();}});
    return node;
  }));
  const tiles=game.drawnTile?[...game.hand,game.drawnTile]:game.hand;
  $('hand-size').textContent=`${tiles.length}枚`;
  $('hand').replaceChildren(...tiles.map(tile=>{
    const node=tileElement(tile,discarding?'button':'span');
    if(tile===game.drawnTile)node.classList.add('drawn');
    if(discarding){
      node.setAttribute('aria-pressed',String(selectedDiscard===tile.id));
      node.setAttribute('aria-label',`${tileName(tile)}${tile===game.drawnTile?'・ツモ牌':''}を${selectedDiscard===tile.id?'捨てる':'選択'}`);
      node.addEventListener('click',()=>{if(selectedDiscard===tile.id)discardSelected();else{selectedDiscard=tile.id;renderShanghai();}});
    }
    return node;
  }));
  $('win').hidden=!score;$('win').textContent=score?`ツモ和了 · ${score.score}点`:'ツモ和了';
  $('discard').disabled=!discarding||selectedDiscard===null;
  $('discard').textContent=selectedDiscard===null?'捨てる牌を選択':'この牌を捨てる';
  $('discard-count').textContent=game.discards.length;
  $('status').textContent=taking?'明るい枠の牌を1枚タップ':discarding?(score?'和了できます。続行も可能':selectedDiscard===null?'捨てる牌をタップ':'もう一度タップで捨てる'):game.phase==='won'?'和了！ もう一度遊べます':'取れる牌がなくなりました';
  sizeBoard();
}
function discardSelected(){
  if(selectedDiscard!==null&&Shanghai.discard(shanghaiGame,selectedDiscard)){
    selectedDiscard=null;renderShanghai();if(shanghaiGame.phase==='lost')showResult();
  }
}
function showResult(){
  const game=shanghaiGame,result=game.result;
  $('result-kicker').textContent=result?'門前ツモ':'牌山終了';$('result-title').textContent=result?'ツモ和了！':'今回は和了ならず';
  const hand=game.drawnTile?[...game.hand,game.drawnTile]:game.hand;
  $('result-hand').replaceChildren(...hand.map(t=>tileElement(t)));
  $('result-yaku').replaceChildren(...(result?.yaku||[]).map(y=>{
    const row=document.createElement('li'),label=document.createElement('span'),value=document.createElement('strong');
    label.textContent=y.name;value.textContent=y.units?(y.units===2?'ダブル役満':'役満'):`${y.han}翻`;row.append(label,value);return row;
  }));
  $('result-han').textContent=result?(result.yakumanUnits?`${result.yakumanUnits}倍役満 · ${result.turn}巡目`:`合計 ${result.han}翻 · ${result.turn}巡目`):`${game.turn}巡目 · 捨て牌 ${game.discards.length}枚`;
  $('result-score').textContent=result?`${result.score.toLocaleString('ja-JP')}点`:'0点';
  $('result-formula').textContent=result?`基本点 ${result.base} × 0.92^${result.turn-1} = ${result.score}点（四捨五入）`:'新しい配牌でもう一度挑戦できます。';
  if(!$('result-dialog').open)$('result-dialog').showModal();
}
function resetShanghai(){
  if($('result-dialog').open)$('result-dialog').close();
  shanghaiGame=Shanghai.newGame();selectedDiscard=null;zoom=1;renderShanghai();
  $('board-viewport').scrollTo(0,0);
}
$('discard').addEventListener('click',discardSelected);
$('win').addEventListener('click',()=>{if(Shanghai.win(shanghaiGame)){renderShanghai();showResult();}});
$('help').addEventListener('click',()=>$('help-dialog').showModal());$('help-close').addEventListener('click',()=>$('help-dialog').close());
$('restart').addEventListener('click',()=>$('restart-dialog').showModal());
$('restart-cancel').addEventListener('click',()=>$('restart-dialog').close());
$('restart-confirm').addEventListener('click',()=>{$('restart-dialog').close();resetShanghai();});
$('result-close').addEventListener('click',()=>$('result-dialog').close());$('result-again').addEventListener('click',resetShanghai);
$('zoom-in').addEventListener('click',()=>{zoom=Math.min(2,zoom+.25);sizeBoard();});
$('zoom-out').addEventListener('click',()=>{zoom=Math.max(1,zoom-.25);sizeBoard();});
$('discards-button').addEventListener('click',()=>{
  $('discard-list').replaceChildren(...shanghaiGame.discards.map(t=>tileElement(t)));
  if(!shanghaiGame.discards.length)$('discard-list').textContent='まだ捨て牌はありません';
  $('discards-dialog').showModal();
});
$('discards-close').addEventListener('click',()=>$('discards-dialog').close());
new ResizeObserver(sizeBoard).observe($('board-viewport'));
renderShanghai();
