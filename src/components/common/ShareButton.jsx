import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { createGunShareUrl } from '../../utils/shareLink'

export default function ShareButton({ gun, className = 'btn btn--outline', iconOnly = false }) {
  const [message, setMessage] = useState('')
  const [shareUrl, setShareUrl] = useState('')

  const handleShare = async () => {
    setMessage('')
    setShareUrl('')
    try {
      const url = createGunShareUrl(gun)
      setShareUrl(url)

      if (navigator.share) {
        await navigator.share({
          title: gun.name,
          text: `View ${gun.name} in Bore & Barrel`,
          url,
        })
        setMessage('Link shared.')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setMessage('Link copied to clipboard.')
      } else {
        setMessage('Copy this link to share:')
      }
    } catch (error) {
      if (error.name === 'AbortError') return
      setMessage('Copy this link to share:')
    }
  }

  return (
    <span className="share-control">
      <button
        type="button"
        className={className}
        onClick={handleShare}
        aria-label={`Share ${gun.name}`}
        title="Share link"
      >
        <Share2 size={16} />
        {!iconOnly && 'Share'}
      </button>
      {message && (
        <span className="share-feedback" role="status">
          {message}
          {shareUrl && message.startsWith('Copy') && (
            <a href={shareUrl}>{shareUrl}</a>
          )}
        </span>
      )}
    </span>
  )
}
