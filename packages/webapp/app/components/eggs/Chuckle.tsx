import React, { useEffect } from 'react'
import { imageAssets } from '@/assets/images'

const COOLDOWN = 3000
const AMT = 20

const Chuckle: React.FC = () => {
  const trigger = () => {
    meow()
    for (let i = 0; i < AMT; i++) {
      createChuckle()
    }
  }

  const meow = () => {
    const audio = new Audio('/sounds/cat_question.ogg')
    audio.play()
  }

  const createChuckle = () => {
    const elem = document.createElement('img')
    elem.src = imageAssets.chuckle.src
    elem.style.position = 'absolute'
    elem.style.opacity = '0'
    elem.style.transition = 'opacity 1s ease-in-out'
    elem.style.pointerEvents = 'none'

    const randomX = Math.random() * (window.innerWidth - 100)
    const randomY = Math.random() * (window.innerHeight - 100)

    elem.style.left = `${randomX}px`
    elem.style.top = `${randomY}px`

    document.body.appendChild(elem)

    elem.onload = () => {
      requestAnimationFrame(() => {
        elem.style.opacity = '1'
      })
    }

    setTimeout(() => {
      elem.style.opacity = '0'
      setTimeout(() => {
        document.body.removeChild(elem)
      }, 1000)
    }, COOLDOWN)
  }

  useEffect(() => {
    let seq: string[] = []
    const target = 'chuckle'

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      seq.push(key)

      if (seq.length > target.length) {
        seq.shift()
      }

      if (seq.join('') === target) {
        trigger()
        seq = []
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return <></>
}

export default Chuckle
