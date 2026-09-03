# 牌尽 HAIJIN

Cloudflareで公開中の静的Webゲームを、公開ファイルから復元したローカル版です。

## 起動

Node.jsがインストールされている環境で、プロジェクト直下から次を実行します。

```powershell
node server.js
```

ブラウザで `http://127.0.0.1:4173/` を開いてください。

別のポートを使う場合:

```powershell
$env:PORT=8080
node server.js
```

`npm`を利用できる環境では `npm start` でも起動できます。
