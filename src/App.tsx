import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './App.module.css'
import DescriptionCard from './components/DescriptionCard'
import KarutaCard from './components/KarutaCard'
import KarutaForm from './components/KarutaForm'
import { downloadPng, generateCardPng, shareCard } from './hooks/useCardExport'
import type { KarutaFormData } from './types/karuta'

type CardAction = 'karuta-share' | 'karuta-save' | 'desc-share' | 'desc-save' | null

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

const initialFormData: KarutaFormData = {
  initial: '',
  word: '',
  imageFile: null,
  imagePreviewUrl: null,
  descriptionEnabled: false,
  description: '',
}

function XIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function App(): JSX.Element {
  const [formData, setFormData] = useState<KarutaFormData>(initialFormData)
  const [cardAction, setCardAction] = useState<CardAction>(null)
  const [toast, setToast] = useState<string | null>(null)

  const karutaCardRef = useRef<HTMLDivElement>(null)
  const descCardRef = useRef<HTMLDivElement>(null)
  const previewSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (formData.imagePreviewUrl === null) return
    if (isMobile) {
      previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [formData.imagePreviewUrl])

  useEffect(() => {
    if (toast === null) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const handleTransformSettle = useCallback(() => {}, [])

  const buildFileName = (prefix: string): string =>
    `${prefix}_${formData.word || 'karuta'}.png`

  const handleShare = async (
    ref: React.RefObject<HTMLDivElement>,
    key: 'karuta' | 'desc',
  ): Promise<void> => {
    if (ref.current === null) return
    setCardAction(`${key}-share`)
    try {
      const dataUrl = await generateCardPng(ref.current)
      const blob = await fetch(dataUrl).then((r) => r.blob())
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setToast('クリップボードにコピーしました')
    } catch {
      setToast('コピーに失敗しました')
    } finally {
      setCardAction(null)
    }
  }

  const handleSave = async (
    ref: React.RefObject<HTMLDivElement>,
    key: 'karuta' | 'desc',
  ): Promise<void> => {
    if (ref.current === null) return
    setCardAction(`${key}-save`)
    try {
      const dataUrl = await generateCardPng(ref.current)
      downloadPng(dataUrl, buildFileName(key === 'karuta' ? 'karuta_1' : 'karuta_2'))
    } finally {
      setCardAction(null)
    }
  }

  const showDescCard = formData.descriptionEnabled && formData.description.trim().length > 0
  const isbusy = cardAction !== null

  const renderCardButtons = (
    ref: React.RefObject<HTMLDivElement>,
    key: 'karuta' | 'desc',
  ): JSX.Element => (
    <div className={styles.buttonRow}>
      <button
        className={styles.shareButton}
        onClick={() => shareCard(ref.current!, formData.word)}
        disabled={isbusy}
      >
        <XIcon />ポスト
      </button>
      <button
        className={styles.nativeShareButton}
        onClick={() => handleShare(ref, key)}
        disabled={isbusy}
      >
        {cardAction === `${key}-share` ? '処理中…' : 'シェア'}
      </button>
      <button
        className={styles.saveButton}
        onClick={() => handleSave(ref, key)}
        disabled={isbusy}
      >
        {cardAction === `${key}-save` ? '保存中…' : '保存'}
      </button>
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>ネットミームかるた</h1>
      </header>

      <main className={styles.main}>
        <KarutaForm formData={formData} setFormData={setFormData} />

        <div className={styles.previewSection} ref={previewSectionRef}>
          <p className={styles.previewLabel}>プレビュー</p>
          <div className={styles.cardsRow}>
            <div className={styles.cardWrapper}>
              <KarutaCard
                ref={karutaCardRef}
                formData={formData}
                onTransformSettle={handleTransformSettle}
              />
              {renderCardButtons(karutaCardRef, 'karuta')}
            </div>
            {showDescCard && (
              <div className={styles.cardWrapper}>
                <DescriptionCard ref={descCardRef} formData={formData} />
                {renderCardButtons(descCardRef, 'desc')}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerPrivacy}>
          🔒 すべての処理はお使いの端末内で完結します。画像がサーバーに送信されることはありません。
        </p>

        <div className={styles.footerSections}>
          <details className={styles.footerDetails}>
            <summary className={styles.footerSummary}>商用利用について</summary>
            <p className={styles.footerSectionText}>
              本ツールで生成した画像は、個人・商用を問わず自由にご利用いただけます。
              ただし、本ツールの利用により生じたいかなる損害についても、作成者は一切の責任を負いません。
            </p>
          </details>
        </div>

        <p className={styles.footerCredit}>
          作成者:{' '}
          <a
            className={styles.footerLink}
            href="https://x.com/tactacgo"
            target="_blank"
            rel="noopener noreferrer"
          >
            @tac-tac-go
          </a>
        </p>
      </footer>

      {toast !== null && (
        <div className={styles.toast}>{toast}</div>
      )}
    </div>
  )
}

export default App
