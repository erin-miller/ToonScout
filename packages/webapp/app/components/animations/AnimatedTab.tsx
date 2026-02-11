import { useEffect, useState } from 'react'

interface AnimatedTabContentProps {
  children: React.ReactNode
}

const AnimatedTabContent = ({ children }: AnimatedTabContentProps) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 5)
    return () => clearTimeout(timer)
  }, [children])

  return (
    <div className={`tab-content ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {children}
    </div>
  )
}

export default AnimatedTabContent
