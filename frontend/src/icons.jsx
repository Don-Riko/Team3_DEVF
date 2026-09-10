function makeIcon(paths) {
  return function Icon(props) {
    const { size = 24, ...rest } = props
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...rest}
      >
        {paths.map((node, i) => {
          const [tag, attrs] = node
          const Tag = tag
          return <Tag key={i} {...attrs} />
        })}
      </svg>
    )
  }
}

export const SearchIcon = makeIcon([
  ['path', { d: 'm21 21-4.34-4.34' }],
  ['circle', { cx: '11', cy: '11', r: '8' }],
])

export const SparklesIcon = makeIcon([
  [
    'path',
    {
      d: 'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
    },
  ],
  ['path', { d: 'M20 2v4' }],
  ['path', { d: 'M22 4h-4' }],
  ['circle', { cx: '4', cy: '20', r: '2' }],
])

export const PopcornIcon = makeIcon([
  ['path', { d: 'M5 9h14l-1.5 12h-11z' }],
  ['path', { d: 'M5 9C3.8 7.7 4.6 5.5 6.4 5.2c.2-2 2.8-2.8 4-1.2 1.1-1.6 3.7-.8 4 1.2 1.8.3 2.6 2.5 1.4 3.8' }],
  ['path', { d: 'M8 9v12M12 9v12M16 9v12' }],
  ['path', { d: 'M8 4.8c.8.2 1.3.8 1.5 1.6M13.2 4.8c-.8.2-1.3.8-1.5 1.6' }],
])

export const StarIcon = makeIcon([
  [
    'path',
    {
      d: 'M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z',
    },
  ],
])

export const MenuIcon = makeIcon([
  ['line', { x1: '4', y1: '6', x2: '20', y2: '6' }],
  ['line', { x1: '4', y1: '12', x2: '20', y2: '12' }],
  ['line', { x1: '4', y1: '18', x2: '20', y2: '18' }],
])

export const PlayIcon = makeIcon([
  [
    'path',
    {
      d: 'M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z',
    },
  ],
])

export const PlusIcon = makeIcon([
  ['path', { d: 'M5 12h14' }],
  ['path', { d: 'M12 5v14' }],
])

export const CheckIcon = makeIcon([['path', { d: 'M20 6 9 17l-5-5' }]])

export const ShareIcon = makeIcon([
  ['circle', { cx: '18', cy: '5', r: '3' }],
  ['circle', { cx: '6', cy: '12', r: '3' }],
  ['circle', { cx: '18', cy: '19', r: '3' }],
  ['line', { x1: '8.59', x2: '15.42', y1: '13.51', y2: '17.49' }],
  ['line', { x1: '15.41', x2: '8.59', y1: '6.51', y2: '10.49' }],
])

export const ChevronLeftIcon = makeIcon([['path', { d: 'm15 18-6-6 6-6' }]])

export const ChevronRightIcon = makeIcon([['path', { d: 'm9 18 6-6-6-6' }]])

export const ChevronDownIcon = makeIcon([['path', { d: 'm6 9 6 6 6-6' }]])

export const EyeIcon = makeIcon([
  ['path', { d: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z' }],
  ['circle', { cx: '12', cy: '12', r: '3' }],
])

export const CloseIcon = makeIcon([
  ['path', { d: 'M18 6 6 18' }],
  ['path', { d: 'm6 6 12 12' }],
])

export const PauseIcon = makeIcon([
  ['rect', { x: '6', y: '4', width: '4', height: '16', rx: '1' }],
  ['rect', { x: '14', y: '4', width: '4', height: '16', rx: '1' }],
])