(function(root){
 'use strict';
 function topSets(rows,game,now=Date.now()){
  if(!game)return [];
  const groups=new Map();
  const fresh=p=>{const age=now-Date.parse(p.date);return Number.isFinite(p.market)&&p.market>0&&Number.isFinite(age)&&age>=-3600000&&age<=48*3600000;};
  for(const p of rows){
   if(p.game!==game||!fresh(p))continue;
   if(!groups.has(p.set))groups.set(p.set,{name:p.set,cards:new Map(),sealed:false});
   const g=groups.get(p.set);
   if(p.kind==='sealed'){g.sealed=true;continue;}
   if(p.kind!=='card')continue;
   const key=String(p.id).split(':')[0],old=g.cards.get(key);
   if(!old||p.market>old.market)g.cards.set(key,p);
  }
  return [...groups.values()].filter(g=>g.sealed&&g.cards.size>=5).map(g=>{
   const cards=[...g.cards.values()].sort((a,b)=>b.market-a.market).slice(0,5);
   return {name:g.name,total:Math.round(cards.reduce((n,p)=>n+p.market,0)*100)/100,cards};
  }).sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name)).slice(0,5);
 }
 const api={topSets};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ChaseRanking=api;
})(typeof window==='undefined'?globalThis:window);
