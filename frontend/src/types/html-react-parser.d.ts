declare module 'html-react-parser' {
  import type { ReactNode } from 'react'
  export default function parse(html: string): ReactNode
}
