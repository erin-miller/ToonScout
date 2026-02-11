import React, { useState, useEffect } from 'react'
import SettingsItem from './SettingsItem'

const GardenSettingsItem: React.FC = () => {
  const [flowerType, setFlowerType] = useState<1 | 2 | 3>(() => {
    return JSON.parse(localStorage.getItem('flowerType') || '1')
  })

  useEffect(() => {
    localStorage.setItem('flowerType', JSON.stringify(flowerType))
    window.dispatchEvent(new Event('flowerChange'))
  }, [flowerType])

  function handleFlowerDisplay(arg: 1 | 2 | 3): void {
    setFlowerType(arg)
  }

  return (
    <SettingsItem label="Gardening">
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          name="flowerType"
          id="progressFlowers"
          checked={flowerType === 1}
          onChange={() => handleFlowerDisplay(1)}
          className="w-5 h-5 cursor-pointer"
        />
        <label className="text-lg cursor-pointer hover:text-blue-600" htmlFor="progressFlowers">
          Only flowers that grant progress
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="radio"
          name="flowerType"
          id="plantableFlowers"
          checked={flowerType === 2}
          onChange={() => handleFlowerDisplay(2)}
          className="w-5 h-5 cursor-pointer"
        />
        <label className="text-lg cursor-pointer hover:text-blue-600" htmlFor="plantableFlowers">
          All plantable flowers
        </label>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="radio"
          name="flowerType"
          id="allFlowers"
          checked={flowerType === 3}
          onChange={() => setFlowerType(3)}
          className="w-5 h-5 cursor-pointer"
        />
        <label className="text-lg cursor-pointer hover:text-blue-600" htmlFor="allFlowers">
          All flowers
        </label>
      </div>
    </SettingsItem>
  )
}

export default GardenSettingsItem
