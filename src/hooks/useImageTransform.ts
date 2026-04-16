import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageTransform } from '../types/karuta'

const ZOOM_MIN = 0.2
const ZOOM_MAX = 5.0
const WHEEL_SENSITIVITY = 0.001

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function touchDistance(a: Touch, b: Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

interface DragState {
  startX: number
  startY: number
  startOffsetX: number
  startOffsetY: number
}

interface PinchState {
  prevDist: number
}

interface UseImageTransformReturn {
  transform: ImageTransform
  containerRef: React.RefObject<HTMLDivElement>
  imageRef: React.RefObject<HTMLImageElement>
  handleImageLoad: () => void
  mouseHandlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
  }
}

export function useImageTransform(onInteractionEnd?: () => void): UseImageTransformReturn {
  const onInteractionEndRef = useRef(onInteractionEnd)
  onInteractionEndRef.current = onInteractionEnd
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [transform, setTransform] = useState<ImageTransform>({ zoom: 1, offsetX: 0, offsetY: 0 })
  const transformRef = useRef(transform)
  transformRef.current = transform

  const isDraggingRef = useRef(false)
  const dragStateRef = useRef<DragState | null>(null)
  const pinchStateRef = useRef<PinchState | null>(null)

  const handleImageLoad = useCallback(() => {
    const container = containerRef.current
    const image = imageRef.current
    if (container === null || image === null) return

    const containerW = container.clientWidth
    const containerH = container.clientHeight
    const imgW = image.naturalWidth
    const imgH = image.naturalHeight

    if (imgW === 0 || imgH === 0) return

    const initialZoom = Math.max(containerW / imgW, containerH / imgH)
    const initialOffsetX = (containerW - imgW * initialZoom) / 2
    const initialOffsetY = (containerH - imgH * initialZoom) / 2

    setTransform({ zoom: initialZoom, offsetX: initialOffsetX, offsetY: initialOffsetY })
  }, [])

  // wheel・touch は passive:false が必要なため useEffect でネイティブ登録
  useEffect(() => {
    const container = containerRef.current
    if (container === null) return

    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault()
      setTransform((prev) => {
        const factor = 1 - e.deltaY * WHEEL_SENSITIVITY
        const newZoom = clamp(prev.zoom * factor, ZOOM_MIN, ZOOM_MAX)
        const rect = container.getBoundingClientRect()
        const cursorX = e.clientX - rect.left
        const cursorY = e.clientY - rect.top
        const newOffsetX = cursorX - (cursorX - prev.offsetX) * (newZoom / prev.zoom)
        const newOffsetY = cursorY - (cursorY - prev.offsetY) * (newZoom / prev.zoom)
        return { zoom: newZoom, offsetX: newOffsetX, offsetY: newOffsetY }
      })
    }

    const handleTouchStart = (e: TouchEvent): void => {
      if (e.touches.length === 1) {
        const touch = e.touches[0]
        dragStateRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          startOffsetX: transformRef.current.offsetX,
          startOffsetY: transformRef.current.offsetY,
        }
        pinchStateRef.current = null
      } else if (e.touches.length === 2) {
        pinchStateRef.current = {
          prevDist: touchDistance(e.touches[0], e.touches[1]),
        }
        dragStateRef.current = null
      }
    }

    const handleTouchMove = (e: TouchEvent): void => {
      e.preventDefault()

      if (e.touches.length === 1 && dragStateRef.current !== null) {
        const touch = e.touches[0]
        const dx = touch.clientX - dragStateRef.current.startX
        const dy = touch.clientY - dragStateRef.current.startY
        const base = dragStateRef.current
        setTransform((prev) => ({
          ...prev,
          offsetX: base.startOffsetX + dx,
          offsetY: base.startOffsetY + dy,
        }))
      } else if (e.touches.length === 2 && pinchStateRef.current !== null) {
        const t0 = e.touches[0]
        const t1 = e.touches[1]
        const dist = touchDistance(t0, t1)
        const midX = (t0.clientX + t1.clientX) / 2
        const midY = (t0.clientY + t1.clientY) / 2
        const rect = container.getBoundingClientRect()
        const centerX = midX - rect.left
        const centerY = midY - rect.top
        const ratio = dist / pinchStateRef.current.prevDist

        setTransform((prev) => {
          const newZoom = clamp(prev.zoom * ratio, ZOOM_MIN, ZOOM_MAX)
          const newOffsetX = centerX - (centerX - prev.offsetX) * (newZoom / prev.zoom)
          const newOffsetY = centerY - (centerY - prev.offsetY) * (newZoom / prev.zoom)
          return { zoom: newZoom, offsetX: newOffsetX, offsetY: newOffsetY }
        })

        pinchStateRef.current = { prevDist: dist }
      }
    }

    const handleTouchEnd = (): void => {
      dragStateRef.current = null
      pinchStateRef.current = null
      onInteractionEndRef.current?.()
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    isDraggingRef.current = true
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: transformRef.current.offsetX,
      startOffsetY: transformRef.current.offsetY,
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent): void => {
    if (!isDraggingRef.current || dragStateRef.current === null) return
    const dx = e.clientX - dragStateRef.current.startX
    const dy = e.clientY - dragStateRef.current.startY
    const base = dragStateRef.current
    setTransform((prev) => ({
      ...prev,
      offsetX: base.startOffsetX + dx,
      offsetY: base.startOffsetY + dy,
    }))
  }, [])

  const handleMouseUp = useCallback((): void => {
    isDraggingRef.current = false
    dragStateRef.current = null
    onInteractionEndRef.current?.()
  }, [])

  return {
    transform,
    containerRef,
    imageRef,
    handleImageLoad,
    mouseHandlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
  }
}
