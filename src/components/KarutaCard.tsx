import { forwardRef, useEffect } from 'react'
import { useImageTransform } from '../hooks/useImageTransform'
import type { KarutaFormData } from '../types/karuta'
import styles from './KarutaCard.module.css'

const MAX_LINES_PER_COLUMN = 6
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

interface WordSegment {
  text: string
  indent: number
  isSpacer: boolean
}

function buildWordSegments(word: string): WordSegment[] {
  const segments: WordSegment[] = []
  let pendingIndent = 0

  for (const part of word.split(/[ \u3000]/)) {
    if (part === '') {
      pendingIndent++
    } else {
      // インデントが列の高さを超えたら透明スペーサー列を挟んで折り返す
      while (pendingIndent >= MAX_LINES_PER_COLUMN) {
        segments.push({
          text: '\u00a0'.repeat(MAX_LINES_PER_COLUMN),
          indent: 0,
          isSpacer: true,
        })
        pendingIndent -= MAX_LINES_PER_COLUMN
      }
      segments.push({ text: part, indent: pendingIndent, isSpacer: false })
      pendingIndent = 0
    }
  }

  return segments
}

interface KarutaCardProps {
  formData: KarutaFormData
  onTransformSettle?: () => void
}

const KarutaCard = forwardRef<HTMLDivElement, KarutaCardProps>(
  function KarutaCard({ formData, onTransformSettle }, ref) {
    const { transform, containerRef, imageRef, handleImageLoad, mouseHandlers } =
      useImageTransform(onTransformSettle)

    const hasImage = formData.imagePreviewUrl !== null

    // 画像が差し替わったときにカーソルを grab に戻す
    useEffect(() => {
      if (!hasImage) return
      handleImageLoad()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.imagePreviewUrl])

    return (
      <div
        ref={(node) => {
          containerRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref !== null) {
            ref.current = node
          }
        }}
        className={styles.card}
        {...(hasImage ? mouseHandlers : {})}
      >
        {hasImage && (
          <img
            ref={imageRef}
            src={formData.imagePreviewUrl!}
            alt="カード背景画像"
            className={styles.image}
            onLoad={handleImageLoad}
            draggable={false}
            style={{
              transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.zoom})`,
              transformOrigin: '0 0',
            }}
          />
        )}

        <div className={styles.initialBadge}>
          {formData.initial || '？'}
        </div>

        {formData.word && (
          <div className={styles.wordVertical}>
            {buildWordSegments(formData.word).map(({ text, indent, isSpacer }, i) => (
              <span
                key={i}
                className={isSpacer ? styles.wordSegmentSpacer : styles.wordSegment}
                style={indent > 0 ? { paddingInlineStart: `${indent}em` } : undefined}
              >
                {text}
              </span>
            ))}
          </div>
        )}

        {hasImage && (
          <div className={styles.hint} data-export-exclude="true">
            {isMobile ? 'スワイプ：移動　ピンチ：ズーム' : 'ドラッグ：移動　ホイール：ズーム'}
          </div>
        )}
      </div>
    )
  }
)

export default KarutaCard
