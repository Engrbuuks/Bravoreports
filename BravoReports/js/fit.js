/*
  FIT
  Real feedback can be much longer than the sample, and team leads can type
  into any text box. This pass makes sure no text is ever cut off by its box
  or pushed past the bottom of a page. For every box (and then every page)
  that overflows it:
    1. eases the text size down a little,
    2. then leaves out the last quotes (the full set stays on the
       "What voters are saying" page where there is more room),
    3. then eases the text down a little more.
  It runs after every build, after edits, and right before printing.
*/
(function () {
  const TEXT = '[data-edit], .qt, .qm, .dmsg b, .dcap, .gtab, .kn, .cap, .def';
  const BOXES = '.page .card, .page .panel, .page .kpi, .page .defs, .dpage .dc, .dpage .dalert, .dpage .dkpi';

  function scaleText(scope, s) {
    scope.querySelectorAll(TEXT).forEach(el => {
      if (!el.dataset.fs) el.dataset.fs = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = (el.dataset.fs * s).toFixed(2) + 'px';
    });
  }
  function shrink(scope, over, from, to) {
    for (let s = from; s >= to - 1e-6; s -= 0.03) {
      if (!over()) return true;
      scaleText(scope, s);
    }
    return !over();
  }
  function drop(scope, over) {
    const items = [...scope.querySelectorAll('[data-drop]')].filter(el => !el.dataset.dropped);
    while (over() && items.length > 1) { const el = items.pop(); el.dataset.dropped = '1'; el.style.display = 'none'; }
    return !over();
  }
  function fitScope(scope, over) {
    if (!over()) return;
    if (shrink(scope, over, 0.97, 0.85)) return;
    if (drop(scope, over)) return;
    shrink(scope, over, 0.82, 0.7);
  }
  const overflowing = el => () => el.scrollHeight > el.clientHeight + 1;

  window.fitReport = function (rep) {
    rep.querySelectorAll('[data-fs]').forEach(el => { el.style.fontSize = ''; delete el.dataset.fs; });
    rep.querySelectorAll('[data-dropped]').forEach(el => { el.style.display = ''; delete el.dataset.dropped; });
    rep.querySelectorAll(BOXES).forEach(box => fitScope(box, overflowing(box)));
    rep.querySelectorAll('.page, .dpage').forEach(page => {
      const area = page.querySelector('.dmain') || page.querySelector('.body');
      if (area) fitScope(page, overflowing(area));
    });
  };
})();
