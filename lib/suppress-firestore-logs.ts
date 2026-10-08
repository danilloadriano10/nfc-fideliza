// Suppresses internal benign Firestore SDK idle stream cancellations
export function initFirestoreLogSuppression() {
  if (typeof globalThis === 'undefined') return

  const isIdleStreamText = (text: string): boolean => {
    return (
      text.includes('Disconnecting idle stream') ||
      text.includes('Timed out waiting for new targets') ||
      text.includes("RPC 'Listen' stream") ||
      text.includes('GrpcConnection RPC') ||
      text.includes('CANCELLED: Disconnecting idle stream')
    )
  }

  const matchesAny = (args: unknown[]): boolean => {
    try {
      for (const arg of args) {
        if (!arg) continue
        if (typeof arg === 'string' && isIdleStreamText(arg)) return true
        if (
          arg instanceof Error &&
          (isIdleStreamText(arg.message) || isIdleStreamText(arg.stack || ''))
        ) {
          return true
        }
        if (typeof arg === 'object') {
          const str = String(arg)
          if (isIdleStreamText(str)) return true
        }
      }
      const fullText = args
        .map((a) =>
          typeof a === 'string' ? a : a instanceof Error ? a.message : String(a)
        )
        .join(' ')
      if (isIdleStreamText(fullText)) return true
    } catch {}
    return false
  }

  if (typeof console !== 'undefined') {
    const origError = console.error
    console.error = (...args: unknown[]) => {
      if (matchesAny(args)) return
      origError.apply(console, args)
    }

    const origWarn = console.warn
    console.warn = (...args: unknown[]) => {
      if (matchesAny(args)) return
      origWarn.apply(console, args)
    }
  }

  if (
    typeof process !== 'undefined' &&
    process.stderr &&
    typeof process.stderr.write === 'function'
  ) {
    const origStderrWrite = process.stderr.write
    process.stderr.write = function (chunk: Parameters<typeof process.stderr.write>[0], ...rest: unknown[]) {
      try {
        const text = typeof chunk === 'string' ? chunk : chunk?.toString?.() || ''
        if (isIdleStreamText(text)) {
          return true
        }
      } catch {}
      return (origStderrWrite as Function).call(process.stderr, chunk, ...rest)
    } as typeof process.stderr.write
  }
}

// Auto-run once on module import
initFirestoreLogSuppression()
