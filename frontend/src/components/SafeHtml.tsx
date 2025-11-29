// parse will be dynamically imported to avoid build/runtime issues when the package isn't installed
import { useEffect, useState, type FC } from 'react'

interface SafeHtmlProps {
  html?: string
}

const SafeHtml: FC<SafeHtmlProps> = ({ html }) => {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('')

  useEffect(() => {
    let mounted = true
    async function sanitize() {
      if (typeof window === 'undefined' || !html) {
        setSanitizedHtml(html || '')
        return
      }
      try {
        const m = await import('dompurify')
        const DOMPurify = (m as any).default || m
        const safe = DOMPurify.sanitize(html)
        if (mounted) setSanitizedHtml(String(safe))
      } catch (_err) {
        // fallback: use raw html
        if (mounted) setSanitizedHtml(String(html || ''))
      }
    }
    sanitize()
    return () => {
      mounted = false
    }
  }, [html])

  const [parsedNodes, setParsedNodes] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    async function parseHtml() {
      if (!sanitizedHtml) {
        if (mounted) setParsedNodes(null)
        return
      }
      try {
        const m = await import('html-react-parser')
        const parseFn = (m as any).default || m
        const nodes = parseFn(String(sanitizedHtml))
        if (mounted) setParsedNodes(nodes)
      } catch (_err) {
        // fallback: render raw as text nodes
        if (mounted) setParsedNodes(String(sanitizedHtml))
      }
    }
    parseHtml()
    return () => { mounted = false }
  }, [sanitizedHtml])

  return <>{parsedNodes}</>
}

export default SafeHtml
