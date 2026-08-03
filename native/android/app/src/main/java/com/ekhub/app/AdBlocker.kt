package com.ekhub.app

import android.net.Uri

/**
 * Ad blocking for the embedded WebView.
 *
 * Two layers:
 *  - [isAd] blocks navigation/new-window requests to known ad/tracker hosts.
 *  - [AD_BLOCK_JS] runs inside the page to neuter scripted popups, hijack
 *    target=_blank ad links, and hide ad containers (incl. ones injected late).
 */
object AdBlocker {

    /** Exact hosts + their subdomains get blocked. */
    private val BLOCKED_HOSTS = setOf(
        // Google ad/tracking stack
        "doubleclick.net", "googleadservices.com", "googlesyndication.com",
        "google-analytics.com", "googletagmanager.com", "2mdn.net",
        "adservice.google.com", "advertising.com",
        // Popunder / traffic
        "popads.net", "popcash.net", "popunder.net", "popadsmedia.com",
        "onclickads.net", "onclickprediction.com", "clickadu.com",
        // Streaming/pirate-mirror ad networks
        "adsterra.com", "adsterra.net", "adsterra.me", "adsterra.org",
        "propellerads.com", "propellerclick.com", "exoclick.com", "exosrv.com",
        "juicyads.com", "yllix.com", "adcash.com", "ad-maven.com", "admaven.com",
        "adskeeper.com", "adpushup.com", "admedia.com",
        // Content recommendation / native
        "mgid.com", "taboola.com", "outbrain.com", "revcontent.com",
        "criteo.com", "criteo.net",
        // DSPs / exchanges
        "adnxs.com", "rubiconproject.com", "openx.net", "pubmatic.com",
        "casalemedia.com", "adroll.com", "adsrvr.org", "media.net",
        // Legacy trackers / beacons
        "bidvertiser.com", "adbrite.com", "buysellads.com",
        "scorecardresearch.com", "quantserve.com", "agkn.com",
        "crwdcntrl.net", "2o7.net", "omtrdc.net", "demdex.net",
        // In-app/mobile ad SDKs
        "inmobi.com", "mopub.com", "applovin.com", "vungle.com",
        "adcolony.com", "chartboost.com", "unityads.unity3d.com",
        "admob.com", "admobpro.com", "smaato.net", "verizonmedia.com",
        "onetag-sys.com", "advertising.com"
    )

    private val AD_HOST_MARKERS = listOf(
        ".adserver", ".adsystem", ".adx.", "ads.", "-ads.", "adclick", "adsyst"
    )

    fun isAd(url: String): Boolean {
        val host = runCatching { Uri.parse(url).host }.getOrNull() ?: return false
        return isAdHost(host.lowercase())
    }

    fun isAdHost(host: String): Boolean {
        val h = host.removePrefix("www.")
        for (entry in BLOCKED_HOSTS) {
            if (h == entry || h.endsWith(".$entry")) return true
        }
        for (marker in AD_HOST_MARKERS) {
            if (h.contains(marker)) return true
        }
        return false
    }

    /** Injected into every page to stop ads client-side. */
    val AD_BLOCK_JS: String by lazy {
        val hosts = BLOCKED_HOSTS.joinToString(",") { "\"$it\"" }
        """
        (function () {
          if (window.__ekhubAdBlock) return;
          window.__ekhubAdBlock = true;

          var AD_HOSTS = [$hosts];

          function isAdUrl(u) {
            if (!u) return false;
            var h = '';
            try {
              var a = document.createElement('a');
              a.href = String(u);
              h = (a.hostname || '').toLowerCase().replace(/^www\./, '');
            } catch (e) { return false; }
            for (var i = 0; i < AD_HOSTS.length; i++) {
              var x = AD_HOSTS[i];
              if (h === x || h.indexOf('.' + x) > -1) return true;
            }
            if (/ad(server|system|srvr|click|vertising)|adsystem|pop(up|under)|doubleclick|propeller|adsterra|exoclick/.test(h)) return true;
            return false;
          }

          // Neutralize scripted popups.
          var _open = window.open;
          window.open = function (url) {
            if (url && isAdUrl(url)) return null;
            if (_open) return _open.apply(window, arguments);
            return null;
          };

          // Stop target=_blank ad links before they spawn a new window.
          document.addEventListener('click', function (e) {
            var t = e.target;
            var a = t && t.closest ? t.closest('a[href]') : null;
            if (a && a.target === '_blank' && isAdUrl(a.href)) {
              e.preventDefault();
              e.stopPropagation();
            }
          }, true);

          // Hide ad containers (existing + late-injected).
          var AD_SELECTORS = [
            'ins.adsbygoogle',
            'iframe[id*="google_ads"]', 'iframe[id*="div-gpt"]',
            'iframe[src*="doubleclick"]', 'iframe[src*="adsystem"]',
            'iframe[src*="/ads/"]', 'iframe[src*="adsterra"]',
            'iframe[src*="exoclick"]', 'iframe[src*="popads"]',
            'div[id*="google_ads"]', 'div[id*="div-gpt"]',
            'div[id*="ad_"]', '.ad-container', '.ad-banner', '.ad-placeholder',
            '.advertisement', '.adsbygoogle', '.adslot', '[class*="adsbygoogle"]'
          ];
          function killAds() {
            for (var i = 0; i < AD_SELECTORS.length; i++) {
              var els = document.querySelectorAll(AD_SELECTORS[i]);
              for (var j = 0; j < els.length; j++) {
                var el = els[j];
                if (el && el.parentNode && el.style.display !== 'none') {
                  el.style.display = 'none';
                }
              }
            }
          }
          killAds();
          try {
            new MutationObserver(function () { killAds(); })
              .observe(document.documentElement, { childList: true, subtree: true });
          } catch (e) {}
        })();
        """.trimIndent()
    }
}
