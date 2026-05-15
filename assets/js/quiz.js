/* ============================================================
   Applied Time Series Interactive Lab — quiz.js
   MCQ/True-False renderer with instant feedback and persisted scoring
   ============================================================ */
(function (global) {
  'use strict';

  /*
    Each question object:
    {
      q: 'Question text',
      options: ['A', 'B', 'C', 'D'],
      correct: 1,                // index of correct option
      explain: 'Why ...'
    }
    True/False is just options ['True','False'] with correct 0 or 1.
  */

  function render(rootSel, questions, chapterKey) {
    const root = typeof rootSel === 'string' ? document.querySelector(rootSel) : rootSel;
    if (!root) return;
    root.innerHTML = '';
    const stored = global.TSL.loadState('quiz.' + (chapterKey || 'unknown'), {});
    let attempted = 0, correct = 0;

    questions.forEach((q, idx) => {
      const qDiv = document.createElement('div');
      qDiv.className = 'quiz-q';
      const qText = document.createElement('div');
      qText.className = 'qtext';
      qText.textContent = (idx + 1) + '. ' + q.q;
      qDiv.appendChild(qText);

      const opts = q.options.map((opt, i) => {
        const o = document.createElement('div');
        o.className = 'opt';
        o.textContent = opt;
        o.dataset.idx = i;
        qDiv.appendChild(o);
        return o;
      });

      const expl = document.createElement('div');
      expl.className = 'explain';
      expl.textContent = q.explain || '';
      qDiv.appendChild(expl);

      function reveal(selectedIdx) {
        opts.forEach((o, i) => {
          o.classList.add('disabled');
          if (i === q.correct) o.classList.add('correct');
          else if (i === selectedIdx) o.classList.add('wrong');
        });
        expl.classList.add('show');
      }

      const prevSel = stored[idx];
      if (typeof prevSel === 'number') reveal(prevSel);

      opts.forEach((o, i) => {
        o.addEventListener('click', () => {
          if (o.classList.contains('disabled')) return;
          reveal(i);
          stored[idx] = i;
          global.TSL.saveState('quiz.' + (chapterKey || 'unknown'), stored);
          updateScore();
        });
      });

      root.appendChild(qDiv);
    });

    const score = document.createElement('div');
    score.className = 'score-bar';
    root.appendChild(score);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Quiz';
    resetBtn.style.marginTop = '12px';
    resetBtn.style.padding = '6px 12px';
    resetBtn.style.borderRadius = '8px';
    resetBtn.style.border = '1px solid var(--line)';
    resetBtn.style.background = 'var(--soft)';
    resetBtn.style.color = 'var(--ink)';
    resetBtn.style.cursor = 'pointer';
    resetBtn.style.fontSize = '0.9rem';
    resetBtn.addEventListener('click', () => {
      global.TSL.saveState('quiz.' + (chapterKey || 'unknown'), {});
      render(rootSel, questions, chapterKey);
    });
    root.appendChild(resetBtn);

    function updateScore() {
      attempted = 0; correct = 0;
      questions.forEach((q, idx) => {
        if (typeof stored[idx] === 'number') {
          attempted++;
          if (stored[idx] === q.correct) correct++;
        }
      });
      score.textContent = `Score: ${correct} / ${questions.length} (${attempted} attempted)`;
    }
    updateScore();
  }

  global.TSL = global.TSL || {};
  global.TSL.Quiz = { render: render };
})(window);
