import { toPng } from 'html-to-image'

const exportFilter = (node: Node): boolean =>
  (node as HTMLElement).dataset?.exportExclude !== 'true'

const toPngOptions = { pixelRatio: 3, filter: exportFilter }

export async function generateCardPng(element: HTMLElement): Promise<string> {
  // 1回目でWebフォントをキャッシュさせ、2回目で確実に描画する
  await toPng(element, toPngOptions)
  return toPng(element, toPngOptions)
}

export function downloadPng(dataUrl: string, fileName: string): void {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function shareCard(_element: HTMLElement, word: string): void {
  const shareText = word
    ? `「${word}」のネットミームかるたを作りました！ #ネットミームかるた`
    : 'ネットミームかるたを作りました！ #ネットミームかるた'

  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`
  window.open(xUrl, '_blank', 'noopener,noreferrer')
}
