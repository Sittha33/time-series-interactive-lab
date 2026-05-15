/* ============================================================
   Applied Time Series Interactive Lab — simulations.js
   Pure-JS textbook implementations. All functions exported on
   global object `TSL`.
   ============================================================ */
(function (global) {
  'use strict';

  // ---------- Seeded RNG (Mulberry32) ----------
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t = (t + 0x6D2B79F5) >>> 0;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Stateful normal generator using Box-Muller polar form
  // If `rng` is provided we use it (seeded); else Math.random
  let _spareGauss = null;
  function randn(rng) {
    const rand = rng || Math.random;
    if (_spareGauss !== null) {
      const s = _spareGauss; _spareGauss = null; return s;
    }
    let u, v, s;
    do {
      u = 2 * rand() - 1;
      v = 2 * rand() - 1;
      s = u * u + v * v;
    } while (s >= 1 || s === 0);
    const m = Math.sqrt((-2 * Math.log(s)) / s);
    _spareGauss = v * m;
    return u * m;
  }

  // Seeded version that returns randn function bound to a seed
  function seededRandn(seed) {
    const rng = mulberry32(seed);
    let spare = null;
    return function () {
      if (spare !== null) { const s = spare; spare = null; return s; }
      let u, v, s;
      do {
        u = 2 * rng() - 1;
        v = 2 * rng() - 1;
        s = u * u + v * v;
      } while (s >= 1 || s === 0);
      const m = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * m;
      return u * m;
    };
  }

  // ---------- Generators ----------
  function generateWhiteNoise(n, sigma, seed) {
    sigma = sigma == null ? 1 : sigma;
    const rn = seed != null ? seededRandn(seed) : randn;
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = sigma * rn();
    return out;
  }

  function generateRandomWalk(n, drift, sigma, seed) {
    drift = drift || 0;
    sigma = sigma == null ? 1 : sigma;
    const rn = seed != null ? seededRandn(seed) : randn;
    const out = new Array(n);
    let x = 0;
    for (let i = 0; i < n; i++) {
      x = x + drift + sigma * rn();
      out[i] = x;
    }
    return out;
  }

  // y_t = c + phi * y_{t-1} + sigma * eps_t
  function generateAR1(n, phi, sigma, c, seed) {
    sigma = sigma == null ? 1 : sigma;
    c = c || 0;
    const rn = seed != null ? seededRandn(seed) : randn;
    const out = new Array(n);
    let y = (1 - phi) !== 0 ? c / (1 - phi) : 0; // start near mean
    // burn-in
    for (let i = 0; i < 50; i++) y = c + phi * y + sigma * rn();
    for (let i = 0; i < n; i++) {
      y = c + phi * y + sigma * rn();
      out[i] = y;
    }
    return out;
  }

  // AR(2): y_t = c + phi1 y_{t-1} + phi2 y_{t-2} + e_t
  function generateAR2(n, phi1, phi2, sigma, seed) {
    sigma = sigma == null ? 1 : sigma;
    const rn = seed != null ? seededRandn(seed) : randn;
    const out = new Array(n);
    let y1 = 0, y2 = 0;
    for (let i = 0; i < 50; i++) {
      const y = phi1 * y1 + phi2 * y2 + sigma * rn();
      y2 = y1; y1 = y;
    }
    for (let i = 0; i < n; i++) {
      const y = phi1 * y1 + phi2 * y2 + sigma * rn();
      out[i] = y;
      y2 = y1; y1 = y;
    }
    return out;
  }

  // MA(1): y_t = e_t + theta * e_{t-1}
  function generateMA1(n, theta, sigma, seed) {
    sigma = sigma == null ? 1 : sigma;
    const rn = seed != null ? seededRandn(seed) : randn;
    const eps = new Array(n + 1);
    for (let i = 0; i <= n; i++) eps[i] = sigma * rn();
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = eps[i + 1] + theta * eps[i];
    return out;
  }

  // MA(2)
  function generateMA2(n, theta1, theta2, sigma, seed) {
    sigma = sigma == null ? 1 : sigma;
    const rn = seed != null ? seededRandn(seed) : randn;
    const eps = new Array(n + 2);
    for (let i = 0; i < n + 2; i++) eps[i] = sigma * rn();
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = eps[i + 2] + theta1 * eps[i + 1] + theta2 * eps[i];
    return out;
  }

  // ARMA(1,1): y_t = phi y_{t-1} + e_t + theta e_{t-1}
  function generateARMA11(n, phi, theta, sigma, seed) {
    sigma = sigma == null ? 1 : sigma;
    const rn = seed != null ? seededRandn(seed) : randn;
    const out = new Array(n);
    let y = 0, prevEps = 0;
    for (let i = 0; i < 50; i++) {
      const e = sigma * rn();
      y = phi * y + e + theta * prevEps;
      prevEps = e;
    }
    for (let i = 0; i < n; i++) {
      const e = sigma * rn();
      y = phi * y + e + theta * prevEps;
      out[i] = y;
      prevEps = e;
    }
    return out;
  }

  // Differencing
  function difference(series, d) {
    d = d || 1;
    let s = series.slice();
    for (let k = 0; k < d; k++) {
      const out = new Array(s.length - 1);
      for (let i = 1; i < s.length; i++) out[i - 1] = s[i] - s[i - 1];
      s = out;
    }
    return s;
  }

  // Rolling mean (centered to right - "last k observations")
  function rollingMean(series, window) {
    const n = series.length;
    const out = new Array(n);
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += series[i];
      if (i >= window) sum -= series[i - window];
      if (i >= window - 1) out[i] = sum / window;
      else out[i] = null;
    }
    return out;
  }

  function rollingStd(series, window) {
    const n = series.length;
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      if (i < window - 1) { out[i] = null; continue; }
      let s = 0, ss = 0;
      for (let j = i - window + 1; j <= i; j++) { s += series[j]; ss += series[j] * series[j]; }
      const mean = s / window;
      const v = ss / window - mean * mean;
      out[i] = Math.sqrt(Math.max(v, 0));
    }
    return out;
  }

  // Sample ACF using textbook formula
  // rho_h = sum_{t=h+1..n} (x_t - mean)(x_{t-h} - mean) / sum (x_t-mean)^2
  function acf(series, maxLag) {
    const n = series.length;
    const mean = series.reduce((a, b) => a + b, 0) / n;
    let denom = 0;
    for (let i = 0; i < n; i++) denom += (series[i] - mean) ** 2;
    if (denom < 1e-12) return new Array(maxLag).fill(0);
    const out = new Array(maxLag);
    for (let h = 1; h <= maxLag; h++) {
      let num = 0;
      for (let t = h; t < n; t++) num += (series[t] - mean) * (series[t - h] - mean);
      out[h - 1] = num / denom;
    }
    return out;
  }

  // PACF via Durbin-Levinson recursion
  function pacf(series, maxLag) {
    const rho = [1, ...acf(series, maxLag)];
    const phi = []; // phi[k] is array of partial coefs at order k
    const pacfArr = new Array(maxLag);
    for (let k = 1; k <= maxLag; k++) {
      if (k === 1) {
        const a = rho[1];
        phi[1] = [a];
        pacfArr[0] = a;
      } else {
        let num = rho[k];
        for (let j = 1; j < k; j++) num -= phi[k - 1][j - 1] * rho[k - j];
        let den = 1;
        for (let j = 1; j < k; j++) den -= phi[k - 1][j - 1] * rho[j];
        const phi_kk = den === 0 ? 0 : num / den;
        phi[k] = new Array(k);
        phi[k][k - 1] = phi_kk;
        for (let j = 1; j < k; j++) phi[k][j - 1] = phi[k - 1][j - 1] - phi_kk * phi[k - 1][k - 1 - j];
        pacfArr[k - 1] = phi_kk;
      }
    }
    return pacfArr;
  }

  // Simple OLS: y = a + b x
  function simpleOLS(x, y) {
    const n = x.length;
    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
    const mx = sx / n, my = sy / n;
    let sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) {
      sxx += (x[i] - mx) ** 2;
      sxy += (x[i] - mx) * (y[i] - my);
    }
    const beta = sxx === 0 ? 0 : sxy / sxx;
    const alpha = my - beta * mx;
    const resid = new Array(n);
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
      const yhat = alpha + beta * x[i];
      resid[i] = y[i] - yhat;
      ssRes += resid[i] * resid[i];
      ssTot += (y[i] - my) ** 2;
    }
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
    // pseudo standard error for beta
    const sigma2 = ssRes / Math.max(1, n - 2);
    const seBeta = sxx > 0 ? Math.sqrt(sigma2 / sxx) : 1;
    const tStat = seBeta > 0 ? beta / seBeta : 0;
    return { alpha: alpha, beta: beta, residuals: resid, rSquared: rSquared, seBeta: seBeta, tStat: tStat, sigma2: sigma2 };
  }

  function durbinWatson(residuals) {
    let num = 0, den = 0;
    for (let i = 1; i < residuals.length; i++) num += (residuals[i] - residuals[i - 1]) ** 2;
    for (let i = 0; i < residuals.length; i++) den += residuals[i] * residuals[i];
    return den === 0 ? 2 : num / den;
  }

  // ARCH(1) simulator: e_t = sqrt(h_t) z_t, h_t = a0 + a1 e_{t-1}^2
  function generateARCH(n, a0, a1, seed) {
    const rn = seed != null ? seededRandn(seed) : randn;
    const eps = new Array(n);
    const h = new Array(n);
    let prevE = 0;
    h[0] = a0 / Math.max(1e-6, 1 - a1);
    eps[0] = Math.sqrt(h[0]) * rn();
    prevE = eps[0];
    for (let i = 1; i < n; i++) {
      h[i] = a0 + a1 * prevE * prevE;
      eps[i] = Math.sqrt(Math.max(h[i], 1e-8)) * rn();
      prevE = eps[i];
    }
    return { returns: eps, variance: h };
  }

  // GARCH(1,1)
  function generateGARCH(n, omega, alpha, beta, seed) {
    const rn = seed != null ? seededRandn(seed) : randn;
    const eps = new Array(n);
    const h = new Array(n);
    const persist = alpha + beta;
    h[0] = persist < 1 ? omega / (1 - persist) : 1;
    eps[0] = Math.sqrt(h[0]) * rn();
    for (let i = 1; i < n; i++) {
      h[i] = omega + alpha * eps[i - 1] * eps[i - 1] + beta * h[i - 1];
      eps[i] = Math.sqrt(Math.max(h[i], 1e-8)) * rn();
    }
    return { returns: eps, variance: h };
  }

  // Forecast AR(1) from last observed value (zero-mean form: y_{t+h} = phi^h y_t)
  function forecastAR1(lastValue, phi, horizon) {
    const out = new Array(horizon);
    for (let h = 1; h <= horizon; h++) out[h - 1] = Math.pow(phi, h) * lastValue;
    return out;
  }

  // Random walk forecast = last value
  function forecastRW(lastValue, horizon, drift) {
    drift = drift || 0;
    const out = new Array(horizon);
    for (let h = 1; h <= horizon; h++) out[h - 1] = lastValue + drift * h;
    return out;
  }

  // Approximate forecast intervals for AR(1): sigma_h = sigma * sqrt((1 - phi^{2h}) / (1 - phi^2))
  function forecastIntervalAR1(sigma, phi, horizon) {
    const out = new Array(horizon);
    if (Math.abs(phi) >= 1) {
      // unit root: sigma_h ~ sigma * sqrt(h)
      for (let h = 1; h <= horizon; h++) out[h - 1] = sigma * Math.sqrt(h);
    } else {
      const denom = 1 - phi * phi;
      for (let h = 1; h <= horizon; h++) {
        const sh = sigma * Math.sqrt((1 - Math.pow(phi, 2 * h)) / denom);
        out[h - 1] = sh;
      }
    }
    return out;
  }

  function calculateForecastMetrics(actual, forecast) {
    const n = Math.min(actual.length, forecast.length);
    let bias = 0, mae = 0, mse = 0, mape = 0, denomU = 0, numU = 0;
    let validMape = 0;
    for (let i = 0; i < n; i++) {
      const e = actual[i] - forecast[i];
      bias += e;
      mae += Math.abs(e);
      mse += e * e;
      if (Math.abs(actual[i]) > 1e-6) { mape += Math.abs(e / actual[i]); validMape++; }
      // Theil U2 (vs naive y_{t-1})
      if (i > 0) {
        numU += e * e;
        denomU += (actual[i] - actual[i - 1]) ** 2;
      }
    }
    bias /= n; mae /= n; mse /= n;
    mape = validMape > 0 ? (100 * mape) / validMape : NaN;
    const rmse = Math.sqrt(mse);
    const theilU2 = denomU > 0 ? Math.sqrt(numU / denomU) : NaN;
    return { bias: bias, MAE: mae, MSE: mse, RMSE: rmse, MAPE: mape, TheilU2: theilU2 };
  }

  function zscore(series) {
    const mean = series.reduce((a, b) => a + b, 0) / series.length;
    const v = series.reduce((a, b) => a + (b - mean) ** 2, 0) / series.length;
    const sd = Math.sqrt(v);
    return series.map(x => sd > 0 ? (x - mean) / sd : 0);
  }

  function mean(series) { return series.reduce((a, b) => a + b, 0) / series.length; }
  function variance(series) { const m = mean(series); return series.reduce((a, b) => a + (b - m) ** 2, 0) / series.length; }
  function stddev(series) { return Math.sqrt(variance(series)); }
  function skewness(series) {
    const m = mean(series), s = stddev(series);
    if (s === 0) return 0;
    return series.reduce((a, b) => a + ((b - m) / s) ** 3, 0) / series.length;
  }
  function kurtosis(series) {
    const m = mean(series), s = stddev(series);
    if (s === 0) return 0;
    return series.reduce((a, b) => a + ((b - m) / s) ** 4, 0) / series.length - 3; // excess
  }

  // Half-life helpers
  function halfLife(phi) { if (phi <= 0 || phi >= 1) return NaN; return Math.log(0.5) / Math.log(phi); }

  // Fat-tailed random (Student-t approx via normal/sqrt(chi-sq/df))
  function tDistRandom(df, rng) {
    const z = randn(rng);
    let chi = 0;
    for (let i = 0; i < df; i++) { const r = randn(rng); chi += r * r; }
    return z / Math.sqrt(chi / df);
  }

  // Random walk pair (for spurious regression / cointegration)
  function generatePairRW(n, cointegrated, beta, sigmaSpread, seed) {
    const rn = seed != null ? seededRandn(seed) : randn;
    const x = new Array(n), y = new Array(n);
    let xv = 0;
    const spread = []; let sv = 0;
    for (let i = 0; i < n; i++) {
      xv += rn();
      x[i] = xv;
      if (cointegrated) {
        // spread = stationary AR(1)
        sv = 0.6 * sv + sigmaSpread * rn();
        y[i] = beta * xv + sv;
      } else {
        // independent random walk
        if (i === 0) y[i] = rn();
        else y[i] = y[i - 1] + rn();
      }
    }
    return { x: x, y: y };
  }

  // Public API
  global.TSL = global.TSL || {};
  Object.assign(global.TSL, {
    mulberry32: mulberry32,
    randn: randn,
    seededRandn: seededRandn,
    generateWhiteNoise: generateWhiteNoise,
    generateRandomWalk: generateRandomWalk,
    generateAR1: generateAR1,
    generateAR2: generateAR2,
    generateMA1: generateMA1,
    generateMA2: generateMA2,
    generateARMA11: generateARMA11,
    difference: difference,
    rollingMean: rollingMean,
    rollingStd: rollingStd,
    acf: acf,
    pacf: pacf,
    simpleOLS: simpleOLS,
    durbinWatson: durbinWatson,
    generateARCH: generateARCH,
    generateGARCH: generateGARCH,
    forecastAR1: forecastAR1,
    forecastRW: forecastRW,
    forecastIntervalAR1: forecastIntervalAR1,
    calculateForecastMetrics: calculateForecastMetrics,
    zscore: zscore,
    mean: mean,
    variance: variance,
    stddev: stddev,
    skewness: skewness,
    kurtosis: kurtosis,
    halfLife: halfLife,
    tDistRandom: tDistRandom,
    generatePairRW: generatePairRW
  });
})(window);
