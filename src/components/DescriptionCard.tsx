import { forwardRef } from 'react'
import type { KarutaFormData } from '../types/karuta'
import styles from './DescriptionCard.module.css'

interface DescriptionCardProps {
  formData: KarutaFormData
}

const DescriptionCard = forwardRef<HTMLDivElement, DescriptionCardProps>(
  function DescriptionCard({ formData }, ref) {
    const now = new Date()
    const dateLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`

    return (
      <div ref={ref} className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerInitial}>{formData.initial || '？'}</div>
          <div className={styles.headerWord}>{formData.word}</div>
          <div className={styles.headerLabel}>解説</div>
        </div>

        <div className={styles.body}>
          <p className={styles.description}>{formData.description}</p>
        </div>

        <div className={styles.footer}>
          <span className={styles.date}>{dateLabel}</span>
        </div>
      </div>
    )
  }
)

export default DescriptionCard
