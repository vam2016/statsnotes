import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import YAML from 'yaml';
import { zipSync, strToU8 } from 'fflate';
import { initCharts } from './charts';
import { newDraft, noteTemplate, bookTemplate, sourceText, bookMetadata, validateDraft, draftFromSource, publicationPath, githubEditUrl, type WriterDraft, type WriterBook, type PublishedNote } from './writer-model';
const md = new Marked({ gfm: true, async: false });
md.use({ extensions: [
  { name: 'mathBlock', level: 'block', start: (s: string) => s.indexOf('$$'), tokenizer(s: string) { const m = s.match(/^\$\$[ \t]*\n([\s\S]+?)\n\$\$[ \t]*(?:\n|$)/); if (m) return { type: 'mathBlock', raw: m[0], text: m[1] }; }, renderer(token) { return katex.renderToString(token.text, { displayMode: true, throwOnError: false, trust: false }); } },
  { name: 'mathInline', level: 'inline', start: (s: string) => s.indexOf('$'), tokenizer(s: string) { const m = s.match(/^\$([^\n$]+?)\$(?!\$)/); if (m) return { type: 'mathInline', raw: m[0], text: m[1] }; }, renderer(token) { return katex.renderToString(token.text, { throwOnError: false, trust: false }); } },
  { name: 'articleChart', level: 'block', start: (s: string) => s.indexOf('<InteractiveChart'), tokenizer(s: string) { const m = s.match(/^<InteractiveChart(?:\s+kind=["'](survival|power)["'])?\s*\/>[ \t]*(?:\n|$)/); if (m) return { type: 'articleChart', raw: m[0], text: m[1] || 'survival' }; }, renderer(token) { return `<div data-preview-chart="${token.text}"></div>`; } },
] });
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('trial-notes-writing-desk', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('drafts', { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('另一窗口尚未关闭草稿库。'));
  });
}
export async function initWriter() {
  if (!document.querySelector('#writer-form')) return;
  const initial = JSON.parse(document.querySelector('#writer-data')!.textContent!);
  const books: WriterBook[] = initial.books, posts: PublishedNote[] = initial.posts;
  const form = document.querySelector<HTMLFormElement>('#writer-form')!;
  const body = document.querySelector<HTMLTextAreaElement>('#writer-body')!;
  const preview = document.querySelector<HTMLElement>('#writer-preview')!;
  const saved = document.querySelector<HTMLElement>('#save-status')!;
  const draftList = document.querySelector<HTMLSelectElement>('#draft-list')!;
  const publication = document.querySelector<HTMLDialogElement>('#publish-dialog')!;
  const deleteDialog = document.querySelector<HTMLDialogElement>('#delete-dialog')!;
  let db: IDBDatabase | undefined, draft = newDraft(), dirty = false, timer: ReturnType<typeof setTimeout> | undefined;
  let allDrafts: WriterDraft[] = [], queue = Promise.resolve(true), switching = false;
  const objectUrls = new Map<string, string>();
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  function message(text: string) { const box = document.querySelector<HTMLElement>('#writer-message')!; box.textContent = text; box.hidden = !text; }
  function sync() { for (const [key, value] of new FormData(form).entries()) draft.fields[key] = String(value); draft.body = body.value; }
  function displayBookFields() { document.querySelector<HTMLElement>('#book-fields')!.hidden = field('kind').value !== 'book'; document.querySelector<HTMLElement>('#new-book-fields')!.hidden = field('bookChoice').value !== 'new'; }
  function renderPreview() {
    sync(); displayBookFields();
    document.querySelector('#preview-title')!.textContent = draft.fields.title || '未命名笔记';
    document.querySelector('#preview-description')!.textContent = draft.fields.description;
    document.querySelector('#preview-kind')!.textContent = draft.fields.kind === 'book' ? `读书笔记 · 第 ${draft.fields.chapter || '1'} 篇` : '零散笔记';
    document.querySelector('#word-count')!.textContent = `${(draft.body.match(/[\u4e00-\u9fff]/g)?.length || 0) + (draft.body.match(/[a-zA-Z]+/g)?.length || 0)} 字 / 词`;
    document.querySelector('#asset-count')!.textContent = draft.assets.length ? `${draft.assets.length} 张本地图片 · 随文章包导出` : '未添加本地图片';
    // MDX is not executed in the authoring browser. Only the two known chart elements are previewed.
    const source = draft.body.replace(/^import\s+[^\n]+\n?/gm, '');
    preview.innerHTML = DOMPurify.sanitize(md.parse(source) as string, { FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'style'] });
    for (const asset of draft.assets) if (!objectUrls.has(asset.name)) objectUrls.set(asset.name, URL.createObjectURL(asset.blob));
    preview.querySelectorAll<HTMLImageElement>('img').forEach(img => {
      const path = img.getAttribute('src') || '';
      const asset = draft.assets.find(a => path === `/images/${a.name}` || path === `${import.meta.env.BASE_URL}images/${a.name}`);
      if (asset) img.src = objectUrls.get(asset.name)!;
      else if (path.startsWith('/') && !path.startsWith('//') && !path.startsWith(import.meta.env.BASE_URL)) img.src = `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;
    });
    preview.querySelectorAll<HTMLAnchorElement>('a').forEach(a => {
      const path = a.getAttribute('href') || '';
      if (path.startsWith('/') && !path.startsWith('//') && !path.startsWith(import.meta.env.BASE_URL)) a.href = `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;
      a.target = '_blank'; a.rel = 'noopener noreferrer';
    });
    preview.querySelectorAll<HTMLElement>('[data-preview-chart]').forEach(placeholder => {
      const template = document.querySelector<HTMLTemplateElement>(`#preview-${placeholder.dataset.previewChart}`);
      if (!template) return;
      const content = template.content.cloneNode(true) as DocumentFragment;
      const chart = content.querySelector<HTMLElement>('[data-chart]')!;
      // Every inserted chart needs distinct input and accessibility IDs.
      const prefix = crypto.randomUUID(); const remap = new Map<string,string>();
      chart.querySelectorAll<HTMLElement>('[id]').forEach(el => { const old = el.id; el.id = `${prefix}-${old}`; remap.set(old, el.id); });
      chart.querySelectorAll<HTMLElement>('[for],[aria-labelledby]').forEach(el => { for (const attr of ['for','aria-labelledby']) if (el.hasAttribute(attr)) el.setAttribute(attr, el.getAttribute(attr)!.split(' ').map(id => remap.get(id) || id).join(' ')); });
      placeholder.replaceWith(content);
    });
    initCharts();
  }
  function refreshDraftList() {
    const selected = draft.id; draftList.replaceChildren();
    allDrafts.sort((a,b) => (b.savedAt || '').localeCompare(a.savedAt || '')).forEach(d => draftList.add(new Option(`${d.fields.kind === 'book' ? '读书 · ' : ''}${d.fields.title || '未命名笔记'}`, d.id)));
    if (!allDrafts.some(d => d.id === selected)) draftList.add(new Option(draft.fields.title || '未命名笔记', selected));
    draftList.value = selected;
  }
  async function readAll() { if (!db) return []; return new Promise<WriterDraft[]>((resolve, reject) => { const req = db!.transaction('drafts').objectStore('drafts').getAll(); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); }
  async function save(): Promise<boolean> {
    clearTimeout(timer); sync();
    if (!db) { saved.textContent = '浏览器保存不可用，请导出备份'; return false; }
    const snapshot = structuredClone(draft); snapshot.savedAt = new Date().toISOString();
    queue = queue.catch(() => false).then(() => new Promise<boolean>(resolve => {
      const tx = db!.transaction('drafts','readwrite'); tx.objectStore('drafts').put(snapshot);
      tx.oncomplete = () => {
        const index = allDrafts.findIndex(d => d.id === snapshot.id); if (index >= 0) allDrafts[index] = snapshot; else allDrafts.push(snapshot);
        if (draft.id === snapshot.id && body.value === snapshot.body && JSON.stringify(draft.fields) === JSON.stringify(snapshot.fields)) { dirty = false; saved.textContent = `已保存到此浏览器 · ${new Date(snapshot.savedAt!).toLocaleTimeString('zh-CN', { hour:'2-digit', minute:'2-digit' })}`; }
        refreshDraftList(); resolve(true);
      };
      tx.onerror = tx.onabort = () => { saved.textContent = '未保存成功，请导出备份'; message('浏览器草稿空间不可用或已满。请先导出文章包，避免丢失内容。'); resolve(false); };
    }));
    return queue;
  }
  function changed() { dirty = true; saved.textContent = '正在保存…'; renderPreview(); clearTimeout(timer); timer = setTimeout(() => { void save(); }, 700); }
  function load(d: WriterDraft) {
    draft = structuredClone(d); for (const u of objectUrls.values()) URL.revokeObjectURL(u); objectUrls.clear();
    for (const [key,value] of Object.entries(draft.fields)) { const element = form.elements.namedItem(key); if (element) (element as HTMLInputElement).value = value; }
    body.value = draft.body; message(''); renderPreview(); refreshDraftList(); dirty = false;
  }
  async function switchDraft(create: () => WriterDraft | undefined) {
    if (switching) return;
    switching = true; form.inert = true;
    try {
      if (db && !await save()) return;
      const next = create(); if (!next) return;
      load(next); await save();
    } finally { form.inert = false; switching = false; }
  }
  function download(blob: Blob, name: string) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
  function ready(publish = false) { sync(); const errors = validateDraft(draft,books,posts,publish); if (errors.length) { message(errors.join(' ')); document.querySelector('#writer-message')?.scrollIntoView({block:'nearest'}); return false; } message(''); return true; }
  function exportBundle(publish = false) {
    if (!ready(publish)) return;
    const files: Record<string,Uint8Array> = { [publicationPath(draft)]: strToU8(sourceText(draft,publish)) };
    const tasks = draft.assets.map(async a => { files[`public/images/${a.name}`] = new Uint8Array(await a.blob.arrayBuffer()); });
    if (draft.fields.kind === 'book' && draft.fields.bookChoice === 'new') files[`src/content/books/${draft.fields.bookId}.json`] = strToU8(JSON.stringify(bookMetadata(draft),null,2)+'\n');
    files['发布说明.txt'] = strToU8(`将各文件放到 GitHub 仓库 vam2016/statsnotes 中对应的目录，提交到 main。\n本包中的笔记 draft 为 ${!publish}。\n如有新书信息或图片，应与笔记一起提交，或先提交它们。\n图片路径是 /images/，正式构建时会自动加上 /statsnotes/。\n`);
    void Promise.all(tasks).then(() => { const bytes = zipSync(files); download(new Blob([new Uint8Array(bytes)],{type:'application/zip'}), `${draft.fields.slug}-${publish ? 'publish' : 'draft'}.zip`); });
  }
  function preparePublication() {
    if (!ready(true)) return;
    document.querySelector('#publish-summary')!.textContent = `文件：${publicationPath(draft)}。待发布内容已设为 draft: false；浏览器草稿仍保留。`;
    document.querySelector<HTMLTextAreaElement>('#publication-source')!.value = sourceText(draft,true);
    document.querySelector<HTMLAnchorElement>('#publication-link')!.href = githubEditUrl(draft,posts);
    document.querySelector<HTMLElement>('#publish-assets')!.hidden = !draft.assets.length;
    const isNewBook = draft.fields.kind === 'book' && draft.fields.bookChoice === 'new';
    document.querySelector<HTMLElement>('#publish-book')!.hidden = !isNewBook;
    if (isNewBook) { document.querySelector<HTMLTextAreaElement>('#book-source')!.value = JSON.stringify(bookMetadata(draft),null,2)+'\n'; document.querySelector<HTMLAnchorElement>('#book-edit-link')!.href = `https://github.com/vam2016/statsnotes/new/main/src/content/books?filename=${encodeURIComponent(draft.fields.bookId+'.json')}`; }
    document.querySelector('#publish-status')!.textContent = ''; publication.showModal(); void save();
  }
  async function copyFrom(id: string) {
    const textarea = document.querySelector<HTMLTextAreaElement>(id)!;
    try { await navigator.clipboard.writeText(textarea.value); document.querySelector('#publish-status')!.textContent = '已复制。打开对应的 GitHub 编辑页，粘贴并确认提交。'; }
    catch { textarea.closest('details')?.setAttribute('open',''); textarea.focus(); textarea.select(); document.querySelector('#publish-status')!.textContent = '自动复制不可用，内容已选中，请用 ⌘ / Ctrl + C 复制。'; }
  }
  function insert(text: string) { const a = body.selectionStart, b = body.selectionEnd; body.setRangeText(text,a,b,'end'); body.focus(); changed(); }
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('input', e => { const target = e.target as HTMLElement; if (target.id === 'writer-body' || target.hasAttribute('name')) changed(); });
  field('kind').addEventListener('change',() => { if ([noteTemplate,bookTemplate].includes(body.value)) body.value = field('kind').value === 'book' ? bookTemplate : noteTemplate; if (['统计推断','读书笔记'].includes(field('category').value)) field('category').value = field('kind').value === 'book' ? '读书笔记' : '统计推断'; changed(); });
  field('bookChoice').addEventListener('change',() => { const b=books.find(b=>b.id===field('bookChoice').value); if (b) field('chapter').value = String(Math.max(0,...b.chapters.map(c=>c.order))+1); changed(); });
  document.querySelectorAll<HTMLButtonElement>('[data-insert]').forEach(button => button.addEventListener('click',() => {
    const selected = body.value.slice(body.selectionStart,body.selectionEnd);
    const snippets: Record<string,string> = { heading:`\n## ${selected || '小标题'}\n\n`, bold:`**${selected || '重点内容'}**`, 'inline-math':`$${selected || '\\theta'}$`, 'block-math':`\n\n$$\n${selected || '\\widehat\\theta\\pm 1.96\\,SE(\\widehat\\theta)'}\n$$\n\n`, link:`[${selected || '链接文字'}](https://example.com)`, code:'\n\n```r\n'+(selected || '# 在这里写代码')+'\n```\n\n' }; insert(snippets[button.dataset.insert!]);
  }));
  document.querySelectorAll<HTMLButtonElement>('[data-chart-insert]').forEach(button => button.addEventListener('click',() => {
    insert(`\n\n<InteractiveChart kind="${button.dataset.chartInsert}" />\n\n`);
    if (!body.value.includes("import InteractiveChart from")) body.value = "import InteractiveChart from '../../components/InteractiveChart.astro';\n\n"+body.value;
    field('format').value = 'mdx'; field('visual').value = button.dataset.chartInsert!; button.closest('details')!.open = false; changed();
  }));
  document.querySelector<HTMLInputElement>('#image-file')!.addEventListener('change',async event => {
    const input = event.target as HTMLInputElement, file = input.files?.[0]; if (!file) return;
    const types: Record<string,string> = { 'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif' };
    if (!types[file.type]) { message('请选择 PNG、JPG、WebP 或 GIF 图片。'); input.value=''; return; }
    if (file.size > 10*1024*1024) { message('单张图片请小于 10 MB。建议先压缩图片。'); input.value=''; return; }
    const name = `${draft.fields.slug || 'note'}-${crypto.randomUUID().slice(0,8)}.${types[file.type]}`;
    draft.assets.push({name,blob:file}); insert(`\n\n![图片说明](/images/${name})\n\n`); input.value=''; await save();
  });
  document.querySelector<HTMLInputElement>('#import-file')!.addEventListener('change',async event => {
    const input = event.target as HTMLInputElement, file = input.files?.[0]; if (!file) return;
    if (file.size > 2*1024*1024) { message('文章文本请小于 2 MB。'); input.value=''; return; }
    try { const d = draftFromSource(await file.text(),file.name,books); await switchDraft(() => d); } catch(e) { message(`导入失败：${e instanceof Error ? e.message : '无法读取文件'}`); } input.value='';
  });
  document.querySelector<HTMLSelectElement>('#published-list')!.addEventListener('change',async e => {
    const select=e.target as HTMLSelectElement, p=posts.find(p=>p.id===select.value); if (!p) return;
    await switchDraft(() => { const d=draftFromSource(`---\n${YAML.stringify(p.data)}---\n\n${p.body}`,p.path.split('/').pop()!,books); d.originalPath=p.path; return d; }); select.value='';
  });
  draftList.addEventListener('change',async() => { const target=draftList.value; await switchDraft(() => allDrafts.find(d=>d.id===target)); });
  for (const [id,kind] of [['#new-note','note'],['#new-book-note','book']]) document.querySelector(id)!.addEventListener('click',async() => { await switchDraft(() => newDraft(kind)); field('title').focus(); });
  document.querySelector('#export-file')!.addEventListener('click',() => { if (ready()) download(new Blob([sourceText(draft)],{type:'text/markdown;charset=utf-8'}),`${draft.fields.slug}.${draft.fields.format}`); });
  document.querySelector('#export-bundle')!.addEventListener('click',()=>exportBundle());
  document.querySelector('#prepare-publish')!.addEventListener('click',preparePublication);
  document.querySelector('#close-publish')!.addEventListener('click',()=>publication.close());
  document.querySelector('#copy-publication')!.addEventListener('click',()=>copyFrom('#publication-source'));
  document.querySelector('#copy-book')!.addEventListener('click',()=>copyFrom('#book-source'));
  document.querySelector('#download-publication')!.addEventListener('click',()=>exportBundle(true));
  document.querySelector('#toggle-preview')!.addEventListener('click',e=>{const expanded=form.classList.toggle('preview-expanded');(e.currentTarget as HTMLElement).textContent=expanded?'返回编辑':'展开预览';});
  document.querySelector('#delete-draft')!.addEventListener('click',()=>deleteDialog.showModal());
  document.querySelector('#cancel-delete')!.addEventListener('click',()=>deleteDialog.close());
  document.querySelector('#confirm-delete')!.addEventListener('click',async() => {
    clearTimeout(timer); await queue;
    if (!db) { message('浏览器草稿库不可用。'); deleteDialog.close(); return; }
    const id=draft.id;
    await new Promise<void>((resolve,reject)=>{const tx=db!.transaction('drafts','readwrite');tx.objectStore('drafts').delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);}).catch(()=>message('草稿未能删除，请重试。'));
    allDrafts=await readAll();load(allDrafts[0] || newDraft());deleteDialog.close();await save();
  });
  document.addEventListener('keydown',e=>{if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='s') {e.preventDefault();void save();}if ((e.metaKey || e.ctrlKey) && e.key==='Enter') {e.preventDefault();preparePublication();}});
  addEventListener('beforeunload',e=>{if (dirty) {e.preventDefault();}});
  try { db=await openDatabase(); allDrafts=await readAll(); load([...allDrafts].sort((a,b)=>(b.savedAt||'').localeCompare(a.savedAt||''))[0] || newDraft()); await save(); }
  catch { load(draft); saved.textContent='浏览器保存不可用，请导出备份'; message('当前浏览器无法保存草稿。你仍可以写作和预览，请及时导出备份。'); }
}
