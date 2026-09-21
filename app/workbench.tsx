'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, Check, CheckCheck, Circle, Clock3, FileText, Globe2, Inbox, Link2, Loader2, Mail, Plus, Search, Send, X, Download, PanelTop, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Entry } from '@/lib/extract';
const labels={action:'待行动',waiting:'等回复',done:'已完成'};
const sources={email:'邮件',web:'网页',note:'笔记'};
const icons={email:Mail,web:Globe2,note:FileText};
const sample='主题：研究生入学材料确认\n发件人：Admissions Office\n你好，请在 2026-10-15 前提交英文成绩单。\n请回复此邮件确认是否参加 10 月 20 日的线上迎新。\n提交材料后，我们将在五个工作日内回复审核结果。';
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function fmt(v:string){return v?new Date(v).toLocaleString('zh-CN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';}
async function api(path:string,body?:unknown){const r=await fetch('/api/'+path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);const data=await r.json() as {items:Entry[];draft:Omit<Entry,'id'|'history'|'created'|'updated'>;error?:string};if(!r.ok)throw new Error(data.error||'请求失败，请稍后重试。');return data;}
export default function Workbench(){
 const [items,setItems]=useState<Entry[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [source,setSource]=useState<Entry['source']>('email'),[content,setContent]=useState(''),[url,setUrl]=useState('');
 const [busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[filter,setFilter]=useState('all'),[query,setQuery]=useState('');
 const [edit,setEdit]=useState<Entry|null>(null),[isNew,setIsNew]=useState(false),[detailError,setDetailError]=useState(''),[note,setNote]=useState(''),[kind,setKind]=useState('followup');
 async function refresh(){const data=await api('items');setItems(data.items);}
 useEffect(()=>{refresh().catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 async function collect(){setBusy(true);setError('');setNotice('');try{const {draft}=await api('extract',{source,content,url:source==='web'?url:''});setEdit({...draft,id:crypto.randomUUID(),history:[],created:'',updated:''});setIsNew(true);setDetailError('');setNote('');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function open(v:Entry){setEdit(structuredClone(v));setIsNew(false);setDetailError('');setNote('');setKind('followup');}
 function field<K extends keyof Entry>(key:K,value:Entry[K]){setEdit(v=>v?{...v,[key]:value}:v);}
 async function save(){if(!edit)return;setSaving(true);setDetailError('');try{await api('items',{...edit,version:edit.updated,...(note.trim()?{event:{note:note.trim(),kind}}:{})});setEdit(null);if(isNew){setContent('');setUrl('');}setNotice(isNew?'事项已收集，可以开始行动了。':'事项和跟进记录已保存。');try{await refresh();}catch{setError('保存成功，但列表暂时无法刷新。请点击重试。');}}catch(e){setDetailError((e as Error).message);}finally{setSaving(false);}}
 function exportData(){const blob=new Blob([JSON.stringify({format:'followdesk-v1',exportedAt:new Date().toISOString(),items},null,2)],{type:'application/json'});const href=URL.createObjectURL(blob);const a=document.createElement('a');a.href=href;a.download='followdesk-'+today()+'.json';a.click();URL.revokeObjectURL(href);}
 const counts={action:items.filter(i=>i.status==='action').length,waiting:items.filter(i=>i.status==='waiting').length,done:items.filter(i=>i.status==='done').length};
 const visible=items.filter(i=>(filter==='all'||i.status===filter)&&[i.title,i.summary,i.contact,i.content].join(' ').toLowerCase().includes(query.toLowerCase()));
 const dueItems=items.filter(i=>i.status!=='done'&&((i.due&&i.due<=today())||(i.followDate&&i.followDate<=today())));
 return <div className="app-shell">
  <header className="topbar"><a className="brand" href="/"><span className="brand-icon">f<span>·</span></span>followdesk<span className="brand-caption">个人工作台</span></a><div className="top-actions"><span className="private-label"><span/>私人空间</span><Button variant="outline" onClick={exportData} disabled={loading||!items.length}><Download/>导出记录</Button><div className="avatar">我</div></div></header>
  <main className="workspace">
   <div className="page-heading"><div><p className="eyebrow">YOUR PERSONAL WORKSPACE</p><h1>把信息，变成下一步。</h1><p className="intro">邮件、网页与零散想法，在这里收集、行动、跟进。</p></div><div className="workspace-stamp"><PanelTop size={17}/>我的工作台<span> / </span><b>概览</b></div></div>
   <section className="metrics" aria-label="事项概览">{([['action','待我行动',ArrowUpRight],['waiting','等待回复',Clock3],['done','已经完成',CheckCheck]] as const).map(([key,label,Icon])=><button key={key} className={'metric '+key+(filter===key?' selected':'')} onClick={()=>setFilter(filter===key?'all':key)}><div className="metric-top"><span>{label}</span><Icon size={20}/></div><div className="metric-value">{loading?'—':counts[key]}<span>{key==='action'?'明确下一步':key==='waiting'?'跟进有迹可循':'每一步都算数'}</span></div></button>)}<div className="metric attention"><div className="metric-top"><span>今日需留意</span><span className="tiny-badge">TODAY</span></div><div className="metric-value">{loading?'—':dueItems.length}<span>已到截止 / 跟进日期</span></div></div></section>
   <div className="work-grid">
    <section className="collector panel"><div className="section-heading"><div className="section-icon"><Plus size={19}/></div><h2>收集一条信息</h2></div><Tabs value={source} onValueChange={v=>setSource(v as Entry['source'])}><TabsList className="source-tabs">{Object.entries(sources).map(([key,label])=>{const Icon=icons[key as Entry['source']];return <TabsTrigger value={key} key={key}><Icon/>{label}</TabsTrigger>})}</TabsList></Tabs>
     {source==='web'&&<label className="field-label">网页链接<Input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></label>}
     <label className="field-label">{source==='email'?'邮件内容':source==='web'?'网页正文（链接无法读取时粘贴）':'笔记内容'}<Textarea className="capture-text" value={content} maxLength={40000} onChange={e=>setContent(e.target.value)} placeholder={source==='email'?'把邮件粘贴到这里…\n\n可以包含主题、发件人、正文和往来记录。':source==='web'?'可只填上方链接，或直接粘贴网页正文。':'记下需要处理的事情…'}/></label>
     <div className="capture-footer"><span>{content.length.toLocaleString()} / 40,000</span><button className="text-button" onClick={()=>{setSource('email');setContent(sample);setUrl('');}}>试试示例</button></div>
     <Button className="extract-button" onClick={collect} disabled={busy||(!content.trim()&&!(source==='web'&&url.trim()))}>{busy?<Loader2 className="spin"/>:<Sparkles/>}{busy?'正在整理…':'提取关键事项'}{!busy&&<ArrowRight/>}</Button>
     <p className="capture-hint">先辅助提取，再由你确认。不会自动发送邮件。</p>
     <div className="workflow"><span><span>01</span>收集</span><span className="line"/><span><span>02</span>确认待办</span><span className="line"/><span><span>03</span>跟进</span></div>
    </section>
    <section className="inbox-panel panel"><div className="inbox-heading"><h2>事项清单 <span>{items.length}</span></h2><div className="search"><Search size={17}/><Input aria-label="搜索事项" placeholder="搜索事项或联系人" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
     <Tabs value={filter} onValueChange={setFilter}><TabsList variant="line" className="filter-tabs"><TabsTrigger value="all">全部</TabsTrigger>{Object.entries(labels).map(([key,label])=><TabsTrigger key={key} value={key}>{label}<span>{counts[key as keyof typeof counts]}</span></TabsTrigger>)}</TabsList></Tabs>
     {error&&<div className="error-banner" role="alert">{error}<Button variant="ghost" size="sm" onClick={()=>{setError('');refresh().catch(e=>setError(e.message));}}>重试</Button></div>}
     {notice&&<div className="notice" role="status"><Check size={16}/>{notice}</div>}
     {loading?<div className="empty"><Loader2 className="spin"/><p>正在读取你的事项…</p></div>:visible.length===0?<div className="empty"><div className="empty-icon"><Inbox size={30}/></div><h3>{query?'没有找到相关事项':filter==='all'?'为下一步，留一个清晰的起点。':'这里暂时没有事项'}</h3><p>{query?'换一个关键词试试。':filter==='all'?'从左侧粘贴一封邮件，或添加一个网页链接。':'在事项详情中更新状态，记录每一次进展。'}</p>{!items.length&&<Button variant="outline" onClick={()=>{setSource('email');setContent(sample);document.querySelector('textarea')?.focus();}}>用一封示例邮件开始 <ArrowUpRight/></Button>}</div>:<div className="item-list">{visible.map(item=>{const Icon=icons[item.source];const last=item.history.filter(h=>h.kind==='followup').at(-1);const overdue=item.status!=='done'&&item.due&&item.due<today();return <button key={item.id} className="item-row" onClick={()=>open(item)}><div className={'source-icon '+item.source}><Icon size={20}/></div><div className="item-body"><div className="item-title"><h3>{item.title}</h3><span className={'status '+item.status}>{labels[item.status]}</span></div><p>{item.summary.split('\n')[0]||'点击补充事项摘要'}</p><div className="item-meta"><span>{sources[item.source]}</span>{item.contact&&<span>{item.contact}</span>}<span className={overdue?'overdue':''}>{item.due?`${overdue?'已逾期 · ':'截止 '}${item.due}`:'截止日期未确认'}</span></div><div className="item-progress"><span><CheckCheck size={14}/>{item.tasks.filter(t=>t.done).length}/{item.tasks.length} 项待办</span><span className={last?'followed':''}>{last?`已跟进 · ${fmt(last.at)}`:'暂无跟进记录'}</span>{item.followDate&&<span>下次跟进 {item.followDate}</span>}</div></div><ArrowUpRight className="row-arrow" size={17}/></button>})}</div>}
     <div className="list-footer"><span>跟进记录与完成状态分别保存</span><span>FOLLOW THROUGH.</span></div>
    </section>
   </div><footer className="page-footer"><span>followdesk <span className="footer-dot">/</span> 少一点遗漏，多一点从容。</span><span>你的内容仅在私人工作台中保存</span></footer>
  </main>
  <Dialog open={!!edit} onOpenChange={v=>{if(!v&&!saving)setEdit(null);}}><DialogContent className="detail-dialog"><DialogTitle>{isNew?'确认提取结果':'事项详情'}</DialogTitle><DialogDescription>{isNew?'基于关键词和原文摘录的辅助提取；请检查待办、联系人和日期。':'更新待办，记录跟进，并决定下一步。'}</DialogDescription>{edit&&<div className="detail-scroll">
   {detailError&&<p role="alert" className="error-banner">{detailError}</p>}
   <label className="field-label">事项标题<Input value={edit.title} maxLength={160} onChange={e=>field('title',e.target.value)}/></label>
   <label className="field-label">关键事项<Textarea value={edit.summary} maxLength={4000} onChange={e=>field('summary',e.target.value)}/></label>
   <div className="detail-grid"><label className="field-label">当前状态<NativeSelect value={edit.status} onChange={e=>field('status',e.target.value as Entry['status'])}>{Object.entries(labels).map(([k,v])=><NativeSelectOption key={k} value={k}>{v}</NativeSelectOption>)}</NativeSelect></label><label className="field-label">联系人 / 正在等谁<Input value={edit.contact} maxLength={200} placeholder="姓名或邮箱" onChange={e=>field('contact',e.target.value)}/></label><label className="field-label">截止日期<Input type="date" value={edit.due} onChange={e=>field('due',e.target.value)}/></label><label className="field-label">下次跟进日期<Input type="date" value={edit.followDate} onChange={e=>field('followDate',e.target.value)}/></label></div>
   <div className="tasks-header"><h3>我需要做的事</h3><Button size="sm" variant="ghost" disabled={edit.tasks.length>=40} onClick={()=>field('tasks',[...edit.tasks,{text:'',done:false}])}><Plus/>添加待办</Button></div>
   {!edit.tasks.length&&<p className="muted">没有识别到明确行动，请手动补充；也可以只保存为参考事项。</p>}
   {edit.tasks.map((t,i)=><div className="task-edit" key={i}><Checkbox aria-label={`完成待办 ${i+1}`} checked={t.done} onCheckedChange={v=>field('tasks',edit.tasks.map((x,n)=>n===i?{...x,done:!!v}:x))}/><Textarea aria-label={`待办 ${i+1}`} className={t.done?'task-done':''} value={t.text} maxLength={700} onChange={e=>field('tasks',edit.tasks.map((x,n)=>n===i?{...x,text:e.target.value}:x))}/><Button variant="ghost" size="icon" aria-label="移除待办" onClick={()=>field('tasks',edit.tasks.filter((_,n)=>n!==i))}><X/></Button></div>)}
   {!isNew&&<section className="follow-section"><h3><Send size={17}/>记录一次进展</h3><div className="detail-grid"><label className="field-label">记录类型<NativeSelect value={kind} onChange={e=>setKind(e.target.value)}><NativeSelectOption value="followup">我已跟进</NativeSelectOption><NativeSelectOption value="reply">对方已回复</NativeSelectOption><NativeSelectOption value="note">补充备注</NativeSelectOption></NativeSelect></label><p className="muted">记录已经发生的沟通；填写后点击保存。</p></div><Textarea aria-label="跟进内容" value={note} maxLength={2000} onChange={e=>setNote(e.target.value)} placeholder="例如：今天已回复邮件并提交成绩单，等待确认。"/><p className="muted">如需等待回复，请同时把当前状态改为「等回复」。</p></section>}
   {edit.history.length>0&&<section className="history"><h3>时间线</h3>{[...edit.history].reverse().map((h,i)=><div key={i}><span className="history-dot"/><div><p>{h.note}</p><small>{fmt(h.at)} · {h.kind==='followup'?'已跟进':h.kind==='reply'?'收到回复':h.kind==='created'?'已收集':'备注'}</small></div></div>)}</section>}
   <details className="original"><summary>查看原始{sources[edit.source]}内容 {edit.url&&<Link2 size={14}/>}</summary>{edit.url&&<a href={edit.url} target="_blank" rel="noopener noreferrer">打开来源网页 <ArrowUpRight size={14}/></a>}<pre>{edit.content}</pre></details>
  </div>}<div className="dialog-actions"><Button variant="outline" disabled={saving} onClick={()=>setEdit(null)}>取消</Button><Button disabled={saving||!edit?.title.trim()||edit.tasks.some(t=>!t.text.trim())} onClick={save}>{saving?<Loader2 className="spin"/>:<Check/>}{saving?'保存中…':isNew?'确认并收集':'保存修改'}</Button></div></DialogContent></Dialog>
 </div>;
}
