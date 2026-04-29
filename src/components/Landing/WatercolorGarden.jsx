import { useEffect, useRef } from 'react'
import p5 from 'p5'
import './WatercolorGarden.css'

const GREENS = [
  [78, 110, 60],
  [100, 140, 80],
  [60, 90, 50],
  [120, 160, 95],
  [85, 125, 65],
  [70, 100, 55],
  [140, 175, 110],
]

const POPS = [
  [212, 165, 42],
  [193, 77, 58],
  [156, 126, 184],
  [232, 150, 81],
]

const SPECIES_KEYS = ['fern', 'tomato', 'basil', 'grass', 'leafyVine', 'wildflower', 'sunflower']
const SPECIES_WEIGHTS = [0.18, 0.10, 0.18, 0.20, 0.14, 0.12, 0.08]

export default function WatercolorGarden() {
  const containerRef = useRef(null)
  const visListenerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sketch = (p) => {
      let plants = []
      let reducedMotion = false
      let viewportScale = 1

      const pickSpecies = () => {
        const r = p.random()
        let acc = 0
        for (let i = 0; i < SPECIES_KEYS.length; i++) {
          acc += SPECIES_WEIGHTS[i]
          if (r < acc) return SPECIES_KEYS[i]
        }
        return 'grass'
      }

      const generatePlants = () => {
        const W = p.width
        const isMobile = W < 640
        const count = isMobile ? 9 : 20
        viewportScale = Math.min(1, p.height / 160)
        plants = []
        for (let i = 0; i < count; i++) {
          const slotW = W / count
          plants.push({
            x: slotW * i + slotW * 0.5 + p.random(-slotW * 0.4, slotW * 0.4),
            species: pickSpecies(),
            scale: p.random(0.75, 1.25) * viewportScale,
            heightVar: p.random(0.85, 1.15),
            color: GREENS[Math.floor(p.random(GREENS.length))],
            popColor: POPS[Math.floor(p.random(POPS.length))],
            swayPhase: p.random(0, 1000),
            flip: p.random() < 0.5 ? -1 : 1,
            seed: p.random(0, 10000),
            zOrder: p.random(0, 1),
          })
        }
        plants.sort((a, b) => a.zOrder - b.zOrder)
      }

      const watercolorBlob = (cx, cy, rx, ry, rgb, layers = 4, alpha = 28, seed = 0) => {
        for (let layer = 0; layer < layers; layer++) {
          const a = alpha + p.random(-8, 8)
          p.noStroke()
          p.fill(rgb[0], rgb[1], rgb[2], a)
          p.beginShape()
          const steps = 24
          const offX = layer * 1.1
          const offY = layer * 0.9
          for (let i = 0; i <= steps + 2; i++) {
            const ang = (i / steps) * p.TWO_PI
            const nx = p.cos(ang) * 0.8 + 50 + seed * 0.001 + layer * 7
            const ny = p.sin(ang) * 0.8 + 50
            const distortion = 0.6 + p.noise(nx, ny) * 0.6
            const x = cx + p.cos(ang) * rx * distortion + p.random(-0.8, 0.8) + offX
            const y = cy + p.sin(ang) * ry * distortion + p.random(-0.8, 0.8) + offY
            p.curveVertex(x, y)
          }
          p.endShape(p.CLOSE)
        }
        for (let i = 0; i < 2; i++) {
          p.fill(rgb[0] * 0.55, rgb[1] * 0.55, rgb[2] * 0.55, 22)
          const ang = p.random(p.TWO_PI)
          const r = p.random(0.2, 0.55) * Math.min(rx, ry)
          p.ellipse(cx + p.cos(ang) * r, cy + p.sin(ang) * r, p.random(2, 4))
        }
      }

      const stem = (x0, y0, x1, y1, color, thickness, sway = 0) => {
        for (let layer = 0; layer < 3; layer++) {
          p.noFill()
          p.stroke(color[0], color[1], color[2], 50 + layer * 12)
          p.strokeWeight(thickness + layer * 0.4)
          p.beginShape()
          p.curveVertex(x0, y0)
          p.curveVertex(x0, y0)
          const midX = (x0 + x1) / 2 + sway * 0.5
          const midY = (y0 + y1) / 2
          p.curveVertex(midX + p.random(-0.6, 0.6), midY)
          p.curveVertex(x1, y1)
          p.curveVertex(x1, y1)
          p.endShape()
        }
        p.noStroke()
      }

      const drawFern = (plant, t) => {
        const sway = p.noise(plant.swayPhase + t * 0.0008) * 8 - 4
        const baseY = p.height
        const stemH = 70 * plant.scale * plant.heightVar
        const tipX = plant.x + sway * 1.4
        const tipY = baseY - stemH
        stem(plant.x, baseY, tipX, tipY, plant.color, 2.2, sway * 0.5)
        const pairs = 7
        for (let i = 1; i <= pairs; i++) {
          const tFrac = i / (pairs + 1)
          const cx = p.lerp(plant.x, tipX, tFrac)
          const cy = p.lerp(baseY, tipY, tFrac)
          const leafLen = 14 * plant.scale * (1 - tFrac * 0.3)
          const leafSway = p.noise(plant.swayPhase + 100 + t * 0.001 + i) * 3 - 1.5
          watercolorBlob(cx - leafLen * 0.5 + leafSway, cy, leafLen * 0.55, leafLen * 0.18, plant.color, 3, 30, plant.seed + i)
          watercolorBlob(cx + leafLen * 0.5 - leafSway, cy, leafLen * 0.55, leafLen * 0.18, plant.color, 3, 30, plant.seed + i + 0.5)
        }
      }

      const drawTomato = (plant, t) => {
        const sway = p.noise(plant.swayPhase + t * 0.001) * 6 - 3
        const baseY = p.height
        const stemH = 55 * plant.scale * plant.heightVar
        const tipX = plant.x + sway
        const tipY = baseY - stemH
        stem(plant.x, baseY, tipX, tipY, plant.color, 2.6, sway)
        const leafCount = 5
        for (let i = 0; i < leafCount; i++) {
          const tFrac = (i + 0.5) / leafCount
          const cx = p.lerp(plant.x, tipX, tFrac) + p.random(-12, 12) * plant.scale
          const cy = p.lerp(baseY, tipY, tFrac) + p.random(-6, 6)
          const sz = 16 * plant.scale * p.random(0.7, 1.1)
          watercolorBlob(cx, cy, sz, sz * 0.85, plant.color, 4, 32, plant.seed + i)
        }
        if (plant.zOrder > 0.6) {
          for (let f = 0; f < 2; f++) {
            const fx = plant.x + p.random(-15, 15) * plant.scale
            const fy = baseY - stemH * p.random(0.4, 0.8)
            watercolorBlob(fx, fy, 6 * plant.scale, 6 * plant.scale, [193, 77, 58], 3, 50, plant.seed + 100 + f)
          }
        }
      }

      const drawBasil = (plant, t) => {
        const sway = p.noise(plant.swayPhase + t * 0.0009) * 5 - 2.5
        const baseY = p.height
        const stemH = 38 * plant.scale * plant.heightVar
        const tipX = plant.x + sway
        const tipY = baseY - stemH
        stem(plant.x, baseY, tipX, tipY, plant.color, 1.8, sway)
        const pairs = 4
        for (let i = 1; i <= pairs; i++) {
          const tFrac = i / (pairs + 1)
          const cx = p.lerp(plant.x, tipX, tFrac)
          const cy = p.lerp(baseY, tipY, tFrac)
          const sz = 9 * plant.scale * (1 - tFrac * 0.2)
          watercolorBlob(cx - sz * 1.1, cy, sz, sz * 0.75, plant.color, 3, 32, plant.seed + i * 2)
          watercolorBlob(cx + sz * 1.1, cy, sz, sz * 0.75, plant.color, 3, 32, plant.seed + i * 2 + 1)
        }
        watercolorBlob(tipX, tipY, 12 * plant.scale, 9 * plant.scale, plant.color, 4, 30, plant.seed + 99)
      }

      const drawGrass = (plant, t) => {
        const blades = 6
        const baseY = p.height
        for (let i = 0; i < blades; i++) {
          const offsetX = (i - blades / 2) * 5 * plant.scale
          const sway = p.noise(plant.swayPhase + i * 5 + t * 0.0012) * 12 - 6
          const h = (40 + p.random(-10, 25)) * plant.scale * plant.heightVar
          const tipX = plant.x + offsetX + sway
          const tipY = baseY - h
          stem(plant.x + offsetX, baseY, tipX, tipY, plant.color, 1.3, sway * 0.7)
        }
      }

      const drawSunflower = (plant, t) => {
        const sway = p.noise(plant.swayPhase + t * 0.0007) * 8 - 4
        const baseY = p.height
        const stemH = 95 * plant.scale * plant.heightVar
        const tipX = plant.x + sway
        const tipY = baseY - stemH
        stem(plant.x, baseY, tipX, tipY, plant.color, 3.2, sway)
        for (let i = 0; i < 3; i++) {
          const tFrac = (i + 1) / 4
          const cx = p.lerp(plant.x, tipX, tFrac)
          const cy = p.lerp(baseY, tipY, tFrac)
          const side = i % 2 === 0 ? -1 : 1
          watercolorBlob(cx + side * 14 * plant.scale, cy, 14 * plant.scale, 8 * plant.scale, plant.color, 3, 30, plant.seed + i)
        }
        const yellow = [212, 165, 42]
        const center = [120, 70, 35]
        const petalCount = 12
        for (let pi = 0; pi < petalCount; pi++) {
          const ang = (pi / petalCount) * p.TWO_PI
          const px = tipX + p.cos(ang) * 13 * plant.scale
          const py = tipY + p.sin(ang) * 13 * plant.scale
          watercolorBlob(px, py, 7 * plant.scale, 4 * plant.scale, yellow, 3, 35, plant.seed + 200 + pi)
        }
        watercolorBlob(tipX, tipY, 8 * plant.scale, 8 * plant.scale, center, 4, 50, plant.seed + 999)
      }

      const drawLeafyVine = (plant, t) => {
        const baseY = p.height
        const stemH = 62 * plant.scale * plant.heightVar
        const segments = 8
        let prevX = plant.x
        let prevY = baseY
        for (let s = 1; s <= segments; s++) {
          const tFrac = s / segments
          const wave = p.sin(tFrac * Math.PI * 2 + plant.swayPhase) * 14 * plant.scale * plant.flip
          const swayMore = p.noise(plant.swayPhase + s + t * 0.0008) * 4 - 2
          const x = plant.x + wave + swayMore
          const y = baseY - stemH * tFrac
          for (let layer = 0; layer < 2; layer++) {
            p.noFill()
            p.stroke(plant.color[0], plant.color[1], plant.color[2], 60 + layer * 15)
            p.strokeWeight(1.4 + layer * 0.4)
            p.line(prevX, prevY, x, y)
          }
          if (s % 2 === 0) {
            watercolorBlob(x + 8 * plant.flip * plant.scale, y, 9 * plant.scale, 7 * plant.scale, plant.color, 3, 32, plant.seed + s)
          }
          prevX = x
          prevY = y
        }
        p.noStroke()
      }

      const drawWildflower = (plant, t) => {
        const sway = p.noise(plant.swayPhase + t * 0.001) * 7 - 3.5
        const baseY = p.height
        const stemH = 50 * plant.scale * plant.heightVar
        const tipX = plant.x + sway
        const tipY = baseY - stemH
        stem(plant.x, baseY, tipX, tipY, plant.color, 1.4, sway)
        for (let i = 0; i < 3; i++) {
          const tFrac = (i + 1) / 5
          const cx = p.lerp(plant.x, tipX, tFrac)
          const cy = p.lerp(baseY, tipY, tFrac)
          const side = i % 2 === 0 ? -1 : 1
          watercolorBlob(cx + side * 6 * plant.scale, cy, 6 * plant.scale, 3 * plant.scale, plant.color, 2, 28, plant.seed + i)
        }
        for (let f = 0; f < 5; f++) {
          const fx = tipX + p.random(-6, 6) * plant.scale
          const fy = tipY + p.random(-5, 2) * plant.scale
          watercolorBlob(fx, fy, 3 * plant.scale, 3 * plant.scale, plant.popColor, 3, 45, plant.seed + 300 + f)
        }
      }

      const drawers = {
        fern: drawFern,
        tomato: drawTomato,
        basil: drawBasil,
        grass: drawGrass,
        sunflower: drawSunflower,
        leafyVine: drawLeafyVine,
        wildflower: drawWildflower,
      }

      p.setup = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        const cnv = p.createCanvas(w, h)
        cnv.parent(container)
        p.frameRate(30)
        p.noStroke()
        reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        generatePlants()
        if (reducedMotion) {
          p.noLoop()
          p.redraw()
        }
      }

      p.draw = () => {
        p.clear()
        const t = p.millis()
        for (const plant of plants) {
          const drawer = drawers[plant.species]
          if (drawer) drawer(plant, t)
        }
      }

      p.windowResized = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        p.resizeCanvas(w, h)
        generatePlants()
        if (reducedMotion) p.redraw()
      }

      const onVis = () => {
        if (document.hidden) p.noLoop()
        else if (!reducedMotion) p.loop()
      }
      document.addEventListener('visibilitychange', onVis)
      visListenerRef.current = onVis
    }

    const instance = new p5(sketch)

    return () => {
      instance.remove()
      if (visListenerRef.current) {
        document.removeEventListener('visibilitychange', visListenerRef.current)
        visListenerRef.current = null
      }
    }
  }, [])

  return <div ref={containerRef} className="watercolor-garden" aria-hidden="true" />
}
