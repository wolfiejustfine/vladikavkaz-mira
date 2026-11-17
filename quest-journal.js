import {ACHIEVEMENTS,renderAchievements,achievementProgress,badgeChip} from './achievements.js';
import {QUESTS,questObjective} from './quests.js';
export function journalEntries(progress,pois){
  const active=progress.active;
  return QUESTS.map(q=>{const giver=pois.find(p=>p.id===q.giver),target=pois.find(p=>p.id===q.target),status=progress.completed.includes(q.id)?'completed':active?.id===q.id?active.stage:'available';
    return {...q,status,giverName:giver?.name||q.giver,targetName:target?.title||q.target,objective:active?.id===q.id?questObjective(progress):null};
  });
}
export function createJournalView(dialog,{progress,pois,onNavigate}){
  const $=id=>document.getElementById(id);
  let selected='tasks';
  function selectTab(tab,focus=false){
    selected=tab;for(const id of ['tasks','badges']){const button=$('journal-tab-'+id),active=id===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;$('journal-'+(id==='tasks'?'content':'achievements')).hidden=!active;}
    $('journal-help').hidden=tab!=='tasks';if(focus)$('journal-tab-'+tab).focus();
  }
  for(const id of ['tasks','badges']){const button=$('journal-tab-'+id);button.onclick=()=>selectTab(id);button.onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();selectTab(e.key==='Home'?'tasks':e.key==='End'?'badges':selected==='tasks'?'badges':'tasks',true);}};}

  function section(title,rows,empty){
    const group=document.createElement('section'),heading=document.createElement('h3');heading.textContent=title;group.append(heading);
    if(!rows.length){const p=document.createElement('p');p.className='journal-empty';p.textContent=empty;group.append(p);}
    for(const row of rows){
      const card=document.createElement('article');card.className='journal-entry';card.dataset.quest=row.id;
      const name=document.createElement('h4');name.textContent=row.title;
      const status=document.createElement('p');status.textContent=row.status==='completed'?'✓ Выполнено':row.status==='inspect'?'1 / 2 · Осмотрите '+row.targetName:row.status==='return'?'2 / 2 · Вернитесь к персонажу: '+row.giverName:'Выдаёт поручение: '+row.giverName+'. Подойдите и поговорите.';
      const giver=document.createElement('small');giver.textContent='От кого: '+row.giverName;
      card.append(name,giver,status);
      const reward=achievementProgress(progress()).find(a=>a.quest===row.id);if(reward)card.append(badgeChip(reward,row.status==='completed'));
      const actions=document.createElement('div');actions.className='journal-actions';
      const add=(text,id,kind)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.navigate=kind;b.onclick=()=>onNavigate(id);actions.append(b);};
      if(row.objective&&row.status==='inspect')add('Показать цель',row.objective,'objective');
      add('На карте: '+row.giverName,row.giver,'giver');card.append(actions);group.append(card);
    }
    $('journal-content').append(group);
  }
  return {render(){
    const p=progress(),rows=journalEntries(p,pois);$('journal-summary').textContent=`Выполнено ${p.completed.length} из ${QUESTS.length}`;
    const earned=renderAchievements($('journal-achievements'),p);$('journal-tab-badges').textContent=`Значки · ${earned} / ${ACHIEVEMENTS.length}`;
    $('journal-content').replaceChildren();
    section('Активное поручение',rows.filter(r=>['inspect','return'].includes(r.status)),'Активных поручений нет. Найдите персонажа в списке ниже и поговорите с ним.');
    section('Выполненные',rows.filter(r=>r.status==='completed'),'Здесь появятся поручения, которые вы сдали персонажам.');
    section('Можно взять',rows.filter(r=>r.status==='available'),'Все поручения выполнены. Можно снова навестить персонажей.');
    selectTab(selected);
  }};
}
