---
title: "一篇札记的诞生：文字、公式与图像"
description: "Markdown 写作示例：行内与独立公式、图片、链接、表格和代码都可以放进同一篇文章。"
date: 2026-09-30
category: "写作札记"
tags: ["Markdown", "LaTeX", "写作"]
author: "博主"
demo: true
visual: "writing"
---

这篇示例展示博客的日常写作格式。普通文章可以使用 Markdown，包含交互图表的文章可以使用 MDX。

## 文字有自己的层次

用标题组织论述，用**加粗**标出重点，用 *斜体* 做轻量强调。无序列表、编号步骤、引用和分隔线都可直接使用。

> 好的统计写作既说明结论，也交代结论成立的条件。

## 让公式自然融入论述

行内公式可以这样写：参数估计为 $\widehat\theta$，标准误为 $SE(\widehat\theta)$。

独立公式单独成行：

$$
\widehat\theta\pm z_{1-\alpha/2}\,SE(\widehat\theta).
$$

也可以使用矩阵与多行推导：

$$
\begin{aligned}
\mathbf Y &= \mathbf X\boldsymbol\beta+\boldsymbol\varepsilon,\\
\widehat{\boldsymbol\beta} &= (\mathbf X^\top\mathbf X)^{-1}\mathbf X^\top\mathbf Y.
\end{aligned}
$$

公式使用 KaTeX 支持的 LaTeX 数学语法。

## 用图像补充表达

![演示图：从研究问题到临床证据的思考路径](/images/evidence-path.svg)

图片可以是本地 PNG、JPG、WebP、GIF、SVG，也可以使用允许公开访问的图片链接。给图片提供替代文字，有助于屏幕阅读器用户理解内容。

## 链接、表格与代码

可以链接到 [R 项目官网](https://www.r-project.org/)，也可以链接到博客内部的[图表实验室](/lab/)。

| 写作元素 | 适用场景 |
| --- | --- |
| 正文与标题 | 组织论述 |
| 数学公式 | 表达模型和推导 |
| 图片与表格 | 展示图形和对照信息 |
| 交互图表 | 观察参数之间的关系 |

代码会自动高亮，并提供复制按钮：

```r
set.seed(2026)
x <- rnorm(100, mean = 0, sd = 1)
mean(x)
sd(x)
```

## 怎样开始下一篇？

从项目中的文章模板复制一份，将标题、摘要、日期、分类和标签换成自己的内容，然后写正文。设置 `draft: true` 的文章不会出现在发布后的站点中。

完成后提交到 GitHub，自动发布流程会将新文章加入首页、归档与 RSS。具体步骤在仓库的中文写作指南中。
