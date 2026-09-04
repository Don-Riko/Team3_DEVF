// TypingAnimation.jsx
// Adaptación a JSX del componente TypingAnimation de MagicUI
// (https://magicui.design/docs/components/typing-animation), sin
// dependencias de shadcn (`cn()`, alias `@/`). Usa `motion` para
// detectar la entrada en viewport (startOnView).
//
// Props (equivalentes a la doc oficial):
//   children     string      Texto único a animar
//   words        string[]    Lista de textos a escribir/borrar en secuencia
//   className    string      Clases extra
//   typeSpeed    number=100  ms por carácter al escribir
//   deleteSpeed  number=50   ms por carácter al borrar
//   pauseDelay   number=1000 ms de pausa entre palabras
//   delay        number=0    ms antes de iniciar
//   loop         boolean=false  Repetir la secuencia
//   as           string='span'  Etiqueta a renderizar
//   startOnView  boolean=true   Iniciar al entrar en viewport
//   showCursor   boolean=true   Mostrar el cursor
//   blinkCursor  boolean=true   Parpadeo del cursor
//   cursorStyle  'line'|'block'|'underscore'='line'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'motion/react'

function classes(...parts) {
  return parts.filter(Boolean).join(' ')
}

const CURSOR_CHAR = {
  line: '|',
  block: '▌',
  underscore: '_',
}

export function TypingAnimation({
  children,
  words,
  className,
  typeSpeed = 100,
  deleteSpeed = 50,
  pauseDelay = 1000,
  delay = 0,
  loop = false,
  as = 'span',
  startOnView = true,
  showCursor = true,
  blinkCursor = true,
  cursorStyle = 'line',
  ...props
}) {
  // Normaliza a un arreglo de palabras.
  const list =
    Array.isArray(words) && words.length > 0
      ? words
      : typeof children === 'string'
        ? [children]
        : ['']

  const MotionTag = motion[as] ?? motion.span

  const ref = useRef(null)
  const inView = useInView(ref, { amount: 0.3, once: false })
  const started = useRef(false)
  const [display, setDisplay] = useState('')

  useEffect(() => {
    // Espera a estar en viewport si startOnView está activo.
    if (startOnView && !inView) return
    if (started.current) return
    started.current = true

    let cancelled = false
    let wordIndex = 0
    let charIndex = 0
    let deleting = false
    const timers = []

    const wait = (ms, fn) => {
      const id = setTimeout(fn, ms)
      timers.push(id)
    }

    const tick = () => {
      if (cancelled) return
      const current = list[wordIndex]

      if (!deleting) {
        charIndex += 1
        setDisplay(current.slice(0, charIndex))
        if (charIndex >= current.length) {
          const isLast = wordIndex === list.length - 1
          // Si es una sola palabra y no hay loop, detente al terminar.
          if (list.length === 1 && !loop) return
          if (isLast && !loop) return
          wait(pauseDelay, () => {
            deleting = true
            tick()
          })
          return
        }
        wait(typeSpeed, tick)
      } else {
        charIndex -= 1
        setDisplay(current.slice(0, charIndex))
        if (charIndex <= 0) {
          deleting = false
          wordIndex = (wordIndex + 1) % list.length
          wait(typeSpeed, tick)
          return
        }
        wait(deleteSpeed, tick)
      }
    }

    wait(delay, tick)

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, startOnView])

  const cursor = CURSOR_CHAR[cursorStyle] ?? CURSOR_CHAR.line

  return (
    <MotionTag
      ref={ref}
      className={classes('typing-animation', className)}
      {...props}
    >
      {display}
      {showCursor ? (
        <span
          aria-hidden="true"
          className={classes(
            'typing-cursor',
            `typing-cursor--${cursorStyle}`,
            blinkCursor && 'typing-cursor--blink',
          )}
        >
          {cursor}
        </span>
      ) : null}
    </MotionTag>
  )
}

export default TypingAnimation
