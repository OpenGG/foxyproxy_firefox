
// TODO: cancel/close window
let ddg = {

  yesInstall : function() {
    console.log("yesInstallDDG()");
    this._send('yes');
    let engine = Services.search.getEngineByName("DuckDuckGo For FoxyProxy");
    if (!engine)
      engine = Services.search.addEngineWithDetails(
          "DuckDuckGo For FoxyProxy",
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAB8lBMVEUAAADkRQzjPwPjQQXkRQ3iPwTiQQXgPQPeQgrcOwPVNgDVNQDWOgbTMwDRMgDQMwDSMwDRNwTQLgDRJgDSJwDSLgDSNwTjOgDiOADjOQDkPADhQAXzs5v+/fv////0vKbiRQvgPQHpdUr85NzuknPdKgDcIwDnZzj2w7HqeU/gPQLsimb/+PftjWn97Obpb0LdJQDeLQDtjmvsi2jgSBDnbULgOQD/39HgLQDeMgDpeFLgSBH0v670uqbaJQD2qImWvP/G1Ob5+/3u//+fvvXyp47dMwDaLwD0u6v0v6/aNQDiXi/aKQD3qozU7/8gSY2vvtg0ZK/OqLDaKQHYKgLgWTfaNADZMgDZMADZLADzqpD7//+xwdz//9H/5Bn/7Bn//ADofADYMADYMQDZOgPXLgDiZDj//97/0AD3tQDvlgHZOgbXLATXMADWMgDfXjLVLQD///z+0AD/3Rn/yRnwnQDcVjbVMQDyv67wuKTSJwDRHQD+8O/tg3/iQQDwhAHnawHWMADvtKfyva7XQxHga0bQGQD2vbH/u8LXIQCmPQzja07XQxLliGn99fPkcVHvhnGZ5VguvUU5wktBwCcAgxzydVv/8/XmiGngdlL+ysi3+I8LtCE80V6P3YmX4sDleljSNQLzr6D7sKPXNQTSIwAEAbMrAAAAF3RSTlMARqSkRvPz80PTpKRG3fPe3hio9/eoGP50jNsAAAABYktHRB5yCiArAAAAyElEQVQYGQXBvUqCYRiA4fu2V9Tn+UQddI3aCpxaOoU6iU4gcqqpoYbALXBuCuoYmttamqJDiEoh4YP+MOi6BNCh+uYKEGiOVNCXXxA2XDVV/UyfKbRCXTLQWAxbP2vt8Ue/uYDvfim91615sb2um6rqtrr/NFb1cUf1Ybd06areU6lSlYpK79jzK1SyJOkfhOl8JGEcqV5zoKrTRqO6yUzIzNu46ijdM1VV9bhuUJ/nZURExLRzUiPQm3kKXHi4BAEGOmOi78A/L1QoU/VHoTsAAAAldEVYdGRhdGU6Y3JlYXRlADIwMTQtMDEtMTlUMjA6MDE6MTEtMDU6MDAuET6cAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDE0LTAxLTE5VDIwOjAxOjExLTA1OjAwX0yGIAAAAABJRU5ErkJggg==",
          "DuckDuckGo For FoxyProxy",
          "DuckDuckGo",
          'GET',
          'https://duckduckgo.com/?q={searchTerms}&t=FoxyProxy');

    if (engine) {
      console.log("installing");
      if (engine.hidden) engine.hidden = false;
      Services.search.currentEngine = Services.search.defaultEngine = engine;
    }
    console.log("done!");
  },

  noInstall : function() {
    console.log("noInstallDDG()");
    this._send('no');
  },

  close : function() {
    console.log("closeDDG()");
    this._send('close');
  },

  _send : function(param) {
    let url = "https://getfoxyproxy.org/ddg?" + param + "=1";
    httpRequest(url, {method: "GET"});
    console.log("request sent");
  }
};

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Http.jsm");
