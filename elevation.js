import {facadeStoreys,facadeCornices} from './facade-model.js';

const fmt=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1}).format(n);
export function genericElevation(building){
  if(building.elevation)return building.elevation;
  const h=building.height.meters,levels=building.height.levels;
  const mapped=Number.isInteger(levels)&&levels>0;
  // Height and storey count are independent. The former 2-storey minimum
  // invented an extra row of windows on mapped single-storey buildings.
  return {cornice:h,storeys:mapped?levels:Math.max(1,Math.round(h/3.4)),
    storeysStatus:mapped?'map-tag':'unverified',heightStatus:'estimated'};
}
export function storeysEvidence(status){
  return {'photo-checked':'Этажность сверена по фото','document-checked':'Этажность по описанию обследования','map-tag':'Этажей по карте',unverified:'Этажей в модели (не проверено)'}[status]||'Этажей в модели';
}
export function storeysLabel(storeys){
  if(storeys.length===3)return `${storeys[0]} в левом крыле · ${storeys[1]} в центре · ${storeys[2]} в правом`;
  if(storeys.length===2)return `${storeys[0]} со стороны площади · ${storeys[1]} в длинном корпусе`;
  const n=storeys[0];return `${n} ${n===1?'этаж':n<5?'этажа':'этажей'}`;
}
export function facadeElevationSummary(definition,config){
  const original=config.template===definition.config.template;
  const storeys=original&&definition.elevation?.label?definition.elevation.label:storeysLabel(facadeStoreys(config)),cornices=facadeCornices(config);
  return {storeys,cornices,
    evidence:original?'Этажность сверена по фото':'Этажность выбранного шаблона',
    height:`${cornices.map(fmt).join(' / ')} м`,
    text:`${original?'По фото':'В шаблоне'}: ${storeys}. Карниз модели: ≈ ${cornices.map(fmt).join(' / ')} м. Метры оценочные; башенки и аттики выше карниза.`};
}
