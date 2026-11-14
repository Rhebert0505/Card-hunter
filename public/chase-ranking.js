(function(root){
 'use strict';
 // Reviewed shopping shortlist, with exact English booster product IDs. Prices refresh
 // with the catalog; membership and order are editorial and must be reviewed separately.
 const PICKS={
  'Magic':[
   ['Lorwyn Eclipsed','656318',40,'2026-01-23'],
   ['Reality Fracture','692982',35,'2026-10-02'],
   ['Marvel Super Heroes','675605',40,'2026-06-26'],
   ['The Hobbit','692962',45,'2026-08-14'],
   ['Star Trek','706141',40,'2026-11-13']
  ],
  'Pokémon':[
   ['ME06: Delta Reign','712099',5,'2026-11-06'],
   ['ME05: Pitch Black','692944',5,'2026-07-17'],
   ['ME04: Chaos Rising','684446',5,'2026-05-22'],
   ['ME03: Perfect Order','672398',5,'2026-03-27'],
   ['ME02: Phantasmal Flames','654144',9,'2025-11-14']
  ],
  'One Piece':[
   ["The World's Strongest Warriors",'704756',6,'2026-08-28'],
   ['The Time of Battle','689341',6,'2026-06-12'],
   ["Adventure on Kami's Island",'682056',6,'2026-04-03'],
   ["The Azure Sea's Seven",'666577',6,'2026-01-16'],
   ['Extra Booster: One Piece Heroines Edition Vol. 2','711383',6,'2026-10-30']
  ],
  'Lorcana':[
   ['Hyperia City','706241',6,'2026-10-23'],
   ['Attack of the Vine!','690386',6,'2026-07-24'],
   ['Wilds Unknown','678167',6,'2026-05-15'],
   ['Winterspell','664821',6,'2026-02-20'],
   ['Whispers in the Well','652701',6,'2025-11-14']
  ]
 };
 function shoppingSets(rows,game,now=Date.now()){
  const products=new Map(rows.filter(p=>p.game===game&&p.kind==='sealed').map(p=>[String(p.id).split(':')[0],p]));
  return (PICKS[game]||[]).filter(([,,,released])=>Date.parse(released+'T00:00:00Z')<=now)
   .map(([name,id,buyCeiling,released])=>({name,buyCeiling,released,pack:products.get(id)}))
   .filter(x=>x.pack&&x.pack.set===x.name&&Number.isFinite(x.pack.market)&&x.pack.market>0&&
    Number.isFinite(Date.parse(x.pack.date))&&now-Date.parse(x.pack.date)<=48*3600000&&now-Date.parse(x.pack.date)>=-3600000);
 }
 const api={shoppingSets};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ChaseRanking=api;
})(typeof window==='undefined'?globalThis:window);
