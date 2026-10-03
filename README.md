# Trial Notes · 临床统计札记

一个面向临床试验生物统计写作的个人博客，署名为「博主」。静态站点，发布在 **https://vam2016.github.io/statsnotes/**，无需购买服务器或域名。

## 第一版功能

- Markdown / MDX 文章，支持 LaTeX 行内、独立和多行公式（KaTeX）。
- 图片、超链接、表格、代码高亮与复制；MDX 还可以加入交互组件和 HTML5 音视频。
- 生存函数和检验效能的交互演示：滑块、悬浮读数、参数复位、CSV 导出。
- 文章搜索、分类筛选、阅读目录、进度条、链接复制、RSS 和站点地图。
- 手机布局、深浅色主题、键盘操作与减少动态效果设置。
- 提交到 main 后，由 GitHub Actions 自动构建并发布。

随附四篇**示例文章**；它们不是博主已发表的作品。正式写作后可以删除示例文件，或设为 `draft: true`。

## 在 GitHub 上发布

项目已配置仓库 `vam2016/statsnotes`。在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**，再在 **Actions → Deploy Trial Notes to GitHub Pages → Run workflow** 运行一次。

以后更新 main 分支，部署会自动执行；成功后访问 https://vam2016.github.io/statsnotes/ 。未确认工作流成功之前，不能把这个地址视为已上线。

部署流程通过 GitHub Pages 输出取得域名和项目路径，因此文章链接、CSS、公式字体、图片、RSS 均兼容 `/statsnotes/`。GitHub Free 的 Pages 使用公开仓库；不要将未公开的试验数据放到这个公开博客。

## 不安装软件也可以写文章

1. 在仓库打开 `templates/article.md`，复制内容。
2. 在 `src/content/posts/` 目录选择 **Add file → Create new file**，文件名如 `my-first-note.md`（推荐英文小写和连字符）。
3. 粘贴模板，修改标题、摘要、日期、分类、标签及正文。
4. 草稿使用 `draft: true`。正式发布时改为 `draft: false`，保留 `demo: false`。
5. 提交到 main。待 Actions 显示成功后，文章会自动出现在博客中。

文件名决定文章地址，例如 `my-first-note.md` 对应 `/statsnotes/posts/my-first-note/`。公开文章尽量不要随意改名，避免旧链接失效。日期使用 `YYYY-MM-DD`；`updated` 可选，用来显示更新时间。分类由文章元数据自动汇总。`visual` 可以选 `survival`、`power`、`estimand`、`writing`，决定列表卡片的插图。

## 公式、图片、链接和音视频

行内公式用 `$...$`，独立公式用 `$$`：

```markdown
行内公式：$\widehat\theta$。

$$
\widehat\theta\pm z_{1-\alpha/2}SE(\widehat\theta)
$$

![图片描述](/images/my-figure.png)
[外部链接](https://www.r-project.org/)
[博客内部链接](/lab/)
```

把本地图片上传到 `public/images/`。Markdown 中 `/images/...` 和 `/lab/` 这样的站内路径会自动加上仓库前缀。不依赖外部 CDN 的公式渲染器、样式和字体已经打包进站点。

MDX 中可以使用交互组件（复制 `templates/article.mdx` 到 `src/content/posts/`）：

```mdx
import InteractiveChart from '../../components/InteractiveChart.astro';

<InteractiveChart kind="power" />
<InteractiveChart kind="survival" />
```

MDX 使用 JavaScript/JSX 语法，正文中的特殊花括号需要转义。普通文章优先用 `.md`。

本地视频或音频放入 `public/media/`，在 MDX 中使用下面方式，确保项目路径正确：

```mdx
import { url } from '../../lib/site';

<video controls preload="metadata" src={url('media/demo.mp4')} />
<audio controls preload="metadata" src={url('media/demo.mp3')} />
```

视频较大时，推荐使用外部媒体托管的公开地址，减少仓库体积。远程内容是否可用取决于其服务与访问权限。

## 本地预览与写作

需要 Node.js 24（建议 24.16 或更新的 24.x）。

```sh
npm ci
npm run dev
```

访问终端给出的预览地址。默认本地路径是 `/`；如需验证 GitHub 项目路径：

```sh
GITHUB_REPOSITORY=vam2016/statsnotes npm run dev
# 打开 http://localhost:4321/statsnotes/
```

新建文章可以复制模板，也可以运行：

```sh
npm run new:post -- my-first-note "我的第一篇札记"
```

验证与构建：

```sh
npm run check
GITHUB_REPOSITORY=vam2016/statsnotes npm run build
GITHUB_REPOSITORY=vam2016/statsnotes npm run preview
```

静态产物在 `dist/`，不需要运行后端。

## 修改站名和外观

- `src/lib/site.ts`：博客名、中文名、署名、描述。
- `src/pages/index.astro`：首页文案。
- `src/pages/about.astro`：博主介绍；目前没有编造学历、任职或个人经历。
- `src/styles/global.css`：颜色、字体、间距、响应式布局。
- `public/favicon.svg`：站点图标。

## 图表的计算范围

生存图是恒定风险下的指数生存函数，使用解析表达式 `S(t)=exp(-λt)`，不包含抽样置信区间，亦不是患者数据的 Kaplan–Meier 估计。

效能图是两组独立、等样本量、正态结局、已知共同标准差的双侧 Z 检验。标准正态 CDF 使用数值近似；给定目标效能时按整数样本量求解。它不考虑脱落、未知方差或复杂设计。随附的 R t 检验例子采用不同假设，不能期待与 Z 检验演示完全一致。

## 官方参考

- [Astro Markdown 与 MDX](https://docs.astro.build/en/guides/markdown-content/)
- [Astro 部署到 GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
