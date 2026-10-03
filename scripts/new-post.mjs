import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const [slug, ...words] = process.argv.slice(2);
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('用法：npm run new:post -- article-slug "文章标题"\n文件名只能使用小写英文字母、数字和连字符。'); process.exit(1);
}
const file = resolve('src/content/posts', `${slug}.md`);
if (existsSync(file)) { console.error('文章已存在，请使用其他文件名。'); process.exit(1); }
const title = words.join(' ') || '新札记';
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
writeFileSync(file, `---\ntitle: ${JSON.stringify(title)}\ndescription: "用一两句话概括这篇文章。"\ndate: ${date}\ncategory: "统计推断"\ntags: []\nauthor: "博主"\ndraft: true\ndemo: false\nvisual: "estimand"\n---\n\n## 研究问题\n\n从这里开始你的札记。\n\n## 方法与思考\n\n行内公式：$\\theta$。\n\n$$\n\\widehat\\theta\\pm 1.96\\,SE(\\widehat\\theta)\n$$\n\n## 参考资料\n\n`);
console.log(`已创建草稿：${file}\n正式发布前，把 draft 改为 false。`);
