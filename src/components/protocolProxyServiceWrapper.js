Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

var Cc = Components.classes, Ci = Components.interfaces;

function ProtocolProxyServiceWrapper() {
  this.wrappedJSObject = this;
  // Getting the old protocolProxyService in order to execute its methods we are
  // not interested in adapting.
  this.oldPPS = Components.
    classesByID["{E9B301C0-E0E4-11d3-A1A8-0050041CAF44}"].
    getService(Ci.nsIProtocolProxyService);
};

ProtocolProxyServiceWrapper.prototype = {
  oldPPS : null,
  //isGecko17 : false,
  fp : null,

  // nsIProtocolProxyService
  asyncResolve : function(aURI, aFlags, aCallback) {
    // TODO: It seems we are only called if we are Gecko > 17. Can we be sure
    // about this or should we test that here as well every time?
    //this.oldPPS.asyncResolve(aURI, aFlags, aCallback);
    dump("URL is: " + aURI.spec + "\n");
    aCallback.onProxyAvailable(null, aURI, this.fp.applyFilter(null, aURI, null), 0);
  },

  getFailoverForProxy : function(aProxyInfo, aURI, aReason) {
    return this.oldPPS.getFailoverForProxy(aProxyInfo, aURI, aReason);
  },

  newProxyInfo : function(aType, aHost, aPort, aFlags, aFailoverTimeout,
                          aFailoverProxy) {
    return this.oldPPS.newProxyInfo(aType, aHost, aPort, aFlags,
        aFailoverTimeout, aFailoverProxy);
  },

  resolve : function(aURI, aFlags) {
    return this.oldPPS.resolve(aURI, aFlags);
  },

  registerFilter : function(aFilter, aPosition) {
    this.oldPPS.registerFilter(aFilter, aPosition);
  },

  unregisterFilter : function(aFilter) {
    this.oldPPS.unregisterFilter(aFilter);
  },

  // nsIProtocolProxyService2
  reloadPAC : function() {
    this.oldPPS.QueryInterface(nsIProtocolProxyService2).reloadPAC();
  },

  classDescription: "FoxyProxy's protocol proxy service wrapper",
  contractID: "@mozilla.org/network/protocol-proxy-service;1",
  classID: Components.ID("{e52f4b1f-3338-4be6-b9b3-ac0861749627}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIProtocolProxyService,
    Ci.nsIProtocolProxyService2, Ci.nsISupports]),
  _xpcom_factory: {
    singleton: null,
    createInstance: function (aOuter, aIID) {
      if (aOuter) throw CR.NS_ERROR_NO_AGGREGATION;
      if (!this.singleton) this.singleton = new ProtocolProxyServiceWrapper();
      return this.singleton.QueryInterface(aIID);
    }
  }
};

/**
 * XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4)
 * XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 and earlier (Firefox 3.6)
 */
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.
    generateNSGetFactory([ProtocolProxyServiceWrapper]);
else
  var NSGetModule = XPCOMUtils.
    generateNSGetModule([ProtocolProxyServiceWrapper]);
