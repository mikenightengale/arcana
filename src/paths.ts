const baseUrl = import.meta.env.BASE_URL

export function appPath(path = ''): string {
  return `${baseUrl}${path.replace(/^\/+/, '')}`
}

export function assetPath(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path
  return appPath(path)
}

export function galleryPath(): string {
  return appPath('gallery/crystal')
}

export function canonicalGalleryPath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, '')
  const galleryRoot = appPath('gallery')
  return normalized === galleryRoot || normalized.startsWith(`${galleryRoot}/`)
    ? galleryPath()
    : pathname
}

export function isGalleryPath(pathname: string): boolean {
  const galleryPath = appPath('gallery')
  return pathname === galleryPath || pathname.startsWith(`${galleryPath}/`)
}
