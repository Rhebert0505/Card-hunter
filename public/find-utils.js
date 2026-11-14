(function(root){
  'use strict';
  function compare(product,total,quantity,now=Date.now()){
    const n=Number(total),q=Number(quantity);
    if(String(total).trim()===''||!Number.isFinite(n)||n<=0||!Number.isInteger(q)||q<1) return {state:'invalid',title:'Enter price and quantity',reason:'Use a total price above zero and a whole number of identical packages or cards.'};
    const unit=n/q;
    if(!product) return {state:'research',title:'Needs research',unit,reason:'Select an exact catalogue match. A similar name or a different package is not a valid price comparison.'};
    const age=now-Date.parse(product.date);
    if(!Number.isFinite(age)||age>48*3600000||age< -3600000||!Number.isFinite(product.market)||product.market<=0) return {state:'research',title:'Needs research',unit,reason:'The reference price is missing or more than 48 hours old. Refresh or verify recent sales before buying.'};
    const ratio=unit/product.market;
    return {state:ratio<=.9?'good':ratio<=1.05?'warn':'bad',title:ratio<=.9?'Below market':ratio<=1.05?'Near market':'Above market',unit,market:product.market,totalMarket:product.market*q,target:product.market*.9,difference:(ratio-1)*100,reason:'Comparison with the exact selected product and variant. The 90% target is a planning guideline; tax, shipping, fees, condition and demand affect what you can resell it for.'};
  }
  function search(rows,query,game,kind){
    const normalize=v=>v.toLowerCase().normalize('NFD').replace(/\p{M}/gu,'');
    const terms=normalize(query).trim().split(/\s+/).filter(Boolean);
    return rows.filter(p=>(!game||p.game===game)&&(!kind||p.kind===kind)&&terms.every(t=>normalize([p.name,p.set,p.number,p.variant,p.game].join(' ')).includes(t)));
  }
  const api={compare,search};
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  else root.FindUtils=api;
})(typeof window==='undefined'?globalThis:window);
