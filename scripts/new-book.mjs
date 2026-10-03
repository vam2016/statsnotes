import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { slugPattern } from '../src/lib/writer-model.ts';
const [id,...words] = process.argv.slice(2);
if (!id || !slugPattern.test(id) || !words.length) { console.error('用法：npm run new:book -- book-id "完整书名"');process.exit(1); }
const file=resolve('src/content/books',`${id}.json`);
if (existsSync(file)) {console.error('该书籍标识已存在。');process.exit(1);}
writeFileSync(file,JSON.stringify({title:words.join(' '),description:'在这里填写这本书的学习目标与简介。',color:'blue',demo:false},null,2)+'\n');
console.log(`已创建书籍信息：${file}\n下一步：npm run new:note -- chapter-slug "章节标题" --book ${id} --chapter 1`);
