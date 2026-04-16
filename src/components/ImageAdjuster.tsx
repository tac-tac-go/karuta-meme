import { useImageTransform } from '../hooks/useImageTransform'
import styles from './ImageAdjuster.module.css'

interface ImageAdjusterProps {
  imageUrl: string
}

function ImageAdjuster({ imageUrl }: ImageAdjusterProps): JSX.Element {
  const { transform, containerRef, imageRef, handleImageLoad, mouseHandlers, touchHandlers } =
    useImageTransform()

  return (
    <div
      ref={containerRef}
      className={styles.container}
      {...mouseHandlers}
      {...touchHandlers}
    >
      <img
        ref={imageRef}
        src={imageUrl}
        alt="カード画像"
        className={styles.image}
        onLoad={handleImageLoad}
        draggable={false}
        style={{
          transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.zoom})`,
          transformOrigin: '0 0',
        }}
      />
    </div>
  )
}

export default ImageAdjuster
