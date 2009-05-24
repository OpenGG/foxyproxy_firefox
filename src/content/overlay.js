/**
  FoxyProxy
  Copyright (C) 2006-2009 Eric H. Jung and LeahScape, Inc.
  http://foxyproxy.mozdev.org/
  eric.jung@yahoo.com

  This source code is released under the GPL license,
  available in the LICENSE file at the root of this installation
  and also online at http://www.gnu.org/licenses/gpl.txt
**/

var foxyproxy = {
  checkboxType : Components.interfaces.nsITreeColumn.TYPE_CHECKBOX,
  fp : Components.classes["@leahscape.org/foxyproxy/service;1"].getService().wrappedJSObject,
  fpc : Components.classes["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject,
  statusIconColor : null,
  contextMenuIcon : null,
  toolbarIcon : null,
  toolsMenuIcon : null,
  notes: ["foxyproxy-statusbar-icon","foxyproxy-statusbar-text","foxyproxy-statusbar-width","foxyproxy-toolsmenu",
    "foxyproxy-contextmenu","foxyproxy-mode-change","foxyproxy-throb","foxyproxy-updateviews","foxyproxy-autoadd-toggle"],

  alert : function(wnd, str) {
    Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService)
      .alert(null, this.fp.getMessage("foxyproxy"), str);
  },

  // thanks, mzz
  updateCheck : {
    timer : null,
    first : false,
    usingObserver : true,
    check : function() {
      const CC = Components.classes, CI = Components.interfaces;
      var vc = CC["@mozilla.org/xpcom/version-comparator;1"].getService(CI.nsIVersionComparator),
        lastVer, curVer = CC["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject.getVersion();
      try {
        lastVer = foxyproxy.fp.getPrefsService("extensions.foxyproxy.").getCharPref("last-version");
        if (vc.compare(curVer, lastVer) > 0)
          p(this);
      }
      catch(e) {
        this.first = true;
        p(this);
      }
      function p(o) {
        var appInfo = CC["@mozilla.org/xre/app-info;1"].getService(CI.nsIXULAppInfo);
        if(vc.compare(appInfo.version, "3.0") < 0) {
          // sessionstore-windows-restored notification not supported; just do it now
          o.usingObserver = false;
          o.installTimer();
        }
        else
          CC["@mozilla.org/observer-service;1"].getService(CI.nsIObserverService)
             .addObserver(o, "sessionstore-windows-restored", false);
      }
    },

    notify : function() {
      if (this.usingObserver)
        Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService)
          .removeObserver(this, "sessionstore-windows-restored");

      // Probably not necessary, but does not hurt
      this.timer = null;
      var fpc = Components.classes["@leahscape.org/foxyproxy/common;1"].getService().wrappedJSObject;
      if (this.first) {
        x("http://foxyproxy.mozdev.org/help.html");
        //foxyproxy.torWizard(true);
      }
      else {
         x("http://foxyproxy.mozdev.org/releasenotes.html");
      }
      function x(url) {
        fpc.openAndReuseOneTabPerURL(url);
        // Do this last so we try again next time if we failed to display now
        foxyproxy.fp.getPrefsService("extensions.foxyproxy.").setCharPref("last-version", fpc.getVersion());
      }
    },

    observe : function(s, topic) {
      if (topic == "sessionstore-windows-restored") {
        // If we show the tab now, the tab isn't guaranteed to be topmost
        // (in Firefox 3.0b5). So use a timer.
        this.installTimer();
      }
    },

    installTimer : function() {
      this.timer = Components.classes["@mozilla.org/timer;1"].createInstance(Components.interfaces.nsITimer);
      this.timer.initWithCallback(this, 1000, Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    }
  },
  
  observe: function(subj, topic, str) {
    var e;
    try {
      e = subj.QueryInterface(Components.interfaces.nsISupportsPRBool).data;
    }
    catch(e) {}
    switch (topic) {
      case "foxyproxy-throb":
        this.throb(subj);
        break;
      case "foxyproxy-statusbar-icon":
        this.toggleStatusBarIcon(e);
        break;
      case "foxyproxy-statusbar-text":
        this.toggleStatusBarText(e);
        break;
      case "foxyproxy-statusbar-width":
        this.toggleStatusBarWidth(e);
        break;
      case "foxyproxy-autoadd-toggle":
        this.checkPageLoad();
        break;
      case "foxyproxy-mode-change":
        this.setMode(str);
        this.checkPageLoad();
        break;
      case "foxyproxy-toolsmenu":
        this.toggleToolsMenu(e);
        break;
      case "foxyproxy-contextmenu":
        this.toggleContextMenu(e);
        break;
      case "foxyproxy-updateviews":
        this.updateViews(false, false);
        break;
    }
  },

  onLoad : function() {
    this.svgIcon.init();
    this.statusIconColor = document.getElementById("path3231");
    this.contextMenuIcon = document.getElementById("foxyproxy-context-menu-1");
    this.toolbarIcon = document.getElementById("foxyproxy-button-1");
    this.toolsMenuIcon = document.getElementById("foxyproxy-tools-menu-1");
    var obSvc = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
    for (var i in this.notes) {
      obSvc.addObserver(this, this.notes[i], false);
    }
    this.toggleToolsMenu(this.fp.toolsMenu);
    this.toggleContextMenu(this.fp.contextMenu);
    this.checkPageLoad();
    this.toggleStatusBarIcon(this.fp.statusbar.iconEnabled);
    this.toggleStatusBarText(this.fp.statusbar.textEnabled);    
    this.toggleStatusBarWidth(this.fp.statusbar.width);
    this.setMode(this.fp.mode);
  this.updateCheck.check();    
  },

  toggleToolsMenu : function(e) {
    this.toolsMenuIcon.hidden = !e;
  },

  toggleContextMenu : function(e) {
    this.contextMenuIcon.hidden = !e;
  },
  
  torWizard : function(firstTime) {
    var owner = foxyproxy._getOptionsDlg();
    if (this.ask(owner, (firstTime ? (this.fp.getMessage("welcome") + " ") : "") +
        this.fp.getMessage("torwiz.configure"))) {
      var withoutPrivoxy = this.ask(owner,
        this.fp.getMessage("torwiz.with.without.privoxy"),
        this.fp.getMessage("torwiz.without"),
        this.fp.getMessage("torwiz.with"));
      !withoutPrivoxy && (withoutPrivoxy = !this.ask(owner, this.fp.getMessage("torwiz.privoxy.not.required")));
      var input = {value:withoutPrivoxy?"9050":"8118"};
      var ok, title = this.fp.getMessage("foxyproxy"),
        portMsg = this.fp.getMessage("torwiz.port", [this.fp.getMessage(withoutPrivoxy?"tor":"privoxy")]);
      do {
        ok = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
          .getService(Components.interfaces.nsIPromptService)
          .prompt(owner, title, portMsg, input, null, {});
        if (ok) {
          if (isNaN(input.value) || input.value == "") {
            foxyproxy.alert(owner, this.fp.getMessage("torwiz.nan"));
            ok = false;
          }
        }
        else
          break;
      } while (!ok);
      var proxyDNS;
      ok && (proxyDNS = this.ask(owner, this.fp.getMessage("torwiz.proxydns")));
      if (ok) {
        var p = Components.classes["@leahscape.org/foxyproxy/proxy;1"]
          .createInstance(Components.interfaces.nsISupports).wrappedJSObject;
        p.name = this.fp.getMessage("tor");
        p.notes = this.fp.getMessage("torwiz.proxy.notes");
        var match = Components.classes["@leahscape.org/foxyproxy/match;1"]
          .createInstance(Components.interfaces.nsISupports).wrappedJSObject;
        match.name = this.fp.getMessage("torwiz.google.mail");
        match.pattern = this.fp.getMessage("torwiz.pattern");
        p.matches.push(match);
        p.selectedTabIndex = 2;
        p.mode = "manual";
        if (withoutPrivoxy) {
          p.manualconf.host="127.0.0.1";
          p.manualconf.port=9050;
          p.manualconf.isSocks=true;
        }
        else {
          p.manualconf.host="127.0.0.1";
          p.manualconf.port=8118;
          p.manualconf.isSocks=false;
        }
        p.manualconf.socksversion=5;
        p.autoconf.url = "";
        var params = {inn:{isNew:true, proxy:p, torwiz:true}, out:null};

        var win = owner?owner:window;
        win.openDialog("chrome://foxyproxy/content/addeditproxy.xul", "",
          "chrome,dialog,modal,resizable=yes,center", params).focus();
        if (params.out) {
          this.fp.proxies.push(params.out.proxy);
          this.fp.proxyDNS = proxyDNS;
          foxyproxy.updateViews(true);
          foxyproxy.alert(owner, this.fp.getMessage("torwiz.congratulations"));
          proxyDNS && this.ask(owner, this.fp.getMessage("foxyproxy.proxydns.notice")) && this.fp.restart();
        }
        else
         ok = false;
      }
      !ok && foxyproxy.alert(owner, this.fp.getMessage("torwiz.cancelled"));
    }
  },

  /**
   * Open or focus the main window/dialog
   */
  onOptionsDialog : function() {
    this.onDialog("foxyproxy-options", "chrome://foxyproxy/content/options.xul", null, null, "foxyproxy-superadd");
  },

  onDialog : function(id, xulFile, args, parms, idToClose) {
    // If there's a window/dialog already open, just focus it and return.
    var wnd = foxyproxy.findWindow(id);
    if (wnd) {
      try {
        wnd.focus();
      }
      catch (e) {
        // nsIFilePicker dialog is open. Best we can do is flash the window.
        wnd.getAttentionWithCycleCount(4);
      }
    }
    else {
      if (idToClose) {
        var wnd = foxyproxy.findWindow(idToClose); // close competing dialog to minimize synchronization issues between the two
        wnd && wnd.close();
      }
      window.openDialog(xulFile, "", "minimizable,dialog,chrome,resizable=yes" + (args?(","+args):""), parms).focus();
    }
  },

  onQuickAddDialog : function(evt) {
  if (this.fp.mode != "disabled") {
      if (!this.fp.quickadd.enabled) {
        this.fp.notifier.alert(this.fp.getMessage("foxyproxy"), this.fp.getMessage("quickadd.disabled"));
        return;
      }
      if (!evt.view || !evt.view.content || !evt.view.content.document || !evt.view.content.document.location) {
        this.fp.notifier.alert(this.fp.getMessage("foxyproxy"), this.fp.getMessage("quickadd.nourl"));
        return;
      }
    this.fp.quickadd.onQuickAdd(window, evt.view.content.document);
    }
  },

  onPageLoad : function(evt) {
    var doc = evt.originalTarget; // doc is document that triggered "onload" event
    if (doc && doc.location)
      foxyproxy.fp.autoadd.onAutoAdd(window, doc); // can't use |this.fp| because this isn't |foxyproxy|
  },
  
  updateViews : function(writeSettings, updateLogView) {
    // Update view if it's open
    var optionsDlg = foxyproxy._getOptionsDlg();
    optionsDlg && optionsDlg._updateView(false, updateLogView); // don't write settings here because optionsDlg mayn't be open
    writeSettings && this.fp.writeSettings();
  },

  _getOptionsDlg : function() {
    return Components.classes["@mozilla.org/appshell/window-mediator;1"]
      .getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("foxyproxy-options");
  },

  /**
   * Find and return the dialog/window if it's open (or null if it's not)
   */
  findWindow : function(id) {
    // Same as _getOptionsDlg() but we need a windowManager for later
    var windowManager =
      Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
    var win0 =
      windowManager.getMostRecentWindow(id);

    if (win0) {
      var enumerator = windowManager.getEnumerator(null);
      while (enumerator.hasMoreElements()) {
        var win1 = enumerator.getNext();
        var winID = win1.document.documentElement.id;
        if (winID == "commonDialog" && win1.opener == win0)
          return win1;
      }
      return win0;
    }
    return null;
  },

  /**
   * Function for displaying dialog box with yes/no buttons (not OK/Cancel buttons),
   * or any arbitrary button labels. If btn1Text or btn2Text is null, yes/no values are assumed for them.
   * btn3Text can be null, in which case no 3rd button is displayed.
   * Return values: if btn3Text isn't specified, then true/false is returned
   * corresponding to whether yes (or btn1Text), 1 == no (or btn2Text) was clicked.
   * if btn3Text is specified, return value is 0, 1, or 2 of the clicked button. Specifically:
   * 0 == yes (or btn1Text), 1 == no (or btn2Text), 2 == btn3Text.
   */
  ask : function(parent, text, btn1Text, btn2Text, btn3Text) {
    var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
      .getService(Components.interfaces.nsIPromptService);
    !btn1Text && (btn1Text = this.fp.getMessage("yes"));
    !btn2Text && (btn2Text = this.fp.getMessage("no"));
    if (btn3Text == null)
      return prompts.confirmEx(parent, this.fp.getMessage("foxyproxy"), text,
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_0 +
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_1,
      btn1Text, btn2Text, null, null, {}) == 0; // 0 means first button ("yes") was pressed
    else { 
      // No longer displays in proper order and no longer returns proper values on FF 3.0.7 and above.
      // Insists that 2nd displayed button (1-index) is BUTTON_POS_2 (0-indexed)
      /*var ret = prompts.confirmEx(parent, this.fp.getMessage("foxyproxy"), text,
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_0 +
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_1 +
        prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_2,
        btn1Text, btn2Text, btn3Text, null, {});*/
      var p = {inn:{title: text, btn1Text: btn1Text, btn2Text: btn2Text, btn3Text: btn3Text}, out:null};
      window.openDialog("chrome://foxyproxy/content/triquestion.xul", "",
        "chrome, dialog, modal, resizable=yes, centerscreen=yes", p).focus();
      return p.out ? p.out.value : null;
    }
  },

  checkPageLoad : function() {
    var listen = this.fp.mode != "disabled" && this.fp.autoadd.enabled;
    var appcontent = document.getElementById("appcontent");
    if (appcontent) {
      appcontent.removeEventListener("load", this.onPageLoad, true); // safety
      if (listen) {
        appcontent.addEventListener("load", this.onPageLoad, true);
      }
      else {
        appcontent.removeEventListener("load", this.onPageLoad, true);
      }
    }
  },

  throb : function(mp) {
    if (mp.wrappedJSObject.animatedIcons) {
      this.statusIconColor.setAttribute("style", "fill: "+mp.wrappedJSObject.color+";");
      this.svgIcon.animate(); // NEW SVG
      // this.toolbarIcon is null if user hasn't placed it in the toolbar, so we check its existance before calling setAttribute()
      this.toolbarIcon && this.toolbarIcon.setAttribute("animated", "true");
      this.contextMenuIcon.setAttribute("animated", "true");
      this.toolsMenuIcon.setAttribute("animated", "true");
    }
    this.setStatusText(mp.wrappedJSObject.name, true);
    setTimeout("foxyproxy.unthrob()", 800);
  },

  unthrob : function() {
    // NEW SVG - No reason to untrob, as it a static and animated image
    this.contextMenuIcon.removeAttribute("animated");
    // this.toolbarIcon is null if user hasn't placed it in the toolbar, so we check its existance before calling setAttribute()
    this.toolbarIcon && this.toolbarIcon.removeAttribute("animated");
    this.toolsMenuIcon.removeAttribute("animated");
    var modeAsText = this.getModeAsText(this.fp.mode);
    this.setStatusText(modeAsText, false);
    
    // Reset the icon color back to what it should be
    if (modeAsText != "static") {
      this.statusIconColor.removeAttribute("style");
      this.statusIconColor.setAttribute("mode", modeAsText);
    }
  },
    

  ///////////////// statusbar \\\\\\\\\\\\\\\\\\\\\
  svgIcon : {
    
    fpsvg_blu : 4,
    fpsvg_runners : 0,
    g3231 : null,
    
    init : function() {
      this.g3231 = document.getElementById("g3231");
    },
    
    animate : function() {
      if (this.fpsvg_runners > 8) return; // No more runners
      this.fpsvg_runners++;
      this.animate_runner();
    },

    animate_runner : function() {
      this.g3231.setAttribute("transform", "rotate("+(this.fpsvg_blu/2)+", 8, 8)");
      this.fpsvg_blu += 6;
      if (this.fpsvg_blu > 720) {
        this.fpsvg_blu = 4;
        this.g3231.setAttribute("transform", "rotate(0, 8, 8)");
        this.fpsvg_runners--;
        return;
      }
      window.setTimeout("foxyproxy.svgIcon.animate_runner()", 10);
    }
  },

  toggleStatusBarIcon : function(e) {
    document.getElementById("foxyproxy-status-svg").hidden = !e;
  },

  toggleStatusBarText : function(e) {
    var s=document.getElementById("foxyproxy-status-text");
    // Statusbars don't exist on all windows (e.g,. View Source) so check for existence first,
    // otherwise we get a JS error.
    s && (s.hidden = !e);
  },
  
  toggleStatusBarWidth : function(w) {
    var s=document.getElementById("foxyproxy-status-text");
    // Statusbars don't exist on all windows (e.g,. View Source) so check for existence first,
    // otherwise we get a JS error.
    if (!s) return;
    var w = this.fp.statusbar.width; 
    if (w > 0)
      s.width = w;
    else {
      s.width = "";
      // Work-around weird FF 2.0.x bug whereby statusbarpanel doesn't fit-to-size
      // when width is the empty string; hide then show the statusbarpanel.
      if (!s.hidden) {
        s.hidden = true;
        s.hidden = false;
      }     
    }    
  },

  // Set toolbar, statusbar, and context menu text and icon colors
  setMode : function(mode) {
    var m = this.getModeAsText(mode);
    this.toolsMenuIcon.setAttribute("mode", m);
    this.contextMenuIcon.setAttribute("mode", m);
    // this.toolbarIcon is null if user hasn't placed it in the toolbar, so we check its existance before calling setAttribute()
    this.toolbarIcon && this.toolbarIcon.setAttribute("mode", m);
    if (m == "static")
      this.statusIconColor.setAttribute("style", "fill: " + this.fp._selectedProxy.color);
    else {
      this.statusIconColor.removeAttribute("style");
      this.statusIconColor.setAttribute("mode", m);
    }
    document.getElementById("disabled-ring").setAttribute("mode", m);
    this.setStatusText(m, false);
  },

  getModeAsText : function(mode) {
    return mode != "patterns" && mode != "disabled" && mode != "random" && mode != "roundrobin" ? "static" : mode;
  },

  setStatusText : function(m, skipStyling) {
    if (skipStyling) {
      this._adorn(m);
      return;
    }
    switch(m) {
      case "patterns":
        this._adorn(this.fp.getMessage("foxyproxy.tab.patterns.label"), "orange");
        break;
      case "disabled":
        this._adorn(this.fp.getMessage("disabled"), "red");
        break;
      case "random":
        this._adorn(this.fp.getMessage("random"), "green");
        break;
      case "roundrobin":
        this._adorn(this.fp.getMessage("roundrobin"), "purple");
        break;        
      default:
        this._adorn(this.fp._selectedProxy.name, null, "color: " + this.fp._selectedProxy.color);
    };
  },

  _adorn : function(m, clazz, style) {
    var e = document.getElementById("foxyproxy-status-text");
    var txt = this.fp.getMessage("foxyproxy") + ": " + m; /* todo: add pref to make "FoxyProxy:" prefix optional */
    // Statusbars don't exist on all windows (e.g,. View Source) so check for existence first,
    // otherwise we get a JS error.
    e && e.setAttribute("label", txt);
    if (style) { /* style supercedes clazz */
      e.removeAttribute("class");
      e.setAttribute("style", style);
    }
    else if (clazz) {
      e.removeAttribute("style");
      e.setAttribute("class", clazz);
    }
    foxyproxy.toolsMenuIcon.setAttribute("tooltiptext", txt);
    foxyproxy.contextMenuIcon.setAttribute("tooltiptext", txt);
    // this.toolbarIcon is null if user hasn't placed it in the toolbar, so we check its existance before calling setAttribute()
    foxyproxy.toolbarIcon && foxyproxy.toolbarIcon.setAttribute("tooltiptext", txt);
    document.getElementById('foxyproxy-status-svg').setAttribute("tooltiptext", txt);
  },

  ///////////////// utilities \\\\\\\\\\\\\\\
  onTreeClick : function(e, tree) {
    var row = {}, col = {};
    tree.treeBoxObject.getCellAt(e.clientX, e.clientY, row, col, {});
    row.value > -1 && col.value && col.value.type == this.checkboxType && tree.view.selection.select(row.value);
  },

  ///////////////// menu \\\\\\\\\\\\\\\\\\\\\
  _cmd : "foxyproxy.fp.setMode(event.target.id, true);foxyproxy.updateViews(true);",
  _popupShowing : 0,

  onSBTBClick : function(e, o) {
    if (e.button==0) {
      _act(o.leftClick, e);
    }
    else if (e.button==1) {
      _act(o.middleClick, e);
    }
    else if (e.button==2) {
      _act(o.rightClick, e);
    }
    function _act(x, e) {
      var fp=foxyproxy.fp;
      switch (x) {
        case "options":
          foxyproxy.onOptionsDialog();
          break;
        case "cycle":
          fp.cycleMode();
          break;
        case "contextmenu":
          this._popupShowing = 0;
          document.getElementById("foxyproxy-statusbar-popup").showPopup(e.target, -1, -1, "popup", "bottomleft", "topleft");
          break;
        case "reloadcurtab":
          gBrowser.reloadTab(gBrowser.mCurrentTab);
          break;
        case "reloadtabsinbrowser":
          gBrowser.reloadAllTabs();
          break;
        case "reloadtabsinallbrowsers":
          for (var b, e = this.fpc.getEnumerator();
                  e.hasMoreElements();
                  (b = e.getNext().getBrowser()) && b.reloadAllTabs());
          break;
        case "removeallcookies":
          Components.classes["@mozilla.org/cookiemanager;1"].
            getService(Components.interfaces.nsICookieManager).removeAll();
          fp.notifier.alert(fp.getMessage("foxyproxy"), fp.getMessage("cookies.allremoved"));
          break;
        case "toggle":
          // Toggle between current mode and disabled
          fp.setMode(fp.mode == "disabled" ? "previous" : "disabled");
          break;
        case "quickadd":
          foxyproxy.onQuickAddDialog(e);
          break;
      }
    }
  },

  onPopupHiding : function() {
    this._popupShowing > 0 && this._popupShowing--;
  },

  onPopupShowing : function(menupopup, evt) {
    this._popupShowing++;
    if (this._popupShowing == 1) {
      while (menupopup.hasChildNodes()) {
        menupopup.removeChild(menupopup.firstChild);
      }
      /*var asb = document.createElement("arrowscrollbox");
      asb.setAttribute("style", "max-height: 400px;");
      asb.setAttribute("flex", "1");
      asb.setAttribute("orient", "vertical");*/
      
      var checkOne = [];
      var itm = _createRadioMenuItem(menupopup,
        "patterns",
        this._cmd,
        this.fp.getMessage("mode.patterns.accesskey"),
        this.fp.getMessage("mode.patterns.label"),
        this.fp.getMessage("mode.patterns.tooltip"));
      itm.setAttribute("class", "orange");
      checkOne.push(itm);

      for (var i=0; i<this.fp.proxies.length; i++) {
        var p = this.fp.proxies.item(i);
        var pName = p.name;
        // Set the submenu based on advancedMenus enabled/disabled
        var sbm = this.fp.advancedMenus ? _createMenu(menupopup, pName, pName.substring(0, 1), pName) : menupopup;
        var curProxy = "foxyproxy.fp.proxies.item(" + i + ").";

        if (this.fp.advancedMenus) {
          // Enable/disable checkbox for each proxy.
          // Don't provide enable/disable to lastresort proxy.
          !p.lastresort && _createCheckMenuItem(sbm,
            curProxy + "enabled=!" + curProxy + "enabled;",
            p.enabled,
            this.fp.getMessage("foxyproxy.enabled.accesskey"),
            this.fp.getMessage("foxyproxy.enabled.label"),
            this.fp.getMessage("foxyproxy.enabled.tooltip"));

          _createCheckMenuItem(sbm,
            curProxy + "animatedIcons=!" + curProxy + "animatedIcons;",
            p.animatedIcons,
            this.fp.getMessage("foxyproxy.animatedicons.accesskey"),
            this.fp.getMessage("foxyproxy.animatedicons.label"),
            this.fp.getMessage("foxyproxy.animatedicons.tooltip"));          
        }

        itm = _createRadioMenuItem(sbm,
          p.id,
          this._cmd,
          pName.substring(0, 1),
          this.fp.getMessage("mode.custom.label", [pName]),
          this.fp.getMessage("mode.custom.tooltip", [pName]));
        itm.setAttribute("style", "color: blue;");
        checkOne.push(itm);

        if (this.fp.advancedMenus) {
          var numMatches = this.fp.proxies.item(i).matches.length;
          if (!p.lastresort && numMatches > 0) {
            // Don't provide patterns list to lastresort proxy
            // and proxies with no patterns
            var pmp = _createMenu(sbm,
              this.fp.getMessage("foxyproxy.tab.patterns.label"),
              this.fp.getMessage("foxyproxy.tab.patterns.accesskey"),
              this.fp.getMessage("foxyproxy.tab.patterns.tooltip"));

            for (var j=0; j<numMatches; j++) {
              var m = this.fp.proxies.item(i).matches[j];
              var curMatch = curProxy + "matches[" + j + "].";
              _createCheckMenuItem(pmp,
                curMatch + "enabled=!" + curMatch + "enabled;foxyproxy.fp.writeSettings();",
                m.enabled,
                m.pattern.substring(0, 1),
                m.pattern,
                m.name);
            }
          }     
        }
      }

      /*itm = _createRadioMenuItem(menupopup,
        "random",
        this._cmd,
        this.fp.getMessage("mode.random.accesskey"),
        this.fp.getMessage("mode.random.label"),
        this.fp.getMessage("mode.random.tooltip"));
      itm.setAttribute("style", "color: purple;");
      checkOne.push(itm); */

      itm = _createRadioMenuItem(menupopup,
        "disabled",
        this._cmd,
        this.fp.getMessage("mode.disabled.accesskey"),
        this.fp.getMessage("mode.disabled.label"),
        this.fp.getMessage("mode.disabled.tooltip"));
      itm.setAttribute("style", "color: red;");
      checkOne.push(itm);

      // Check the appropriate one
      for (var i=0; i<checkOne.length; i++) {
        if (checkOne[i].getAttribute("value") == this.fp.mode) {
          checkOne[i].setAttribute("checked", "true");
          //checkOne[i].parentNode.setAttribute("style", "font-weight: bold;");
          break;
        }
      }
      menupopup.appendChild(document.createElement("menuseparator"));

      // Advanced menuing
      if (this.fp.advancedMenus) {
        var submenu = document.createElement("menu");
        submenu.setAttribute("label", this.fp.getMessage("more.label"));
        submenu.setAttribute("accesskey", this.fp.getMessage("more.accesskey"));
        submenu.setAttribute("tooltiptext", this.fp.getMessage("more.tooltip"));

        var submenupopup = document.createElement("menupopup");
        submenu.appendChild(submenupopup);

        var gssubmenupopup =
          _createMenu(submenupopup,
            this.fp.getMessage("foxyproxy.tab.global.label"),
            this.fp.getMessage("foxyproxy.tab.global.accesskey"),
            this.fp.getMessage("foxyproxy.tab.global.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          "foxyproxy.fp.proxyDNS=!foxyproxy.fp.proxyDNS;foxyproxy.updateViews(false);foxyproxy.ask(null, foxyproxy.fp.getMessage('foxyproxy.proxydns.notice')) && foxyproxy.fp.restart();",
          this.fp.proxyDNS,
          this.fp.getMessage("foxyproxy.proxydns.accesskey"),
          this.fp.getMessage("foxyproxy.proxydns.label"),
          this.fp.getMessage("foxyproxy.proxydns.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          "foxyproxy.fp.statusbar.iconEnabled=!foxyproxy.fp.statusbar.iconEnabled;foxyproxy.updateViews(false);",
          this.fp.statusbar.iconEnabled,
          this.fp.getMessage("foxyproxy.showstatusbaricon.accesskey"),
          this.fp.getMessage("foxyproxy.showstatusbaricon.label"),
          this.fp.getMessage("foxyproxy.showstatusbaricon.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          "foxyproxy.fp.statusbar.textEnabled=!foxyproxy.fp.statusbar.textEnabled;foxyproxy.updateViews(false);",
          this.fp.statusbar.textEnabled,
          this.fp.getMessage("foxyproxy.showstatusbarmode.accesskey"),
          this.fp.getMessage("foxyproxy.showstatusbarmode.label"),
          this.fp.getMessage("foxyproxy.showstatusbarmode.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          "foxyproxy.fp.toolsMenu=!foxyproxy.fp.toolsMenu;foxyproxy.updateViews(false);",
          this.fp.toolsMenu,
          this.fp.getMessage("foxyproxy.toolsmenu.accesskey"),
          this.fp.getMessage("foxyproxy.toolsmenu.label"),
          this.fp.getMessage("foxyproxy.toolsmenu.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          "foxyproxy.fp.contextMenu=!foxyproxy.fp.contextMenu;foxyproxy.updateViews(false);",
          this.fp.contextMenu,
          this.fp.getMessage("foxyproxy.contextmenu.accesskey"),
          this.fp.getMessage("foxyproxy.contextmenu.label"),
          this.fp.getMessage("foxyproxy.contextmenu.tooltip"));

        _createCheckMenuItem(gssubmenupopup,
          // no need to write settings because changing the attribute makes the fp service re-write the settings
          "foxyproxy.fp.advancedMenus=!foxyproxy.fp.advancedMenus;foxyproxy.updateViews(false);",
          this.fp.advancedMenus,
          this.fp.getMessage("foxyproxy.advancedmenus.accesskey"),
          this.fp.getMessage("foxyproxy.advancedmenus.label"),
          this.fp.getMessage("foxyproxy.advancedmenus.tooltip"));

        var logsubmenupopup =
          _createMenu(submenupopup,
          this.fp.getMessage("foxyproxy.tab.logging.label"),
          this.fp.getMessage("foxyproxy.tab.logging.accesskey"),
          this.fp.getMessage("foxyproxy.tab.logging.tooltip"));

        _createCheckMenuItem(logsubmenupopup,
          // no need to write settings because changing the attribute makes the fp service re-write the settings
          "foxyproxy.fp.logging=!foxyproxy.fp.logging;foxyproxy.updateViews(false);",
          foxyproxy.fp.logging,
          this.fp.getMessage("foxyproxy.enabled.accesskey"),
          this.fp.getMessage("foxyproxy.enabled.label"),
          this.fp.getMessage("foxyproxy.enabled.tooltip"));

        _createMenuItem(logsubmenupopup,
          this.fp.getMessage("foxyproxy.clear.label"),
          "foxyproxy.fp.logg.clear();foxyproxy.updateViews(false, true);",
          this.fp.getMessage("foxyproxy.clear.accesskey"),
          this.fp.getMessage("foxyproxy.clear.tooltip"));

       _createMenuItem(logsubmenupopup,
           this.fp.getMessage("foxyproxy.refresh.label"),
           // Need to refresh the log view so the refresh button is enabled/disabled appropriately
           "foxyproxy.updateViews(false, true);",
           this.fp.getMessage("foxyproxy.refresh.accesskey"),
           this.fp.getMessage("foxyproxy.refresh.tooltip"));

        itm =_createMenuItem(submenupopup,
            this.fp.getMessage("foxyproxy.quickadd.label"),
            "foxyproxy.onQuickAddDialog(event)",
            this.fp.getMessage("foxyproxy.quickadd.accesskey"),
            this.fp.getMessage("foxyproxy.quickadd.tooltip"));
          itm.setAttribute("key", "key_foxyproxyquickadd");
          itm.setAttribute("disabled", disableQuickAdd(this.fp));          

        _createCheckMenuItem(logsubmenupopup,
          // no need to write settings because changing the attribute makes the fp service re-writes the settings
          "foxyproxy.onToggleNoURLs();",
          foxyproxy.fp.logg.noURLs,
          this.fp.getMessage("foxyproxy.logging.noURLs.accesskey"),
          this.fp.getMessage("foxyproxy.logging.noURLs.label"),
          this.fp.getMessage("foxyproxy.logging.noURLs.tooltip"));

        submenupopup.appendChild(document.createElement("menuseparator"));

        itm =_createMenuItem(submenupopup,
          this.fp.getMessage("foxyproxy.options.label"),
          "foxyproxy.onOptionsDialog();",
          this.fp.getMessage("foxyproxy.options.accesskey"),
          this.fp.getMessage("foxyproxy.options.tooltip"));
        itm.setAttribute("key", "key_foxyproxyfocus");

        itm =_createMenuItem(submenupopup,
          this.fp.getMessage("foxyproxy.quickadd.label"),
          "foxyproxy.onQuickAddDialog(event)",
          this.fp.getMessage("foxyproxy.quickadd.accesskey"),
          this.fp.getMessage("foxyproxy.quickadd.tooltip"));
        itm.setAttribute("key", "key_foxyproxyquickadd");
        itm.setAttribute("disabled", disableQuickAdd(this.fp));
                  
        _createMenuItem(submenupopup,
          this.fp.getMessage("foxyproxy.help.label"),
          "foxyproxy.fpc.openAndReuseOneTabPerURL('http://foxyproxy.mozdev.org/help.html');",
          this.fp.getMessage("foxyproxy.help.accesskey"),
          this.fp.getMessage("foxyproxy.help.tooltip"));

        //menupopup.appendChild(asb);
        try {
          menupopup.appendChild(submenu);
        }
        catch (e) {
          // dunno why it throws
        }
      }
      else {
        // advanced menus are disabled
        itm = _createMenuItem(menupopup,
          this.fp.getMessage("foxyproxy.options.label"),
          "foxyproxy.onOptionsDialog();",
          this.fp.getMessage("foxyproxy.options.accesskey"),
          this.fp.getMessage("foxyproxy.options.tooltip"));
        itm.setAttribute("key", "key_foxyproxyfocus");

        
        /* Do the Set Host items. */
        /*var sel = foxyproxy.parseSelection(p),
            tmp = curProxy.substring(0, curProxy.length - 1); // because curProxy includes a final "."
          sbm.appendChild(document.createElement("menuseparator"));
          itm = _createMenuItem(sbm, this.fp.getMessage("change.host", [sel.selection]),
              "foxyproxy.changeHost({proxy:" + tmp + ", host:'" + sel.parsedSelection[0] + "', port:'" + sel.parsedSelection[1] + "', reloadcurtab:false});", null, null);
          itm.setAttribute("disabled", disabledSetHost);
          itm = _createMenuItem(sbm, this.fp.getMessage("change.host.reload", [sel.selection]),
              "foxyproxy.changeHost({proxy:" + tmp + ", host:'" + sel.parsedSelection[0] + "', port:'" + sel.parsedSelection[1] + "', reloadcurtab:true});", null, null);
          itm.setAttribute("disabled", sel.disabled);     
          */
        itm =_createMenuItem(menupopup,
          this.fp.getMessage("foxyproxy.quickadd.label"),
          "foxyproxy.onQuickAddDialog(event)",
          this.fp.getMessage("foxyproxy.quickadd.accesskey"),
          this.fp.getMessage("foxyproxy.quickadd.tooltip"));
        itm.setAttribute("key", "key_foxyproxyquickadd");
        itm.setAttribute("disabled", disableQuickAdd(this.fp));
        
        _createCheckMenuItem(menupopup,
          "foxyproxy.fp.advancedMenus = true;foxyproxy.updateViews(false);",
          this.fp.advancedMenus,
          this.fp.getMessage("foxyproxy.advancedmenus.accesskey"),
          this.fp.getMessage("foxyproxy.advancedmenus.label"),
          this.fp.getMessage("foxyproxy.advancedmenus.tooltip"));
      }
    }
    
    function disableQuickAdd(fp) {
      return fp.mode == "disabled" || !fp.quickadd.enabled;
    }

    function _createMenu(menupopup, label, accesskey, tooltip) {
      var submenu = document.createElement("menu");
      submenu.setAttribute("label", label);
      submenu.setAttribute("accesskey", accesskey);
      submenu.setAttribute("tooltiptext", tooltip);
      var submenupopup = document.createElement("menupopup");
      submenu.appendChild(submenupopup);
      menupopup.appendChild(submenu);
      return submenupopup;
    }

    function _createMenuItem(menupopup, label, cmd, accesskey, tooltip) {
      var e = document.createElement("menuitem");
      e.setAttribute("label", label);
      e.setAttribute("oncommand", cmd);
      e.setAttribute("accesskey", accesskey);
      e.setAttribute("tooltiptext", tooltip);
      menupopup.appendChild(e);
      return e;
    }

    function _createRadioMenuItem(menupopup, id, cmd, accesskey, label, tooltip) {
      var e = document.createElement("menuitem");
      e.setAttribute("label", label);
      e.setAttribute("id", id);
      e.setAttribute("value", id);
      e.setAttribute("type", "radio");
      e.setAttribute("name", "foxyproxy-enabled-type");
      e.setAttribute("tooltiptext", tooltip);
      e.setAttribute("oncommand", cmd);
      e.setAttribute("accesskey", accesskey);
      menupopup.appendChild(e);
      return e;
    }

    function _createCheckMenuItem(menupopup, cmd, checked, accesskey, label, tooltip) {
      var e = document.createElement("menuitem");
      e.setAttribute("label", label);
      e.setAttribute("type", "checkbox");
      e.setAttribute("checked", checked);
      e.setAttribute("tooltiptext", tooltip);
      e.setAttribute("oncommand", cmd);
      e.setAttribute("accesskey", accesskey);
      menupopup.appendChild(e);
      return e;
    }
  },

  onToggleNoURLs : function(owner) {
    this.fp.logg.noURLs=!this.fp.logg.noURLs;
    if (this.fp.logg.noURLs && this.fp.logg.length > 0) {
      var q=this.ask(owner?owner:window, this.fp.getMessage("log.scrub"));
      if (q) {
        this.fp.logg.scrub();
        this.updateViews(false, true);
      }
    }
  }
};

///////////////////////////////////////////////////////

window.addEventListener("load", function(e) { foxyproxy.onLoad(e); }, false);
window.addEventListener("unload", function(e) {
  document.getElementById("appcontent") && document.getElementById("appcontent").removeEventListener("load", this.onPageLoad, true);
  var obSvc = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
  for (var i in foxyproxy.notes) {
    obSvc.removeObserver(foxyproxy, foxyproxy.notes[i]);
  }
}, false);
