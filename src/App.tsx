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

  // モバイル用：事前生成 Blob（ユーザーアクティベーション切れ対策）
  const karutaBlobRef = useRef<Blob | null>(null)
  const descBlobRef = useRef<Blob | null>(null)

  const regenerateBlobs = useCallback(async () => {
    karutaBlobRef.current = null
    descBlobRef.current = null
    if (karutaCardRef.current) {
      try {
        const dataUrl = await generateCardPng(karutaCardRef.current)
        karutaBlobRef.current = await fetch(dataUrl).then((r) => r.blob())
      } catch { /* ignore */ }
    }
    if (descCardRef.current) {
      try {
        const dataUrl = await generateCardPng(descCardRef.current)
        descBlobRef.current = await fetch(dataUrl).then((r) => r.blob())
      } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    if (formData.imagePreviewUrl === null) return
    if (isMobile) {
      previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [formData.imagePreviewUrl])

  // フォーム変更時に事前生成（PC・モバイル共通）
  useEffect(() => {
    const timer = setTimeout(() => regenerateBlobs(), 500)
    return () => clearTimeout(timer)
  }, [formData, regenerateBlobs])

  useEffect(() => {
    if (toast === null) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // 画像ドラッグ/ズーム完了後に再生成
  const handleTransformSettle = useCallback(() => {
    regenerateBlobs()
  }, [regenerateBlobs])

  const buildFileName = (prefix: string): string =>
    `${prefix}_${formData.word || 'karuta'}.png`

  // 事前生成済み Blob を使い await なしで呼ぶ（ユーザーアクティベーション保持）
  // モバイル: navigator.share でネイティブシェアシート
  // PC: クリップボードにコピー
  const handleShare = (
    blobRef: React.MutableRefObject<Blob | null>,
    fileName: string,
  ): void => {
    const blob = blobRef.current
    if (blob === null) {
      setToast('生成中です。少し待ってから再度タップしてください')
      return
    }

    if (isMobile) {
      if (!navigator.share) {
        setToast('このブラウザはシェアに対応していません')
        return
      }
      const file = new File([blob], fileName, { type: 'image/png' })
      navigator.share({ files: [file] }).catch((err: unknown) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setToast('シェアに失敗しました')
        }
      })
    } else {
      if (!navigator.clipboard || !window.ClipboardItem) {
        setToast('このブラウザはコピーに対応していません')
        return
      }
      try {
        navigator.clipboard
          .write([new ClipboardItem({ 'image/png': blob })])
          .then(() => setToast('クリップボードにコピーしました'))
          .catch(() => setToast('コピーに失敗しました'))
      } catch {
        setToast('コピーに失敗しました')
      }
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
    blobRef: React.MutableRefObject<Blob | null>,
    key: 'karuta' | 'desc',
  ): JSX.Element => {
    const fileName = buildFileName(key === 'karuta' ? 'karuta_1' : 'karuta_2')
    return (
    <div className={styles.buttonRow}>
      <button
        className={styles.shareButton}
        onClick={() => shareCard(ref.current!, formData.word)}
        disabled={isbusy}
      >
        <XIcon />ポスト
      </button>
      <button
        className={styles.saveButton}
        onClick={isMobile ? () => handleShare(blobRef, fileName) : () => handleSave(ref, key)}
        disabled={isbusy}
      >
        {cardAction === `${key}-save` ? '保存中…' : isMobile ? 'シェア・保存' : '保存'}
      </button>
    </div>
    )
  }

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
              {renderCardButtons(karutaCardRef, karutaBlobRef, 'karuta')}
            </div>
            {showDescCard && (
              <div className={styles.cardWrapper}>
                <DescriptionCard ref={descCardRef} formData={formData} />
                {renderCardButtons(descCardRef, descBlobRef, 'desc')}
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
