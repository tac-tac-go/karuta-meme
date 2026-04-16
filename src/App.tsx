import { useEffect, useRef, useState } from 'react'
import styles from './App.module.css'
import DescriptionCard from './components/DescriptionCard'
import KarutaCard from './components/KarutaCard'
import KarutaForm from './components/KarutaForm'
import { exportCardAsPng, shareCard } from './hooks/useCardExport'
import type { KarutaFormData } from './types/karuta'

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
  const [savingCard, setSavingCard] = useState<'karuta' | 'desc' | null>(null)
  const karutaCardRef = useRef<HTMLDivElement>(null)
  const descCardRef = useRef<HTMLDivElement>(null)
  const previewSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (formData.imagePreviewUrl === null) return
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [formData.imagePreviewUrl])

  const handleSaveKarutaCard = async (): Promise<void> => {
    if (karutaCardRef.current === null) return
    setSavingCard('karuta')
    await exportCardAsPng(karutaCardRef.current, `karuta_1_${formData.word}.png`)
    setSavingCard(null)
  }

  const handleSaveDescCard = async (): Promise<void> => {
    if (descCardRef.current === null) return
    setSavingCard('desc')
    await exportCardAsPng(descCardRef.current, `karuta_2_${formData.word}.png`)
    setSavingCard(null)
  }

  const handleShareKarutaCard = (): void => {
    if (karutaCardRef.current === null) return
    shareCard(karutaCardRef.current, formData.word)
  }

  const handleShareDescCard = (): void => {
    if (descCardRef.current === null) return
    shareCard(descCardRef.current, formData.word)
  }

  const showDescCard = formData.descriptionEnabled && formData.description.trim().length > 0

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
              <KarutaCard ref={karutaCardRef} formData={formData} />
              <div className={styles.buttonRow}>
                <button className={styles.saveButton} onClick={handleSaveKarutaCard} disabled={savingCard !== null}>
                  {savingCard === 'karuta' ? '保存中…' : '画像を保存'}
                </button>
                <button className={styles.shareButton} onClick={handleShareKarutaCard}>
                  <XIcon />でシェア
                </button>
              </div>
              <p className={styles.shareNote}>
                ※先に「画像を保存」してからポストに添付してください
              </p>
            </div>
            {showDescCard && (
              <div className={styles.cardWrapper}>
                <DescriptionCard ref={descCardRef} formData={formData} />
                <div className={styles.buttonRow}>
                  <button className={styles.saveButton} onClick={handleSaveDescCard} disabled={savingCard !== null}>
                    {savingCard === 'desc' ? '保存中…' : '画像を保存'}
                  </button>
                  <button className={styles.shareButton} onClick={handleShareDescCard}>
                    <XIcon />でシェア
                  </button>
                </div>
                <p className={styles.shareNote}>
                  ※先に「画像を保存」してからポストに添付してください
                </p>
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
    </div>
  )
}

export default App
