'use strict';
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>typeof v==='number'&&Number.isFinite(v)?v.toLocaleString('en-US',{style:'currency',currency:'USD'}):'Not verified';
const date=v=>{const d=new Date(v);return Number.isNaN(+d)?'Not available':d.toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'});};

// Announced but not yet priced: explicitly separate research entries from TCGCSV market prices.
const RESEARCH_PRODUCTS=[
 {id:'research-flowing-fists-pack',game:'Pokémon',set:'Mega Evolution—Flowing Fists',groupId:'research-flowing-fists',kind:'sealed',name:'Flowing Fists Booster Pack (unreleased)',variant:'English single booster · RESEARCH',market:null,date:null,url:''},
 {id:'research-flowing-fists-etb',game:'Pokémon',set:'Mega Evolution—Flowing Fists',groupId:'research-flowing-fists',kind:'sealed',name:'Flowing Fists Elite Trainer Box (unreleased)',variant:'English sealed ETB · RESEARCH',market:null,date:null,url:''},
 {id:'research-flowing-fists-lucario',game:'Pokémon',set:'Mega Evolution—Flowing Fists',groupId:'research-flowing-fists',kind:'card',name:'Mega Lucario Z ex — prospective chase',number:'Unconfirmed',variant:'High-rarity variant not verified · RESEARCH',market:null,date:null,url:''},
 {id:'research-flowing-fists-garchomp',game:'Pokémon',set:'Mega Evolution—Flowing Fists',groupId:'research-flowing-fists',kind:'card',name:'Mega Garchomp Z ex — prospective chase',number:'Unconfirmed',variant:'High-rarity variant not verified · RESEARCH',market:null,date:null,url:''},
 {id:'research-flowing-fists-absol',game:'Pokémon',set:'Mega Evolution—Flowing Fists',groupId:'research-flowing-fists',kind:'card',name:'Mega Absol Z ex — featured Pokémon',number:'Unconfirmed',variant:'Chase variant not verified · RESEARCH',market:null,date:null,url:''}
];
function includeResearch(rows){const ids=new Set(rows.map(p=>p.id));return rows.concat(RESEARCH_PRODUCTS.filter(p=>!ids.has(p.id)));}
let DATA=[],chosen=null,findProduct=null,photo='',saved=[];
try{saved=JSON.parse(localStorage.getItem('cardhunter-finds-v1')||'[]');if(!Array.isArray(saved))saved=[];}catch{}
function showView(name){for(const n of ['check','find','browse','chases']){$('#'+n).classList.toggle('hidden',name!==n);document.querySelector('[data-view="'+n+'"]').classList.toggle('active',name===n);}window.scrollTo({top:0,behavior:'smooth'});}
function sourceLink(p){return /^https:\/\/(www\.)?tcgplayer.com\//i.test(p.url)?'<a href="'+esc(p.url)+'" target="_blank" rel="noopener noreferrer">View product and recent sales ↗</a>':'';}
function facts(p){return [['Exact product',p.name],['Game / set',p.game+' / '+p.set],['Variant',p.variant],['Market reference',fmt(p.market)],['Source price date',date(p.date)]].map(([k,v])=>'<div class="stat"><span>'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>').join('')+sourceLink(p)+(p.kind==='card'?'<p class="small">Raw-card reference is not condition-specific. Graded cards need separate research.</p>':'');}
function resultHTML(result){let html='<div class="big">'+esc(result.title)+'</div>';
 if(result.unit!==undefined)html+='<div class="stat"><span>Your price per item</span><strong>'+fmt(result.unit)+'</strong></div>';
 if(result.market!==undefined)html+=[['Market per item',fmt(result.market)],['Market for your quantity',fmt(result.totalMarket)],['90% planning target / item',fmt(result.target)],['Your price vs market',(result.difference>0?'+':'')+result.difference.toFixed(1)+'%']].map(([k,v])=>'<div class="stat"><span>'+k+'</span><strong>'+v+'</strong></div>').join('');
 return html+'<p class="small">'+esc(result.reason)+'</p>';}
function render(){if(!chosen)return;$('#productName').textContent=chosen.name;$('#productType').textContent=chosen.game+' · '+chosen.set+' · '+chosen.variant;$('#facts').innerHTML=facts(chosen);let chase=DATA.filter(p=>p.kind==='card'&&p.game===chosen.game&&p.groupId===chosen.groupId).sort((a,b)=>b.market-a.market)[0];$('#chaseName').textContent=chase?.name||'No priced chase available';$('#chaseNumber').textContent=chase?chase.number+' · '+chase.variant+' · '+date(chase.date):'';$('#rawValue').textContent=chase?fmt(chase.market):'Not verified';let r=FindUtils.compare(chosen,$('#price').value,1);$('#verdict').className='verdict '+r.state;$('#verdict').innerHTML=resultHTML(r);}
function choose(id){chosen=DATA.find(p=>p.id===id);$('#price').value='';$('#picker').classList.add('hidden');render();showView('check');}
function card(p,onChoose){let b=document.createElement('button');b.type='button';b.className='panel listItem';b.innerHTML='<span class="tag">'+esc(p.game)+' · '+esc(p.kind==='sealed'?'Sealed product':'Card')+'</span><h3>'+esc(p.name)+'</h3><div class="small">'+esc(p.set)+(p.number?' · '+esc(p.number):'')+'</div><div class="listBottom"><span>'+esc(p.variant)+'</span><strong>'+fmt(p.market)+'</strong></div>';b.addEventListener('click',()=>onChoose(p.id));return b;}
function fillList(target,query,game,kind,callback){let list=$(target),results=FindUtils.search(DATA,query,game,kind);list.replaceChildren();results.slice(0,50).forEach(p=>list.append(card(p,callback)));let note=document.createElement('p');note.className='small';note.textContent=results.length?results.length+' matches'+(results.length>50?' · Showing 50. Add a set name, card number or package type to narrow your search.':''):'No exact match found. Try fewer words or another spelling. Unsupported items need research.';list.prepend(note);}
let chaseLimit=50,topSetsMode=false,rankedSets=[];
function populateChaseSets(){
 const select=$('#chaseSet'),previous=select.value,game=$('#chaseGame').value;
 if(!game)topSetsMode=false;
 rankedSets=ChaseRanking.shoppingSets(DATA,game);
 const names=topSetsMode?rankedSets.map(s=>s.name):[...new Set(DATA.filter(p=>p.kind==='card'&&(!game||p.game===game)).map(p=>p.set))].sort((a,b)=>a.localeCompare(b));
 select.replaceChildren(new Option(topSetsMode?'All reviewed sets':'All sets',''));
 names.forEach(name=>select.append(new Option(name,name)));
 select.value=names.includes(previous)?previous:'';select.disabled=!names.length;
 const toggle=$('#topSetsToggle');toggle.disabled=!game;toggle.textContent=topSetsMode?'Show all sets':'5 reviewed chase packs';toggle.setAttribute('aria-pressed',String(topSetsMode));
 $('#topSetsPanel').classList.toggle('hidden',!topSetsMode);
 const list=$('#topSetList');list.replaceChildren();
 if(topSetsMode){
  for(const set of rankedSets){
   const button=document.createElement('button');button.className='control';button.type='button';button.style.cssText='text-align:left;margin:0 0 8px;padding:12px;cursor:pointer';
   button.innerHTML='<strong>'+esc(set.name)+'</strong><div class="small">'+esc(set.pack.name)+' · Market '+fmt(set.pack.market)+' · My buy limit '+fmt(set.buyCeiling)+' · View chase cards →</div>';
   button.onclick=()=>{select.value=set.name;$('#chaseSearch').value='';renderChases();$('#chaseCount').scrollIntoView({behavior:'smooth',block:'start'});};
   list.append(button);
  }
  if(!rankedSets.length)list.innerHTML='<p class="small">No reviewed booster picks have fresh market prices for this game. Choose Show all sets and research the exact pack before buying.</p>';
 }
}
function renderChases(reset=true){
 if(reset)chaseLimit=50;
 const game=$('#chaseGame').value,set=$('#chaseSet').value;
 const allowed=new Set(rankedSets.map(s=>s.name));
 const matches=FindUtils.search(DATA,$('#chaseSearch').value,game,'card').filter(p=>(!set||p.set===set)&&(!topSetsMode||(allowed.has(p.set)&&!/Serial Numbered/i.test(p.name)&&!(p.game==='Magic'&&p.set==='The Hobbit'&&p.name==='Smaug the Magnificent (Borderless)')))).sort((a,b)=>b.market-a.market);
 const list=$('#chaseList');list.replaceChildren();
 matches.slice(0,chaseLimit).forEach(p=>list.append(card(p,choose)));
 $('#chaseCount').textContent=matches.length?'Showing '+Math.min(chaseLimit,matches.length)+' of '+matches.length+' cards · Highest market references first. Catalogue includes up to five chase cards per set.':'No cards match this game, set and search. Clear the search or choose another set.';
 $('#chaseMore').classList.toggle('hidden',matches.length<=chaseLimit);
}
function lists(){fillList('#productList',$('#productSearch').value,$('#game').value,'sealed',choose);renderChases();}
function pickerList(){fillList('#pickerList',$('#pickerSearch').value,$('#pickerGame').value,'',choose);}
function findMatches(){findProduct=null;$('#findSelected').textContent='No exact match selected';$('#findResult').innerHTML='';if($('#findQuery').value.trim().length<2){$('#findMatches').replaceChildren();return;}fillList('#findMatches',$('#findQuery').value,$('#findGame').value,'',id=>{findProduct=DATA.find(p=>p.id===id);$('#findSelected').innerHTML=facts(findProduct);$('#findMatches').replaceChildren();assess();});}
function assess(){const result=FindUtils.compare(findProduct,$('#findTotal').value,$('#findQuantity').value);$('#findResult').className='verdict '+result.state;$('#findResult').innerHTML=resultHTML(result);return result;}
function persist(){localStorage.setItem('cardhunter-finds-v1',JSON.stringify(saved));}
function renderSaved(){let list=$('#savedFinds');list.replaceChildren();saved.forEach((f,i)=>{const item=document.createElement('div');item.className='panel';const match=DATA.find(p=>p.id===f.productId);const r=FindUtils.compare(match,f.total,f.quantity);item.innerHTML='<h3>'+esc(f.name)+'</h3><p class="small">'+esc(f.store||'Store not specified')+' · '+esc(date(f.savedAt))+'<br>'+esc(f.quantity)+' items · '+fmt(Number(f.total))+' total · '+esc(r.title)+'</p>';const open=document.createElement('button');open.className='action';open.textContent='Recheck with latest data';open.onclick=()=>{$('#findQuery').value=f.name;$('#findGame').value=f.game||'';$('#findTotal').value=f.total;$('#findQuantity').value=f.quantity;$('#findStore').value=f.store||'';findProduct=match||null;photo=f.photo||'';$('#findPhoto').value='';$('#photoPreview').src=photo;$('#photoPreview').classList.toggle('hidden',!photo);$('#findSelected').innerHTML=match?facts(match):'Saved item has no current exact match. Search and select it again.';$('#findMatches').replaceChildren();assess();showView('find');};const del=document.createElement('button');del.className='action secondary';del.textContent='Remove';del.onclick=()=>{const before=saved.slice();saved.splice(i,1);try{persist();renderSaved();}catch{saved=before;$('#saveNote').textContent='Could not update device storage.';}};item.append(open,del);list.append(item);});if(!saved.length)list.innerHTML='<p class="small">No saved finds yet. Finds stay in this browser on this device.</p>';}
async function loadData(){
 $('#dataStatus').textContent='Loading daily price data…';
 try{const r=await fetch('market-catalog.json',{cache:'no-cache'});if(!r.ok)throw Error('not ready');const feed=await r.json();if(!Array.isArray(feed.products)||!feed.products.length)throw Error('empty');DATA=includeResearch(feed.products);const stale=Date.now()-Date.parse(feed.sourceUpdatedAt)>48*3600000;$('#dataStatus').textContent=(stale?'STALE DATA · ':feed.complete?'Daily prices · ':'Partial refresh · ')+'Source: '+date(feed.sourceUpdatedAt)+' · '+DATA.length.toLocaleString()+' entries. '+(feed.refreshError?'Latest refresh failed; previous prices retained. ':'')+'TCGCSV / TCGplayer. Scheduled daily at 21:17 UTC (3:17 PM CST / 4:17 PM CDT).';$('#coverage').textContent='Coverage: sealed products plus the five highest-priced distinct cards per set across Pokémon, One Piece, Lorcana and Magic. Sports cards and other singles need separate research. Market references can include different raw conditions and exclude tax, fees and shipping.';if(chosen)chosen=DATA.find(p=>p.id===chosen.id)||null;if(findProduct)findProduct=DATA.find(p=>p.id===findProduct.id)||null;if(!chosen)chosen=DATA.find(p=>p.game==='Pokémon'&&p.kind==='sealed')||DATA[0];populateChaseSets();render();lists();pickerList();renderSaved();if(findProduct){$('#findSelected').innerHTML=facts(findProduct);assess();}else{if($('#findQuery').value.trim().length>=2)findMatches();if($('#findTotal').value){$('#findSelected').textContent='Select a current exact match.';assess();}} }
 catch{ $('#dataStatus').textContent='Price feed unavailable. No current price comparisons can be verified. Try Refresh data shortly.';$('#coverage').textContent='Daily sync is scheduled. Saved finds remain on your device.';renderSaved();}
}
for(const id of ['game','pickerGame','findGame'])for(const g of ['Pokémon','One Piece','Lorcana','Magic','Sports Cards','Other']){let o=document.createElement('option');o.value=g;o.textContent=g;$('#'+id).append(o);}
$('#productPicker').onclick=()=>{$('#picker').classList.remove('hidden');pickerList();$('#pickerSearch').focus();};$('#closePicker').onclick=()=>$('#picker').classList.add('hidden');$('#picker').onclick=e=>{if(e.target.id==='picker')$('#picker').classList.add('hidden');};document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#picker').classList.add('hidden');});$('#price').oninput=render;
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>showView(b.dataset.view);
$('#topSetsToggle').onclick=()=>{topSetsMode=!topSetsMode;$('#chaseSet').value='';$('#chaseSearch').value='';populateChaseSets();renderChases();};$('#productSearch').oninput=lists;$('#chaseSearch').oninput=()=>renderChases();$('#chaseSet').onchange=()=>renderChases();$('#chaseGame').onchange=()=>{$('#chaseSet').value='';populateChaseSets();renderChases();};$('#chaseMore').onclick=()=>{chaseLimit+=50;renderChases(false);};$('#game').onchange=lists;$('#pickerSearch').oninput=pickerList;$('#pickerGame').onchange=pickerList;
$('#findQuery').oninput=findMatches;$('#findGame').onchange=findMatches;$('#findTotal').oninput=assess;$('#findQuantity').oninput=assess;$('#assessFind').onclick=assess;
$('#findPhoto').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(!file.type.startsWith('image/'))throw Error('image required');const bitmap=await createImageBitmap(file);let canvas=document.createElement('canvas'),scale=Math.min(1,900/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();photo=canvas.toDataURL('image/jpeg',.7);$('#photoPreview').src=photo;$('#photoPreview').classList.remove('hidden');$('#saveNote').textContent='Photo attached locally. Enter the product name above; photo identification is not automatic.';}catch{$('#saveNote').textContent='Photo could not load. Try a JPEG or enter the product name.';}};
$('#saveFind').onclick=()=>{let name=findProduct?.name||$('#findQuery').value.trim();const r=assess();if(!name||r.state==='invalid'){$('#saveNote').textContent='Enter a product name, total price and quantity first.';return;}const f={name,game:findProduct?.game||$('#findGame').value,productId:findProduct?.id||null,total:$('#findTotal').value,quantity:$('#findQuantity').value,store:$('#findStore').value.trim(),photo,savedAt:new Date().toISOString()};saved.unshift(f);try{persist();$('#saveNote').textContent='Find saved on this device.';renderSaved();}catch{saved.shift();$('#saveNote').textContent='Device storage is full or unavailable. Remove older finds or try a smaller photo.';}};
$('#refreshData').onclick=loadData;document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadData();});loadData();
