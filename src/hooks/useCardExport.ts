import { toPng } from 'html-to-image'

const exportFilter = (node: Node): boolean =>
  (node as HTMLElement).dataset?.exportExclude !== 'true'

export async function exportCardAsPng(
  element: HTMLElement,
  fileName: string,
): Promise<void> {
  const dataUrl = await toPng(element, { pixelRatio: 3, filter: exportFilter })
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.click()
}

export function shareCard(_element: HTMLElement, word: string): void {
  const shareText = word
    ? `「${word}」のネットミームかるたを作りました！ #ネットミームかるた`
    : 'ネットミームかるたを作りました！ #ネットミームかるた'

  const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`
  window.open(xUrl, '_blank', 'noopener,noreferrer')
}
