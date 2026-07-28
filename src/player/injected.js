// Injected into the source page to keep the illusion intact.
//
// Two jobs: (1) stop the page from doing anything that reveals a browser is
// present — popups, redirects, native fullscreen; (2) promote the actual
// <video> to fill the bezel and hide the site's own chrome around it.
//
// This is deliberately generic. Per-site rules are exactly the maintenance
// burden the PRD's technical approach exists to avoid, so this only uses
// heuristics that hold across arbitrary sites.
export const INJECTED_JS = `
(function () {
  if (window.__retroball) return;
  window.__retroball = true;

  var post = function (type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
    } catch (e) {}
  };

  // --- 1. Neutralise popup / redirect ad behaviour -------------------------
  window.open = function () { return null; };
  window.alert = function () {};
  window.confirm = function () { return false; };
  window.print = function () {};

  // Anchors that target a new window are the most common popunder vector.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (a && a.target && a.target !== '_self') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // --- 2. Keep video inline, never native fullscreen ----------------------
  var style = document.createElement('style');
  style.textContent = [
    'html,body{margin:0!important;padding:0!important;background:#111214!important;overflow:hidden!important;height:100%!important;}',
    '.__rb_host{position:fixed!important;top:0!important;left:0!important;width:100vw!important;height:100vh!important;z-index:2147483647!important;background:#111214!important;}',
    '.__rb_host video{width:100%!important;height:100%!important;object-fit:contain!important;background:#111214!important;}',
    '.__rb_hidden{display:none!important;}'
  ].join('');
  document.documentElement.appendChild(style);

  var host = null;

  function largestVideo() {
    var vids = Array.prototype.slice.call(document.querySelectorAll('video'));
    if (!vids.length) return null;
    return vids.sort(function (a, b) {
      return (b.clientWidth * b.clientHeight) - (a.clientWidth * a.clientHeight);
    })[0];
  }

  function promote(video) {
    if (!video || host) return;
    host = document.createElement('div');
    host.className = '__rb_host';
    document.body.appendChild(host);
    host.appendChild(video);

    // Everything that isn't our host is site chrome or an ad overlay.
    Array.prototype.slice.call(document.body.children).forEach(function (el) {
      if (el !== host) el.classList.add('__rb_hidden');
    });

    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.removeAttribute('controls');
    video.play().catch(function () {});

    video.addEventListener('error', function () { post('video-error'); });
    video.addEventListener('playing', function () { post('playing'); });
    video.addEventListener('waiting', function () { post('buffering'); });

    post('video-found');
  }

  // Report what the page actually looks like, so a failed spike is
  // diagnosable from one run instead of needing a second.
  post('diag', {
    host: location.host,
    title: (document.title || '').slice(0, 80),
    iframes: document.querySelectorAll('iframe').length,
    videos: document.querySelectorAll('video').length,
  });

  // Streams are often injected well after DOMContentLoaded, so poll for a
  // while rather than checking once.
  var tries = 0;
  var timer = setInterval(function () {
    tries += 1;
    var v = largestVideo();
    if (v) {
      promote(v);
      clearInterval(timer);
    } else if (tries > 40) {
      clearInterval(timer);
      // Distinguish "no video anywhere" from "video is sealed inside a
      // cross-origin iframe we cannot reach" — completely different fixes.
      post('no-video', {
        iframes: document.querySelectorAll('iframe').length,
        videos: document.querySelectorAll('video').length,
      });
    }
  }, 500);
})();
true;
`;

export default INJECTED_JS;
