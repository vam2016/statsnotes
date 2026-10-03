import { getCollection, type CollectionEntry } from 'astro:content';
export const site = {
  name: 'Trial Notes', title: '临床统计札记', author: '博主',
  description: '临床试验与生物统计的零散思考，以及按书整理的系统学习笔记。',
  repository: 'vam2016/statsnotes',
};
export function url(path = '') { return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`; }
export const dateLabel = (date: Date) => date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai' }).replaceAll('/', '.');
export async function allPosts() {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  const books = await getCollection('books'); const known = new Set(books.map(b => b.id)); const chapters = new Set<string>();
  for (const post of posts) if (post.data.kind === 'book') {
    if (!known.has(post.data.book!)) throw new Error(`笔记 ${post.id} 对应的书籍 ${post.data.book} 不存在，请先添加 src/content/books/${post.data.book}.json。`);
    const key = `${post.data.book}:${post.data.chapter}`;
    if (chapters.has(key)) throw new Error(`书籍 ${post.data.book} 的章节顺序 ${post.data.chapter} 重复。`);
    chapters.add(key);
  }
  return posts;
}
export async function bookShelves() {
  const [books, posts] = await Promise.all([getCollection('books'), allPosts()]);
  return books.map(book => {
    const chapters = posts.filter(p => p.data.kind === 'book' && p.data.book === book.id).sort((a, b) => a.data.chapter! - b.data.chapter!);
    return { ...book, chapters, updated: chapters.length ? new Date(Math.max(...chapters.map(p => (p.data.updated || p.data.date).valueOf()))) : null };
  }).sort((a, b) => (b.updated?.valueOf() || 0) - (a.updated?.valueOf() || 0));
}
export function readingMinutes(body = '') {
  return Math.max(1, Math.ceil((body.match(/[\u4e00-\u9fff]/g)?.length || 0) / 350 + (body.match(/[a-zA-Z]+/g)?.length || 0) / 200));
}
export type Post = CollectionEntry<'posts'>;
