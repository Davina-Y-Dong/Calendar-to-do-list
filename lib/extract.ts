export type Task = { text: string; done: boolean };
export type Entry = {
 id: string; title: string; source: 'email'|'web'|'note'; url: string; content: string;
 summary: string; tasks: Task[]; status: 'action'|'waiting'|'done'; contact: string;
 due: string; followDate: string; history: {at:string; note:string; kind:string}[];
 created: string; updated: string;
};
export function validDate(s: string) {
 return s === '' || /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
}
export function extract(content: string, source: Entry['source'], url = '') {
 const lines = content.replace(/\r/g,'').split(/\n+|(?<=[。！？])\s*|(?<=[.!?])\s+(?=[A-Z])/).map(s=>s.trim()).filter(Boolean);
 const candidates = lines.filter(s=> /请|需要|务必|提交|填写|预约|确认|截止|回复|报名|上传|完成|缴|提供|\b(please|must|need to|required|submit|complete|send|register|deadline|reply|confirm|upload|pay)\b/i.test(s) && !/^(>|发件人[：:]|收件人[：:]|from:|to:)/i.test(s));
 const subject = content.match(/^(?:subject|主题)[：:]\s*(.+)$/im)?.[1];
 const summary = (candidates.length?candidates:lines).slice(0,3).join('\n').slice(0,1500);
 const deadlineLine = candidates.find(s=>/截止|最晚|不晚于|之前|前|deadline|due|by\b/i.test(s));
 const date = deadlineLine?.match(/\b(20\d{2})[-/年](\d{1,2})[-/月](\d{1,2})日?/);
 const due = date?`${date[1]}-${date[2].padStart(2,'0')}-${date[3].padStart(2,'0')}`:'';
 return {title:(subject||lines[0]||'新事项').slice(0,160),source,url,content,summary,
 tasks:candidates.slice(0,12).map(text=>({text:text.slice(0,700),done:false})),
 status:'action' as const,contact:content.match(/^(?:from|发件人)[：:]\s*(.+)$/im)?.[1]?.slice(0,200)||'',
 due:validDate(due)?due:'',followDate:''};
}
