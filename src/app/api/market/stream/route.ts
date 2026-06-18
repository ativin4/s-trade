import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchLtp, resolveGrowwToken } from '@/lib/services/market-ltp'

const INTERVAL_MS = 5000
const enc = new TextEncoder()

export async function GET(req: NextRequest) {
  const raw      = req.nextUrl.searchParams.get('symbols') ?? ''
  const symbols  = raw.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50)
  const exchange = req.nextUrl.searchParams.get('exchange') ?? 'NSE'
  if (!symbols.length) return new Response('data: {}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })

  const session = await getServerSession(authOptions)
  const growwToken = session?.user?.id
    ? await resolveGrowwToken(session.user.id).catch(() => null)
    : null

  const stream = new ReadableStream({
    start(controller) {
      let timer: ReturnType<typeof setInterval> | null = null

      const tick = async () => {
        try {
          const data = await fetchLtp(symbols, exchange, growwToken)
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* silent */ }
      }

      tick()
      timer = setInterval(tick, INTERVAL_MS)

      req.signal.addEventListener('abort', () => {
        if (timer) clearInterval(timer)
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection:          'keep-alive',
    },
  })
}
