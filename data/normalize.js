/* PatriaSoul – normalizacija izvornih 800 + 1200 pitanja */
(function () {
  const baseQuestions = [
    {category:'opce',question:'Koji je glavni grad Republike Hrvatske?',answers:['Split','Zagreb','Rijeka','Osijek'],correctIndex:1},
    {category:'opce',question:'Koji se datum obilježava kao Dan državnosti Republike Hrvatske?',answers:['30. svibnja','5. kolovoza','18. studenoga','8. listopada'],correctIndex:0},
    {category:'povijest',question:'Koje je pismo posebno povezano s hrvatskom srednjovjekovnom kulturnom baštinom?',answers:['Glagoljica','Runica','Ćirilica','Latinica'],correctIndex:0},
    {category:'povijest',question:'Koji je kralj okrunjen 925. godine prema tradicionalnom hrvatskom povijesnom računanju?',answers:['Tomislav','Zvonimir','Petar Krešimir IV.','Dmitar Zvonimir'],correctIndex:0},
    {category:'domovinski-rat',question:'Koji se grad posebno obilježava 18. studenoga?',answers:['Vukovar','Pula','Karlovac','Dubrovnik'],correctIndex:0},
    {category:'domovinski-rat',question:'Operacija Oluja započela je 1995. godine?',answers:['1. svibnja','5. kolovoza','4. kolovoza','15. siječnja'],correctIndex:2},
    {category:'geografija',question:'Koji je najviši vrh Hrvatske?',answers:['Dinara (Sinjal)','Sveto brdo','Vaganski vrh','Risnjak'],correctIndex:0},
    {category:'geografija',question:'Koja je najduža rijeka koja cijelim tokom protječe Hrvatskom?',answers:['Kupa','Drava','Sava','Cetina'],correctIndex:3},
    {category:'bastina',question:'Koji je grad poznat po Dioklecijanovoj palači?',answers:['Zadar','Split','Trogir','Šibenik'],correctIndex:1},
    {category:'glagoljica',question:'Kako se zove poznati hrvatski glagoljski spomenik iz 11. stoljeća?',answers:['Bašćanska ploča','Vinodolski zakonik','Istarski razvod','Šibenska molitva'],correctIndex:0}
  ];
  const extra = window.PATRIA_EXTRA_QUESTIONS || {};
  const imported = [];
  const natureTerms = /nacionalni park|park prirode|rijek|planin|jezer|slap|kanjon|ptica|sisav|špilj|krš|vrh |otok/i;
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
    if (c === 'geografija') return natureTerms.test(text) ? 'priroda' : 'geografija';
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
  window.PATRIA_SOUL_QUESTIONS = baseQuestions.concat(imported);
  window.PATRIA_SOUL_QUESTION_META = { imported: imported.length, total: window.PATRIA_SOUL_QUESTIONS.length };
})();
