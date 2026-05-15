# Applied Time Series Interactive Lab

🚀 **Live demo:** https://Sittha33.github.io/time-series-interactive-lab/

An interactive, fully-static educational website for a master's-level Applied Time Series course. Each chapter contains a small simulator, diagnostic plot, formula playground, or exam-style visualization that builds intuition and prepares students for tough applied exams.

## What this is

26 chapter pages covering the full Applied Time Series syllabus (Parts I–VIII), each with:
- An interactive simulator (sliders + live Plotly charts)
- A formula box rendered by MathJax
- Diagnostic interpretation and "what the professor may ask" notes
- An "exam trap" card flagging common student misconceptions
- A mini quiz with instant feedback
- A summary cheat sheet table

## How to run

Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari). Everything is static — no server, no build step. Internet is required only for the Plotly and MathJax CDNs.

To run fully offline, download `plotly.min.js` and `tex-mml-chtml.js` and replace the CDN URLs in each HTML file.

## Folder structure

```
time-series-interactive-lab/
├── index.html                  Course dashboard
├── README.md                   This file
├── assets/
│   ├── css/style.css           Single stylesheet for all pages
│   ├── js/
│   │   ├── common.js           Navigation, DOM helpers, MathJax refresh, localStorage
│   │   ├── simulations.js      White noise, AR, MA, ARMA, ARCH, GARCH, OLS, ACF, PACF
│   │   ├── charts.js           Plotly wrappers (line, multi-line, ACF bars, etc.)
│   │   └── quiz.js             MCQ/true-false renderer with instant feedback
│   └── data/sample_series.json Optional sample data
└── chapters/
    ├── ch01.html .. ch26.html  One page per chapter
```

## Technologies

- Vanilla JavaScript (no framework)
- Plotly.js (CDN) for all charts
- MathJax 3 (CDN) for formula rendering
- Custom CSS (no Tailwind, no build step)
- `localStorage` for per-chapter parameter and quiz state

## How to add a new chapter

1. Copy any existing `chapters/chXX.html` as a template
2. Update the hero section (chapter number, title, intuition, formula)
3. Replace the page-specific `<script>` block at the bottom with your simulation/chart code, reusing functions from `simulations.js` and `charts.js`
4. Add quiz items by passing a `questions[]` array to `Quiz.render(div, questions)` from `quiz.js`
5. Add a card to `index.html` linking to it

## How the simulations work

All random data is generated in JavaScript using a Box-Muller transform for normal variates. Each generator follows the textbook recursion exactly (e.g., AR(1): `y_t = c + φ·y_{t-1} + ε_t`). Sample sizes are capped (default 200–500) to keep the UI responsive. Sliders are debounced (200 ms) before re-simulating.

ACF uses the sample autocovariance formula. PACF uses the Durbin-Levinson recursion. OLS uses the closed-form `β̂ = Σ(x−x̄)(y−ȳ) / Σ(x−x̄)²`.

A "seed lock" is provided where reproducibility matters — the same seed produces the same shock sequence so students can isolate the effect of one parameter at a time.

## Limitations

- Pure-JS implementations: numerically simple, not production-grade
- No Johansen test or formal cointegration p-values — visual intuition only
- VAR / VECM use simulated illustrative dynamics, not full multivariate OLS
- IRFs are recursive simulations, not analytical
- Quiz answers are client-side only (no grading server)

## Educational disclaimer

This project is for educational purposes only. The simulators illustrate textbook concepts; outputs are NOT financial advice. The trading-indicator chapter (Ch 6) is for didactic illustration of moving-average crossovers and should not be used for real trading decisions.

## Credits

Built for master's-level Applied Time Series exam preparation. Special thanks to Professor Dr. Yong Yoon (Chulalongkorn University), whose teachings and insights inspired the creation of this interactive lab.
