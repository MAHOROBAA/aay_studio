// cookie-parser 없이 필요한 쿠키 하나만 읽는다 — 이 값 하나만 다루면 되는데 새 패키지를
// 추가할 필요는 없다고 판단했다.
export function readCookie(
  cookieHeader: string | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) {
    return undefined
  }
  const prefix = `${name}=`
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))

  return match ? decodeURIComponent(match.slice(prefix.length)) : undefined
}
