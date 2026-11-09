export function createGunShareUrl(gun, currentUrl = window.location.href) {
  if (gun?.id === undefined || gun?.id === null || gun.id === '') {
    throw new Error('A product ID is required to create a share link.')
  }

  const url = new URL(currentUrl)
  url.searchParams.set('gun', String(gun.id))
  return url.toString()
}
