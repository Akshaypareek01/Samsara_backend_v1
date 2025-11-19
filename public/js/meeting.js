window.addEventListener("DOMContentLoaded", function (event) {
  console.log("DOM fully loaded and parsed");
  if (window.location.href.indexOf("meeting.html") !== -1) {
    console.log("Web sdk is start ==>")
    websdkready();

  }
  
});



function websdkready() {
  // var testTool = window.testTool;
  // get meeting args from url
  const parseQuery =  ()=> {
    return (function () {
      var href = window.location.href;
      var queryString = href.substr(href.indexOf("?"));
      var query = {};
      var pairs = (queryString[0] === "?"
        ? queryString.substr(1)
        : queryString
      ).split("&");
      for (var i = 0; i < pairs.length; i += 1) {
        var pair = pairs[i].split("=");
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
      }
      return query;
    })();
  }

  const detectOS=  () => {
    var sUserAgent = navigator.userAgent;
    var isWin =
      navigator.platform === "Win32" || navigator.platform === "Windows";
    var isMac =
      navigator.platform === "Mac68K" ||
      navigator.platform === "MacPPC" ||
      navigator.platform === "Macintosh" ||
      navigator.platform === "MacIntel";
    if (isMac) return "Mac";
    var isUnix = navigator.platform === "X11" && !isWin && !isMac;
    if (isUnix) return "Unix";
    var isLinux = String(navigator.platform).indexOf("Linux") > -1;
    if (isLinux) return "Linux";
    if (isWin) {
      var isWin2K =
        sUserAgent.indexOf("Windows NT 5.0") > -1 ||
        sUserAgent.indexOf("Windows 2000") > -1;
      if (isWin2K) return "Win2000";
      var isWinXP =
        sUserAgent.indexOf("Windows NT 5.1") > -1 ||
        sUserAgent.indexOf("Windows XP") > -1;
      if (isWinXP) return "WinXP";
      var isWin2003 =
        sUserAgent.indexOf("Windows NT 5.2") > -1 ||
        sUserAgent.indexOf("Windows 2003") > -1;
      if (isWin2003) return "Win2003";
      var isWinVista =
        sUserAgent.indexOf("Windows NT 6.0") > -1 ||
        sUserAgent.indexOf("Windows Vista") > -1;
      if (isWinVista) return "WinVista";
      var isWin7 =
        sUserAgent.indexOf("Windows NT 6.1") > -1 ||
        sUserAgent.indexOf("Windows 7") > -1;
      if (isWin7) return "Win7";
      var isWin10 =
        sUserAgent.indexOf("Windows NT 10") > -1 ||
        sUserAgent.indexOf("Windows 10") > -1;
      if (isWin10) return "Win10";
    }
    return "other";
  }

  const getBrowserInfo= () => {
    var agent = navigator.userAgent.toLowerCase();
    var regStr_ff = /firefox\/[\d.]+/gi;
    var regStr_chrome = /chrome\/[\d.]+/gi;
    var regStrChrome2 = /ipad; cpu os (\d+_\d+)/gi;
    var regStr_saf = /version\/[\d.]+/gi;
    var regStr_saf2 = /safari\/[\d.]+/gi;
  
    var regStr_edg = /edg\/[\d.]+/gi;

    // firefox
    if (agent.indexOf("firefox") > 0) {
      return agent.match(regStr_ff);
    }

    // Safari
    if (agent.indexOf("safari") > 0 && agent.indexOf("chrome") < 0) {
      var tmpInfo = "safari/unknow";
      var tmpInfo2;
      tmpInfo = agent.match(regStr_saf);
      tmpInfo2 = agent.match(regStr_saf2);
      if (tmpInfo) {
        tmpInfo = tmpInfo.toString().replace("version", "safari");
      }
      if (tmpInfo2) {
        tmpInfo = tmpInfo2.toString().replace("version", "safari");
      }
      return tmpInfo;
    }

    // IE / Eege
    var tmpIsIE = detectIE();
    if (tmpIsIE) {
      return tmpIsIE;
    }
    // Chrome
    if (agent.indexOf("chrome") > 0) {
      return agent.match(regStr_chrome);
    }

    return "other";
  }

  const b64DecodeUnicode=  (str) => {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(
      atob(str)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  }

  const detectIE= () => {
    var ua = window.navigator.userAgent;

    // Test values; Uncomment to check result …

    // IE 10
    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

    // IE 11
    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

    // Edge 12 (Spartan)
    // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';

    // Edge 13
    // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

    var msie = ua.indexOf("MSIE ");
    if (msie > 0) {
      // IE 10 or older => return version number
      return "IE" + parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)), 10);
    }

    var trident = ua.indexOf("Trident/");
    if (trident > 0) {
      // IE 11 => return version number
      var rv = ua.indexOf("rv:");
      return "IE" + parseInt(ua.substring(rv + 3, ua.indexOf(".", rv)), 10);
    }

    var edge = ua.indexOf("Edge/");
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return (
        "Edge" + parseInt(ua.substring(edge + 5, ua.indexOf(".", edge)), 10)
      );
    }

    // other browser
    return false;
  }

  const isMobileDevice = () => {
    return (
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i)
    );
  }



  var tmpArgs = parseQuery();
  var meetingConfig = {
    sdkKey: tmpArgs.sdkKey,
    meetingNumber: tmpArgs.mn,
    userName: (function () {
      if (tmpArgs.name) {
        try {
          return b64DecodeUnicode(tmpArgs.name);
        } catch (e) {
          return tmpArgs.name;
        }
      }
      return (
        "CDN#" +
        tmpArgs.version +
        "#" +
        detectOS() +
        "#" +
        getBrowserInfo()
      );
    })(),
    passWord: tmpArgs.pwd,
    leaveUrl: "/",
    role: parseInt(tmpArgs.role, 10),
    userEmail: (function () {
      try {
        return b64DecodeUnicode(tmpArgs.email);
      } catch (e) {
        return tmpArgs.email;
      }
    })(),
    lang: tmpArgs.lang,
    signature: tmpArgs.signature || "",
    china: tmpArgs.china === "1",
  };

  // a tool use debug mobile device
  if (isMobileDevice()) {
    // vConsole = new VConsole();
  }
  console.log(JSON.stringify(ZoomMtg.checkSystemRequirements()));

  // it's option if you want to change the MeetingSDK-Web dependency link resources. setZoomJSLib must be run at first
  // ZoomMtg.setZoomJSLib("https://source.zoom.us/{VERSION}/lib", "/av"); // default, don't need call it
  if (meetingConfig.china)
    ZoomMtg.setZoomJSLib("https://jssdk.zoomus.cn/3.1.6/lib", "/av"); // china cdn option

  ZoomMtg.preLoadWasm();
  ZoomMtg.prepareWebSDK();

  function beginJoin(signature) {
    ZoomMtg.i18n.load(meetingConfig.lang);
    ZoomMtg.init({
      leaveUrl: meetingConfig.leaveUrl,
      webEndpoint: meetingConfig.webEndpoint,
      disableCORP: !window.crossOriginIsolated, // default true
      // disablePreview: false, // default false
      externalLinkPage: "./externalLinkPage.html",
      success: function () {
        console.log(meetingConfig);
        console.log("signature", signature);

        ZoomMtg.join({
          meetingNumber: meetingConfig.meetingNumber,
          userName: meetingConfig.userName,
          signature: signature,
          sdkKey: meetingConfig.sdkKey,
          userEmail: meetingConfig.userEmail,
          passWord: meetingConfig.passWord,
          success: function (res) {
            console.log("join meeting success");
            console.log("get attendeelist");
            ZoomMtg.getAttendeeslist({});
            ZoomMtg.getCurrentUser({
              success: function (res) {
                console.log("success getCurrentUser", res.result.currentUser);
              },
            });
          },
          error: function (res) {
            console.log(res);
          },
        });
      },
      error: function (res) {
        console.log(res);
      },
    });

    ZoomMtg.inMeetingServiceListener("onUserJoin", function (data) {
      console.log("inMeetingServiceListener onUserJoin", data);
    });

    ZoomMtg.inMeetingServiceListener("onUserLeave", function (data) {
      console.log("inMeetingServiceListener onUserLeave", data);
    });

    ZoomMtg.inMeetingServiceListener("onUserIsInWaitingRoom", function (data) {
      console.log("inMeetingServiceListener onUserIsInWaitingRoom", data);
    });

    ZoomMtg.inMeetingServiceListener("onMeetingStatus", function (data) {
      console.log("inMeetingServiceListener onMeetingStatus", data);
    });
  }

  beginJoin(meetingConfig.signature);
}
