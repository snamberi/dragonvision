/** Hand-composed pixel architecture on a common 96×80 grid. */
const cache=new Map<string,string>();
export function landmarkUrl(kind:string):string {
 const hit=cache.get(kind);if(hit)return hit;
 const canvas=document.createElement('canvas');canvas.width=192;canvas.height=160;
 const ctx=canvas.getContext('2d');if(!ctx)return '';ctx.scale(2,2);
 const r=(x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h)};
 const poly=(points:number[][],c:string)=>{
  const min=Math.min(...points.map(p=>p[1])),max=Math.max(...points.map(p=>p[1]));
  for(let y=min;y<max;y++){const cuts:number[]=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))cuts.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}cuts.sort((a,b)=>a-b);for(let i=0;i<cuts.length;i+=2)r(Math.ceil(cuts[i]),y,Math.floor(cuts[i+1])-Math.ceil(cuts[i])+1,1,c);}
 };
 const stone='#c9b99a',shadow='#806e68',wood='#876449',gold='#e4c17b',ink='#292a3a';
 const stairs=(x:number,y:number,w:number)=>{r(x,y,w,3,'#d2c4ac');r(x-3,y+3,w+6,3,'#a99d8e');r(x-6,y+6,w+12,3,'#766c73')};
 const window=(x:number,y:number,w=8,h=10,color='#efd49b')=>{r(x,y,w,h,ink);r(x+1,y+1,w-2,h-2,color);r(x+w/2,y,1,h,wood);r(x,y+h/2,w,1,wood)};
 const lamp=(x:number,y:number)=>{r(x+2,y,2,12,ink);r(x,y+3,6,7,'#aa774c');r(x+1,y+4,4,5,'#ffe7ac')};
 const roof=(x:number,y:number,w:number,c:string)=>{poly([[x+10,y],[x+w-10,y],[x+w+4,y+12],[x-4,y+12]],c);r(x-5,y+12,w+10,3,ink);r(x-3,y+11,w+6,2,gold);for(let a=0;a<3;a++)for(let b=x+9-a*4;b<x+w-8+a*4;b+=8)r(b,y+2+a*4,5,1,'#fff2d438')};
 // Raised paving and garden edge place each building firmly on the city ground.
 poly([[9,68],[77,68],[90,76],[20,76]],'#454d53');r(13,68,67,4,'#8e8980');r(17,71,67,2,'#625f65');
 if(kind==='gate'){
  poly([[29,8],[64,8],[76,21],[76,60],[64,69],[29,69],[18,60],[18,21]],'#6d6686');
  poly([[32,14],[60,14],[68,24],[68,57],[59,63],[32,63],[26,57],[26,24]],'#24263f');
  poly([[35,20],[57,20],[63,29],[63,51],[55,58],[35,58],[30,50],[30,29]],'#8d79b9');
  poly([[39,27],[53,27],[58,34],[58,47],[52,52],[39,52],[35,46],[35,34]],'#d5c2f4');r(43,33,7,13,'#f6edff');
  for(const [x,y] of [[22,26],[22,46],[69,26],[69,46],[42,10]])r(x,y,4,4,gold);stairs(25,66,43);
 }else if(kind==='port'){
  r(8,62,80,11,'#367589');for(let x=9;x<85;x+=12)r(x,68,8,1,'#93c8cd');
  r(13,53,26,4,wood);r(16,56,3,16,'#57423a');r(33,56,3,16,'#57423a');
  poly([[34,55],[87,55],[76,67],[43,67]],'#8f6345');r(38,55,44,3,gold);r(58,10,3,45,'#9d7d55');poly([[55,16],[55,49],[31,49]],'#efe1be');poly([[64,23],[82,49],[64,49]],'#b95c4b');r(60,9,15,3,gold);lamp(19,39);
 }else if(kind==='board'){
  r(20,28,57,34,'#5f4338');r(24,31,49,28,'#927454');r(24,60,4,12,wood);r(69,60,4,12,wood);roof(18,16,61,'#675964');
  for(let i=0;i<3;i++){r(29+i*15,36,10,17,'#ebd5a8');r(32+i*15,39,4,4,'#af7355');r(31+i*15,46,6,1,'#80634b');r(31+i*15,49,5,1,'#80634b')}
 }else if(kind==='tent'){
  poly([[46,8],[82,55],[14,55]],'#695388');poly([[46,8],[58,55],[34,55]],'#a58ab9');r(15,55,67,11,'#514565');poly([[45,45],[57,66],[34,66]],ink);r(45,2,2,10,gold);r(47,3,10,5,'#e2bd77');lamp(22,48);lamp(68,48);stairs(33,67,26);
 }else if(kind==='tower'){
  r(32,20,35,47,shadow);r(35,20,23,47,'#b8a6bf');
  for(let i=0;i<3;i++){const y=14+i*18;roof(30-i*3,y,39+i*6,'#5e4c81');window(42,y+15,8,8,'#ead8a2')}
  r(46,3,3,11,gold);poly([[40,12],[47,5],[54,12]],gold);stairs(30,68,39);
 }else if(kind==='colosseum'){
  poly([[16,32],[68,25],[82,34],[82,62],[68,69],[16,65]],shadow);r(16,32,54,33,stone);r(13,29,57,5,'#e2d2ae');r(16,43,54,3,gold);r(16,57,54,3,gold);
  for(let i=0;i<6;i++){const x=19+i*8;r(x,35,4,7,ink);r(x,48,4,9,ink);r(x-1,34,6,2,'#ad9982')}
  r(38,51,13,17,ink);r(41,54,7,13,'#9c4d43');for(const x of [22,62]){r(x,16,2,14,wood);r(x+2,17,10,6,'#ba5e4c')}stairs(30,67,35);
 }else if(kind==='dungeon'){
  // A cave mouth in a mossy crag: torches, an iron keystone and steps leading down into the dark.
  poly([[12,67],[20,34],[34,18],[56,14],[72,24],[84,67]],'#4f4b59');
  poly([[17,67],[25,38],[38,24],[55,21],[68,30],[79,67]],'#716b7c');
  r(31,25,9,2,'#9a93a3');r(56,26,7,2,'#9a93a3');r(23,46,6,2,'#8a8494');r(70,44,6,2,'#8a8494');
  poly([[33,67],[33,45],[39,37],[57,37],[63,45],[63,67]],'#2f2a38');
  poly([[37,67],[37,47],[42,41],[54,41],[59,47],[59,67]],'#110f19');
  for(const [x,y] of [[32,44],[35,39],[41,35],[47,34],[53,35],[59,39],[62,44]])r(x,y,4,3,stone);
  r(44,30,8,6,gold);r(47,31,2,2,ink);r(47,33,2,2,ink);
  r(40,56,16,2,'#4c4656');r(42,60,12,2,'#36313f');r(44,64,8,2,'#231f2b');
  for(const x of [27,67]){r(x,45,2,11,ink);r(x-1,41,4,5,'#ff9b3d');r(x,42,2,3,'#ffe08a')}
  r(19,60,7,3,'#586b50');r(70,58,8,3,'#586b50');r(24,57,4,2,'#7d9a62');r(73,55,4,2,'#7d9a62');
 }else if(kind==='raid'){
  // A titan war camp: a spiked palisade around a crenellated gate, red war banners and braziers.
  for(let x=14;x<80;x+=6){r(x,36,5,30,wood);poly([[x,36],[x+2.5,29],[x+5,36]],'#a8805a')}
  r(14,52,70,2,'#57423a');
  r(33,24,30,43,stone);r(30,20,36,5,'#e2d2ae');for(let i=0;i<6;i++)r(30+i*6,15,4,5,'#e2d2ae');
  r(33,30,30,2,gold);
  poly([[39,67],[39,47],[43,41],[53,41],[57,47],[57,67]],ink);
  for(let x=41;x<56;x+=4)r(x,44,1,23,'#8f7a52');r(39,52,18,1,'#8f7a52');r(39,59,18,1,'#8f7a52');
  r(42,32,12,7,'#efe1be');r(44,34,2,2,ink);r(50,34,2,2,ink);r(46,37,4,1,ink);
  for(const x of [22,72]){r(x,6,2,30,wood);r(x+2,8,10,13,'#b8433a');r(x+5,12,4,4,gold);r(x+2,21,10,2,'#7e2a26')}
  for(const x of [19,74]){r(x,60,7,6,ink);r(x+1,55,5,5,'#ff7b3d');r(x+2,53,3,3,'#ffd36b')}
 }else if(kind==='climb'){
  // An endless spire that climbs past the clouds, ringed by a spiral stair and crowned with a crystal.
  r(32,52,32,16,shadow);r(34,52,28,15,stone);
  r(37,38,22,14,'#b6a7c3');r(40,24,16,14,'#cbbfd6');r(43,12,10,12,'#ddd4e8');
  r(35,51,26,2,gold);r(38,37,20,2,gold);r(41,23,14,2,gold);
  for(let i=0;i<12;i++){const side=i%2;r(side?57:33,64-i*4.5,6,2,'#806e68')}
  window(44,56,8,9);window(45,41,6,7,'#c3addc');window(46,27,4,6,'#c3addc');
  poly([[48,0],[54,7],[48,13],[42,7]],'#8be6cf');r(46,4,3,4,'#e6fff7');
  r(16,30,22,4,'#eef0ffcc');r(20,27,10,3,'#eef0ffcc');r(60,18,22,4,'#eef0ffcc');r(66,15,10,3,'#eef0ffcc');
  stairs(34,68,28);
 }else if(kind==='journal'){
  // A scholars' library: bookshelf windows, columns, and a great open journal on the roof ridge.
  poly([[20,34],[72,29],[82,35],[82,64],[72,69],[20,65]],shadow);r(18,34,56,32,'#d7c8a8');
  roof(14,21,62,'#4f6788');
  poly([[33,6],[47,10],[47,22],[33,18]],'#f4ecd8');poly([[49,10],[63,6],[63,18],[49,22]],'#f4ecd8');r(47,10,2,13,wood);
  for(let i=0;i<3;i++){r(36,10+i*3,8,1,'#9a8c78');r(52,10+i*3,8,1,'#9a8c78')}
  for(const x of [24,58]){r(x,40,13,19,ink);for(let i=0;i<5;i++){r(x+1+i*2.4,41,2,8,['#b8433a','#4f6788','#e4c17b','#5e8f6a','#8f6aa8'][i]);r(x+1+i*2.4,50,2,8,['#5e8f6a','#e4c17b','#b8433a','#8f6aa8','#4f6788'][i])}r(x,49,13,1,wood)}
  r(41,44,14,22,ink);r(43,46,10,19,'#6a4b3f');r(51,55,1,2,gold);
  for(const x of [20,71]){r(x,38,4,26,'#eee0bc');r(x-1,37,6,2,'#bfae8a')}
  stairs(30,67,36);lamp(14,52);
 }else{
  const timber=['dojo','shop','armory'].includes(kind),tech=['lab','gravity'].includes(kind);
  const face=tech?'#687a87':timber?'#d1b38b':stone;
  poly([[22,33],[72,28],[84,35],[84,64],[72,69],[22,65]],tech?'#394c62':shadow);r(20,33,53,33,face);
  r(20,34,3,31,timber?wood:'#e0d3b9');r(69,31,4,36,timber?wood:'#e0d3b9');r(23,62,47,4,timber?wood:'#a69b89');
  if(tech){
   r(27,38,15,22,ink);r(29,40,11,17,kind==='lab'?'#83d8c1':'#bcabd5');r(49,38,15,22,ink);r(51,40,11,17,kind==='lab'?'#83d8c1':'#bcabd5');
   poly([[23,33],[28,20],[40,13],[58,13],[70,20],[77,33]],'#7f929f');r(35,17,28,3,'#b7ced5');r(23,32,54,3,ink);r(15,40,4,23,shadow);r(78,40,4,23,shadow);for(let y=45;y<61;y+=7){r(15,y,4,2,gold);r(78,y,4,2,gold)}
   if(kind==='gravity'){r(42,22,16,8,ink);r(45,24,10,4,'#d3b2e9')}
  }else{
   const roofColor=kind==='shrine'?'#b95b4c':kind==='hall'?'#b89b55':kind==='dojo'?'#625777':kind==='shop'?'#5f8d80':'#65737a';
   roof(16,20,60,roofColor);window(27,42);window(57,42);r(41,43,12,23,ink);r(43,45,8,20,'#74524a');r(49,54,1,2,gold);
   if(kind==='shrine'){r(31,12,32,11,'#e3cdb1');roof(26,2,42,roofColor);window(43,15,9,7,'#c3addc');r(44,45,6,19,'#bca0e5')}
   if(kind==='hall'){poly([[26,18],[46,5],[68,18]],gold);for(const x of [26,61]){r(x,38,5,23,'#eee0bc');r(x-2,37,9,3,'#bfae8a')}r(42,13,8,5,'#fff0b9')}
   if(kind==='shop'){r(19,38,55,7,'#ddbc79');for(let x=19;x<73;x+=12)r(x,38,6,7,'#659b86');r(25,57,38,7,wood);for(let x=27;x<60;x+=8)r(x,54,5,5,x%3?'#c59757':'#95aa6f')}
   if(kind==='armory'){r(62,10,8,12,shadow);r(59,8,14,3,'#a5a2a0');r(42,40,11,19,'#503d36');r(47,42,2,12,'#dce5e3');r(43,51,10,2,gold)}
   if(kind==='dojo'){r(40,37,15,4,gold);r(37,42,21,2,wood)}
  }
  stairs(30,67,34);lamp(22,53);lamp(66,53);
 }
 // Low shrubs and masonry edging avoid empty, floating foundations.
 if(kind!=='port'){r(12,66,8,5,'#586b50');r(14,64,5,3,'#9aa979');r(78,66,7,5,'#536b53');r(79,64,4,3,'#92a47a')}
 const url=canvas.toDataURL();cache.set(kind,url);return url;
}
