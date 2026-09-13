(() => {
  const params = new URLSearchParams(location.search);
  const category = params.get('category') || 'opce';
  const all = window.PATRIA_SOUL_QUESTIONS || [];
  const questions = all.filter(q => q.category === category).slice(0, 10);
  const categoryNames = {opce:'HRVATSKO OPĆE ZNANJE',povijest:'POVIJEST', 'domovinski-rat':'DOMOVINSKI RAT',geografija:'GEOGRAFIJA HRVATSKE',kultura:'KULTURA I BAŠTINA',glagoljica:'GLAGOLJICA'};
  const label=document.getElementById('category-label');
  if(label) label.textContent=categoryNames[category]||'PATRIA SOUL KVIZ';
  if(!questions.length){location.href='index.html';return;}
  let index=0, score=0, timerId, seconds=20;
  const $=id=>document.getElementById(id);
  function render(){
    clearInterval(timerId); seconds=20;
    $('timer').textContent=seconds;
    $('question-number').textContent=`Pitanje ${index+1}`;
    $('question-text').textContent=questions[index].question;
    $('progress-text').textContent=`${index+1} / ${questions.length}`;
    $('progress-bar').style.width=`${((index+1)/questions.length)*100}%`;
    $('score').textContent=score;
    const box=$('answers'); box.innerHTML='';
    questions[index].answers.forEach((answer,i)=>{
      const b=document.createElement('button'); b.className='answer'; b.type='button'; b.textContent=answer;
      b.addEventListener('click',()=>choose(i,b)); box.appendChild(b);
    });
    timerId=setInterval(()=>{seconds--; $('timer').textContent=seconds;if(seconds<=0){clearInterval(timerId);choose(-1,null);}},1000);
  }
  function choose(choice,clicked){
    clearInterval(timerId);
    const correct=questions[index].correctIndex;
    document.querySelectorAll('.answer').forEach((b,i)=>{b.disabled=true;if(i===correct)b.classList.add('correct');if(i===choice&&choice!==correct)b.classList.add('wrong');});
    if(choice===correct)score++;
    $('score').textContent=score;
    setTimeout(()=>{index++;if(index<questions.length)render();else location.href=`result.html?correct=${score}&percent=${Math.round(score/questions.length*100)}`;},650);
  }
  render();
})();
