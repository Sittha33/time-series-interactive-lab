/* ============================================================
   Applied Time Series Interactive Lab — common.js
   Navigation, DOM helpers, MathJax, localStorage
   ============================================================ */
(function (global) {
  'use strict';

  // ----- DOM helpers -----
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  function setText(sel, value) { const el = typeof sel === 'string' ? $(sel) : sel; if (el) el.textContent = value; }
  function bindSlider(sliderSel, displaySel, formatter) {
    const slider = typeof sliderSel === 'string' ? $(sliderSel) : sliderSel;
    const disp = typeof displaySel === 'string' ? $(displaySel) : displaySel;
    if (!slider) return;
    const update = () => { if (disp) disp.textContent = (formatter ? formatter(slider.value) : slider.value); };
    update();
    slider.addEventListener('input', update);
    return slider;
  }
  function debounce(fn, wait) {
    let t = null;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), wait);
    };
  }
  function refreshMathJax() {
    if (global.MathJax && global.MathJax.typesetPromise) {
      global.MathJax.typesetPromise().catch(() => {});
    }
  }

  // Force every Plotly chart on the page to resize. Helps after MathJax typesets
  // or when the layout settles late (sticky nav, fonts, etc).
  function resizeAllPlots() {
    if (!global.Plotly) return;
    document.querySelectorAll('.plot').forEach(el => {
      if (!el.id) return;
      try { global.Plotly.Plots.resize(el.id); } catch (_) {}
    });
  }
  // Resize on window resize + once shortly after load (to catch initial layout shifts)
  global.addEventListener('resize', debounce(resizeAllPlots, 120));
  global.addEventListener('load', () => {
    setTimeout(resizeAllPlots, 200);
    setTimeout(resizeAllPlots, 800);
  });

  // ----- LocalStorage helpers -----
  function saveState(key, value) { try { localStorage.setItem('tslab.' + key, JSON.stringify(value)); } catch (_) {} }
  function loadState(key, fallback) {
    try { const v = localStorage.getItem('tslab.' + key); return v == null ? fallback : JSON.parse(v); }
    catch (_) { return fallback; }
  }

  // ----- Chapter manifest -----
  const CHAPTERS = [
    { n: 1,  title: 'Why Time Series Matter',       part: 'Part I: Foundations',           tag: 'Simulator',  intuition: 'Time series have trend, cycles, and noise — order matters.' },
    { n: 2,  title: 'Returns and Financial Data',    part: 'Part I: Foundations',           tag: 'Simulator',  intuition: 'Prices drift; returns are usually more stationary.' },
    { n: 3,  title: 'Probability and Statistics',    part: 'Part I: Foundations',           tag: 'Diagnostic', intuition: 'Same mean can hide very different risk.' },
    { n: 4,  title: 'Visualizing Time Series',       part: 'Part I: Foundations',           tag: 'Exam Lab',   intuition: 'Always plot before modeling — spot the pattern.' },
    { n: 5,  title: 'Smoothing and Trend',           part: 'Part II: Smoothing & Filters',  tag: 'Simulator',  intuition: 'Smoothing reveals trend but introduces lag.' },
    { n: 6,  title: 'Trading Indicators as Filters', part: 'Part II: Smoothing & Filters',  tag: 'Simulator',  intuition: 'Moving-average crossovers lag price movements.' },
    { n: 7,  title: 'Randomness and Dependence',     part: 'Part III: Dependence, Stationarity', tag: 'Simulator', intuition: 'A random-looking series can still be autocorrelated.' },
    { n: 8,  title: 'Stationarity',                  part: 'Part III: Dependence, Stationarity', tag: 'Diagnostic', intuition: 'Stable mean & variance over time — the foundation of everything.' },
    { n: 9,  title: 'ACF and PACF',                  part: 'Part III: Dependence, Stationarity', tag: 'Exam Lab',   intuition: 'AR vs MA pattern recognition with cutoffs and tails.' },
    { n: 10, title: 'Unit Roots and Differencing',   part: 'Part III: Dependence, Stationarity', tag: 'Diagnostic', intuition: 'Differencing turns a unit root into a stationary process.' },
    { n: 11, title: 'AR(p) Models',                  part: 'Part IV: ARIMA Modeling',        tag: 'Simulator',  intuition: 'Persistence via past values — φ controls memory.' },
    { n: 12, title: 'MA(q) Models',                  part: 'Part IV: ARIMA Modeling',        tag: 'Simulator',  intuition: 'Shock propagation — finite memory of past errors.' },
    { n: 13, title: 'ARMA Models',                   part: 'Part IV: ARIMA Modeling',        tag: 'Simulator',  intuition: 'Combine persistence and shock effects.' },
    { n: 14, title: 'ARIMA Models',                  part: 'Part IV: ARIMA Modeling',        tag: 'Simulator',  intuition: 'Difference to handle nonstationarity, then model the rest.' },
    { n: 15, title: 'Forecasting Methods',           part: 'Part V: Forecasting',            tag: 'Forecast Lab', intuition: 'Forecasts decay toward mean (stationary) or stay put (RW).' },
    { n: 16, title: 'Forecast Evaluation',           part: 'Part V: Forecasting',            tag: 'Forecast Lab', intuition: 'Bias, RMSE, MAE, Theil U — pick by loss function.' },
    { n: 17, title: 'Spurious Regression',           part: 'Part VI: Time-Series Regression', tag: 'Exam Lab',  intuition: 'Two random walks can look related by accident.' },
    { n: 18, title: 'Dynamic Regression & ARDL',     part: 'Part VI: Time-Series Regression', tag: 'Simulator', intuition: 'Short-run vs long-run effects unfold over time.' },
    { n: 19, title: 'Granger Causality',             part: 'Part VI: Time-Series Regression', tag: 'Exam Lab',  intuition: 'Predictive content, not philosophical causality.' },
    { n: 20, title: 'Cointegration',                 part: 'Part VI: Time-Series Regression', tag: 'Diagnostic', intuition: 'I(1) variables with a stationary linear combination.' },
    { n: 21, title: 'Error Correction Models',       part: 'Part VI: Time-Series Regression', tag: 'Simulator',  intuition: 'Speed of adjustment back to long-run equilibrium.' },
    { n: 22, title: 'VAR Models',                    part: 'Part VII: Multivariate',         tag: 'Simulator',  intuition: 'Variables jointly endogenous; use IRFs to interpret.' },
    { n: 23, title: 'Impulse Response Functions',    part: 'Part VII: Multivariate',         tag: 'Simulator',  intuition: 'Trace the dynamic ripple of a one-time shock.' },
    { n: 24, title: 'VECM',                          part: 'Part VII: Multivariate',         tag: 'Diagnostic', intuition: 'VAR + cointegration → error-correction in a system.' },
    { n: 25, title: 'ARCH Models',                   part: 'Part VIII: Volatility',          tag: 'Simulator',  intuition: 'Volatility today depends on yesterday\'s squared shock.' },
    { n: 26, title: 'GARCH Models',                  part: 'Part VIII: Volatility',          tag: 'Simulator',  intuition: 'Volatility has memory — α + β controls persistence.' }
  ];

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function chapterFile(n) { return 'ch' + pad2(n) + '.html'; }
  function chapterLink(n) { return n >= 1 && n <= 26 ? chapterFile(n) : null; }

  function buildNav(currentN, containerSel) {
    const c = currentN;
    const meta = CHAPTERS[c - 1];
    const prevHref = c > 1 ? chapterFile(c - 1) : null;
    const nextHref = c < 26 ? chapterFile(c + 1) : null;
    const nav = document.createElement('nav');
    nav.className = 'top-nav';
    nav.innerHTML = `
      <a href="../index.html" class="home-btn">🏠 Home</a>
      <div class="nav-meta"><strong>Ch ${c}.</strong> ${meta.title} <span class="muted"> · ${meta.part}</span></div>
      <a href="${prevHref || '#'}" class="nav-btn secondary ${prevHref ? '' : 'disabled'}">← Prev</a>
      <a href="${nextHref || '#'}" class="nav-btn ${nextHref ? '' : 'disabled'}">Next →</a>
    `;
    const root = containerSel ? $(containerSel) : document.body.firstElementChild;
    if (containerSel) {
      const el = $(containerSel); if (el) el.replaceWith(nav);
    } else {
      document.body.insertBefore(nav, document.body.firstChild);
    }
  }

  function buildFooter(currentN) {
    const c = currentN;
    const prevHref = c > 1 ? chapterFile(c - 1) : null;
    const nextHref = c < 26 ? chapterFile(c + 1) : null;
    const f = document.createElement('footer');
    f.className = 'page-footer';
    f.style.display = 'block';
    f.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>${prevHref ? `<a href="${prevHref}">← Ch ${c - 1}</a>` : '<span class="muted">— start —</span>'}</div>
        <div class="muted">Applied Time Series Interactive Lab</div>
        <div>${nextHref ? `<a href="${nextHref}">Ch ${c + 1} →</a>` : '<span class="muted">— end —</span>'}</div>
      </div>
      <div class="muted" style="text-align: center; font-size: 0.85em; max-width: 800px; margin: 0 auto; line-height: 1.6;">
        <strong>Credits</strong><br>
        Built for master's-level Applied Time Series Course. Special thanks to Professor Dr. Yong Yoon (Chulalongkorn University), whose teachings and insights inspired the creation of this interactive lab.
      </div>
    `;
    document.body.appendChild(f);
  }

  global.TSL = global.TSL || {};
  Object.assign(global.TSL, {
    $: $, $$: $$, setText: setText, bindSlider: bindSlider, debounce: debounce, refreshMathJax: refreshMathJax,
    saveState: saveState, loadState: loadState,
    CHAPTERS: CHAPTERS, pad2: pad2, chapterFile: chapterFile, chapterLink: chapterLink,
    buildNav: buildNav, buildFooter: buildFooter, resizeAllPlots: resizeAllPlots
  });
})(window);
