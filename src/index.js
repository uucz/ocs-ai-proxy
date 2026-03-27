// OCS AI Answer Proxy - Cloudflare Worker
// Bridges OCS AnswererWrapper (GET) to OpenAI-compatible chat completions APIs

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const title = url.searchParams.get('title') || ''
    const options = url.searchParams.get('options') || ''

    if (!title) {
      return new Response(JSON.stringify({ error: 'missing title' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiBase = env.API_BASE || 'https://api.openai.com'
    const model = env.MODEL || 'gpt-4o-mini'
    const systemPrompt = env.SYSTEM_PROMPT || '你是一个答题助手，直接给出答案，不要解释'

    const userContent = options
      ? `题目：${title}\n选项：${options}`
      : `题目：${title}`

    const resp = await fetch(`${apiBase}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      return new Response(JSON.stringify({ error: err }), {
        status: resp.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await resp.json()
    const answer = data?.choices?.[0]?.message?.content ?? null

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  },
}
