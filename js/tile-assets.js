(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TileAssets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const TILE_IMAGE_MAP = {
    "1m":"Man1.svg","2m":"Man2.svg","3m":"Man3.svg","4m":"Man4.svg","5m":"Man5.svg","6m":"Man6.svg","7m":"Man7.svg","8m":"Man8.svg","9m":"Man9.svg",
    "1p":"Pin1.svg","2p":"Pin2.svg","3p":"Pin3.svg","4p":"Pin4.svg","5p":"Pin5.svg","6p":"Pin6.svg","7p":"Pin7.svg","8p":"Pin8.svg","9p":"Pin9.svg",
    "1s":"Sou1.svg","2s":"Sou2.svg","3s":"Sou3.svg","4s":"Sou4.svg","5s":"Sou5.svg","6s":"Sou6.svg","7s":"Sou7.svg","8s":"Sou8.svg","9s":"Sou9.svg",
    E:"Ton.svg",S:"Nan.svg",W:"Shaa.svg",N:"Pei.svg",P:"Haku.svg",F:"Hatsu.svg",C:"Chun.svg",
  };
  const HONOR_CODES = { 東:"E",南:"S",西:"W",北:"N",白:"P",發:"F",中:"C" };
  function tileCode(tile) {
    if (tile.suit === "honor") return HONOR_CODES[tile.value];
    return `${tile.value}${{ man:"m",pin:"p",sou:"s" }[tile.suit]}`;
  }
  function imagePath(tile) { return `./assets/tiles/${TILE_IMAGE_MAP[tileCode(tile)]}`; }
  return { TILE_IMAGE_MAP, HONOR_CODES, tileCode, imagePath };
});
