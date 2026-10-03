# Trial Notes · 临床统计札记

博客：**https://vam2016.github.io/statsnotes/**

两个阅读板块：**零散笔记**和**读书笔记**。图表是笔记内容的一部分。静态博客继续使用 GitHub Pages，不需要服务器或自购域名。

## 推荐的写作方式：打开写作台

**https://vam2016.github.io/statsnotes/write/**

不用安装编辑软件，也不用手写文章信息：

1. 选择「新建零散笔记」或「新建读书笔记」。填写标题、摘要、日期和文件名。
2. 在左侧正文区写 Markdown，在右侧查看文字、LaTeX 公式、图片和表格预览。
3. 工具栏可以插入标题、加粗、公式、代码、图片和本站的两类交互图表；插入图表会自动切换为 MDX。
4. 草稿自动保存在**当前浏览器**，可切换多篇草稿、导入 `.md` / `.mdx` 文件，也可载入本站已发布笔记继续修改。
5. 写好后点「准备发布」→「复制完整笔记」→「打开 GitHub 编辑页」。在 GitHub 将文件内容全部替换为复制的文本，选择 Commit changes 提交到 main。
6. GitHub 自动检查并发布。可在发布窗口点击「查看发布进度」。

准备发布的文本自动设为 `draft: false`。导出的普通草稿设为 `draft: true`，不会出现在公开博客中。准备发布不会代替你提交 GitHub，也不会索取账户密码或访问令牌；最后的提交仍在 GitHub 网页完成。

浏览器草稿使用 IndexedDB。它不会同步到其他电脑或浏览器；清理网站数据会删除草稿。请定期点击「导出草稿」或「导出文章包」备份。保存空间不可用时，写作台会提示你导出，不会假装保存成功。

### 图片如何发布？

在工具栏选择图片，可在正文中插入图片并预览。图片和草稿一起保存在当前浏览器。

点击「导出文章包」，会得到 ZIP，包含：

- `src/content/posts/文件名.md` 或 `.mdx`：文章源文件。
- `public/images/`：新增图片。
- `src/content/books/书籍标识.json`：新书信息（如果有）。
- `发布说明.txt`。

将图片上传到 GitHub 的 `public/images/`，再发布笔记。写作台的发布窗口有对应目录入口。本地图片目前支持 PNG、JPG、WebP、GIF，单张不超过 10 MB；也可直接在正文中使用已有的公开图片 URL。

### 怎样开始一本新书？

1. 在写作台选择「新建读书笔记」。
2. 「书籍」选择「添加一本新书」，填写真实书名、书籍标识、原书作者与版本（作者、版本可选）。
3. 为章节填写**正整数顺序**，例如 1、2、3。同一本书的所有笔记使用相同书籍标识。
4. 点击「准备发布」。先复制并提交书籍信息，再复制并提交章节笔记。发布窗口提供两个文件各自的 GitHub 入口。
5. 以后写下一章时，从列表中选择同一本书，写作台会建议下一个序号。

书架、学习目录、前后篇导航和章节侧栏会自动生成。为避免章节混乱，同一本书不能有两篇公开笔记使用相同顺序。

书籍标识决定书籍地址，例如 `clinical-trials-book` → `/books/clinical-trials-book/`。笔记文件名决定原有文章地址，仍为 `/posts/笔记文件名/`。文件名和书籍标识建议使用英文小写、数字和连字符，公开之后尽量保持稳定。

## 直接使用 Markdown 文件

模板位于 `templates/`：

- `note.md`：零散笔记。
- `book-note.md`：章节笔记。
- `book.json`：书籍信息。
- `article.mdx`：带交互图表的笔记（保留上一版模板兼容）。

零散笔记的信息示例：

```yaml
---
title: "一篇笔记"
description: "摘要"
date: 2026-10-03
kind: note
category: "统计推断"
tags: ["R"]
author: "博主"
draft: false
visual: estimand
---
```

读书笔记再加上：

```yaml
kind: book
book: clinical-trials-book
chapter: 1
```

书籍信息保存到 `src/content/books/clinical-trials-book.json`：

```json
{
  "title": "实际书名",
  "description": "学习目标与简介",
  "author": "原书作者",
  "edition": "第 2 版",
  "color": "blue",
  "demo": false
}
```

`color` 支持 `blue`、`green`、`violet`，决定书架上的封面颜色。`updated` 是可选的笔记更新时间。`visual` 支持 `writing`、`estimand`、`survival`、`power`，决定列表插图。

## 公式与交互图表

行内公式用 `$...$`，独立公式用 `$$`：

```markdown
参数估计为 $\widehat\theta$。

$$
\widehat\theta\pm z_{1-\alpha/2}SE(\widehat\theta)
$$

![图片描述](/images/my-figure.png)
[另一篇笔记](/posts/sample-size/)
```

站内根路径会自动加上 `/statsnotes/`，公式样式和字体随网站打包。

MDX 可以使用交互图表：

```mdx
import InteractiveChart from '../../components/InteractiveChart.astro';

<InteractiveChart kind="power" />
<InteractiveChart kind="survival" />
```

写作台预览 Markdown、LaTeX 和上述两类交互图表。其他 MDX 组件、任意 JSX 或多行 import 不在写作台执行；完整编译由 GitHub 构建完成。普通笔记建议用 Markdown，确需组件时再使用 MDX。

视频和音频可在 MDX 中使用 HTML5 元素，将文件放在 `public/media/`：

```mdx
import { url } from '../../lib/site';

<video controls preload="metadata" src={url('media/demo.mp4')} />
<audio controls preload="metadata" src={url('media/demo.mp3')} />
```

## 可选：本地编辑

需要 Node.js 24（建议 24.16 或更新的 24.x）：

```sh
npm ci
npm run dev
```

本地预览默认 `/`，GitHub 项目路径预览：

```sh
GITHUB_REPOSITORY=vam2016/statsnotes npm run dev
# http://localhost:4321/statsnotes/
```

创建笔记和书籍：

```sh
npm run new:note -- my-note "我的零散笔记"
npm run new:book -- my-book "实际书名"
npm run new:note -- my-book-ch01 "第一章笔记" --book my-book --chapter 1
# 加 --mdx 可创建 MDX 文件。
```

`new:post` 仍兼容零散笔记命令。创建的笔记默认草稿，不会覆盖同名文件。

验证与构建：

```sh
npm run check
npm test
GITHUB_REPOSITORY=vam2016/statsnotes npm run build
GITHUB_REPOSITORY=vam2016/statsnotes npm run preview
```

## 当前示例与兼容链接

当前零散笔记有 3 篇示例，书架有 1 个**读书笔记结构示例**及 2 篇章节示例。结构示例没有对应实际书籍，也不是从某本书摘录。可删除这些示例，或将章节和笔记设为 `draft: true`。

上一版的文章地址保留。`/posts/` 转向零散笔记，`/lab/` 转向带图表的样本量笔记。主导航为「零散笔记 / 读书笔记 / 关于」，不再有独立图表实验室。

`src/lib/site.ts` 修改站名、署名与简介；`src/pages/about.astro` 修改博主介绍；`src/styles/global.css` 修改样式。

## 发布配置

仓库已启用 GitHub Pages / GitHub Actions。提交 main 后，工作流先检查内容、类型与数值，再构建静态页面并发布。`draft: true` 的笔记不会进入页面、RSS、站点地图或写作台的公开笔记列表。书籍引用不存在或章节顺序重复时，构建会明确报错。

## 图表说明与参考

生存图是恒定风险下的指数生存函数，不包含抽样置信区间，亦不是患者数据的 Kaplan–Meier 估计。效能图采用两组独立、等样本量、已知共同标准差的双侧 Z 检验，未包含脱落或复杂设计。

- [Astro Markdown 与 MDX](https://docs.astro.build/en/guides/markdown-content/)
- [GitHub Pages 发布](https://docs.astro.build/en/guides/deploy/github/)
