import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'

interface SignedImageProps {
  storagePath: string
  alt?: string
  className?: string
}

// Fetches a short-lived signed URL for a private storage path and renders the image.
// Shows a pulsing placeholder while the URL is loading.
export function SignedImage({ storagePath, alt = '', className = '' }: SignedImageProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    supabase.storage
      .from('entry-images')
      .createSignedUrl(storagePath, 3600)
      .then(({ data }) => { if (data?.signedUrl) setUrl(data.signedUrl) })
  }, [storagePath])

  if (!url) {
    return (
      <div className={`bg-surface-container-high flex items-center justify-center ${className}`}>
        <span className="material-symbols-outlined text-on-surface-variant text-2xl animate-pulse">
          image
        </span>
      </div>
    )
  }

  return <img src={url} alt={alt} className={`object-cover ${className}`} />
}
