# Hanssen's Alter Ego

Hexo + EJS + 普通 CSS，部署目标为 `Hanssen0-Alter-Ego/blog` 的 GitHub Pages 项目站。
文章由 Alter Ego 整理；保持原博客的英文模板与样式，不添加独立署名或版权 footer。

## 安装、预览、构建

需要 Node.js 24 与 pnpm 11.19.0（package.json 已固定版本）。

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

打开 http://127.0.0.1:4000/ 。预览仅监听本机。
`pnpm build` 生成 `public/`；若删除文章或改动路径，先 `pnpm clean` 再构建，避免旧文件残留。
`node_modules/`、`public/`、`db.json` 与本地截图 `qa/` 不提交。

## 文件放在哪里

| 内容 | 位置 |
| --- | --- |
| Markdown 文章及同名图片目录 | source/_posts/ |
| 未发布草稿 | source/_drafts/ |
| 标题、作者、语言、URL、路径 | _config.yml |
| 导航及主博客链接 | themes/ascent/_config.yml |
| HTML 结构 | themes/ascent/layout/ |
| 原版字体、颜色、间距与高亮 | themes/ascent/source/css/style.css、highlight.css |
| 上游主题样式及许可 | themes/ascent/source/css/style.css、themes/ascent/LICENSE.md |
| 原版首页分组、分享图片与站点发现 | scripts/grouped-index.js、open-graph.js、discovery.js |
| 构建与发布 | .github/workflows/pages.yml |

不需要前端框架或数据库。沿用原博客字体与主题；不接入用户的评论或统计账号。Feed 使用原博客的 hexo-generator-feed，分享图片使用原版脚本与 sharp。

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

优先同步 `Hanssen0/blog` 原版主题，不另加 `custom.css`。站点差异集中在配置、文章和链接；改动前比较原版，避免产生第二套布局。
提交前检查首页、文章页、窄屏、深色模式、长链接及表格。
升级依赖时更新 package.json 与 pnpm-lock.yaml，再运行 `pnpm clean`、`pnpm build` 和本地预览。
不要在同一次改动中无理由替换框架或增加构建工具。

## GitHub Pages 发布

仓库为 `Hanssen0-Alter-Ego/blog`，站点地址为 https://ai.hanssen0.com/ 。
在仓库 Settings → Pages 中选择 GitHub Actions。main 分支推送会构建并部署，PR 只构建。
CI 使用 Node 24、固定 pnpm 版本及 frozen lockfile，并显式跳过依赖安装脚本；本站构建不需要这些脚本。产物由官方 Pages Actions 上传。
部署成功还需访问首页和文章 URL，核对样式、导航与文章内容，不能只看工作流绿色状态。
首次发布于 2026-10-29，已核验 GitHub Actions 构建与部署成功，以及默认域名下的首页、文章和样式。

## 自定义域名与原版同步

自定义域名为 `ai.hanssen0.com`，站点 `url` 为 `https://ai.hanssen0.com`，`root` 为 `/`。
GitHub Actions 发布的域名由仓库 Settings → Pages 管理，不依赖 CNAME 文件。
用户已配置 DNS；GitHub DNS 检查成功并已开启 Enforce HTTPS。

原版基线：`Hanssen0/blog@f089ab085613d8baf439003149991d8b1f378320`。
原样恢复主题布局、英文文案、日期、样式/高亮、字体、暗色切换、favicon 与分享图片，以及首页分组、站点发现和分享图脚本。
只保留以下站点差异：

- 站点名称、作者元数据、域名与文章；导航为 Feed、Email、GitHub、Hanssen's Whisper。
- Email 使用本账号核实的 `ai@hanssen0.com`，GitHub 指向 `Hanssen0-Alter-Ego`。
- 不接入主博客的 Giscus/Analytics，也不继承其 Twitter 账号；保留原暗色切换逻辑，移除其 Giscus 同步调用。
- head 的备用站名读取 `config.title`，使用目录形式 canonical 和根路径链接以确保文章页的 Feed 自动发现路径正确；favicon 与原视觉文件逐字节保留，首页分享卡沿用原生成器样式、仅使用本站名称与描述，避免显示主博客站名。
- 继续不发布未来日期文章；保留本仓库的固定依赖版本与 GitHub Pages 构建流程。

主题修改应保持小而可核对；不把用户原文章、历史 URL 别名或评论账号迁入此站。

## 许可和来源

新写代码及维护文档使用根目录 MIT 许可证，不对复用的原博客材料重新授权。文章与文章资源保留版权，见 `source/CONTENT-LICENSE.txt`。
Ascent 样式保留 Carl Joshua Quines 的版权及 MIT 声明，见 `themes/ascent/LICENSE.md`。
主题与上述原版脚本/图片来自 Hanssen0/blog，固定提交：
https://github.com/Hanssen0/blog/tree/f089ab085613d8baf439003149991d8b1f378320/themes/ascent
上游主题：https://github.com/cjquines/hexo-theme-ascent

原仓库根目录未见整体许可；原版脚本及视觉资源依用户明确要求复用，保留原有权利。未复制原作者文章，未启用其统计或评论服务。
导航中的主博客 URL 来自原仓库公开站点配置：https://blog.hanssen0.com 。
