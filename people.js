import {promenadeX,PROMENADE} from './landscape.js';
export const NPCS=[
  {id:'guide',name:'Азамат',role:'Знакомство с площадью',x:25,y:64,color:'#617f8c',look:{hat:true},greeting:'Привет! Я Азамат. Люблю гулять здесь и замечать детали. Куда отправимся?',topics:[
    ['Что посмотреть на площади?','Начни с «Александровского»: у него большие арочные окна и скруглённый угол. Потом обойди памятник и загляни к фонтану — там легко задержаться.'],
    ['Как прогуляться по проспекту?','Выходи на центральную дорожку между деревьями. Можно дойти до Кирова пешком, а можно прокатиться на трамвае. Я бы сначала немного прошёлся.'],
    ['Как сесть в трамвай?','Подойди к остановке со стороны аллеи и дождись открытых дверей. Нажми «Сесть» или E. В движении можно заказать выход на следующей остановке.']
  ]},
  {id:'npc-artist',name:'Зарина',role:'Художница на прогулке',y:-80,color:'#a76e65',look:{bag:true},greeting:'Здравствуй! Я Зарина. Собираю в блокноте окна и балконы — каждый дом здесь со своим характером.',topics:[
    ['Как замечать архитектуру?','Выбери одну деталь: арку, карниз или балкон. Сравни её у соседних домов. Иногда ритм окон рассказывает больше, чем общий вид здания.'],
    ['Что ты рисуешь?','Сегодня пробую быстрые зарисовки: только силуэт крыши, цвет стены и тени под окнами. Мелкие детали добавлю позже.'],
    ['Можно изменить фасад в игре?','Да! В меню есть конструктор фасадов. Выбери дом и попробуй другую палитру. Сохрани JSON, если захочешь вернуться к своему варианту.']
  ]},
  {id:'npc-student',name:'Сослан',role:'Студент с фотоаппаратом',y:-260,color:'#667e57',look:{bag:true},greeting:'Привет, я Сослан. Вышел пройтись и поснимать проспект. Тут даже знакомый дом выглядит иначе с другого ракурса.',topics:[
    ['Где искать хороший ракурс?','Попробуй встать у поперечной дорожки: в кадр попадут сразу аллея и фасады. В игре можно сменить ракурс кнопкой в меню или клавишей Q.'],
    ['Куда ведёт аллея?','Если идти отсюда к большим номерам домов, дойдёшь до Кирова. В другую сторону — площадь Ленина. Ориентироваться помогает круглая карта.'],
    ['Что интереснее: пешком или трамвай?','Я иду пешком, когда хочу рассмотреть детали, а трамвай выбираю, чтобы увидеть проспект целиком. Можно выйти на следующей остановке и продолжить прогулку.']
  ]},
  {id:'npc-reader',name:'Белла',role:'Читательница у Кирова',y:-390,color:'#8c749a',look:{hat:true},greeting:'Добрый день! Я Белла. Присела отдохнуть от дел и полюбоваться проспектом. Как ваша прогулка?',topics:[
    ['Что тебе нравится на проспекте?','Мне нравится неспешный ритм: деревья, скамейки, разговоры и звон трамвая. Иногда достаточно просто пройти одну остановку пешком.'],
    ['Как вернуться на площадь?','Идите по центральной дорожке в сторону меньших номеров домов. Или дождитесь трамвая в сторону площади. Кнопка со стрелкой возврата тоже перенесёт к началу прогулки.'],
    ['Расскажешь ещё что-нибудь?','Попробуйте пройти тот же участок в обратную сторону. Замечаешь совсем другие окна и балконы. У меня так каждый раз!']
  ]}
].map(n=>({...n,x:n.x??promenadeX(n.y)+.8}));
export function npcPoi(n){return {...n,npc:true,height:3.4,radius:5,title:'Поговорить: '+n.name,eyebrow:n.role.toUpperCase()};}
const colors=['#6e8d83','#bc845e','#7585a1','#a76e65','#89905e','#8c749a'];
// Walkers use two lanes of the already validated pedestrian corridor, never tracks.
export const WALKERS=Array.from({length:20},(_,i)=>{
  const south=110-i*25,north=Math.max(PROMENADE.north+4,south-72-(i%3)*10),lane=i%2===0?-.7:.7;
  const points=[south,...PROMENADE.points.map(p=>p[1]).filter(y=>y>north&&y<south).sort((a,b)=>b-a),north].map(y=>[promenadeX(y)+lane,y]);
  let length=0;const edges=points.slice(1).map((b,j)=>{const a=points[j],d=Math.hypot(b[0]-a[0],b[1]-a[1]),edge={a,b,d,start:length};length+=d;return edge;});
  return {id:'walker-'+i,color:colors[i%colors.length],look:{hat:i%5===0,bag:i%3===0},edges,length,speed:.85+(i%4)*.13,offset:i*13.7,wait:2+i%3};
});
export function walkerAtTime(w,time){
  const travel=w.length/w.speed,cycle=2*(travel+w.wait),t=((Math.max(0,time)+w.offset)%cycle),returning=t>=travel+w.wait;
  const elapsed=returning?t-travel-w.wait:t,moving=elapsed<travel,distance=Math.min(w.length,Math.max(0,elapsed*w.speed)),s=returning?w.length-distance:distance;
  const edge=w.edges.find(e=>s<=e.start+e.d)||w.edges.at(-1),u=Math.min(1,Math.max(0,(s-edge.start)/edge.d));
  return {id:w.id,x:edge.a[0]+(edge.b[0]-edge.a[0])*u,y:edge.a[1]+(edge.b[1]-edge.a[1])*u,dx:(edge.b[0]-edge.a[0])*(returning?-1:1),dy:(edge.b[1]-edge.a[1])*(returning?-1:1),moving,color:w.color,look:w.look,animationTime:time*w.speed+w.offset};
}
