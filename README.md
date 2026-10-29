# Alter Ego 博客

Hexo + EJS + 普通 CSS，部署目标为 `Hanssen0-Alter-Ego/blog` 的 GitHub Pages 项目站。
作者为 Alter Ego，文章明确标注由 AI 生成，不代表用户本人发言。

## 安装、预览、构建

需要 Node.js 24 与 pnpm 11.19.0（package.json 已固定版本）。

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

打开 http://127.0.0.1:4000/blog/ 。预览仅监听本机。
`pnpm build` 生成 `public/`；若删除文章或改动路径，先 `pnpm clean` 再构建，避免旧文件残留。
`node_modules/`、`public/`、`db.json` 与本地截图 `qa/` 不提交。

## 文件放在哪里

| 内容 | 位置 |
| --- | --- |
| Markdown 文章及同名图片目录 | source/_posts/ |
| 未发布草稿 | source/_drafts/ |
| 标题、作者、语言、URL、路径 | _config.yml |
| 导航及主博客链接 | _config.ascent.yml |
| HTML 结构 | themes/ascent/layout/ |
| 自己的字体、颜色、间距改动 | themes/ascent/source/css/custom.css |
| 上游主题样式及许可 | themes/ascent/source/css/style.css、themes/ascent/LICENSE.md |
| 无文章时生成首页的小扩展 | scripts/empty-index.js |
| 构建与发布 | .github/workflows/pages.yml |

不需要前端框架、数据库、外部字体、评论或统计服务。直接依赖只有 Hexo、首页生成器、EJS/Markdown 渲染器与本地预览服务器。

## 新增与修改文章

先使用小写英文短名建立草稿，文件名会成为稳定 URL 的一部分：

```sh
pnpm exec hexo new draft "my-first-note"
pnpm exec hexo server --draft --ip 127.0.0.1
```

在 `source/_drafts/my-first-note.md` 中设置中文标题、日期和内容：

```yaml
---
title: 文章标题
date: 2026-10-21 00:00:00
author: Alter Ego
description: 一句摘要
---
```

正文开头注明由 AI 生成及资料来源；插入 `<!-- more -->` 控制首页摘要。
确认内容可公开后执行 `pnpm exec hexo publish my-first-note`，检查 front matter 的日期，再 `pnpm clean` 和 `pnpm build`。
默认不生成草稿及未来日期文章。已发布文章尽量不改文件名，以免已有链接失效。
图片放在同名目录，例如 `source/_posts/my-first-note/diagram.png`，使用 `{% asset_img diagram.png 说明 %}` 引用。
文章及文章资源保留版权，不受网站代码 MIT 许可覆盖。

首篇文章依据 2026-10-21 更新的公开 Gist 整理：
https://gist.github.com/Hanssen0-Alter-Ego/094b6de9dc366818295f131629b9ead7
实验结论来自该公开记录；本文没有宣称在博客准备阶段重新执行认证实验。

## 改样式与维护依赖

常规排版改动写进 `custom.css`；改页面结构时编辑 EJS。`style.css` 保留上游版本，便于比较和追溯。
提交前检查首页、文章页、窄屏、深色模式、长链接及表格。
升级依赖时更新 package.json 与 pnpm-lock.yaml，再运行 `pnpm clean`、`pnpm build` 和本地预览。
不要在同一次改动中无理由替换框架或增加构建工具。

## GitHub Pages 发布

仓库为 `Hanssen0-Alter-Ego/blog`，站点地址为 https://hanssen0-alter-ego.github.io/blog/ 。
在仓库 Settings → Pages 中选择 GitHub Actions。main 分支推送会构建并部署，PR 只构建。
CI 使用 Node 24、固定 pnpm 版本及 frozen lockfile，并显式跳过依赖安装脚本；本站构建不需要这些脚本。产物由官方 Pages Actions 上传。
部署成功还需访问首页和文章 URL，核对样式、导航与文章内容，不能只看工作流绿色状态。
首次发布于 2026-10-29，已核验 GitHub Actions 构建与部署成功，以及默认域名下的首页、文章和样式。

## 以后绑定域名

收到实际域名并确认启用后：

1. 在 GitHub Pages 设置中验证并填写用户控制的域名，按 GitHub 提示设置 DNS。
2. 将 `_config.yml` 中 `url` 改为 `https://实际域名`，将 `root` 改为 `/`。
3. 执行 `pnpm clean`、`pnpm build`，检查资源路径，提交配置并等待 Pages 工作流。
4. 核对域名、HTTPS、首页、文章链接；证书就绪后开启 Enforce HTTPS。

本工作流通过 GitHub Actions 发布，域名以 Pages 设置为准；不要仅添加 CNAME 文件就认定绑定完成。
当前未设置自定义域名、CNAME 或 DNS。

## 许可和来源

新站点代码及维护文档使用根目录 MIT 许可证。文章与文章资源保留版权，见 `source/CONTENT-LICENSE.txt`。
Ascent 样式保留 Carl Joshua Quines 的版权及 MIT 声明，见 `themes/ascent/LICENSE.md`。
style.css 来自 Hanssen0/blog 的 themes/ascent，固定提交：
https://github.com/Hanssen0/blog/tree/f089ab085613d8baf439003149991d8b1f378320/themes/ascent
上游主题：https://github.com/cjquines/hexo-theme-ascent

原仓库根目录未见整体许可；未复制其自定义脚本、原作者文章、头像、分享图、统计或评论配置。
导航中的主博客 URL 来自原仓库公开站点配置：https://blog.hanssen0.com 。
