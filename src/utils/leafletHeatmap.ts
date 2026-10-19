import L from 'leaflet'

export interface HeatmapPoint {
  lat: number
  lng: number
  weight?: number // 0.0 to 1.0
}

export interface HeatmapOptions {
  radius?: number
  blur?: number
  maxOpacity?: number
  minOpacity?: number
  mode?: 'availability' | 'deficit'
}

// Pre-rendered color palettes for 60fps canvas pixel color mapping
function createPalette(mode: 'availability' | 'deficit'): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 1
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 256, 0)
  if (mode === 'availability') {
    // High availability: Emerald -> Lime -> Golden Yellow -> Blue Cyan
    grad.addColorStop(0.0, 'rgba(16, 185, 129, 0)')
    grad.addColorStop(0.2, 'rgba(16, 185, 129, 0.4)')
    grad.addColorStop(0.45, 'rgba(52, 211, 153, 0.7)')
    grad.addColorStop(0.7, 'rgba(234, 179, 8, 0.85)')
    grad.addColorStop(0.9, 'rgba(34, 197, 94, 0.95)')
    grad.addColorStop(1.0, 'rgba(6, 182, 212, 1)')
  } else {
    // Deficit / High Demand: Amber -> Orange -> Crimson Red
    grad.addColorStop(0.0, 'rgba(245, 158, 11, 0)')
    grad.addColorStop(0.25, 'rgba(245, 158, 11, 0.45)')
    grad.addColorStop(0.55, 'rgba(249, 115, 22, 0.75)')
    grad.addColorStop(0.85, 'rgba(239, 68, 68, 0.9)')
    grad.addColorStop(1.0, 'rgba(185, 28, 28, 1)')
  }

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 1)
  return ctx.getImageData(0, 0, 256, 1).data
}

export class CanvasHeatmapLayer {
  private map: L.Map
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private points: HeatmapPoint[] = []
  private options: Required<HeatmapOptions>
  private palette: Uint8ClampedArray
  private circleCanvas: HTMLCanvasElement
  private animFrameId: number | null = null

  constructor(map: L.Map, options?: HeatmapOptions) {
    this.map = map
    this.options = {
      radius: options?.radius ?? 32,
      blur: options?.blur ?? 18,
      maxOpacity: options?.maxOpacity ?? 0.82,
      minOpacity: options?.minOpacity ?? 0.05,
      mode: options?.mode ?? 'availability',
    }

    this.palette = createPalette(this.options.mode)
    this.circleCanvas = this.createCircleCanvas()

    this.canvas = document.createElement('canvas')
    this.canvas.className = 'leaflet-heatmap-canvas'
    this.canvas.style.position = 'absolute'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.pointerEvents = 'none'
    this.canvas.style.zIndex = '350'

    this.ctx = this.canvas.getContext('2d')!
    this.addToPane()
    this.bindEvents()
    this.resize()
  }

  private createCircleCanvas(): HTMLCanvasElement {
    const c = document.createElement('canvas')
    const r = this.options.radius + this.options.blur
    c.width = r * 2
    c.height = r * 2
    const ctx = c.getContext('2d')!

    const grad = ctx.createRadialGradient(r, r, this.options.radius * 0.15, r, r, r)
    grad.addColorStop(0, 'rgba(0,0,0,1)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(r, r, r, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.fill()
    return c
  }

  private addToPane() {
    const pane = this.map.getPanes().overlayPane
    pane.appendChild(this.canvas)
  }

  private bindEvents() {
    this.onMove = this.onMove.bind(this)
    this.onResize = this.onResize.bind(this)
    this.map.on('moveend zoomend viewreset', this.onMove)
    this.map.on('resize', this.onResize)
  }

  private onResize() {
    this.resize()
    this.draw()
  }

  private onMove() {
    this.resetCanvasPosition()
    this.draw()
  }

  private resize() {
    const size = this.map.getSize()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = size.x * dpr
    this.canvas.height = size.y * dpr
    this.canvas.style.width = `${size.x}px`
    this.canvas.style.height = `${size.y}px`
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.resetCanvasPosition()
  }

  private resetCanvasPosition() {
    const bounds = this.map.getBounds()
    const topLeft = this.map.latLngToLayerPoint(bounds.getNorthWest())
    L.DomUtil.setPosition(this.canvas, topLeft)
  }

  public setPoints(points: HeatmapPoint[]) {
    this.points = points
    this.draw()
  }

  public setOptions(newOpts: Partial<HeatmapOptions>) {
    let circleDirty = false
    if (newOpts.radius !== undefined && newOpts.radius !== this.options.radius) {
      this.options.radius = newOpts.radius
      circleDirty = true
    }
    if (newOpts.blur !== undefined && newOpts.blur !== this.options.blur) {
      this.options.blur = newOpts.blur
      circleDirty = true
    }
    if (newOpts.mode !== undefined && newOpts.mode !== this.options.mode) {
      this.options.mode = newOpts.mode
      this.palette = createPalette(this.options.mode)
    }
    if (newOpts.maxOpacity !== undefined) this.options.maxOpacity = newOpts.maxOpacity
    if (newOpts.minOpacity !== undefined) this.options.minOpacity = newOpts.minOpacity

    if (circleDirty) {
      this.circleCanvas = this.createCircleCanvas()
    }
    this.draw()
  }

  public draw() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId)
    this.animFrameId = requestAnimationFrame(() => {
      this.renderFrame()
    })
  }

  private renderFrame() {
    const size = this.map.getSize()
    this.ctx.clearRect(0, 0, size.x, size.y)
    if (!this.points || this.points.length === 0) return

    const bounds = this.map.getBounds()
    const r = this.options.radius + this.options.blur

    // 1. Draw grayscale alpha mask using precomputed circle
    for (const pt of this.points) {
      // Skip points far out of viewport
      if (!bounds.pad(0.15).contains([pt.lat, pt.lng])) continue
      const layerPt = this.map.latLngToContainerPoint([pt.lat, pt.lng])
      const weight = Math.max(0.1, Math.min(1.0, pt.weight ?? 0.8))
      this.ctx.globalAlpha = weight * this.options.maxOpacity
      this.ctx.drawImage(this.circleCanvas, layerPt.x - r, layerPt.y - r)
    }

    // 2. Colorize alpha channels with palette
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const imgData = this.ctx.getImageData(0, 0, size.x * dpr, size.y * dpr)
    const data = imgData.data
    const pal = this.palette

    for (let i = 3; i < data.length; i += 4) {
      const alpha = data[i]
      if (alpha > 0) {
        const offset = alpha * 4
        data[i - 3] = pal[offset]
        data[i - 2] = pal[offset + 1]
        data[i - 1] = pal[offset + 2]
        data[i] = Math.round(pal[offset + 3] * (alpha / 255))
      }
    }

    this.ctx.putImageData(imgData, 0, 0)
    this.ctx.globalAlpha = 1
  }

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId)
    this.map.off('moveend zoomend viewreset', this.onMove)
    this.map.off('resize', this.onResize)
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
  }
}
