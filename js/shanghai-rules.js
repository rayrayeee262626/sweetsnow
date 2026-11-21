(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./game-rules.js'):root.MahjongRules);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ShanghaiRules=api;
})(globalThis,function(R){
  'use strict';
  const EPS=1e-8;
  const isTerminal=i=>i<27&&(i%9===0||i%9===8);
  const isOutside=i=>i>=27||isTerminal(i);
  const countsOf=tiles=>{const c=Array(34).fill(0);for(const t of tiles)c[t.order]++;return c;};
  function createLayout(){
    const places=[];
    for(const [z,cols,rows,x0,y0] of [[0,9,9,0,0],[1,6,5,1.5,2],[2,4,3,2.5,3]]){
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)places.push({x:x0+x,y:y0+y,z});
    }
    return places;
  }
  const overlap=(a,b)=>a.x<b.x+1-EPS&&a.x+1>b.x+EPS&&a.y<b.y+1-EPS&&a.y+1>b.y+EPS;
  function blocking(board,id){
    const tile=board.find(t=>t.id===id&&t.active);
    if(!tile)return {missing:true,above:false,left:false,right:false};
    let above=false,left=false,right=false;
    for(const other of board){
      if(!other.active||other.id===id)continue;
      if(other.z>tile.z&&overlap(tile,other))above=true;
      if(other.z!==tile.z||other.y>=tile.y+1-EPS||other.y+1<=tile.y+EPS)continue;
      if(Math.abs(other.x+1-tile.x)<EPS)left=true;
      if(Math.abs(other.x-tile.x-1)<EPS)right=true;
    }
    return {missing:false,above,left,right};
  }
  function isFree(board,id){const b=blocking(board,id);return !b.missing&&!b.above&&(!b.left||!b.right);}
  function freeTiles(board){return board.filter(t=>t.active&&isFree(board,t.id));}
  function decompositions(counts){
    const out=[];
    function melds(c,groups,pair){
      const i=c.findIndex(n=>n>0);
      if(i<0){if(groups.length===4)out.push({pair,groups:groups.slice()});return;}
      if(groups.length>=4)return;
      if(c[i]>=3){c[i]-=3;melds(c,[...groups,{kind:'triplet',tile:i}],pair);c[i]+=3;}
      if(i<27&&i%9<=6&&c[i+1]&&c[i+2]){c[i]--;c[i+1]--;c[i+2]--;melds(c,[...groups,{kind:'sequence',tile:i}],pair);c[i]++;c[i+1]++;c[i+2]++;}
    }
    for(let pair=0;pair<34;pair++)if(counts[pair]>=2){const c=counts.slice();c[pair]-=2;melds(c,[],pair);}
    return out;
  }
  function winningRoles(shape,win){
    const roles=[];
    if(shape.pair===win)roles.push({kind:'pair'});
    for(const g of shape.groups){
      if(g.kind==='triplet'){if(g.tile===win)roles.push({kind:'triplet'});}
      else if(win>=g.tile&&win<=g.tile+2){
        const pos=win-g.tile;
        const ryanmen=pos!==1&&!((g.tile%9===0&&pos===2)||(g.tile%9===6&&pos===0));
        roles.push({kind:'sequence',ryanmen});
      }
    }
    return roles;
  }
  function scoreHand(tiles,drawn,turn=1,context={}){
    if(!Array.isArray(tiles)||!drawn||!Number.isInteger(turn)||turn<1||!tiles.every(t=>Number.isInteger(t?.order)&&t.order>=0&&t.order<34)||!tiles.some(t=>t.order===drawn.order))return null;
    if(!R.getWinningType(tiles))return null;
    const c=countsOf(tiles),before=c.slice();before[drawn.order]--;
    const present=c.flatMap((n,i)=>n?[i]:[]),suits=new Set(present.filter(i=>i<27).map(i=>Math.floor(i/9)));
    const honors=present.some(i=>i>=27),onlyHonors=suits.size===0;
    const allOutside=present.every(isOutside),allTerminals=present.every(isTerminal);
    const green=present.every(i=>[19,20,21,23,25,32].includes(i));
    const standard=decompositions(c),variants=[];
    const normal=(name,han)=>({name,han,units:0});
    const yakuman=(name,units=1)=>({name,han:0,units});
    const universal=[];
    if(onlyHonors)universal.push(yakuman('字一色'));
    if(allTerminals)universal.push(yakuman('清老頭'));
    if(green)universal.push(yakuman('緑一色'));
    const kokushi=R.ORPHAN_INDICES.every(i=>c[i]>0)&&present.every(i=>R.ORPHAN_INDICES.includes(i));
    if(kokushi){const pure=R.ORPHAN_INDICES.every(i=>before[i]===1);variants.push([yakuman(pure?'国士無双十三面待ち':'国士無双',pure?2:1),...universal]);}
    const common=()=>{
      const y=[normal('門前清自摸和',1)];
      if(present.every(i=>i<27&&!isTerminal(i)))y.push(normal('断么九',1));
      if(suits.size===1)y.push(normal(honors?'混一色':'清一色',honors?3:6));
      if(context.lastTile)y.push(normal('海底摸月',1));
      if(allOutside)y.push(normal('混老頭',2));
      return y;
    };
    if(c.filter(n=>n===2).length===7&&c.every(n=>n===0||n===2))variants.push(universal.length?universal.slice():[...common(),normal('七対子',2)]);
    const nineBase=[3,1,1,1,1,1,1,1,3];
    let nineGates=null;
    if(suits.size===1&&!honors){
      const start=[...suits][0]*9;
      if(nineBase.every((n,i)=>c[start+i]>=n)){
        const pure=nineBase.every((n,i)=>before[start+i]===n);
        nineGates=yakuman(pure?'純正九蓮宝燈':'九蓮宝燈',pure?2:1);
      }
    }
    for(const shape of standard)for(const role of winningRoles(shape,drawn.order)){
      const triplets=shape.groups.filter(g=>g.kind==='triplet').map(g=>g.tile);
      const sequences=shape.groups.filter(g=>g.kind==='sequence').map(g=>g.tile);
      const big=universal.slice();
      if(nineGates)big.push(nineGates);
      const dragons=[31,32,33].filter(i=>triplets.includes(i)).length;
      const winds=[27,28,29,30].filter(i=>triplets.includes(i)).length;
      if(dragons===3)big.push(yakuman('大三元'));
      if(winds===4)big.push(yakuman('大四喜',2));
      else if(winds===3&&shape.pair>=27&&shape.pair<=30)big.push(yakuman('小四喜'));
      if(triplets.length===4)big.push(yakuman(role.kind==='pair'?'四暗刻単騎':'四暗刻',role.kind==='pair'?2:1));
      if(big.length){variants.push(big);continue;}
      const y=common();
      if(sequences.length===4&&shape.pair<31&&role.kind==='sequence'&&role.ryanmen)y.push(normal('平和',1));
      const seqCounts=new Map();for(const tile of sequences)seqCounts.set(tile,(seqCounts.get(tile)||0)+1);
      const identicalPairs=[...seqCounts.values()].reduce((n,count)=>n+Math.floor(count/2),0);
      if(identicalPairs>=2)y.push(normal('二盃口',3));else if(identicalPairs===1)y.push(normal('一盃口',1));
      if(Array.from({length:7},(_,i)=>i).some(i=>[i,i+9,i+18].every(t=>sequences.includes(t))))y.push(normal('三色同順',2));
      if([0,9,18].some(i=>[i,i+3,i+6].every(t=>sequences.includes(t))))y.push(normal('一気通貫',2));
      if(Array.from({length:9},(_,i)=>i).some(i=>[i,i+9,i+18].every(t=>triplets.includes(t))))y.push(normal('三色同刻',2));
      for(const [tile,name] of [[31,'役牌・白'],[32,'役牌・發'],[33,'役牌・中']])if(triplets.includes(tile))y.push(normal(name,1));
      if(triplets.length===4)y.push(normal('対々和',2));
      if(triplets.length===3)y.push(normal('三暗刻',2));
      if(dragons===2&&shape.pair>=31)y.push(normal('小三元',2));
      const outsideGroups=isOutside(shape.pair)&&shape.groups.every(g=>g.kind==='triplet'?isOutside(g.tile):g.tile%9===0||g.tile%9===6);
      if(sequences.length&&outsideGroups)y.push(normal(honors?'混全帯幺九':'純全帯幺九',honors?2:3));
      variants.push(y);
    }
    const results=variants.map(candidate=>{
      const yaku=candidate.some(y=>y.name==='門前清自摸和')?candidate:[normal('門前清自摸和',1),...candidate];
      const yakumanUnits=yaku.reduce((n,y)=>n+y.units,0),han=yaku.reduce((n,y)=>n+y.han,0);
      const base=yakumanUnits?1500*yakumanUnits:100*han;
      const multiplier=Math.pow(.92,turn-1);
      return {yaku,han,yakumanUnits,base,turn,multiplier,score:Math.round(base*multiplier)};
    });
    // Yakuman replaces normal yaku. Among decompositions take the best base value.
    const hasYakuman=results.some(r=>r.yakumanUnits);
    return results.filter(r=>!hasYakuman||r.yakumanUnits).sort((a,b)=>b.base-a.base)[0]||null;
  }
  function newGame(random=Math.random){
    const tiles=R.shuffle(R.createWall('yonma'),random),hand=tiles.splice(0,13);
    hand.sort((a,b)=>a.order-b.order||a.id-b.id);
    const board=createLayout().map((position,i)=>({...tiles[i],...position,active:true}));
    return {hand,board,drawnTile:null,discards:[],turn:0,phase:'take',result:null};
  }
  function winningScore(state){
    if(state.phase!=='discard'||!state.drawnTile)return null;
    return scoreHand([...state.hand,state.drawnTile],state.drawnTile,state.turn,{lastTile:state.board.every(t=>!t.active)});
  }
  function takeTile(state,id){
    if(state.phase!=='take'||!isFree(state.board,id))return false;
    const tile=state.board.find(t=>t.id===id);tile.active=false;
    state.drawnTile={suit:tile.suit,value:tile.value,order:tile.order,id:tile.id};
    state.turn++;state.phase='discard';return true;
  }
  function discard(state,id){
    if(state.phase!=='discard')return false;
    const tiles=[...state.hand,state.drawnTile],index=tiles.findIndex(t=>t.id===id);
    if(index<0)return false;
    state.discards.push(tiles.splice(index,1)[0]);state.hand=tiles.sort((a,b)=>a.order-b.order||a.id-b.id);
    state.drawnTile=null;state.phase=freeTiles(state.board).length?'take':'lost';return true;
  }
  function win(state){const result=winningScore(state);if(!result)return false;state.result=result;state.phase='won';return true;}
  return {createLayout,blocking,isFree,freeTiles,scoreHand,newGame,takeTile,discard,winningScore,win};
});
