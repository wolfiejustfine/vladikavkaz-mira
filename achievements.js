import {QUESTS,restoreQuests} from './quests.js';
export const ACHIEVEMENTS=[
  {id:'square-friend',quest:'square-fountain',title:'Друг площади',icon:'fountain',description:'Знакомство с фонтаном и прогулка по площади.',requirement:'Выполните поручение Азамата «Знакомство с фонтаном».'},
  {id:'facade-eye',quest:'artist-facade',title:'Зоркий глаз',icon:'window',description:'Архитектурные детали замечены вместе с Зариной.',requirement:'Выполните поручение Зарины «Детали фасада».'},
  {id:'photo-walker',quest:'student-building',title:'Фотопрогулка',icon:'camera',description:'Найден новый адрес для прогулки с Сосланом.',requirement:'Выполните поручение Сослана «Дом для фотопрогулки».'},
  {id:'cinema-friend',quest:'reader-cinema',title:'У «Гиганта»',icon:'cinema',description:'Здание осмотрено, впечатления переданы Белле.',requirement:'Выполните поручение Беллы «У старого кинотеатра».'},
  {id:'avenue-expert',title:'Знаток проспекта',icon:'star',description:'Все четыре поручения завершены. Проспект стал немного ближе.',requirement:'Выполните все четыре поручения NPC.'}
];
// completed is authoritative: old v1 saves earn badges without a second save key.
export function achievementProgress(progress){
  const {completed}=restoreQuests(progress),done=new Set(completed);
  return ACHIEVEMENTS.map(a=>{const required=a.quest?[a.quest]:QUESTS.map(q=>q.id),count=required.filter(id=>done.has(id)).length;
    return {...a,earned:count===required.length,count,total:required.length};
  });
}
export function newlyEarned(before,after){const old=new Set(achievementProgress(before).filter(a=>a.earned).map(a=>a.id));return achievementProgress(after).filter(a=>a.earned&&!old.has(a.id));}
const shapes={
  fountain:['M8 27h24M11 23q9 6 18 0M20 10v14M13 17q0-6 7-7 7 1 7 7M16 31h8'],
  window:['M11 30V17a9 9 0 0 1 18 0v13zM20 9v21M11 19h18M8 32h24'],
  camera:['M9 14h6l2-4h6l2 4h6v16H9z','M25 22a5 5 0 1 1-10 0 5 5 0 0 1 10 0'],
  cinema:['M8 12h24v18H8zM8 17h24M12 12l4 5M20 12l4 5M28 12l4 5M18 21l6 3-6 3z'],
  star:['M20 7l4 8 9 1-6.5 6.5 1.5 9L20 27l-8 4.5 1.5-9L7 16l9-1z']
};
export function badgeIcon(kind){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 40 40');svg.setAttribute('aria-hidden','true');svg.classList.add('badge-icon');
  for(const d of shapes[kind]||shapes.star){const path=document.createElementNS(ns,'path');path.setAttribute('d',d);svg.append(path);}return svg;
}
export function badgeChip(a,earned){const chip=document.createElement('div');chip.className='badge-chip'+(earned?' earned':'');chip.append(badgeIcon(a.icon));const text=document.createElement('span');text.textContent=(earned?'Получен значок: ':'Награда: ')+a.title;chip.append(text);return chip;}
export function renderAchievements(container,progress){
  const rows=achievementProgress(progress);container.replaceChildren();
  const summary=document.createElement('p');summary.className='badges-summary';summary.textContent=`Получено ${rows.filter(a=>a.earned).length} из ${rows.length}. Значки выдаются после возвращения к NPC и сдачи поручения.`;container.append(summary);
  const grid=document.createElement('div');grid.className='badge-grid';
  for(const a of rows){const card=document.createElement('article');card.className='achievement'+(a.earned?' earned':' locked');card.dataset.achievement=a.id;card.dataset.earned=String(a.earned);
    const medal=document.createElement('div');medal.className='badge-medal';medal.append(badgeIcon(a.icon));
    const info=document.createElement('div'),title=document.createElement('h3'),status=document.createElement('strong'),detail=document.createElement('p');
    title.textContent=a.title;status.textContent=a.earned?'✓ Получен':'Пока не получен';detail.textContent=a.earned?a.description:a.requirement;
    info.append(title,status,detail);if(!a.quest&&!a.earned){const count=document.createElement('small');count.textContent=`Поручения: ${a.count} / ${a.total}`;info.append(count);}card.append(medal,info);grid.append(card);
  }container.append(grid);return rows.filter(a=>a.earned).length;
}
