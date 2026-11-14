(function(root){
 'use strict';
 // Reviewed shopping shortlist, with exact English booster product IDs. Prices refresh
 // with the catalog; membership and order are editorial and must be reviewed separately.
 const PICKS={
  'Magic':[
   ['Lorwyn Eclipsed','656318','2026-01-23'],
   ['Avatar: The Last Airbender','648646','2025-11-21'],
   ['FINAL FANTASY','618892','2025-06-13'],
   ['Tarkir: Dragonstorm','619648','2025-04-11'],
   ['The Hobbit','692962','2026-08-14']
  ],
  'Pokémon':[
   ['ME: 30th Celebration','696613','2026-09-16'],
   ['ME06: Delta Reign','712099','2026-11-06'],
   ['ME05: Pitch Black','692944','2026-07-17'],
   ['ME04: Chaos Rising','684446','2026-05-22'],
   ['ME03: Perfect Order','672398','2026-03-27']
  ],
  'One Piece':[
   ["The World's Strongest Warriors",'704756','2026-08-28'],
   ['The Time of Battle','689341','2026-06-12'],
   ["Adventure on Kami's Island",'682056','2026-04-03'],
   ["The Azure Sea's Seven",'666577','2026-01-16'],
   ['Extra Booster: One Piece Heroines Edition Vol. 2','711383','2026-10-30']
  ],
  'Lorcana':[
   ['Hyperia City','706241','2026-10-23'],
   ['Attack of the Vine!','690386','2026-07-24'],
   ['Wilds Unknown','678167','2026-05-15'],
   ['Winterspell','664821','2026-02-20'],
   ['Whispers in the Well','652701','2025-11-14']
  ]
 };
 function shoppingSets(rows,game,now=Date.now()){
  const products=new Map(rows.filter(p=>p.game===game&&p.kind==='sealed').map(p=>[String(p.id).split(':')[0],p]));
  return (PICKS[game]||[]).filter(([,,released])=>Date.parse(released+'T00:00:00Z')<=now)
   .map(([name,id,released])=>({name,released,pack:products.get(id)}))
   .filter(x=>x.pack&&x.pack.set===x.name&&Number.isFinite(x.pack.market)&&x.pack.market>0&&
    Number.isFinite(Date.parse(x.pack.date))&&now-Date.parse(x.pack.date)<=48*3600000&&now-Date.parse(x.pack.date)>=-3600000);
 }
 const api={shoppingSets};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ChaseRanking=api;
})(typeof window==='undefined'?globalThis:window);
