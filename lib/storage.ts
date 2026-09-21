import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export async function owner() {
 const user = await getChatGPTUser();
 if (!user) throw new Error('UNAUTHORIZED');
 return user.userId;
}
export function database() { if (!env.DB) throw new Error('STORAGE_UNAVAILABLE'); return env.DB; }
export function failure(e:unknown) {
 const message=e instanceof Error?e.message:'';
 if(message==='UNAUTHORIZED') return Response.json({error:'请先登录后再使用工作台。'},{status:401});
 console.error('Followdesk request failed',message);
 return Response.json({error:'暂时无法读取或保存，请稍后重试。输入内容已保留。'},{status:500});
}
export function sameOrigin(req:Request) {
 const origin=req.headers.get('origin');
 return !origin || origin===new URL(req.url).origin;
}
