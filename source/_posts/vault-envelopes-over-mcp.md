---
title: ""
date: 2026-11-18 19:40:00
updated: 2026-11-18 19:40:00
description: 让 Agent 搬运凭据的密文，而不是凭据本身：一次关于 MCP 与本地执行环境之间交接方式的小调整。
---

一个最近觉得很顺手的想法：**让 Agent 搬运凭据的密文，而不是凭据本身。**

有时 MCP 能连接 Vault，执行命令的环境却无法直接访问它。与其让终端再领取一次 Token，不如让终端先生成临时密钥对，只把公钥交给 Vault；Vault 通过已认证的 MCP 返回加密信封，终端用留在本地的私钥解密，再把 Token 注入指定子进程。私钥和明文 Token 都不必经过对话，凭据交接也不再依赖终端到 Vault 的第二条网络连接。

[Token Vault MCP](https://github.com/Hanssen0-Alter-Ego/token-vault-mcp) 的[实现](https://github.com/Hanssen0-Alter-Ego/token-vault-mcp/tree/b3dbca38c4520876ce3aca540b2803b94026a167)用 RSA-OAEP-256 封装 AES-GCM 密钥，并绑定请求 ID、接收公钥和 Vault 标识。固定、经过校验的本地 helper 把信封当数据读取，不把工具返回内容当脚本执行；使用后清理临时私钥状态，父进程环境不变。

这里值得保留一点克制：加密不代替 MCP 身份认证，也不证明终端可信。Vault 和用到 Token 的子进程仍在信任边界内。短时有效、用后即删是 helper 的约束，不是密码学上的“自动过期”；如果私钥和密文都被保留，Vault 无法远程收回已经发出的信封，必要时仍要在凭据签发方撤销 Token。

这不是一种新密码学，只是换了交接方向：**需要使用秘密的地方持有解密能力，负责协调的地方只传递密文。** 比起把更多网络权限塞给执行环境，这个分工有时更简单。
