/* PatriaSoul – centralna normalizacija izvornih 800 + 1200 pitanja.
   Izvorne banke ostaju neizmijenjene; ovdje se samo dodaje kategorizacija. */
(function () {
  const extra = window.PATRIA_EXTRA_QUESTIONS || {};
  const imported = [];

  // Konzervativno prebacivanje Geografije u Prirodu:
  // geografski pojmovi poput otoka, rijeka, planina i vrhova ostaju Geografija
  // osim ako je pitanje očito o zaštiti prirode, vrstama ili staništima.
  const natureStrong = /nacionalni park|park prirode|zaštić|zaštitni|rezervat|bioraznolik|staništ|endem|flora|fauna|bjeloglavi sup|smeđi medvjed|autohtoni.*sisav|autohtoni.*vrst/i;
  const glagoliticTerms = /glagolj|bašćansk|povaljsk|misal|glagolji/i;

  function categoryFor(sourceCategory, question) {
    const text = String(question || '');
    const c = String(sourceCategory || '').toLowerCase();

    if (c === 'domovinski_rat' || c === 'domovinski-rat') return 'domovinski-rat';
    if (c === 'sport') return 'sport';
    if (c === 'znanost') return 'znanost';
    if (c === 'priroda') return 'priroda';
    if (c === 'glagoljica') return 'glagoljica';
    if (c === 'vjera' || c === 'sakralna_bastina') return 'vjera';
    if (c === 'kultura' || c === 'bastina') return 'bastina';

    if (c === 'geografija') return natureStrong.test(text) ? 'priroda' : 'geografija';

    // Povijesno pitanje ostaje Povijest osim ako je izrazito glagoljično.
    if (c === 'povijest') return glagoliticTerms.test(text) ? 'glagoljica' : 'povijest';

    return c || 'opce';
  }

  Object.keys(extra).forEach(sourceCategory => {
    (extra[sourceCategory] || []).forEach((q, index) => imported.push({
      id: q.id || `${sourceCategory}-${index + 1}`,
      category: categoryFor(sourceCategory, q.question),
      sourceCategory,
      sourceBank: sourceCategory,
      question: q.question,
      answers: Array.isArray(q.answers) ? q.answers.slice() : [],
      correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0
    }));
  });

  window.PATRIA_SOUL_QUESTIONS = imported;
  window.PATRIA_SOUL_QUESTION_META = {
    imported: imported.length,
    expected: 2000,
    total: imported.length,
    categories: [...new Set(imported.map(q => q.category))]
  };
})();
