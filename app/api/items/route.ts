import { z } from 'zod';
import { database, owner, failure, sameOrigin } from '@/lib/storage';
import { validDate } from '@/lib/extract';
export const dynamic='force-dynamic';
const date=z.string().max(10).refine(validDate);
const schema=z.object({id:z.string().uuid(),title:z.string().trim().min(1).max(160),source:z.enum(['email','web','note']),url:z.string().max(2048).refine(v=>!v||/^https?:\/\//i.test(v)),content:z.string().max(40000),summary:z.string().max(4000),tasks:z.array(z.object({text:z.string().trim().min(1).max(700),done:z.boolean()})).max(40),status:z.enum(['action','waiting','done']),contact:z.string().max(200),due:date,followDate:date});
const eventSchema=z.object({note:z.string().trim().min(1).max(2000),kind:z.enum(['followup','reply','note'])});
export async function GET() {try {
 const who=await owner();const {results}=await database().prepare('SELECT * FROM items WHERE owner=? ORDER BY updated DESC').bind(who).all();
 return Response.json({items:results.map((r:any)=>({...r,owner:undefined,tasks:JSON.parse(r.tasks),history:JSON.parse(r.history),followDate:r.follow_date}))},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
export async function POST(req:Request){try {
 const who=await owner(); if(!sameOrigin(req))return Response.json({error:'请求来源不匹配'},{status:403});
 if(Number(req.headers.get('content-length')||0)>100000)return Response.json({error:'内容过长'},{status:413});
 const raw=await req.text();if(raw.length>100000)return Response.json({error:'内容过长'},{status:413});
 let body;try{body=JSON.parse(raw);}catch{return Response.json({error:'内容格式有误'},{status:400});}
 const p=schema.safeParse(body);const ev=body.event?eventSchema.safeParse(body.event):null;
 if(!p.success||(ev&&!ev.success))return Response.json({error:'请检查标题、日期和待办内容。'},{status:400});
 const v=p.data, db=database();const old:any=await db.prepare('SELECT history,created,updated FROM items WHERE id=? AND owner=?').bind(v.id,who).first();
 if(old && body.version!==old.updated) return Response.json({error:'这条事项已在其他页面更新，请关闭详情并重新打开后再修改。'},{status:409});
 const now=new Date().toISOString(); const history=old?JSON.parse(old.history):[{at:now,note:'收集并确认事项',kind:'created'}];
 if(ev?.success)history.push({at:now,...ev.data});
 const fields=[v.title,v.source,v.url,v.content,v.summary,JSON.stringify(v.tasks),v.status,v.contact,v.due,v.followDate,JSON.stringify(history),now];
 if(old){const r=await db.prepare('UPDATE items SET title=?,source=?,url=?,content=?,summary=?,tasks=?,status=?,contact=?,due=?,follow_date=?,history=?,updated=? WHERE id=? AND owner=? AND updated=?').bind(...fields,v.id,who,old.updated).run(); if(!r.meta.changes)return Response.json({error:'事项已更新，请重新打开。'},{status:409});}
 else await db.prepare('INSERT INTO items (title,source,url,content,summary,tasks,status,contact,due,follow_date,history,updated,id,owner,created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(...fields,v.id,who,now).run();
 return Response.json({ok:true});
 }catch(e){return failure(e);}}
