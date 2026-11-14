const {test}=require('node:test');const assert=require('node:assert/strict');const {compare,search}=require('../public/find-utils.js');
const now=Date.parse('2026-11-14T12:00:00Z');const pack={id:'a',name:'Example Booster Pack',set:'Set A',number:'',variant:'Normal',game:'Pokémon',kind:'sealed',market:10,date:'2026-11-13T20:00:00Z'};
test('quantity compares per exact package, not total or cards inside',()=>{const r=compare(pack,16,2,now);assert.equal(r.unit,8);assert.equal(r.totalMarket,20);assert.equal(r.title,'Below market');assert.equal(compare(pack,30,2,now).title,'Above market');});
test('stale and absent sources cannot produce buy signals',()=>{assert.equal(compare({...pack,date:'2026-11-10'},1,1,now).state,'research');assert.equal(compare(null,1,1,now).state,'research');assert.equal(compare({...pack,market:null},1,1,now).state,'research');assert.equal(compare({...pack,date:'2026-11-17'},1,1,now).state,'research');});
test('invalid quantities and prices are rejected',()=>{for(const [p,q] of [['',1],[0,1],[-1,1],[10,0],[10,1.5],['oops',2]])assert.equal(compare(pack,p,q,now).state,'invalid');});
test('search retains exact packaging candidates and game filters',()=>{let box={...pack,id:'b',name:'Example Booster Box'};assert.deepEqual(search([pack,box],'example pack','Pokémon','sealed').map(x=>x.id),['a']);assert.equal(search([pack],'example','Magic','').length,0);});

test('phone searches accept unaccented game names',()=>{assert.equal(search([pack],'pokemon pack','','').length,1);});
