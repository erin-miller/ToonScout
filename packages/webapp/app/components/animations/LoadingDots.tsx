import React, { useState, useEffect } from 'react'

interface ConnectingMessageProps {
  text: string
  className: string
}

const ConnectingMessage: React.FC<ConnectingMessageProps> = ({ text, className }) => {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDots(prevDots => {
        if (prevDots.length < 3) {
          return prevDots + '.'
        }
        return '.'
      })
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <h2 className={className}>
      {text}
      {dots}
    </h2>
  )
}

export default ConnectingMessage
