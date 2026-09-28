const baseUrl = import.meta.env.BASE_URL

export function appPath(path = ''): string {
  return `${baseUrl}${path.replace(/^\/+/, '')}`
}

export function assetPath(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path
  return appPath(path)
}

export function galleryPath(deckId: string): string {
  const slug = deckId === 'cathedral' ? 'crystal' : deckId
  return appPath(`gallery/${slug}`)
}

export function galleryDeckId(pathname: string): string | null {
  const galleryRoot = `${appPath('gallery')}/`
  if (!pathname.startsWith(galleryRoot)) return null
  const slug = pathname.slice(galleryRoot.length).replace(/\/+$/, '').split('/').at(-1)
  if (!slug) return null
  return slug === 'crystal' ? 'cathedral' : slug
}

export function canonicalGalleryPath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '')
  return normalized === appPath('gallery/cathedral') ? galleryPath('cathedral') : pathname
}

export function isGalleryPath(pathname: string): boolean {
  const galleryPath = appPath('gallery')
  return pathname === galleryPath || pathname.startsWith(`${galleryPath}/`)
}
