(() => {
  const qs = window.PATRIA_SOUL_QUESTIONS || [];
  const names = {opce:'Hrvatsko opće znanje',povijest:'Povijest Hrvatske','domovinski-rat':'Domovinski rat',geografija:'Geografija Hrvatske',priroda:'Priroda Hrvatske',bastina:'Kultura i baština',glagoljica:'Glagoljica',vjera:'Vjera i sakralna baština',sport:'Sport',znanost:'Znanost i izumi'};
  const count = {};
  const bad = [];
  const seen = {};
  qs.forEach((q,i) => {
    count[q.category]=(count[q.category]||0)+1;
    if(!q.question || !Array.isArray(q.answers) || q.answers.length!==4 || !Number.isInteger(q.correctIndex) || q.correctIndex<0 || q.correctIndex>3 || !names[q.category]) bad.push((q.id||i+1)+' — provjeriti zapis');
    const t=String(q.question||'').trim().toLowerCase();
    if(t){seen[t]=seen[t]||[];seen[t].push(q.id||String(i+1));}
  });
  Object.keys(seen).forEach(t=>{if(seen[t].length>1)bad.push('Duplikat: '+seen[t].join(', '));});
  document.getElementById('summary').innerHTML='<strong>'+qs.length+' pitanja</strong> · očekivano 2000 · '+(qs.length===2000?'broj je ispravan':'broj treba provjeriti')+' · tehničkih stavki: '+bad.length;
  const box=document.getElementById('categories');
  Object.keys(names).forEach(k=>{const d=document.createElement('div');d.className='quiz-card';d.innerHTML='<h3>'+names[k]+'</h3><p><strong>'+(count[k]||0)+'</strong> pitanja</p>';box.appendChild(d);});
  const out=document.getElementById('issues');
  if(!bad.length){out.innerHTML='<p>✅ Nema pronađenih tehničkih problema.</p>';return;}
  const ul=document.createElement('ul');bad.slice(0,200).forEach(x=>{const li=document.createElement('li');li.textContent=x;ul.appendChild(li);});out.appendChild(ul);
})();
