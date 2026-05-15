/* ============================================================
   Applied Time Series Interactive Lab — charts.js
   Plotly chart wrappers. All functions exported on global TSL.
   ============================================================ */
(function (global) {
  'use strict';

  const COMMON_LAYOUT = {
    margin: { l: 50, r: 20, t: 65, b: 70 },
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 12, color: '#0f172a' },
    xaxis: { gridcolor: '#e5e7eb', linecolor: '#cbd5e1', zerolinecolor: '#94a3b8' },
    yaxis: { gridcolor: '#e5e7eb', linecolor: '#cbd5e1', zerolinecolor: '#94a3b8' },
    showlegend: true,
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.05, yanchor: 'bottom' }
  };
  const COMMON_CONFIG = { responsive: true, displayModeBar: false };

  // Safe wrapper around Plotly.newPlot that:
  // - waits for the target div to actually exist and have width
  // - forces a resize after first paint
  // - swallows errors so one bad chart cannot break the rest of the page
  function safePlot(divId, data, layout) {
    const el = document.getElementById(divId);
    if (!el) {
      console.warn('safePlot: div not found: ' + divId);
      return;
    }
    if (typeof Plotly === 'undefined') {
      console.warn('safePlot: Plotly not loaded yet for ' + divId);
      return;
    }
    try {
      // Use CSS-driven sizing; let responsive: true handle it. autosize ensures
      // Plotly fills the container even if it has no explicit width attribute.
      layout = Object.assign({ autosize: true }, layout || {});
      delete layout.width;  // never freeze width — responsive must work
      Plotly.newPlot(divId, data, layout, COMMON_CONFIG).then(() => {
        requestAnimationFrame(() => {
          try { Plotly.Plots.resize(divId); } catch (_) {}
        });
      }).catch(err => {
        console.warn('Plot failed for ' + divId + ':', err);
      });
    } catch (err) {
      console.warn('safePlot error for ' + divId + ':', err);
    }
  }

  function plotLine(divId, x, y, title, yLabel, color) {
    const xs = x || Array.from({ length: y.length }, (_, i) => i + 1);
    const trace = { x: xs, y: y, type: 'scatter', mode: 'lines', name: yLabel || 'series', line: { color: color || '#2563eb', width: 2 } };
    const layout = Object.assign({}, COMMON_LAYOUT, { title: title, yaxis: Object.assign({}, COMMON_LAYOUT.yaxis, { title: yLabel || '' }), xaxis: Object.assign({}, COMMON_LAYOUT.xaxis, { title: 't' }) });
    safePlot(divId, [trace], layout);
  }

  function plotMultiLine(divId, traces, title, yLabel) {
    const palette = ['#2563eb', '#b45309', '#15803d', '#b91c1c', '#7c3aed', '#0f766e', '#475569'];
    const data = traces.map((t, i) => {
      if (!t || !t.y) return null;
      const mode = t.mode || 'lines';
      const xs = t.x || Array.from({ length: t.y.length }, (_, k) => k + 1);
      const trace = {
        x: xs,
        y: t.y,
        type: 'scatter',
        mode: mode,
        name: t.name || ('series ' + (i + 1))
      };
      // Only attach line/marker if relevant for the mode (prevents Plotly weirdness with undefined values)
      if (mode.indexOf('lines') !== -1) {
        const line = { color: t.color || palette[i % palette.length], width: t.width || 2 };
        if (t.dash && t.dash !== 'solid') line.dash = t.dash;
        trace.line = line;
      }
      if (mode.indexOf('markers') !== -1 && t.marker) {
        trace.marker = t.marker;
      }
      return trace;
    }).filter(Boolean);
    const layout = Object.assign({}, COMMON_LAYOUT, {
      title: title,
      yaxis: Object.assign({}, COMMON_LAYOUT.yaxis, { title: yLabel || '' }),
      xaxis: Object.assign({}, COMMON_LAYOUT.xaxis, { title: 't' })
    });
    safePlot(divId, data, layout);
  }

  function plotACF(divId, acfValues, title, n) {
    const ci = n ? 1.96 / Math.sqrt(n) : null;
    const x = acfValues.map((_, i) => i + 1);
    const colors = acfValues.map(v => (ci !== null && Math.abs(v) > ci) ? '#2563eb' : '#94a3b8');
    const bar = { x: x, y: acfValues, type: 'bar', marker: { color: colors }, name: 'ACF', width: 0.7 };
    const shapes = [];
    if (ci !== null) {
      shapes.push({ type: 'line', x0: 0.5, x1: x.length + 0.5, y0: ci, y1: ci, line: { dash: 'dash', color: '#b91c1c', width: 1 } });
      shapes.push({ type: 'line', x0: 0.5, x1: x.length + 0.5, y0: -ci, y1: -ci, line: { dash: 'dash', color: '#b91c1c', width: 1 } });
    }
    const layout = Object.assign({}, COMMON_LAYOUT, {
      title: title,
      shapes: shapes,
      showlegend: false,
      xaxis: Object.assign({}, COMMON_LAYOUT.xaxis, { title: 'lag', dtick: 1 }),
      yaxis: Object.assign({}, COMMON_LAYOUT.yaxis, { title: 'autocorr', range: [-1, 1] })
    });
    safePlot(divId, [bar], layout);
  }

  function plotScatter(divId, x, y, title, xLabel, yLabel) {
    const trace = { x: x, y: y, type: 'scatter', mode: 'markers', name: 'data', marker: { color: '#2563eb', size: 5, opacity: 0.7 } };
    const layout = Object.assign({}, COMMON_LAYOUT, {
      title: title,
      showlegend: false,
      xaxis: Object.assign({}, COMMON_LAYOUT.xaxis, { title: xLabel || 'x' }),
      yaxis: Object.assign({}, COMMON_LAYOUT.yaxis, { title: yLabel || 'y' })
    });
    safePlot(divId, [trace], layout);
  }

  function plotForecast(divId, history, forecast, title, ci) {
    const histX = history.map((_, i) => i + 1);
    const fcStart = history.length;
    const fcX = forecast.map((_, i) => fcStart + i + 1);
    const traces = [
      { x: histX, y: history, type: 'scatter', mode: 'lines', name: 'history', line: { color: '#2563eb', width: 2 } },
      { x: fcX, y: forecast, type: 'scatter', mode: 'lines', name: 'forecast', line: { color: '#b91c1c', dash: 'dash', width: 2 } }
    ];
    if (ci) {
      const upper = forecast.map((v, i) => v + 1.96 * ci[i]);
      const lower = forecast.map((v, i) => v - 1.96 * ci[i]);
      traces.push({ x: fcX.concat(fcX.slice().reverse()), y: upper.concat(lower.slice().reverse()), fill: 'toself', fillcolor: 'rgba(185,28,28,0.12)', line: { color: 'transparent' }, name: '95% interval', showlegend: true, type: 'scatter' });
    }
    const layout = Object.assign({}, COMMON_LAYOUT, {
      title: title,
      xaxis: Object.assign({}, COMMON_LAYOUT.xaxis, { title: 't' }),
      yaxis: Object.assign({}, COMMON_LAYOUT.yaxis, { title: 'y' })
    });
    safePlot(divId, traces, layout);
  }

  function plotVolatility(divId, returns, volatility, title) {
    const x = returns.map((_, i) => i + 1);
    const traces = [
      { x: x, y: returns, type: 'scatter', mode: 'lines', name: 'returns', line: { color: '#2563eb', width: 1 } },
      { x: x, y: volatility, type: 'scatter', mode: 'lines', name: 'sqrt(h_t)', line: { color: '#b91c1c', width: 2 }, yaxis: 'y2' }
    ];
    const layout = Object.assign({}, COMMON_LAYOUT, {
      title: title,
      xaxis: Object.assign({}, COMMON_LAYOUT.xaxis, { title: 't' }),
      yaxis: Object.assign({}, COMMON_LAYOUT.yaxis, { title: 'returns' }),
      yaxis2: { title: 'volatility', overlaying: 'y', side: 'right', gridcolor: '#fee2e2', zerolinecolor: '#fca5a5' }
    });
    safePlot(divId, traces, layout);
  }

  function plotHistogram(divId, values, title, bins) {
    const trace = { x: values, type: 'histogram', marker: { color: '#2563eb', opacity: 0.75 }, nbinsx: bins || 30, name: 'count' };
    const layout = Object.assign({}, COMMON_LAYOUT, {
      title: title,
      showlegend: false,
      xaxis: Object.assign({}, COMMON_LAYOUT.xaxis, { title: 'value' }),
      yaxis: Object.assign({}, COMMON_LAYOUT.yaxis, { title: 'frequency' })
    });
    safePlot(divId, [trace], layout);
  }

  function plotResidual(divId, residuals, title) {
    const x = residuals.map((_, i) => i + 1);
    const trace = { x: x, y: residuals, type: 'scatter', mode: 'lines+markers', name: 'residual', line: { color: '#7c3aed', width: 1 }, marker: { size: 3 } };
    const layout = Object.assign({}, COMMON_LAYOUT, {
      title: title,
      showlegend: false,
      shapes: [{ type: 'line', x0: 1, x1: residuals.length, y0: 0, y1: 0, line: { color: '#94a3b8', dash: 'dot' } }],
      xaxis: Object.assign({}, COMMON_LAYOUT.xaxis, { title: 't' }),
      yaxis: Object.assign({}, COMMON_LAYOUT.yaxis, { title: 'residual' })
    });
    safePlot(divId, [trace], layout);
  }

  function plotBars(divId, x, y, title, yLabel, color) {
    const trace = { x: x, y: y, type: 'bar', marker: { color: color || '#2563eb' } };
    const layout = Object.assign({}, COMMON_LAYOUT, {
      title: title, showlegend: false,
      yaxis: Object.assign({}, COMMON_LAYOUT.yaxis, { title: yLabel || '' })
    });
    safePlot(divId, [trace], layout);
  }

  global.TSL = global.TSL || {};
  Object.assign(global.TSL, {
    plotLine: plotLine,
    plotMultiLine: plotMultiLine,
    plotACF: plotACF,
    plotScatter: plotScatter,
    plotForecast: plotForecast,
    plotVolatility: plotVolatility,
    plotHistogram: plotHistogram,
    plotResidual: plotResidual,
    plotBars: plotBars
  });
})(window);
