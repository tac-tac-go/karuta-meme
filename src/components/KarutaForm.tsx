import { useEffect, useRef } from 'react'
import type { KarutaFormData } from '../types/karuta'
import ImageAdjuster from './ImageAdjuster'
import styles from './KarutaForm.module.css'

const WORD_MAX_LENGTH = 50
const DESCRIPTION_MAX_LENGTH = 80
const DESCRIPTION_COLOR_THRESHOLD = 50

interface KarutaFormProps {
  formData: KarutaFormData
  setFormData: React.Dispatch<React.SetStateAction<KarutaFormData>>
}

function KarutaForm({ formData, setFormData }: KarutaFormProps): JSX.Element {
  const prevPreviewUrlRef = useRef<string | null>(null)

  useEffect(() => {
    const prev = prevPreviewUrlRef.current
    if (prev !== null && prev !== formData.imagePreviewUrl) {
      URL.revokeObjectURL(prev)
    }
    prevPreviewUrlRef.current = formData.imagePreviewUrl
  }, [formData.imagePreviewUrl])

  useEffect(() => {
    return () => {
      if (prevPreviewUrlRef.current !== null) {
        URL.revokeObjectURL(prevPreviewUrlRef.current)
      }
    }
  }, [])

  const handleInitialChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, initial: value.slice(0, 1) }))
  }

  const handleWordChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData((prev) => ({ ...prev, word: e.target.value.slice(0, WORD_MAX_LENGTH) }))
  }

  const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] ?? null
    if (file === null) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return
    const previewUrl = URL.createObjectURL(file)
    setFormData((prev) => ({ ...prev, imageFile: file, imagePreviewUrl: previewUrl }))
  }

  const handleDescriptionToggle = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData((prev) => ({ ...prev, descriptionEnabled: e.target.checked }))
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setFormData((prev) => ({ ...prev, description: e.target.value }))
  }

  const descriptionCounterColor =
    formData.description.length < DESCRIPTION_COLOR_THRESHOLD ? 'orange' : 'gray'

  return (
    <form className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="initial">
          頭文字
        </label>
        <input
          id="initial"
          type="text"
          className={styles.inputInitial}
          maxLength={1}
          value={formData.initial}
          onChange={handleInitialChange}
          placeholder="あ"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="word">
          かるたの言葉
        </label>
        <input
          id="word"
          type="text"
          className={styles.input}
          maxLength={WORD_MAX_LENGTH}
          value={formData.word}
          onChange={handleWordChange}
          placeholder="あなたの言葉を入力"
        />
        <span className={styles.optionalHint}>スペースで段を区切れます</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="image">
          画像
        </label>
        <input
          id="image"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className={styles.fileInput}
          onChange={handleImageChange}
        />
        {formData.imagePreviewUrl !== null && (
          <ImageAdjuster imageUrl={formData.imagePreviewUrl} />
        )}
      </div>

      <div className={styles.field}>
        <div className={styles.checkboxRow}>
          <input
            id="descriptionEnabled"
            type="checkbox"
            checked={formData.descriptionEnabled}
            onChange={handleDescriptionToggle}
          />
          <label htmlFor="descriptionEnabled" className={styles.checkboxLabel}>
            解説文を追加
          </label>
          <span className={styles.optionalHint}>省略してもOK</span>
        </div>

        {formData.descriptionEnabled && (
          <div className={styles.descriptionWrapper}>
            <textarea
              className={styles.textarea}
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="解説文を入力（最大80文字）"
              rows={3}
            />
            <span
              className={styles.counter}
              style={{ color: descriptionCounterColor }}
            >
              {formData.description.length} / {DESCRIPTION_MAX_LENGTH}
            </span>
          </div>
        )}
      </div>
    </form>
  )
}

export default KarutaForm
