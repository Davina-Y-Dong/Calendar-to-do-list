import { owner, failure, sameOrigin } from '@/lib/storage';
import { extract } from '@/lib/extract';
function publicURL(value:string) {
 const u=new URL(value), h=u.hostname.toLowerCase();
 if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port||!h.includes('.')||h.includes(':')||/^\d/.test(h)||/(^|\.)(localhost|local|internal|lan|home|test|invalid)$/.test(h)||h.endsWith('.arpa'))throw new Error('URL');
 return u;
}
async function readPage(value:string) {
 let u=publicURL(value);
 const signal=AbortSignal.timeout(12000);
 for(let n=0;n<5;n++) {
  const res=await fetch(u,{redirect:'manual',signal,headers:{Accept:'text/html,text/plain','User-Agent':'Followdesk/0.1'}});
  if(res.status>=300&&res.status<400&&res.headers.get('location')){u=publicURL(new URL(res.headers.get('location')!,u).href);continue;}
  if(!res.ok)throw new Error('FETCH');
  if(!/text\/(html|plain)/i.test(res.headers.get('content-type')||''))throw new Error('TYPE');
  const reader=res.body?.getReader();if(!reader)throw new Error('FETCH');
  const decoder=new TextDecoder();let html='',size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>1500000){await reader.cancel();throw new Error('LARGE');}html+=decoder.decode(value,{stream:true});}html+=decoder.decode();
  const text=html.replace(/<(script|style|noscript|svg|nav|footer)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<\/(p|div|h[1-6]|li|section|tr)>|<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim().slice(0,40000);
  if(text.length<60)throw new Error('EMPTY');return {text,url:u.href};
 }
 throw new Error('REDIRECT');
}
export async function POST(req:Request){
 try{await owner();if(!sameOrigin(req))return Response.json({error:'请求来源不匹配'},{status:403});
 const raw=await req.text();if(raw.length>50000)return Response.json({error:'内容过长，请分段添加。'},{status:413});
 let b;try{b=JSON.parse(raw);}catch{return Response.json({error:'内容格式有误'},{status:400});}
 if(!['email','web','note'].includes(b.source)||typeof b.content!=='string'||typeof b.url!=='string')return Response.json({error:'请填写来源和内容。'},{status:400});
 let content=b.content.trim(),url=b.url.trim();
 if(b.source==='web'&&url&&!content){try{const p=await readPage(url);content=p.text;url=p.url;}catch{return Response.json({error:'无法读取这个网页（可能需要登录、禁止抓取或不是公开文本）。请粘贴网页正文后重新提取。'},{status:422});}}
 if(content.length<8)return Response.json({error:'请粘贴至少 8 个字的内容，或填写公开网页链接。'},{status:400});
 if(url){try{publicURL(url);}catch{return Response.json({error:'请使用有效的公开网页链接。'},{status:400});}}
 return Response.json({draft:extract(content.slice(0,40000),b.source,url),mode:'rules'});
 }catch(e){return failure(e);}
}
