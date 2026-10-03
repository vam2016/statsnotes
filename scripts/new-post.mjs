import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { chinaDate, noteTemplate, bookTemplate, slugPattern } from '../src/lib/writer-model.ts';
import YAML from 'yaml';
const args = process.argv.slice(2), plain = [], options = {};
for (let i=0;i<args.length;i++) {
  if (args[i] === '--mdx') options.mdx = true;
  else if (['--book','--chapter'].includes(args[i])) options[args[i].slice(2)] = args[++i];
  else plain.push(args[i]);
}
const [slug,...words] = plain;
function fail(text) { console.error(text); process.exit(1); }
if (!slug || !slugPattern.test(slug)) fail('用法：npm run new:note -- note-slug "笔记标题"\n读书笔记：npm run new:note -- chapter-slug "章节标题" --book book-id --chapter 1\n文件名只能使用小写英文、数字和连字符。');
if (['md','mdx'].some(ext=>existsSync(resolve('src/content/posts', `${slug}.${ext}`)))) fail('同名笔记已存在，请更改文件名。');
if (options.book && (!slugPattern.test(options.book) || !existsSync(resolve('src/content/books',`${options.book}.json`)))) fail('找不到这本书，请先用 new:book 创建书籍信息。');
if (options.book && (!Number.isInteger(Number(options.chapter)) || Number(options.chapter)<=0)) fail('请通过 --chapter 指定正整数章节顺序。');
const kind = options.book ? 'book' : 'note', format=options.mdx?'mdx':'md';
const metadata = { title:words.join(' ') || '新札记',description:'用一两句话概括这篇笔记。',date:chinaDate(),kind,category:kind==='book'?'读书笔记':'统计推断',tags:[],author:'博主',draft:true,demo:false,visual:kind==='book'?'writing':'estimand',...(options.book?{book:options.book,chapter:Number(options.chapter)}:{}) };
const file=resolve('src/content/posts',`${slug}.${format}`);
writeFileSync(file,`---\n${YAML.stringify(metadata)}---\n\n${kind==='book'?bookTemplate:noteTemplate}`);
console.log(`已创建草稿：${file}\n正式发布前，把 draft 改为 false。`);
