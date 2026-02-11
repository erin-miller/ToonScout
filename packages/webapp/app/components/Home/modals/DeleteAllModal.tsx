import React from 'react'
import Modal from '../../Modal'
import { useToonContext } from '@/app/context/ToonContext'

type DeleteAllModalProps = {
  isOpen: boolean
  onClose: () => void
}

const DeleteAllModal: React.FC<DeleteAllModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null
  const { toons, deleteToon } = useToonContext()
  const unlockedToons = toons.filter(toon => !toon.locked)

  const confirm = () => {
    unlockedToons.forEach(toon => deleteToon(toon))
    onClose()
  }

  const reject = () => {
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="px-2 items-center justify-center text-center">
        {unlockedToons.length >= 1 ? (
          <>
            <p>
              Are you sure you want to <strong>delete the following unlocked toons?</strong>
            </p>
            <ol className="list-disc list-inside">
              {unlockedToons.map((lockedToon, idx) => (
                <li key={idx}>{lockedToon.data.data.toon.name}</li>
              ))}
            </ol>
            <div className="flex flex-row items-center justify-center space-x-2 mt-4">
              <button
                className="px-2 border-4 rounded-lg border-green-600 bg-green-100 text-green-900"
                onClick={confirm}
              >
                Yes
              </button>
              <button className="px-2 bg-red-100 border-4 rounded-lg border-red-600 text-red-900" onClick={reject}>
                No
              </button>
            </div>
          </>
        ) : (
          <>
            <span>You have no unlocked toons!</span>
          </>
        )}
      </div>
    </Modal>
  )
}

export default DeleteAllModal
