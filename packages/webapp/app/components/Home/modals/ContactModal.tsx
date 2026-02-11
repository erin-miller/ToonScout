import React from 'react'
import Modal from '../../Modal'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3 className="text-3xl mb-2 minnie-title">Contact</h3>
      <div className="space-y-4 pt-2">
        <p>
          Need help or have a question? Please join ToonScout's{' '}
          <a
            href={process.env.NEXT_PUBLIC_DISCORD_INVITE}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            support server
          </a>
          ! Alternatively, you can contact me at <span className="text-blue-400">c.smic</span> on Discord.
        </p>
      </div>
    </Modal>
  )
}

export default ContactModal
