// Chrome Proxy helper
// by zhouzhenster@gmail.com
// https://raw.github.com/henices/Chrome-proxy-helper/master/javascripts/options.js

document.addEventListener('DOMContentLoaded', function () {

    document.querySelector('#save-button').addEventListener('click', save);
    document.querySelector('#adv_checkbox').addEventListener('change', showAdv);
    document.querySelector('#pac-path').addEventListener('input', markDirty);
    document.querySelector('#http-host').addEventListener('input', markDirty);
    document.querySelector('#http-port').addEventListener('input', markDirty);
    document.querySelector('#https-host').addEventListener('input', markDirty);
    document.querySelector('#https-port').addEventListener('input', markDirty);
    document.querySelector('#socks5-host').addEventListener('input', markDirty);
    document.querySelector('#socks5-port').addEventListener('input', markDirty);
    document.querySelector('#rule').addEventListener('change', markDirty);
    document.querySelector('textarea#bypasslist').addEventListener('input', markDirty);
    document.querySelector('#socks4').addEventListener('click', socks5_unchecked);
    document.querySelector('#socks5').addEventListener('click', socks4_unchecked);
    document.querySelector('#cancel-button').addEventListener('click', loadProxyData);
    document.querySelector('#memory-data').addEventListener('change', enableInput);
    document.querySelector('#load-pac').addEventListener('click', memoryData);
    document.querySelector('textarea#pac-rules').addEventListener('input', markDirty);
    document.querySelector('#edit-pac-data').addEventListener('click', showPacData);
    document.querySelector('#ret-pac-data').addEventListener('click', retPacData);
    document.querySelector('#pac-data').addEventListener('input', markDirty);
    
    $('[data-i18n-content]').each(function() {
        var message = chrome.i18n.getMessage(this.getAttribute('data-i18n-content'));
        if (message)
            $(this).html(message);
    }); 

    markClean();
});

loadProxyData();
getProxyInfo();



/**
 * load data in local database and 
 * display it on the options page
 *
 */
function loadProxyData() {

  $(document).ready(function() {

      $('#pac-path').val(localStorage.pacPath || "") ;
      $('#pac-url').val(localStorage.pacUrl || "") ;
      $('#socks5-host').val(localStorage.socks5Host || "");
      $('#socks5-port').val(localStorage.socks5Port || "");
      $('#http-host').val(localStorage.httpHost || "");
      $('#http-port').val(localStorage.httpPort || "");
      $('#https-host').val(localStorage.httpsHost || "");
      $('#https-port').val(localStorage.httpsPort || "");
      $('#rule').val(localStorage.rule || "");
      $('textarea#bypasslist').val(localStorage.bypass || "localhost,127.0.0.1");
      $('textarea#pac-data').val(localStorage.pacData || "");
      $('#pac-via-proxy').val(localStorage.pacViaProxy || "");
      $('#pac-proxy-host').val(localStorage.pacProxyHost || "");
      $('textarea#pac-rules').val(localStorage.pacRules || "");

      if (localStorage.socks5 == 'true') {
        $('#socks5').attr('checked', true);
        $('#socks4').attr('checked', false);
      }

      if (localStorage.socks4 == 'true') {
        $('#socks4').attr('checked', true);
        $('#socks5').attr('checked', false);
      }

      if (localStorage.useMemory == 'true') {
        $('#memory-data').attr('checked', true);
        $('#pac-path').attr("disabled", true);
        $('#pac-via-proxy').attr('disabled', false);
        $('#pac-proxy-host').show();
        $('#pac-data-settings').show();
        //$('textarea#pac-rules').attr('disabled', false);
        if ($('#pac-via-proxy').val() !== 'None')
            $('#pac-proxy-host').attr('disabled', false);
      }

  });

  markClean();

}

/**
 * get chrome browser proxy settings 
 * and display on the options page
 *
 */
function getProxyInfo() {

    var proxyInfo, controlInfo, host, port;

    chrome.proxy.settings.get(
    {'incognito': false},
        function(config) {
            //alert(JSON.stringify(config));
            if (config["value"]["mode"] == "direct") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo =  "Use DIRECT connections.";
            } else if (config["value"]["mode"] == "system" ) {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo =  "Use System's proxy settings.";
            } else if (config["value"]["mode"] == "pac_script") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                var url = config["value"]["pacScript"]["url"];
                if (url)
                    proxyInfo = "PAC script: " + url;
                else {
                    proxyInfo = "PAC script: data:application/x-ns-proxy-autoconfig;"
                }

            } else if (config["value"]["mode"] == "auto_detect") {
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo = "Auto detect mode";
            } else {
                host = config["value"]["rules"][localStorage.rule]["host"];
                port = config["value"]["rules"][localStorage.rule]["port"];
                controlInfo = "levelOfControl: " + config["levelOfControl"];
                proxyInfo = "Proxy server  : " +
                config["value"]["rules"][localStorage.rule]["scheme"] +
                '://' + host + ':' + port.toString();
            }
            $("#proxy-info").text(proxyInfo);
            $("#control-info").text(controlInfo);

            localStorage.proxyInfo = proxyInfo;
        }
    );

}

/**
 * @brief merge pac data
 *
 */
function mergePacData() {
    var pacData;
    var mergeData;

    pacData = localStorage.pacData;
    if (pacData.indexOf('${pac_rules}') !== -1)
        mergeData = pacData.replace('${pac_rules}', localStorage.pacRules);
    else
        mergeData = pacData;

    return mergeData;
}

/**
 * @brief use proxy info to set proxy
 *
 */
function reloadProxy(info) {

    var type, auto, arrayString;
    var proxy = {type: '', host: '', port: ''};
    var config = {
        mode: '',
        pacScript: {},
        rules: {}
    };

    if (info.indexOf('DIRECT') != -1 || info.indexOf('System') != -1 )
        return;

    arrayString = info.split(':');
    auto = arrayString[0];
    type = arrayString[1];

    if (auto.indexOf('PAC') != -1) {
        var mergeData = mergePacData();
        config.mode = 'pac_script';
        if (localStorage.useMemory === "true") {
            config.pacScript.data = mergeData;
            config.pacScript.url = "";
        } else {
            config.pacScript.data = "";
            config.pacScript.url = localStorage.pacPath;
        }
        chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function() {})
    } else {
        if (type.indexOf('http') != -1) {
            proxy.type = 'http';
            proxy.host = localStorage.httpHost;
            proxy.port = parseInt(localStorage.httpPort);
        }
        if (type.indexOf('https') != -1) {
            proxy.type = 'https';
            proxy.host = localStorage.httpsHost;
            proxy.port = parseInt(localStorage.httpsPort);
        }
        if (type.indexOf('socks4') != -1) {
            proxy.type = 'socks4';
            proxy.host = localStorage.socks5Host;
            proxy.port = parseInt(localStorage.socks5Port);
        }
        if (type.indexOf('socks5') != -1) {
            proxy.type = 'socks5';
            proxy.host = localStorage.socks5Host;
            proxy.port = parseInt(localStorage.socks5Port);
        }

        var rule = localStorage.rule;
        var bypasslist = (localStorage.bypass).split(',');
        config.mode = "fixed_servers";
        config.rules.bypassList = bypasslist;
        config["rules"][rule] = {
            scheme: proxy.type,
            host: proxy.host,
            port: proxy.port
        };

        chrome.proxy.settings.set(
        {value: config, scope: 'regular'},
        function() {});
    }
}

/**
 * event handler
 *
 */
function socks5_unchecked() {
    $('#socks5').attr('checked', false);
    markDirty();
}

/**
 * event handler
 *
 */
function socks4_unchecked() {
    $('#socks4').attr('checked', false);
    markDirty();
}

/**
 * event handler
 *
 */
function showAdv() {
    if($('#adv_settings').is(':hidden'))
        $("#adv_settings").show();
    else
        $("#adv_settings").hide();
}

/**
 * input id memory-data handler
 *
 */
function memoryData() {

    if ($('#memory-data').attr('checked')) {
        if (getPac())
            return 1;
    }

    $('#pac-data').val(localStorage.pacData);

    return 0;
}

/**
 * set system proxy
 *
 */
function sysProxy() {

    var config = {
        mode: "system",
    };
    var icon = {
        path: "images/off.png",
    }

    chrome.proxy.settings.set(
            {value: config, scope: 'regular'},
            function() {});

    chrome.browserAction.setIcon(icon);
}

/**
 * button id save click handler
 *
 */
function save() {

  localStorage.pacPath = $('#pac-path').val()||"";
  localStorage.pacUrl = $('#pac-url').val()||"";
  localStorage.socks5Host = $('#socks5-host').val()||"";
  localStorage.socks5Port = $('#socks5-port').val()||"";
  localStorage.httpHost = $('#http-host').val()||"";
  localStorage.httpPort = $('#http-port').val()||"";
  localStorage.httpsHost = $('#https-host').val()||"";
  localStorage.httpsPort = $('#https-port').val()||"";
  localStorage.rule = $("#rule").val()||"singleProxy";
  localStorage.bypass = $("textarea#bypasslist").val()||"localhost,127.0.0.1";
  localStorage.pacViaProxy = $('#pac-via-proxy').val()||"";
  localStorage.pacProxyHost = $('#pac-proxy-host').val()||"";
  localStorage.pacData = $('#pac-data').val()||"";
  localStorage.pacRules = $('textarea#pac-rules').val()||"";

  if ($('#socks5').attr('checked')) {
      localStorage.socks5 = 'true';
  } else {
      localStorage.socks5 = 'false';
  }

  if ($('#socks4').attr('checked')) {
      localStorage.socks4 = 'true';
  } else {
      localStorage.socks4 = 'false';
  }

  if ($('#memory-data').is(':checked')) {
      localStorage.useMemory = true;
  } else {
      localStorage.useMemory = false;
  }

  markClean();
  loadProxyData();

  reloadProxy(localStorage.proxyInfo);
  getProxyInfo();
}

function markDirty() {
  $('#save-button').attr("class", "btn solid red");
}

function markClean() {
  $('#save-button').attr("class", "btn solid grey");
}

function retPacData() {
    enableInput();
    $('#pac-data-info').hide();
}


/**
 * memory-data click handle
 *
 */

function enableInput() {

    if ($('#memory-data').is(':checked')) {

        $("#pac-via-proxy").attr("disabled", false);
        $('#pac-data-settings').show();
        $('#pac-path').attr("disabled", true);

        if ($('#pac-via-proxy').val() !== 'None') {
            $("#pac-proxy-host").show();
            $("#pac-proxy-host").attr("disabled", false);
        }
    } else {
        $('#pac-path').attr("disabled", false);
        $('#pac-data-settings').hide();
        $('#pac-data-info').hide();
        $("#pac-via-proxy").attr("disabled", true);
        $("#pac-proxy-host").attr("disabled", true);
    }
    markDirty();
}

function showPacData() {
    $('#pac-data-info').show();
    $('#pac-data-settings').hide();
}

function disableInput() {
    if ($('#pac-via-proxy').val() === 'None') {
        $('#pac-proxy-host').attr('disabled', true);
        $('#pac-proxy-host').val("");
        $('#pac-proxy-host').hide();
    } else {
        $('#pac-proxy-host').attr('disabled', false);
        $('#pac-proxy-host').show();
    }
}

/**
 * set proxy for get pac data
 *
 */
function setPacProxy() {

    var proxy = {type:'', host:'', port:''};

    pacProxyHost = $('#pac-proxy-host').val().split(':');
    pacViaProxy = $('#pac-via-proxy').val().split(':');

    proxy.type = pacViaProxy[0];
    proxy.host = pacProxyHost[0];
    proxy.port = parseInt(pacProxyHost[1]);

    var config = {
        mode: "fixed_servers",
        rules: {
            singleProxy: {
                scheme: proxy.type,
                host: proxy.host,
                port: proxy.port
            }
        }
    };

    chrome.proxy.settings.set(
        {value: config, scope: 'regular'}, function() {});

}

/**
 * get pac script data from url
 */
function getPac() {

    var req = new XMLHttpRequest();
    var url = $('#pac-url').val();
    var result;
    var pacViaProxy;
    var oldConfig;
    var useProxy;
    var pacData;

    if ( url.indexOf("file") != -1) {
        alert("Local file are not supported. :(");
        return;
    }

    chrome.proxy.settings.get(
        {'incognito': false},
        function(config) {
            oldConfig = config.value;
        }
    );

    pacViaProxy = $('#pac-via-proxy').val();

    // via proxy
    useProxy = pacViaProxy.indexOf('None');

    if (useProxy) {
        setPacProxy();
    }

    // async request
    req.open("GET", url, true);
    req.onreadystatechange = processResponse;
    req.send(null);

    /**
     *  decode pac data and set it to local database
     *  @param {string} ret the response text
     *
     *  @return {string}
     */
    function processPacData(ret) {
        var regx_dbase64 = /decode64\("(.*)"\)/i;
        var regx_find = /FindProxyForURL/i;

        // autoproxy2pac
        if (ret.indexOf('decode64') != -1) {
            match = regx_dbase64.test(ret);
            if (match) {
                var decodePacData = $.base64Decode(RegExp.$1);
                if (regx_find.test(decodePacData)) 
                    localStorage.pacData = decodePacData;
                else
                    localStorage.pacData = "";
            } else 
                localStorage.pacData = "";
        }
        // plain text
        else {
            if (regx_find.test(ret))
                localStorage.pacData = ret;
            else
                localStorage.pacData = "";
        }

        return localStorage.pacData;
    }

    /**
     *  process the reponse text, tell user the result
     *
     */
    function processResponse() {

        if (req.readyState == 4 ) {
            if (req.status == 200) {
                result = req.responseText;
                pacData = processPacData(result);
                if (pacData !== "") {
                    alert('Load pac data OK');
                    $('textarea#pac-data').val(pacData);
                } else {
                    alert('Error pac script, check it again :(');
                }
            } else
                alert('Failed to open the pac url :(');

            // if set proxy, recovery old proxy settings
            if (useProxy)
                chrome.proxy.settings.set(
                    {value: oldConfig, scope: 'regular'},
                    function() {});
        }
    }
}
