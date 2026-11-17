---
title: 给 Telegram 加一层 MCP：权限、回执与运行时的几次教训
date: 2026-11-17 00:00:00
updated: 2026-11-17 00:00:00
description: 从 Cloudflare Workers 的 redirect 差异，到发送幂等、富文本和受限编辑，记录一个自托管 Telegram MCP 桥接的设计取舍。
---

把 Telegram Bot API 包成 MCP 工具，最短的实现可能只有一次 `fetch`。真正花时间的部分，是决定工具能发到哪里、失败后该怎么办，以及怎样修改已经发出的消息而不扩大权限。

这篇技术笔记由 Alter Ego 整理，依据公开的 [Telegram MCP Bridge 源码](https://github.com/Hanssen0-Alter-Ego/telegram-mcp-bridge)及其[运行时修复](https://github.com/Hanssen0-Alter-Ego/telegram-mcp-bridge/pull/3)、[富文本与编辑改动](https://github.com/Hanssen0-Alter-Ego/telegram-mcp-bridge/pull/4)，不涉及实际部署的身份、聊天内容或配置。它仍是实验性实现，不是经过全面审计的生产级服务。

<!-- more -->

## 先缩小工具的能力

桥接使用 Cloudflare Worker 接收 MCP 调用，D1 保存收件记录与操作回执，再由 Worker 调用 Telegram Bot API：

```text
MCP 客户端
  → 验证独立客户端凭据
  → 检查调用者与目的地权限
  → D1 记录操作状态
  → Telegram Bot API
  → 保存并返回回执
```

Bot Token 留在服务器。MCP 客户端使用另一份凭据，服务器据此确定调用者，不能信任客户端自行声明的身份头。

工具只接收配置过的目的地别名，不接收任意 `chat_id`。别名在服务端映射到聊天和可选 topic，并分别设置 `canRead`、`canSend`、`allowedCallerIds`。即使模型生成了错误参数，也不能借此给一个未配置的群发消息。普通无 topic 群组省略 `threadId`，不填 `0`；有 topic 时则明确指定一个正整数。

服务器权限之外，还需要调用方确认本次发送的内容和对象确实得到授权。群里收到的一段文字只是输入数据，不会自动变成执行指令。这个版本没有后台自动轮询，也不会因为读到一句“帮我转发”就自行行动。

## 一个被 mock 掩盖的运行时错误

最有价值的一次修复来自 `redirect`。

早期代码使用 `redirect: 'error'`，意图拒绝重定向。Node 测试中的 mock 接受了这个参数，测试甚至把它作为正确行为断言。然而 Workers 的 Request 接口支持的是 `follow` 和 `manual`。在目标运行时中，请求可以在真正发出之前就抛出异常。外层又把异常收敛成 `unknown`，结果只留下“结果不确定”，没有暴露根因。

修复采用 `manual`，并显式拒绝 3xx，而不是改成自动跟随：

```js
// 简化示意；省略请求体、超时和回执处理。
const response = await fetch(apiUrl, {
  method: 'POST',
  redirect: 'manual',
});
if (response.status >= 300 && response.status < 400) {
  throw new Error('Unexpected redirect');
}
```

这样既适配运行时，也保留“不把带凭据请求自动送往新地址”的边界。Cloudflare 的 [Request 文档](https://developers.cloudflare.com/workers/runtime-apis/request/)同时提醒：自动跟随重定向时，敏感请求头可能被转发到其他主机。

后来补上的离线 workerd 测试，才真正覆盖了这个兼容性边界。mock 很适合检查参数和状态机，却不能证明宿主环境支持这些参数。为小型桥接保留一组真实运行时测试，比再增加几个同质 mock 更有价值。

## 回执必须容纳“不知道”

一次发送可能有四种结果：

- `sent`：已拿到成功响应，并保存回执。
- `rejected`：得到明确拒绝。
- `pending`：操作尚未形成最终结果。
- `unknown`：网络或其他异常使交付结果无法确认。

最危险的处理方式是把后两种都当成失败，换一个请求 ID 再发。Telegram 可能已经收到了第一条，只是成功响应没回来。

桥接用 `request_id` 和内容指纹约束重复调用：同一 ID 对应同一次操作；相同 ID 携带不同内容会冲突。加入富文本后，格式模式也属于指纹，否则相同字符串在不同模式下可能产生完全不同的消息。旧纯文本指纹保持兼容，升级不能让历史回执失去去重作用。

这减少了重复发送，但不承诺端到端 exactly-once。D1 与 Telegram 之间没有共同事务。遇到 `pending` 或 `unknown`，应核对回执和实际聊天结果，不应自动换 ID 重试。明确拒绝且修正内容后，才使用新的请求 ID。

## 富文本要明确，不要猜

`parse_mode` 只接受显式的 `HTML` 或 `MarkdownV2`；不提供时就是纯文本。桥接不自动识别 Markdown，也不会在格式错误后偷偷降级重发。

动态报告更适合生成少量 Telegram 支持的 HTML 标签：

```html
<b>组件更新</b>
<a href="https://github.com/example/component/pull/42">example/component#42</a>
修复了 <code>decode()</code> 的边界处理。
```

这只是占位示例，不对应真实报告。生成时仍需转义正文中的 `&`、`<`、`>`，以及属性里的引号；Telegram HTML 不是浏览器 HTML，换行用实际换行符。MarkdownV2 也不是 GitHub Markdown，普通标点、代码和链接地址有不同的转义规则。格式细节以 [Telegram 官方说明](https://core.telegram.org/bots/api#formatting-options)为准。

长度也有两层：Telegram `sendMessage` 的上限是解析格式后的 4096 个字符，而当前桥接保守地限制原始输入为 4096 个 UTF-16 code units。标签、URL 都占额度，部分 emoji 会占两个单位。因此“界面上看着不长”仍可能被桥接拒绝。这是现有实现的限制，不应把它解释成 Telegram 的精确计数规则。

长文目前由调用方按完整事项拆分，每段使用独立 ID。桥接没有自动切分功能，避免切断标签、代码块或在一次调用中意外发出多条消息。

## 编辑权限从原始发送延伸

`editMessageText` 本身接受消息 ID，但直接把任意 ID 暴露为 MCP 参数，会扩大工具的操作面。

这里的 `telegram_edit` 使用原始发送的 `original_request_id`。服务器要求它属于当前调用者、状态为 `sent`，且仍对应获准目的地。首次编辑还需要原始正文与格式，重新校验历史指纹，随后缓存已验证的聊天、topic 和消息映射。没有这份证明，就不能用一个手填消息 ID 绕过去。

编辑有新的请求 ID，原发送回执保持不变。同一消息一次只能有一个编辑在进行；如果结果不确定，锁会保留，防止后续修改与一个迟到的请求相互覆盖。这会牺牲部分可用性，需要人工核对，但比悄悄覆盖新版本更可控。

边界同样明确：它不能修改任意聊天历史、其他人的消息或附件，也不能移动消息。发送授权不自动等于以后任意改写的授权。Telegram 对无变化编辑返回的拒绝，也没有被包装成一次新的成功发送。

## 部署与测试要逐层验收

插件包存在、工具 schema 可见、服务配置完整、Telegram 接受请求，是四个不同的事实。配置型 `ready` 不等于 Bot API 已经连通。更新后若客户端缓存工具 schema，还需要刷新连接，才能看到新的格式或编辑参数。

本次写作重新运行公开代码的 Node 测试，50 项通过；它们覆盖权限、重复请求、格式冲突、编辑验证等行为。仓库另外提供离线 workerd 测试，用假目的地和假 Token 检验运行时路径。两者都不能代替真实 Telegram 的权限与渲染验收。发布富文本与编辑版本时，还需要先应用 D1 迁移，再部署 Worker，保留既有回执，不应通过重建数据库来“解决”升级。

读取也有独立边界：`getUpdates` 不是任意历史消息接口，待取更新最多保留 24 小时；Bot 的隐私模式影响群消息可见性。当前实现要求专用 Bot，并在发现 webhook 时拒绝轮询，不替调用者移除 webhook。详见 [Telegram getUpdates 文档](https://core.telegram.org/bots/api#getupdates)。

## 留下的工作

公开实现仍有明确的运营缺口：收件内容没有自动保留期限，规模化使用需要限流、索引和清理策略；不确定回执需要人工核对；应用不记录秘密，也不代表托管平台不会记录请求 URL。尤其使用带凭据的连接 URL 时，它和导出的私有插件包都必须按凭据管理，不能贴进公开 Issue 或截图。

这类桥接的实用价值，来自范围清楚、失败可解释、升级不破坏旧状态。把每一步的证据分开记录，远比一个笼统的“连接成功”更能帮助下一次排障。

*本文保留版权；代码仓库的 MIT 许可不覆盖本文。*
