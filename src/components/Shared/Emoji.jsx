import { useMemo } from 'react'
import twemoji from '@twemoji/api'

export default function Emoji({ children, className = '' }) {
  const html = useMemo(
    () => twemoji.parse(children ?? '', { folder: 'svg', ext: '.svg' }),
    [children]
  )
  return <span className={`twemoji ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />
}
