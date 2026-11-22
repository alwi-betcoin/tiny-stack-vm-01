import{readdirSync as D,readFileSync as R,mkdirSync as M,writeFileSync as W}from"node:fs";
let T="!2b%'+,0        *******&***&*** ***             AEEA!           &)              %%\"%",
B=[(a,b)=>a+b,(a,b)=>a-b,Math.imul,(a,b)=>a/b,(a,b)=>a%b,(a,b)=>(a>>>0)/(b>>>0),(a,b)=>(a>>>0)%(b>>>0),0,(a,b)=>a&b,(a,b)=>a|b,(a,b)=>a^b,0,(a,b)=>a<<(b&31),(a,b)=>a>>(b&31),(a,b)=>a>>>(b&31),0,(a,b)=>a==b?1:0,(a,b)=>a<b?1:0,(a,b)=>(a>>>0)<(b>>>0)?1:0];
function V(p,i){
let n=p.length,S=new Int32Array(256),s=0,C=new Int32Array(64),c=0,m=new Int32Array(256),O=new Uint8Array(65536),l=0,j=0,P=0,k=0,a,b,E=z=>[O.slice(0,l),z];
for(;;){
if(k==1e6)return E(10);
if(P<0|P>=n)return E(9);
let o=p[P],t=T.charCodeAt(o)-33,u=t>>2&3,x=P+1+(t>>4);
if(!(t>=0))return E(5);
if(x>n)return E(9);
k++;
if(s<u)return E(2);
if(s-u+(t&3)>256)return E(3);
P=x;
switch(o){
case 0:return E(0);
case 1:S[s++]=(p[x-1]<<24)>>24;break;
case 2:S[s++]=p.readInt32LE(x-4);break;
case 3:s--;break;
case 4:S[s]=S[s-1];s++;break;
case 5:a=S[s-1];S[s-1]=S[s-2];S[s-2]=a;break;
case 6:S[s]=S[s-2];s++;break;
case 7:a=S[s-3];S[s-3]=S[s-2];S[s-2]=S[s-1];S[s-1]=a;break;
case 23:S[s-1]=-S[s-1];break;
case 27:S[s-1]=~S[s-1];break;
case 48:case 49:case 50:if(o==48||(S[--s]==0)==(o==49))P=x+p.readInt16LE(x-2);break;
case 51:if(c==64)return E(7);C[c++]=x;P=p[x-2]|p[x-1]<<8;break;
case 52:if(!c)return E(8);P=C[--c];break;
case 64:a=S[s-1];if(a>>8)return E(6);S[s-1]=m[a];break;
case 65:a=S[s-1];if(a>>8)return E(6);m[a]=S[s-2];s-=2;break;
case 80:{let v=S[--s],q=""+v;if(l+q.length>65536)return E(11);for(let z of q)O[l++]=z.charCodeAt(0);break}
case 81:if(l==65536)return E(11);O[l++]=S[--s]&255;break;
case 82:S[s++]=j<i.length?i[j++]:-1;break;
case 83:return E(S[--s]&255);
default:b=S[s-1];a=S[s-2];if(o>18&&o<23&&!b)return E(4);s--;S[s-1]=B[o-16](a,b);
}}}
let I=process.env.MAKEFUN_INPUT_DIR||"/input",O=process.env.MAKEFUN_OUTPUT_DIR||"/output";
for(let d of D(I).sort()){let r=V(R(I+"/"+d+"/program.bin"),R(I+"/"+d+"/input.bin"));M(O+"/"+d,{recursive:!0});W(O+"/"+d+"/stdout.bin",r[0]);W(O+"/"+d+"/exit.txt",r[1]+"\n")}
