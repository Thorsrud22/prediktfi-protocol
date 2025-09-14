'use client'
import { useEffect } from 'react'

export default function IntentStorageGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const ls = window.localStorage
    if (!ls || (ls as any).__predikt_guard_installed) return
    ;(ls as any).__predikt_guard_installed = true

    const origSet = ls.setItem.bind(ls)
    const origRemove = ls.removeItem.bind(ls)
    const origClear = ls.clear.bind(ls)

    function logWithStack(label: string, ...args: any[]) {
      // lettvekts stack for å finne kilden
      try {
        const err = new Error()
        console.warn(`[INTENTS-GUARD] ${label}`, ...args, '\nStack:\n', err.stack)
      } catch {}
    }

    ls.setItem = (key: string, value: string) => {
      try {
        if (key?.startsWith('predikt:intents')) {
          // blokker tom-skriv som visker lista
          if (value === '[]') {
            logWithStack('blocked empty setItem', key)
            return
          }
          // liten sanity: valider JSON
          try { JSON.parse(value) } catch {
            logWithStack('blocked invalid JSON setItem', key, value)
            return
          }
        }
      } catch {}
      return origSet(key, value)
    }

    ls.removeItem = (key: string) => {
      if (key?.startsWith('predikt:intents')) {
        logWithStack('blocked removeItem', key)
        return
      }
      return origRemove(key)
    }

    ls.clear = () => {
      logWithStack('blocked clear() — noop for predikt:intents*')
      // "clear" uten å røre predikt:intents*
      const keep: Record<string,string> = {}
      for (let i = 0; i < ls.length; i++) {
        const k = ls.key(i)!
        if (k?.startsWith('predikt:intents')) {
          keep[k] = ls.getItem(k)!
        }
      }
      origClear()
      for (const k in keep) origSet(k, keep[k])
    }

  }, [])

  return null
}
