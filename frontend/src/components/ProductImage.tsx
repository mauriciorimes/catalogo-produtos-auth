import type { CSSProperties } from 'react'
import placeholder from '../assets/placeholder.svg'

interface Props {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
}

export function ProductImage({ src, alt, className, style }: Props) {
  return (
    <img
      src={src || placeholder}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        e.currentTarget.onerror = null
        e.currentTarget.src = placeholder
      }}
    />
  )
}
