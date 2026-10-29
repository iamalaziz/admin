// React Imports
import type { SVGAttributes } from 'react'

// The leading <rect> is the brand tile and must stay the first child: the sidebar recolors it
// with `[&_rect:first-child]:fill-primary`. The glyph is stroked rather than filled so it reads
// as a cut-out of the tile in both themes.
const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='1em' height='1em' viewBox='0 0 328 329' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      <rect y='0.5' width='328' height='328' rx='164' fill='black' className='dark:fill-white' />
      <path
        d='M164 116C140 100 112 94 84 96V216C112 214 140 220 164 236'
        stroke='white'
        strokeWidth='20'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='dark:stroke-black'
      />
      <path
        d='M164 116C188 100 216 94 244 96V216C216 214 188 220 164 236'
        stroke='white'
        strokeWidth='20'
        strokeLinecap='round'
        strokeLinejoin='round'
        className='dark:stroke-black'
      />
      <line
        x1='164'
        y1='116'
        x2='164'
        y2='236'
        stroke='white'
        strokeWidth='20'
        strokeLinecap='round'
        className='dark:stroke-black'
      />
    </svg>
  )
}

export default Logo
