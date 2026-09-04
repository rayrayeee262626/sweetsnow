(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.ResultShare=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  const GAME_URL="https://sweet-snow-7d4b.rayrayeee.workers.dev/";
  function postText(tenpais,mode){return`牌尽 HAIJIN\n今回の記録：${tenpais}テンパイ\n${mode==="sanma"?"三麻108枚":"136枚"}で、何回テンパイできるか。\n${GAME_URL}\n\n#牌尽 #HAIJIN`;}
  function openXPost(tenpais,mode){const url=`https://twitter.com/intent/tweet?text=${encodeURIComponent(postText(tenpais,mode))}`;window.open(url,"_blank","noopener,noreferrer");}
  function roundedRect(ctx,x,y,w,h,r){const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+w,y,x+w,y+h,radius);ctx.arcTo(x+w,y+h,x,y+h,radius);ctx.arcTo(x,y+h,x,y,radius);ctx.arcTo(x,y,x+w,y,radius);ctx.closePath();}
  function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error(`牌画像を読み込めませんでした: ${src}`));image.src=src;});}
  async function generateCanvas(state,rules,tileAssets){
    const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext("2d");
    const history=state.tenpaiHistory||[];const paths=[...new Set(history.flatMap(entry=>[...entry.hand,...entry.waits.map(order=>({...rules.TILE_TYPES[order],order}))]).map(tile=>tileAssets.imagePath(tile)))];
    const images=new Map(await Promise.all(paths.map(async path=>[path,await loadImage(path)])));
    const bg=ctx.createLinearGradient(0,0,1080,1350);bg.addColorStop(0,"#174d40");bg.addColorStop(1,"#08271f");ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350);
    const glow=ctx.createRadialGradient(540,60,20,540,60,650);glow.addColorStop(0,"rgba(230,189,98,.25)");glow.addColorStop(1,"rgba(230,189,98,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,1080,650);
    ctx.textAlign="center";ctx.fillStyle="#e6bd62";ctx.font="700 30px 'Yu Gothic',sans-serif";ctx.fillText(state.mode==="sanma"?"一人用・三麻108枚チャレンジ":"一人用・136枚チャレンジ",540,70);
    ctx.fillStyle="#fff8df";ctx.font="700 74px 'Yu Mincho',serif";ctx.fillText("牌尽  HAIJIN",540,155);
    ctx.fillStyle="#fff8df";ctx.font="700 42px 'Yu Gothic',sans-serif";ctx.fillText(`今回の記録：${state.tenpais}テンパイ`,540,220);
    ctx.textAlign="left";ctx.fillStyle="#e6bd62";ctx.font="700 27px 'Yu Gothic',sans-serif";ctx.fillText("これまでのテンパイ形",70,278);
    const top=300,bottom=1188,available=bottom-top;const rowH=history.length?Math.min(126,available/history.length):126;
    function drawTile(tile,x,y,h){const w=h*.75;const grad=ctx.createLinearGradient(x,y,x+w,y+h);grad.addColorStop(0,"#fffef8");grad.addColorStop(.72,"#f6efd9");grad.addColorStop(1,"#e4d8b9");roundedRect(ctx,x,y,w,h,5);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle="#d8cba9";ctx.lineWidth=1.5;ctx.stroke();const image=images.get(tileAssets.imagePath(tile));if(image)ctx.drawImage(image,x+3,y+3,w-6,h-6);return w;}
    if(!history.length){ctx.textAlign="center";ctx.fillStyle="#b8c8c0";ctx.font="500 32px 'Yu Gothic',sans-serif";ctx.fillText("テンパイ履歴はありません",540,520);}
    history.forEach((entry,index)=>{const y=top+index*rowH;roundedRect(ctx,55,y+5,970,rowH-10,12);ctx.fillStyle="rgba(2,24,20,.38)";ctx.fill();ctx.fillStyle="#e6bd62";ctx.textAlign="left";ctx.font=`700 ${Math.min(25,rowH*.22)}px 'Yu Gothic',sans-serif`;ctx.fillText(`${entry.number}回目`,75,y+31);const tileH=Math.min(62,Math.max(42,rowH*.52));const tileW=tileH*.75;const gap=3;const handWidth=13*tileW+12*gap;const handX=75;const tileY=y+38;entry.hand.forEach((tile,i)=>drawTile(tile,handX+i*(tileW+gap),tileY,tileH));const waitsX=Math.max(handX+handWidth+30,780);const waitH=Math.min(34,Math.max(24,(rowH-42)/2-2));const waitStepX=waitH*.75+2;ctx.fillStyle="#b8c8c0";ctx.font="700 20px 'Yu Gothic',sans-serif";ctx.fillText("待ち",waitsX,tileY+18);entry.waits.slice(0,13).forEach((order,i)=>{const tile={...rules.TILE_TYPES[order],order};drawTile(tile,waitsX+52+(i%7)*waitStepX,tileY+Math.floor(i/7)*(waitH+2),waitH);});});
    ctx.strokeStyle="rgba(230,189,98,.35)";ctx.beginPath();ctx.moveTo(70,1220);ctx.lineTo(1010,1220);ctx.stroke();ctx.textAlign="center";ctx.fillStyle="#fff8df";ctx.font="700 24px 'Yu Gothic',sans-serif";ctx.fillText(`${state.mode==="sanma"?"三麻108枚":"136枚"}で、何回テンパイできるか。`,540,1260);ctx.fillStyle="#e6bd62";ctx.font="500 22px Arial,sans-serif";ctx.fillText(GAME_URL,540,1305);return canvas;
  }
  function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("PNGを生成できませんでした")),"image/png"));}
  async function saveResult(state,rules,tileAssets){const canvas=await generateCanvas(state,rules,tileAssets);const blob=await canvasBlob(canvas);const file=new File([blob],`haijin-result-${state.tenpais}-tenpai.png`,{type:"image/png"});if(navigator.maxTouchPoints>0&&navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:"牌尽 HAIJIN ゲーム結果",text:`今回の記録：${state.tenpais}テンパイ`});return"shared";}const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);return"downloaded";}
  return{GAME_URL,postText,openXPost,generateCanvas,saveResult};
});
