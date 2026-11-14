const {test}=require('node:test');const assert=require('node:assert/strict');const {compare,search}=require('../public/find-utils.js');
const now=Date.parse('2026-11-14T12:00:00Z');const pack={id:'a',name:'Example Booster Pack',set:'Set A',number:'',variant:'Normal',game:'Pokémon',kind:'sealed',market:10,date:'2026-11-13T20:00:00Z'};
test('quantity compares per exact package, not total or cards inside',()=>{const r=compare(pack,16,2,now);assert.equal(r.unit,8);assert.equal(r.totalMarket,20);assert.equal(r.title,'Below market');assert.equal(compare(pack,30,2,now).title,'Above market');});
test('stale and absent sources cannot produce buy signals',()=>{assert.equal(compare({...pack,date:'2026-11-10'},1,1,now).state,'research');assert.equal(compare(null,1,1,now).state,'research');assert.equal(compare({...pack,market:null},1,1,now).state,'research');assert.equal(compare({...pack,date:'2026-11-17'},1,1,now).state,'research');});
test('invalid quantities and prices are rejected',()=>{for(const [p,q] of [['',1],[0,1],[-1,1],[10,0],[10,1.5],['oops',2]])assert.equal(compare(pack,p,q,now).state,'invalid');});
test('search retains exact packaging candidates and game filters',()=>{let box={...pack,id:'b',name:'Example Booster Box'};assert.deepEqual(search([pack,box],'example pack','Pokémon','sealed').map(x=>x.id),['a']);assert.equal(search([pack],'example','Magic','').length,0);});

test('phone searches accept unaccented game names',()=>{assert.equal(search([pack],'pokemon pack','','').length,1);});

const {shoppingSets}=require('../public/chase-ranking.js');
const pick=(game,set,id,market=10,date=pack.date)=>({id:id+':Normal',name:set+' Booster Pack',set,game,kind:'sealed',market,date,url:'https://www.tcgplayer.com/product/'+id});
test('shopping list uses reviewed exact packs and order, not the highest card total',()=>{
 const rows=[pick('Magic','Lorwyn Eclipsed','656318',42),pick('Magic','Avatar: The Last Airbender','648646',44),pick('Magic','The Hobbit','692962',50),{...pick('Magic','Judge Promos','777777',100),kind:'card'}];
 assert.deepEqual(shoppingSets(rows,'Magic',now).map(x=>x.name),['Lorwyn Eclipsed','Avatar: The Last Airbender','The Hobbit']);
 assert.equal(shoppingSets(rows,'Magic',now)[0].pack.market,42);
 assert.deepEqual(shoppingSets(rows,'Lorcana',now),[]);
});
test('shopping list hides stale, missing, mismatched, and future product references',()=>{
 const rows=[pick('Pokémon','ME: 30th Celebration','696613',10,'2026-11-10'),pick('Pokémon','ME06: Delta Reign','712099',6),pick('Pokémon','Wrong set','692944',5)];
 assert.deepEqual(shoppingSets(rows,'Pokémon',now).map(x=>x.name),['ME06: Delta Reign']);
 assert.deepEqual(shoppingSets(rows,'Pokémon',Date.parse('2026-10-01T12:00:00Z')),[]);
});
