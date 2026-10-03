import YAML from 'yaml';
export interface WriterDraft {
  id: string; fields: Record<string, string>; body: string;
  extra: Record<string, unknown>; assets: { name: string; blob: Blob }[];
  originalPath?: string; savedAt?: string;
}
export interface WriterBook { id: string; title: string; description: string; author?: string; edition?: string; color?: string; chapters: { id: string; order: number }[]; }
export interface PublishedNote { id: string; path: string; body: string; data: Record<string, unknown>; }
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function chinaDate() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export const noteTemplate = '## 研究问题\n\n我想理解的问题是……\n\n## 方法与思考\n\n先说明假设，再写下推导与观察。\n\n## 参考资料\n\n';
export const bookTemplate = '## 本章的核心问题\n\n这一章回答了什么问题？\n\n## 定义与推导\n\n记录公式、符号含义与成立条件。\n\n## 我的理解与疑问\n\n用自己的话解释，并记下需要继续追问的问题。\n\n## 原书位置与参考\n\n书名 / 版本 / 章节 / 页码\n';
export function newDraft(kind = 'note'): WriterDraft {
  return { id: crypto.randomUUID(), fields: { title: '', description: '', slug: '', kind, date: chinaDate(), category: kind === 'book' ? '读书笔记' : '统计推断', tags: '', author: '博主', format: 'md', visual: kind === 'book' ? 'writing' : 'estimand', bookChoice: 'new', bookId: '', bookTitle: '', bookAuthor: '', bookDescription: '', bookEdition: '', chapter: '1' }, body: kind === 'book' ? bookTemplate : noteTemplate, extra: {}, assets: [] };
}
export function sourceMetadata(draft: WriterDraft, publish = false) {
  const f = draft.fields;
  const data: Record<string, unknown> = { ...draft.extra, title: f.title.trim(), description: f.description.trim(), date: f.date, category: f.category.trim() || (f.kind === 'book' ? '读书笔记' : '统计推断'), tags: f.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean), author: f.author.trim() || '博主', kind: f.kind, draft: !publish, demo: false, visual: f.visual };
  if (f.kind === 'book') { data.book = f.bookChoice === 'new' ? f.bookId.trim() : f.bookChoice; data.chapter = Number(f.chapter); }
  else { delete data.book; delete data.chapter; }
  return data;
}
export function sourceText(draft: WriterDraft, publish = false) { return `---\n${YAML.stringify(sourceMetadata(draft, publish))}---\n\n${draft.body.trimEnd()}\n`; }
export function bookMetadata(draft: WriterDraft) {
  const f = draft.fields; return { title: f.bookTitle.trim(), description: f.bookDescription.trim() || `《${f.bookTitle.trim()}》的系统学习笔记。`, ...(f.bookAuthor.trim() ? { author: f.bookAuthor.trim() } : {}), ...(f.bookEdition.trim() ? { edition: f.bookEdition.trim() } : {}), color: 'blue', demo: false };
}
export function validateDraft(draft: WriterDraft, books: WriterBook[], posts: PublishedNote[], publish = false): string[] {
  const f = draft.fields, errors: string[] = [];
  if (!f.title.trim()) errors.push('请填写笔记标题。');
  if (!f.description.trim()) errors.push('请填写一两句话的摘要。');
  if (!slugPattern.test(f.slug)) errors.push('文件名请使用小写英文、数字和连字符，例如 sample-size-note。');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || Number.isNaN(Date.parse(`${f.date}T00:00:00Z`)) || new Date(`${f.date}T00:00:00Z`).toISOString().slice(0,10) !== f.date) errors.push('请选择有效的笔记日期。');
  if (f.kind === 'book') {
    if (f.bookChoice === 'new') {
      if (!slugPattern.test(f.bookId)) errors.push('请填写书籍标识，例如 clinical-trials-book。');
      if (!f.bookTitle.trim()) errors.push('请填写书名。');
      if (books.some(b => b.id === f.bookId)) errors.push('这个书籍标识已存在，请从书籍列表中选择它。');
    } else if (!books.some(b => b.id === f.bookChoice)) errors.push('请选择书籍，或填写新书信息。');
    if (!Number.isInteger(Number(f.chapter)) || Number(f.chapter) <= 0) errors.push('章节顺序必须是正整数。');
    const bookId = f.bookChoice === 'new' ? f.bookId : f.bookChoice;
    if (publish && books.find(b => b.id === bookId)?.chapters.some(c => c.order === Number(f.chapter) && c.id !== f.slug)) errors.push('该书已经有相同章节顺序的笔记，请改用其他序号。');
  }
  const existing = posts.find(p => p.id === f.slug);
  if (existing && !existing.path.endsWith(`.${f.format}`)) errors.push('该文件名已用于另一种格式，请导入原笔记编辑，或更改文件名。');
  return errors;
}
export function draftFromSource(source: string, filename: string, books: WriterBook[]): WriterDraft {
  const matched = source.replace(/^\uFEFF/, '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/);
  if (!matched) throw new Error('文章需要以 --- 包围的 YAML 信息开头。可以先使用写作模板。');
  const data = YAML.parse(matched[1], { maxAliasCount: 50 });
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('文章信息应包含 title、description、date 等字段。');
  const d = newDraft(data.kind === 'book' || data.book ? 'book' : 'note');
  const book = books.find(b => b.id === data.book);
  const date = data.date instanceof Date ? data.date.toISOString().slice(0,10) : String(data.date || chinaDate()).slice(0,10);
  Object.assign(d.fields, { title: String(data.title || ''), description: String(data.description || ''), slug: filename.replace(/\.(md|mdx)$/i, ''), date, category: String(data.category || '统计推断'), author: String(data.author || '博主'), tags: Array.isArray(data.tags) ? data.tags.join(', ') : '', format: filename.toLowerCase().endsWith('.mdx') ? 'mdx' : 'md', visual: String(data.visual || 'writing'), bookChoice: book?.id || 'new', bookId: String(data.book || ''), bookTitle: book?.title || '', chapter: String(data.chapter || 1) });
  d.body = matched[2]; d.extra = data; return d;
}
export function publicationPath(draft: WriterDraft) { return `src/content/posts/${draft.fields.slug}.${draft.fields.format}`; }
export function githubEditUrl(draft: WriterDraft, posts: PublishedNote[]) {
  const path = publicationPath(draft);
  return posts.some(p => p.path === path) ? `https://github.com/vam2016/statsnotes/edit/main/${path}` : `https://github.com/vam2016/statsnotes/new/main/src/content/posts?filename=${encodeURIComponent(`${draft.fields.slug}.${draft.fields.format}`)}`;
}
