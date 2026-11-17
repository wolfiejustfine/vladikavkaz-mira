export const QUEST_KEY='vladikavkaz.quests.v1';
export const QUESTS=[
  {id:'square-fountain',giver:'guide',title:'Знакомство с фонтаном',target:'fountain',offer:'Найдёшь фонтан «Танцующий Сослан»? Осмотри его и возвращайся — обсудим, что удалось заметить.',thanks:'Спасибо! Теперь у тебя есть ещё одна остановка на площади. В следующий раз попробуй рассмотреть фонтан с другой стороны.'},
  {id:'artist-facade',giver:'npc-artist',title:'Детали фасада',target:'mira40',offer:'Поможешь с зарисовкой? Найди дом на проспекте Мира, 40 и открой его карточку. Затем возвращайся ко мне.',thanks:'Отлично! Можно начинать с общего силуэта, а потом переходить к окнам и балконам. Спасибо за компанию!'},
  {id:'student-building',giver:'npc-student',title:'Дом для фотопрогулки',target:'mira43',offer:'Найди дом на проспекте Мира, 43, осмотри его и возвращайся. Сравним впечатления от прогулки.',thanks:'Спасибо! Один адрес — а сколько деталей можно заметить. В следующий раз выберем другой ракурс.'},
  {id:'reader-cinema',giver:'npc-reader',title:'У старого кинотеатра',target:'mira53',offer:'Прогуляйся до дома Мира, 53 — «Гиганта». Осмотри здание и загляни ко мне снова.',thanks:'Рада, что ты дошёл! Даже короткая прогулка за знакомым адресом помогает увидеть проспект по-новому.'}
];
export function restoreQuests(raw){
  const clean={version:1,active:null,completed:[]};
  try{const value=typeof raw==='string'?JSON.parse(raw):raw;if(value?.version!==1)return clean;
    clean.completed=[...new Set(Array.isArray(value.completed)?value.completed:[])].filter(id=>QUESTS.some(q=>q.id===id));
    const a=value.active;if(a&&QUESTS.some(q=>q.id===a.id)&&!clean.completed.includes(a.id)&&['inspect','return'].includes(a.stage))clean.active={id:a.id,stage:a.stage};
  }catch{}return clean;
}
export function questObjective(progress){const q=QUESTS.find(q=>q.id===progress.active?.id);return q?(progress.active.stage==='inspect'?q.target:q.giver):null;}
export function advanceQuest(progress,event,player,pois){
  const near=id=>{const p=pois.find(p=>p.id===id);return p&&Number.isFinite(player.x)&&Number.isFinite(player.y)&&Math.hypot(player.x-p.x,player.y-p.y)<=p.radius;};
  if(event.type==='cancel')return progress.active?{...progress,active:null}:progress;
  if(event.type==='accept'){
    const q=QUESTS.find(q=>q.id===event.id);return q&&!progress.active&&!progress.completed.includes(q.id)&&near(q.giver)?{...progress,active:{id:q.id,stage:'inspect'}}:progress;
  }
  const q=QUESTS.find(q=>q.id===progress.active?.id);if(!q)return progress;
  if(event.type==='inspect'&&progress.active.stage==='inspect'&&event.poi===q.target&&near(q.target))return {...progress,active:{id:q.id,stage:'return'}};
  if(event.type==='finish'&&progress.active.stage==='return'&&event.id===q.id&&near(q.giver))return {...progress,active:null,completed:[...progress.completed,q.id]};
  return progress;
}
export function createQuestJournal(storage){
  let progress=restoreQuests(null),saved=true;
  try{progress=restoreQuests(storage.getItem(QUEST_KEY));}catch{saved=false;}
  return {snapshot:()=>structuredClone(progress),dispatch(event,player,pois){const next=advanceQuest(progress,event,player,pois);if(next===progress)return false;progress=next;try{storage.setItem(QUEST_KEY,JSON.stringify(progress));saved=true;}catch{saved=false;}return true;},isSaved:()=>saved};
}
