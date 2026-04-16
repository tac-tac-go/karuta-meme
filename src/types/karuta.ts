export interface ImageTransform {
  zoom: number
  offsetX: number
  offsetY: number
}

export interface KarutaFormData {
  initial: string
  word: string
  imageFile: File | null
  imagePreviewUrl: string | null
  descriptionEnabled: boolean
  description: string
}
