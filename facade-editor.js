import {parseFacade,serializeFacade,validateFacade,restoreFacadeConfigs,STORAGE_KEY,ROW_TEMPLATES} from './facade-model.js';
import {drawElevation,facadeSprite,facadeView,facadeFrames} from './facades.js';
import {facadeElevationSummary} from './elevation.js';

export function createFacadeEditor({catalog,buildings,onApply,onOpen,onClose}){
  const $=id=>document.getElementById(id),ids=catalog.map(d=>d.id),definitions=new Map(catalog.map(d=>[d.id,d]));
  const defaults=Object.fromEntries(catalog.map(d=>[d.id,validateFacade(d.config,ids)]));
  $('facade-building').replaceChildren(...catalog.map(d=>{const option=document.createElement('option');option.value=d.id;option.textContent=d.title;return option;}));
  let applied=structuredClone(defaults),drafts,selected=ids[0],previewFace='front',redrawFrame=0,persistenceNote='';
  // Broken/old local data must not prevent a walk. Only this feature's key is read.
  try{
    const restored=restoreFacadeConfigs(catalog,localStorage.getItem(STORAGE_KEY));
    applied=restored.configs;
    if(restored.updated.length)persistenceNote='Обновлены пропорции неизменённых образцов по фото. Ваши отредактированные фасады сохранены.';
  }catch{persistenceNote='Локальные настройки недоступны или повреждены. Загружены образцы.';}
  const dialog=$('facade-dialog'),controls=$('facade-controls');
  function message(text,error=false){$('facade-status').textContent=text;$('facade-status').classList.toggle('error',error);}
  function paint(){
    redrawFrame=0;
    const config=drafts[selected],definition=definitions.get(selected),building=buildings.find(b=>b.id===selected);
    drawElevation($('facade-elevation'),building,definition,config,previewFace);
    const sprite=facadeSprite(building,definition,config,facadeView(building,definition)),canvas=$('facade-iso'),c=canvas.getContext('2d');
    c.clearRect(0,0,canvas.width,canvas.height);const scale=Math.min((canvas.width-24)/sprite.image.width,(canvas.height-16)/sprite.image.height);
    c.drawImage(sprite.image,(canvas.width-sprite.image.width*scale)/2,(canvas.height-sprite.image.height*scale)/2,sprite.image.width*scale,sprite.image.height*scale);
    sprite.image.width=sprite.image.height=1;
  }
  function schedule(){if(!redrawFrame)redrawFrame=requestAnimationFrame(paint);}
  function fill(){
    const c=drafts[selected],definition=definitions.get(selected);
    const faces=facadeFrames(buildings.find(b=>b.id===selected),definition,c);
    if(!faces.some(f=>f.role===previewFace))previewFace='front';
    $('facade-face').replaceChildren(...faces.map(f=>{const o=document.createElement('option');o.value=f.role;o.textContent=f.label;return o;}));
    $('facade-face').value=previewFace;$('facade-face').hidden=faces.length===1;$('facade-face-caption').hidden=faces.length>1;
    $('facade-building').value=selected;$('facade-template').value=c.template;
    for(const field of ['floorHeight','wingBays','windowWidth']){$('facade-'+field).value=c[field];$('value-'+field).textContent=field==='floorHeight'?`${c[field].toFixed(2)} м`:field==='windowWidth'?`${Math.round(c[field]*100)}%`:c[field];}
    $('facade-windowShape').value=c.windowShape;$('facade-windowShape').disabled=c.template==='ribbon-modern';$('detail-parapet').disabled=c.template==='theatre-clock';
    for(const name of Object.keys(c.colors))$('color-'+name).value=c.colors[name];
    for(const name of Object.keys(c.details))$('detail-'+name).checked=c.details[name];
    $('detail-awnings').disabled=!['ochre-archway','canopied-balcony','brick-canopy','arcade-wing','oculus-corners','brick-shop-corner','stucco-niches','rose-shop-attics','rusticated-balcony'].includes(c.template);
    $('detail-shutters').disabled=!ROW_TEMPLATES.includes(c.template)&&!['ochre-archway','cinema-pinnacles','grand-hotel','brick-drum','arched-bow-balconies','canopied-balcony','glazed-bays','stepped-gable','five-attics','paired-frontages','brick-shop-corner','stucco-niches'].includes(c.template);
    $('detail-balconies').disabled=ROW_TEMPLATES.includes(c.template)||['ribbon-modern','brick-portals','glazed-bays','brick-shop-corner','brick-white-frames','stucco-niches'].includes(c.template);
    $('facade-balconies-label').textContent=['rose-shop-attics','rusticated-balcony'].includes(c.template)?'Угловой балкон':'Балконы';
    $('facade-awnings-label').textContent=['rose-shop-attics','rusticated-balcony'].includes(c.template)?'Козырьки':'Маркизы';
    $('facade-turret-label').textContent=c.template==='cinema-pinnacles'?'Шпили аттиков':c.template==='brick-drum'?'Угловая надстройка':c.template==='arched-bow-balconies'?'Башенки аттиков':'Угловая башенка';
    $('detail-turret').disabled=!['corner-turret','arched-bow-balconies','cinema-pinnacles','brick-drum'].includes(c.template);
    $('detail-turret').closest('label').hidden=!['corner-turret','arched-bow-balconies','cinema-pinnacles','brick-drum'].includes(c.template);
    $('facade-shape-label').textContent=c.template==='glazed-bays'?'Окна крайних осей':'Окна основного объёма';
    $('facade-bays-label').textContent=c.template==='theatre-clock'?'Окон над тремя входами':c.template==='officers-assembly'?'Окон главного фасада':['ochre-archway','cinema-pinnacles','grand-hotel','brick-drum'].includes(c.template)?'Окон верхнего ряда':c.template==='ribbon-modern'?'Групп остекления в полосе':c.template==='arched-bow-balconies'?'Окон со стороны проспекта':c.template==='twin-oculus'?'Окон между крайними аттиками':c.template==='brick-shop-corner'?'Витрин по улице Джанаева':c.template==='three-storey-balconies'?'Окон в каждой половине':c.template==='paired-frontages'?'Окон центра / пар северного фасада':c.template==='glazed-bays'?'Переплётов широкого пролёта':ROW_TEMPLATES.includes(c.template)||['corner-turret','stepped-gable','five-attics','oculus-corners','brick-white-frames','stucco-niches','rose-shop-attics','rusticated-balcony','canopied-balcony','brick-portals','brick-canopy'].includes(c.template)?'Окон верхнего ряда':'Окон в боковом крыле';
    $('facade-subtitle').textContent=definition.subtitle;$('facade-note').textContent=definition.note;
    $('facade-elevation-note').textContent=facadeElevationSummary(definition,c).text;
    $('facade-sources').replaceChildren();
    for(const source of definition.sources){const a=document.createElement('a');a.textContent=source.title+' ↗';a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';$('facade-sources').append(a);}
    schedule();
  }
  function readControls(){
    const c=structuredClone(drafts[selected]);c.template=$('facade-template').value;c.windowShape=$('facade-windowShape').value;
    for(const field of ['floorHeight','wingBays','windowWidth'])c[field]=Number($('facade-'+field).value);
    for(const name of Object.keys(c.colors))c.colors[name]=$('color-'+name).value;
    for(const name of Object.keys(c.details))c.details[name]=$('detail-'+name).checked;
    drafts[selected]=validateFacade(c,ids);fill();message('Предпросмотр. Нажмите «Применить», чтобы изменить дома в прогулке.');
  }
  $('facade-face').onchange=()=>{previewFace=$('facade-face').value;schedule();};
  controls.addEventListener('input',readControls);
  $('facade-building').onchange=()=>{selected=$('facade-building').value;fill();message('У каждого дома свои настройки. Применятся все сделанные изменения.');};
  $('facade-default').onclick=()=>{drafts[selected]=structuredClone(defaults[selected]);fill();message('Восстановлен образец по фотографии. Нажмите «Применить».');};
  $('facade-export').onclick=()=>{
    const url=URL.createObjectURL(new Blob([serializeFacade(drafts[selected],ids)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=selected+'-facade.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    message('Настройки выбранного дома выгружены в JSON.');
  };
  $('facade-import').onclick=()=>$('facade-file').click();
  $('facade-file').onchange=async e=>{
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    try{if(file.size>16000)throw new Error('Файл фасада слишком большой (максимум 16 КБ)');const c=parseFacade(await file.text(),ids);drafts[c.buildingId]=c;selected=c.buildingId;fill();message('JSON проверен и открыт в предпросмотре. Нажмите «Применить».');}
    catch(error){message('Не удалось импортировать: '+error.message,true);}
  };
  $('facade-apply').onclick=()=>{
    // Rebuild first, persist only successfully accepted settings.
    try{
      const next=Object.fromEntries(ids.map(id=>[id,validateFacade(drafts[id],ids)]));
      onApply(next,selected);applied=structuredClone(next);
      try{localStorage.setItem(STORAGE_KEY,JSON.stringify(Object.values(applied)));persistenceNote='';}
      catch{persistenceNote='Изменения работают до перезагрузки. Для сохранения выгрузите JSON.';}
      dialog.close();
    }catch(error){message('Не удалось применить: '+error.message,true);}
  };
  $('facade-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{if(redrawFrame)cancelAnimationFrame(redrawFrame);redrawFrame=0;onClose(persistenceNote);});
  return {get:id=>applied[id],configs:()=>structuredClone(applied),open(id=selected){selected=ids.includes(id)?id:selected;drafts=structuredClone(applied);onOpen();dialog.showModal();fill();message(persistenceNote||'Меняйте детали и сравнивайте дома. Применение сохранит настройки в этом браузере.');}};
}
