/**
 * Compress a base64/dataURL image via Canvas before persisting.
 * iPhone photos at full resolution are 4–10 MB and exceed the iOS
 * localStorage 5 MB quota. Scaling to ≤1200 px at JPEG 0.75 brings
 * them to ~150–300 KB — well within quota and fast to load in the UI.
 */
export function compressImage(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.75,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale    = Math.min(1, maxWidth / img.width)
      const canvas   = document.createElement('canvas')
      canvas.width   = Math.round(img.width  * scale)
      canvas.height  = Math.round(img.height * scale)
      const ctx      = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl) // fallback: keep original on error
    img.src = dataUrl
  })
}
