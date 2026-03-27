# OCS AI Answer Proxy

一个 Cloudflare Worker，将 [OCS（Open College Study）](https://github.com/ocsjs/ocsjs) 的 AnswererWrapper 请求转发到任意 OpenAI 兼容的 API（OpenAI、DeepSeek、Moonshot 等）。

## 背景

OCS 的 AnswererWrapper 通过 GET 请求查询题库，但 OpenAI Chat Completions API 需要 POST + 嵌套 JSON body。OCS 的嵌套 `data.handler` 不支持返回数组，无法直接构造 `messages` 字段。此 Worker 作为中转层解决这个问题。

## 部署

### 方式一：Cloudflare Dashboard（推荐）

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create → Create Worker
2. 将 `src/index.js` 内容粘贴进编辑器，部署
3. 进入 Worker 设置 → Variables，添加以下环境变量：

| 变量名 | 说明 | 是否加密 |
|--------|------|----------|
| `API_KEY` | 你的 API Key | ✅ 必须加密 |
| `API_BASE` | API 基础地址，默认 `https://api.openai.com` | 否 |
| `MODEL` | 模型名称，默认 `gpt-4o-mini` | 否 |
| `SYSTEM_PROMPT` | 系统提示词，默认 `你是一个答题助手，直接给出答案，不要解释` | 否 |

### 方式二：Wrangler CLI

```bash
npm install -g wrangler
wrangler login
wrangler secret put API_KEY   # 输入你的 API Key
wrangler deploy
```

## OCS 配置

部署完成后，将以下配置填入 OCS 的题库设置（AnswererWrapper）：

```json
[
  {
    "name": "AI 答题",
    "url": "https://你的worker名.workers.dev/?title=${title}&options=${options}",
    "method": "get",
    "type": "fetch",
    "handler": "return (res)=> res.answer ? [undefined, res.answer] : undefined"
  }
]
```

将 `你的worker名` 替换为实际的 Worker 域名。

## 支持的 API

任何兼容 OpenAI Chat Completions 格式的服务均可使用，只需修改 `API_BASE` 变量：

| 服务 | API_BASE |
|------|----------|
| OpenAI | `https://api.openai.com` |
| DeepSeek | `https://api.deepseek.com` |
| Moonshot | `https://api.moonshot.cn` |
| 其他兼容服务 | 对应 base URL |

## 请求参数

Worker 接受以下 GET 参数：

| 参数 | 说明 |
|------|------|
| `title` | 题目内容（必填） |
| `options` | 选项内容，换行分隔（选填） |

## License

MIT
