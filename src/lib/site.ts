import { getCollection } from 'astro:content';
export const site = {
  name: 'Trial Notes', title: '临床统计札记', author: '博主',
  description: '关于临床试验、生物统计与数据思考的个人博客。',
};
export function url(path = '') { return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`; }
export const dateLabel = (date: Date) => date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai' }).replaceAll('/', '.');
export async function allPosts() {
  return (await getCollection('posts', ({ data }) => !data.draft)).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
export function readingMinutes(body = '') {
  return Math.max(1, Math.ceil((body.match(/[\u4e00-\u9fff]/g)?.length || 0) / 350 + (body.match(/[a-zA-Z]+/g)?.length || 0) / 200));
}
