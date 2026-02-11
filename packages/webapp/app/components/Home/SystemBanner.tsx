import Banner from '@/app/components/Banner'

interface SystemBannerProps {
  isOpen: boolean
  onClose: () => void
}

const SystemBannerType: { [key: string]: string } = {
  INFO: 'bg-blue-300',
  WARNING: 'bg-orange-300',
  ERROR: 'bg-red-300'
}

const SystemBanner: React.FC<SystemBannerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const enabled = process.env.NEXT_PUBLIC_SYSTEM_BANNER_ENABLED
  if (enabled !== 'true') return null

  const type = process.env.NEXT_PUBLIC_SYSTEM_BANNER_TYPE
  if (!type) return null

  const msg = process.env.NEXT_PUBLIC_SYSTEM_BANNER_MSG
  if (!msg) return null
  return <Banner isOpen={isOpen} onClose={onClose} msg={msg} className={`${SystemBannerType[type]}`} />
}

export default SystemBanner
