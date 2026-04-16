import { useEffect, useRef, useState } from 'react'
import type { KarutaFormData } from '../types/karuta'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)

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

  const handleImageReset = (): void => {
    setFormData((prev) => ({ ...prev, imageFile: null, imagePreviewUrl: null }))
    if (fileInputRef.current !== null) {
      fileInputRef.current.value = ''
    }
    setConfirmingReset(false)
  }

  const handleDescriptionToggle = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData((prev) => ({ ...prev, descriptionEnabled: e.target.checked }))
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const description = e.target.value
    setFormData((prev) => ({
      ...prev,
      description,
      descriptionEnabled: description.length > 0,
    }))
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
        <label className={styles.label}>
          画像
        </label>
        <label className={styles.imageDropZone} htmlFor="image">
          {formData.imagePreviewUrl !== null ? (
            <img
              src={formData.imagePreviewUrl}
              alt="選択中の画像"
              className={styles.imagePreviewThumb}
            />
          ) : (
            <>
              <span className={styles.cameraIcon}>📷</span>
              <span className={styles.imageDropZoneText}>タップして画像を選択</span>
            </>
          )}
        </label>
        <input
          id="image"
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className={styles.fileInputHidden}
          onChange={handleImageChange}
        />
        {formData.imagePreviewUrl !== null && (
          <div className={styles.imageResetRow}>
            {confirmingReset ? (
              <>
                <span className={styles.imageResetConfirmText}>画像を削除しますか？</span>
                <button
                  type="button"
                  className={styles.imageResetConfirmButton}
                  onClick={handleImageReset}
                >
                  削除する
                </button>
                <button
                  type="button"
                  className={styles.imageResetCancelButton}
                  onClick={() => setConfirmingReset(false)}
                >
                  キャンセル
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.imageResetButton}
                onClick={() => setConfirmingReset(true)}
              >
                画像を変更・削除
              </button>
            )}
          </div>
        )}
      </div>

      <div className={styles.descriptionPanel}>
        <div className={styles.descriptionPanelHeader}>
          <div className={styles.descriptionPanelTitleRow}>
            <span className={styles.descriptionPanelIcon}>📝</span>
            <span className={styles.descriptionPanelTitle}>解説文カードを追加</span>
            <label className={styles.descriptionToggleLabel}>
              <input
                id="descriptionEnabled"
                type="checkbox"
                className={styles.descriptionToggleInput}
                checked={formData.descriptionEnabled}
                onChange={handleDescriptionToggle}
              />
              <span className={styles.descriptionToggleTrack}>
                <span className={styles.descriptionToggleThumb} />
              </span>
            </label>
          </div>
          <p className={styles.descriptionPanelHint}>
            かるた札と一緒にシェアできる解説カードを作れます
          </p>
        </div>

        <div className={styles.descriptionWrapper}>
          <textarea
            className={styles.textarea}
            maxLength={DESCRIPTION_MAX_LENGTH}
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="解説文を入力（最大80文字）&#10;例：これは○○というミームです"
            rows={3}
          />
          <span
            className={styles.counter}
            style={{ color: descriptionCounterColor }}
          >
            {formData.description.length} / {DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </div>
    </form>
  )
}

export default KarutaForm
