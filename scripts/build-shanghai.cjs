'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'shanghai-dist');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(path.join(root,'shanghai.html'),path.join(out,'index.html'));
for(const folder of ['assets'])fs.cpSync(path.join(root,folder),path.join(out,folder),{recursive:true});
for(const folder of ['css','js'])fs.mkdirSync(path.join(out,folder),{recursive:true});
for(const name of ['css/shanghai.css','js/tile-assets.js','js/game-rules.js','js/shanghai-rules.js','js/shanghai-app.js'])fs.copyFileSync(path.join(root,name),path.join(out,name));
console.log('Built shanghai-dist (Shanghai HTML and public assets only)');
