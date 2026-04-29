import { useEffect, useRef } from 'react'
import p5 from 'p5'
import './WatercolorGarden.css'

const GREENS_FRONT = [
  [62, 100, 50],
  [80, 120, 62],
  [98, 140, 75],
  [50, 88, 42],
  [115, 155, 88],
]

const GREENS_BACK = [
  [148, 175, 122],
  [165, 190, 140],
  [130, 165, 110],
]

const MEADOW_WASH = [
  [200, 215, 150],
  [185, 205, 130],
  [215, 220, 160],
]

const ORANGE_POPPY = [
  [232, 128, 50],
  [218, 105, 35],
  [240, 145, 65],
]
const ORANGE_DARK = [85, 48, 22]

const PURPLE_CONE = [
  [170, 95, 168],
  [185, 115, 180],
  [150, 80, 155],
]
const CONE_CENTER = [125, 70, 30]

const LUPINE = [
  [125, 100, 178],
  [145, 120, 195],
  [105, 85, 160],
]

const DAISY_WHITE = [248, 245, 232]
const DAISY_CENTER = [215, 178, 65]

const SUNFLOWER = [225, 175, 55]
const SUNFLOWER_BACK = [205, 155, 45]
const SUNFLOWER_CENTER = [105, 60, 25]

const TOMATO_RED = [
  [195, 65, 50],
  [212, 80, 60],
  [180, 55, 45],
]

const PUMPKIN_ORANGE = [
  [220, 125, 35],
  [235, 140, 50],
  [200, 105, 25],
]

const STRAWBERRY_RED = [
  [205, 70, 65],
  [220, 85, 75],
]

const PEPPER_RED = [
  [200, 55, 45],
  [180, 45, 40],
]

const TWO_PI = Math.PI * 2

const rand = (a, b) => a + Math.random() * (b - a)
const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)]

const lanceShape = (length, width, pointiness = 1, steps = 12) => {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = length * t
    const profile = Math.sin(t * Math.PI) * (0.55 + 0.45 * (1 - t * pointiness))
    pts.push({ x, y: -width * profile })
  }
  for (let i = steps - 1; i > 0; i--) {
    const t = i / steps
    const x = length * t
    const profile = Math.sin(t * Math.PI) * (0.55 + 0.45 * (1 - t * pointiness))
    pts.push({ x, y: width * profile })
  }
  return pts
}

const lobedShape = (length, width, lobes = 5, steps = 28) => {
  // Pumpkin/squash leaf — broad with shallow lobes around the edge.
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * TWO_PI - Math.PI / 2
    const baseR = 1 + 0.18 * Math.cos(ang * lobes)
    const r = baseR
    const x = Math.cos(ang) * length * 0.5 * r + length * 0.5
    const y = Math.sin(ang) * width * 0.5 * r
    pts.push({ x, y })
  }
  return pts
}

const roundShape = (rx, ry, steps = 16) => {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const ang = (i / steps) * TWO_PI
    pts.push({ x: Math.cos(ang) * rx, y: Math.sin(ang) * ry })
  }
  return pts
}

const precomputeWashLayers = (pts, layers, edgeAmp, layerOffsetAmp) => {
  const out = []
  for (let l = 0; l < layers; l++) {
    out.push({
      vNoise: pts.map(() => ({ dx: rand(-edgeAmp, edgeAmp), dy: rand(-edgeAmp, edgeAmp) })),
      offsetX: rand(-layerOffsetAmp, layerOffsetAmp),
      offsetY: rand(-layerOffsetAmp, layerOffsetAmp),
      colorDelta: [rand(-15, 15), rand(-12, 12), rand(-10, 10)],
      alpha: rand(18, 30),
    })
  }
  return out
}

const newLeaf = (config) => {
  const { pivot, angle, shape, color, edgeAmp = 2.2, layers = 4 } = config
  return {
    type: 'leaf',
    pivot,
    angle,
    shape,
    color,
    layers: precomputeWashLayers(shape, layers, edgeAmp, 1.4),
    edgeStroke: { alpha: rand(35, 55), weight: rand(0.5, 0.8) },
  }
}

const newStem = (start, end, thickness, color, jitterPts = 5) => {
  const jit = []
  for (let i = 0; i < jitterPts; i++) jit.push({ dx: rand(-0.7, 0.7), dy: rand(-0.7, 0.7) })
  return { type: 'stem', start, end, thickness, color, jitter: jit }
}

const newCurvedStem = (start, end, thickness, color, curveAmount, jitterPts = 6) => {
  // Stem with a sine-shaped sideways arch (peaks at midpoint), useful for grass/long stems.
  const jit = []
  for (let i = 0; i < jitterPts; i++) {
    const t = (i + 1) / (jitterPts + 1)
    const sineBias = Math.sin(t * Math.PI) * curveAmount
    jit.push({ dx: sineBias + rand(-0.5, 0.5), dy: rand(-0.5, 0.5) })
  }
  return { type: 'stem', start, end, thickness, color, jitter: jit }
}

const newBlob = (pos, rx, ry, color, layers = 5, edgeAmp = 1.6) => {
  const shape = roundShape(rx, ry, 14)
  return {
    type: 'blob',
    pos,
    shape,
    color,
    layers: precomputeWashLayers(shape, layers, edgeAmp, 1.0),
    pigmentDot: { dx: rand(-1, 1), dy: rand(-1, 1) },
  }
}

// ---- Species ----

const buildGrass = (palette) => {
  const parts = []
  const blades = 11 + Math.floor(rand(0, 5))
  const spread = rand(28, 44)
  // Cluster prevailing arch direction (suggests wind in this clump).
  const clusterCurve = rand(-3.5, 3.5)
  for (let i = 0; i < blades; i++) {
    const offX = (i - blades / 2) * (spread / blades) + rand(-3, 3)
    const h = rand(60, 110)
    const tipDrift = clusterCurve * 1.5 + rand(-5, 5)
    const curveAmount = clusterCurve + rand(-2, 2)
    parts.push(newCurvedStem({ x: offX, y: 0 }, { x: offX + tipDrift, y: -h }, rand(1.3, 2.0), randPick(palette), curveAmount, 6))
  }
  return parts
}

const buildPoppy = (palette) => {
  const parts = []
  const stemH = rand(65, 100)
  const stemColor = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-3, 3), y: -stemH }, 1.3, stemColor, 5))
  for (let i = 0; i < 2; i++) {
    const y = -stemH * (0.2 + i * 0.15)
    const shape = lanceShape(rand(8, 12), rand(1.5, 2.2), 1.4)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: i % 2 === 0 ? 0.3 : Math.PI - 0.3, shape, color: stemColor, layers: 3, edgeAmp: 1.2 }))
  }
  const headY = -stemH
  const blobCount = 4 + Math.floor(rand(0, 3))
  for (let i = 0; i < blobCount; i++) {
    const ang = (i / blobCount) * TWO_PI + rand(-0.3, 0.3)
    const r = rand(4, 7)
    const cx = Math.cos(ang) * rand(2, 5)
    const cy = headY + Math.sin(ang) * rand(2, 5)
    parts.push(newBlob({ x: cx, y: cy }, r, r * rand(0.85, 1.1), randPick(ORANGE_POPPY), 5, 2.0))
  }
  const petalHints = 3 + Math.floor(rand(0, 3))
  for (let i = 0; i < petalHints; i++) {
    const ang = rand(0, TWO_PI)
    const shape = lanceShape(rand(5, 8), rand(2, 3), 1.2)
    parts.push(newLeaf({ pivot: { x: 0, y: headY }, angle: ang, shape, color: randPick(ORANGE_POPPY), edgeAmp: 1.8, layers: 3 }))
  }
  parts.push(newBlob({ x: 0, y: headY }, 2, 2, ORANGE_DARK, 4, 1.0))
  return parts
}

const buildConeflower = (palette) => {
  const parts = []
  const stemH = rand(75, 115)
  const stemColor = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-2, 2), y: -stemH }, 1.4, stemColor, 5))
  for (let i = 0; i < 2; i++) {
    const y = -stemH * (0.3 + i * 0.2)
    const shape = lanceShape(rand(9, 13), 1.8, 1.5)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: i % 2 === 0 ? 0.4 : Math.PI - 0.4, shape, color: stemColor, layers: 3, edgeAmp: 1.2 }))
  }
  const headY = -stemH
  const petals = 9 + Math.floor(rand(0, 3))
  for (let i = 0; i < petals; i++) {
    const ang = (i / petals) * TWO_PI + rand(-0.1, 0.1)
    const droop = 0.15
    const finalAng = ang + (Math.sin(ang) > 0 ? droop : -droop * 0.3)
    const shape = lanceShape(rand(7, 10), rand(2.2, 3), 1.3)
    parts.push(newLeaf({ pivot: { x: 0, y: headY }, angle: finalAng, shape, color: randPick(PURPLE_CONE), edgeAmp: 1.8, layers: 3 }))
  }
  parts.push(newBlob({ x: 0, y: headY }, 2.5, 3.2, CONE_CENTER, 5, 1.0))
  parts.push(newBlob({ x: 0, y: headY - 1 }, 2, 2.5, [165, 110, 50], 4, 0.8))
  return parts
}

const buildLupine = (palette) => {
  const parts = []
  const stemH = rand(95, 130)
  const main = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-3, 3), y: -stemH }, 1.6, main, 6))
  for (let i = 0; i < 3; i++) {
    const t = (i + 1) / 5
    const y = -stemH * t * 0.4
    const shape = lanceShape(rand(8, 12), 2, 1.4)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: i % 2 === 0 ? 0.5 : Math.PI - 0.5, shape, color: main, layers: 3, edgeAmp: 1.2 }))
  }
  const spikeStart = -stemH * 0.5
  const spikeEnd = -stemH - rand(2, 6)
  const spikeBlobs = 14 + Math.floor(rand(0, 6))
  for (let i = 0; i < spikeBlobs; i++) {
    const t = i / (spikeBlobs - 1)
    const y = spikeStart + (spikeEnd - spikeStart) * t
    const xJit = rand(-2.5, 2.5) * (1 - t * 0.5)
    const r = rand(1.8, 2.8) * (1 - t * 0.35)
    parts.push(newBlob({ x: xJit, y }, r, r, randPick(LUPINE), 4, 1.2))
  }
  return parts
}

const buildDaisy = (palette) => {
  const parts = []
  const stemH = rand(55, 85)
  const main = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-2, 2), y: -stemH }, 1.1, main, 4))
  for (let i = 0; i < 2; i++) {
    const y = -stemH * (0.3 + i * 0.25)
    const shape = lanceShape(rand(6, 9), 1.5, 1.3)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: i % 2 === 0 ? 0.4 : Math.PI - 0.4, shape, color: main, layers: 3, edgeAmp: 1.2 }))
  }
  const cy = -stemH
  const petals = 8 + Math.floor(rand(0, 3))
  for (let i = 0; i < petals; i++) {
    const ang = (i / petals) * TWO_PI + rand(-0.05, 0.05)
    const shape = lanceShape(rand(4.5, 6.5), rand(1.6, 2.2), 1.3)
    parts.push(newLeaf({ pivot: { x: 0, y: cy }, angle: ang, shape, color: DAISY_WHITE, layers: 3, edgeAmp: 1.4 }))
  }
  parts.push(newBlob({ x: 0, y: cy }, 2.2, 2.2, DAISY_CENTER, 4, 1.0))
  return parts
}

const buildSunflower = (palette) => {
  const parts = []
  const stemH = rand(110, 150)
  const main = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-3, 3), y: -stemH }, 2.6, main, 7))
  for (let i = 0; i < 2; i++) {
    const t = (i + 1) / 3
    const y = -stemH * t
    const side = i % 2 === 0 ? -1 : 1
    const shape = lanceShape(rand(16, 22), rand(7, 9), 1.0)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: side > 0 ? -0.3 : Math.PI + 0.3, shape, color: main, layers: 4, edgeAmp: 1.6 }))
  }
  const cy = -stemH
  const petalsBack = 12
  for (let i = 0; i < petalsBack; i++) {
    const ang = (i / petalsBack) * TWO_PI + Math.PI / petalsBack
    const shape = lanceShape(rand(8, 10), 3, 1.2)
    parts.push(newLeaf({ pivot: { x: 0, y: cy }, angle: ang, shape, color: SUNFLOWER_BACK, layers: 3, edgeAmp: 1.4 }))
  }
  const petals = 12
  for (let i = 0; i < petals; i++) {
    const ang = (i / petals) * TWO_PI
    const shape = lanceShape(rand(10, 12), 3.5, 1.2)
    parts.push(newLeaf({ pivot: { x: 0, y: cy }, angle: ang, shape, color: SUNFLOWER, layers: 3, edgeAmp: 1.4 }))
  }
  parts.push(newBlob({ x: 0, y: cy }, 5.5, 5.5, SUNFLOWER_CENTER, 5, 1.2))
  return parts
}

const buildTomato = (palette) => {
  const parts = []
  const stemH = rand(80, 120)
  const main = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-3, 3), y: -stemH }, 2, main, 6))
  // simple lance leaves at intervals
  const leafNodes = 3 + Math.floor(rand(0, 2))
  for (let i = 1; i <= leafNodes; i++) {
    const t = i / (leafNodes + 1)
    const y = -stemH * t
    const side = i % 2 === 0 ? -1 : 1
    const shape = lanceShape(rand(11, 16), rand(4, 6), 1.0)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: side > 0 ? -0.2 : Math.PI + 0.2, shape, color: main, layers: 4, edgeAmp: 1.6 }))
  }
  // 2-3 fruit clusters at varying heights
  const clusters = 2 + Math.floor(rand(0, 2))
  for (let c = 0; c < clusters; c++) {
    const t = rand(0.35, 0.85)
    const cy = -stemH * t
    const cx = rand(-10, 10)
    const fruits = 2 + Math.floor(rand(0, 3))
    for (let f = 0; f < fruits; f++) {
      const fx = cx + rand(-5, 5)
      const fy = cy + rand(-3, 3)
      const r = rand(3.8, 5.5)
      parts.push(newBlob({ x: fx, y: fy }, r, r * rand(0.9, 1.05), randPick(TOMATO_RED), 5, 1.4))
    }
  }
  return parts
}

const buildPumpkin = (palette) => {
  const parts = []
  const main = randPick(palette)
  // low sprawling — 2-3 stems out at low angles, big lobed leaves on each
  const arms = 2 + Math.floor(rand(0, 2))
  for (let a = 0; a < arms; a++) {
    const ang = (a / arms) * Math.PI - Math.PI - rand(-0.2, 0.2)
    const len = rand(20, 35)
    const tx = Math.cos(ang) * len
    const ty = Math.sin(ang) * len * 0.6
    parts.push(newStem({ x: 0, y: 0 }, { x: tx, y: ty }, 1.4, main, 4))
    // lobed leaf at end of each arm
    const leafLen = rand(20, 28)
    const leafWid = rand(14, 19)
    const shape = lobedShape(leafLen, leafWid, 5, 28)
    parts.push(newLeaf({ pivot: { x: tx, y: ty }, angle: ang - Math.PI, shape, color: main, layers: 4, edgeAmp: 2.0 }))
  }
  // big orange round fruit at base
  const fx = rand(-6, 6)
  const fy = rand(-4, 0)
  const fR = rand(9, 13)
  parts.push(newBlob({ x: fx, y: fy }, fR, fR * 0.85, randPick(PUMPKIN_ORANGE), 6, 2.0))
  // small darker dot suggesting ribs
  parts.push(newBlob({ x: fx, y: fy }, fR * 0.7, fR * 0.6, [180, 95, 25], 3, 1.4))
  return parts
}

const buildStrawberry = (palette) => {
  const parts = []
  const main = randPick(palette)
  const clusters = 3 + Math.floor(rand(0, 2))
  for (let c = 0; c < clusters; c++) {
    const ang = (c / clusters) * Math.PI - Math.PI - rand(-0.2, 0.2)
    const len = rand(20, 32)
    const tx = Math.cos(ang) * len
    const ty = Math.sin(ang) * len * 0.7 - rand(2, 6)
    parts.push(newStem({ x: 0, y: 0 }, { x: tx, y: ty }, 1.2, main, 3))
    // trifoliate leaves
    const leafShape = lanceShape(rand(11, 15), rand(5.5, 7), 0.85)
    parts.push(newLeaf({ pivot: { x: tx, y: ty }, angle: ang - 0.45, shape: leafShape, color: main, layers: 4, edgeAmp: 1.8 }))
    parts.push(newLeaf({ pivot: { x: tx, y: ty }, angle: ang, shape: leafShape, color: main, layers: 4, edgeAmp: 1.8 }))
    parts.push(newLeaf({ pivot: { x: tx, y: ty }, angle: ang + 0.45, shape: leafShape, color: main, layers: 4, edgeAmp: 1.8 }))
  }
  // 1-2 berries
  const berries = 1 + Math.floor(rand(0, 2))
  for (let b = 0; b < berries; b++) {
    const fx = rand(-8, 8)
    const fy = rand(-8, -2)
    parts.push(newBlob({ x: fx, y: fy }, rand(3.5, 5), rand(4.5, 6), randPick(STRAWBERRY_RED), 5, 1.4))
  }
  return parts
}

const buildPepper = (palette) => {
  const parts = []
  const stemH = rand(70, 95)
  const main = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-2, 2), y: -stemH }, 1.6, main, 5))
  // small pointed leaves up the stem
  const pairs = 4
  for (let i = 1; i <= pairs; i++) {
    const t = i / (pairs + 1)
    const y = -stemH * t
    const sz = 8 + (1 - t) * 3
    const shape = lanceShape(sz * 1.4, sz * 0.55, 1.2)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: Math.PI - 0.15, shape, color: main, layers: 3, edgeAmp: 1.4 }))
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: 0.15, shape, color: main, layers: 3, edgeAmp: 1.4 }))
  }
  // 2-3 hanging red peppers (lance shape pointing down)
  const peppers = 2 + Math.floor(rand(0, 2))
  for (let f = 0; f < peppers; f++) {
    const t = rand(0.4, 0.85)
    const y = -stemH * t
    const x = rand(-7, 7)
    const shape = lanceShape(rand(11, 16), rand(2.8, 4), 0.9)
    parts.push(newLeaf({ pivot: { x, y }, angle: Math.PI / 2 + rand(-0.2, 0.2), shape, color: randPick(PEPPER_RED), layers: 5, edgeAmp: 1.6 }))
  }
  return parts
}

const SPECIES_BUILDERS = {
  grass: buildGrass,
  poppy: buildPoppy,
  coneflower: buildConeflower,
  lupine: buildLupine,
  daisy: buildDaisy,
  sunflower: buildSunflower,
  tomato: buildTomato,
  pumpkin: buildPumpkin,
  strawberry: buildStrawberry,
  pepper: buildPepper,
}

const SPECIES_KEYS = ['grass', 'poppy', 'coneflower', 'lupine', 'daisy', 'sunflower', 'tomato', 'pumpkin', 'strawberry', 'pepper']
// Foreground favors veggies/fruits; background favors grass.
const SPECIES_WEIGHTS_FRONT = [0.18, 0.10, 0.08, 0.08, 0.08, 0.08, 0.13, 0.10, 0.09, 0.08]
const SPECIES_WEIGHTS_MID   = [0.26, 0.10, 0.10, 0.12, 0.09, 0.06, 0.09, 0.05, 0.07, 0.06]
const SPECIES_WEIGHTS_BACK  = [0.50, 0.10, 0.08, 0.10, 0.08, 0.04, 0.04, 0.02, 0.02, 0.02]

const pickWeighted = (keys, weights) => {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < keys.length; i++) {
    acc += weights[i]
    if (r < acc) return keys[i]
  }
  return keys[0]
}

const generatePlant = (config) => {
  const { x, baseY, scale, palette, swayAmplitude, swayPhase, species, layerTone } = config
  const parts = SPECIES_BUILDERS[species](palette)
  return { x, baseY, scale, parts, swayAmplitude, swayPhase, species, layerTone }
}

export default function WatercolorGarden() {
  const containerRef = useRef(null)
  const visListenerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sketch = (p) => {
      let plants = []
      let washBands = []
      let reducedMotion = false

      const generateWashBands = () => {
        const W = p.width
        const H = p.height
        washBands = []
        const bandCount = 5
        for (let i = 0; i < bandCount; i++) {
          const cy = H * (0.55 + i * 0.1)
          const ry = rand(28, 50)
          const rx = W * 0.7
          const cx = W * rand(0.3, 0.7)
          const color = randPick(MEADOW_WASH)
          const shape = roundShape(rx, ry, 24)
          washBands.push({
            cx, cy, color,
            layers: precomputeWashLayers(shape, 3, 12, 8),
            shape,
          })
        }
      }

      const generatePlants = () => {
        const W = p.width
        const H = p.height
        const isMobile = W < 640
        const counts = isMobile
          ? { back: 12, mid: 16, front: 20 }
          : { back: 30, mid: 40, front: 50 }
        plants = []

        for (let i = 0; i < counts.back; i++) {
          const slotW = W / counts.back
          const x = slotW * i + slotW * 0.5 + rand(-slotW * 0.55, slotW * 0.55)
          const baseY = H * rand(0.55, 0.72)
          const scale = rand(0.45, 0.6)
          plants.push(generatePlant({
            x, baseY, scale,
            palette: GREENS_BACK,
            swayAmplitude: rand(0.03, 0.055),
            swayPhase: rand(0, 1000),
            species: pickWeighted(SPECIES_KEYS, SPECIES_WEIGHTS_BACK),
            layerTone: 'back',
          }))
        }

        for (let i = 0; i < counts.mid; i++) {
          const slotW = W / counts.mid
          const x = slotW * i + slotW * 0.5 + rand(-slotW * 0.65, slotW * 0.65)
          const baseY = H * rand(0.78, 0.94)
          const scale = rand(0.7, 1.0)
          plants.push(generatePlant({
            x, baseY, scale,
            palette: [...GREENS_FRONT, ...GREENS_BACK],
            swayAmplitude: rand(0.045, 0.075),
            swayPhase: rand(0, 1000),
            species: pickWeighted(SPECIES_KEYS, SPECIES_WEIGHTS_MID),
            layerTone: 'mid',
          }))
        }

        for (let i = 0; i < counts.front; i++) {
          const slotW = W / counts.front
          const x = slotW * i + slotW * 0.5 + rand(-slotW * 0.75, slotW * 0.75)
          const baseY = H - rand(-4, 8)
          const scale = rand(1.0, 1.4)
          plants.push(generatePlant({
            x, baseY, scale,
            palette: GREENS_FRONT,
            swayAmplitude: rand(0.06, 0.105),
            swayPhase: rand(0, 1000),
            species: pickWeighted(SPECIES_KEYS, SPECIES_WEIGHTS_FRONT),
            layerTone: 'front',
          }))
        }

        const viewportFactor = Math.min(1.4, H / 220)
        for (const pl of plants) pl.scale *= viewportFactor
      }

      const drawShape = (pts, vNoise, dxAdd, dyAdd, color, alpha) => {
        p.noStroke()
        p.fill(color[0], color[1], color[2], alpha)
        p.beginShape()
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i]
          const n = vNoise[i]
          p.vertex(pt.x + n.dx + dxAdd, pt.y + n.dy + dyAdd)
        }
        p.endShape(p.CLOSE)
      }

      const drawShapeStroke = (pts, vNoise, color, alpha, weight) => {
        p.noFill()
        p.stroke(color[0] * 0.55, color[1] * 0.55, color[2] * 0.55, alpha)
        p.strokeWeight(weight)
        p.beginShape()
        for (let i = 0; i < pts.length; i++) {
          const pt = pts[i]
          const n = vNoise[i]
          p.vertex(pt.x + n.dx, pt.y + n.dy)
        }
        p.endShape(p.CLOSE)
        p.noStroke()
      }

      const drawLeaf = (leaf, toneAlphaMul) => {
        p.push()
        p.translate(leaf.pivot.x, leaf.pivot.y)
        p.rotate(leaf.angle)
        const { shape, color, layers } = leaf
        for (const layer of layers) {
          const c = [
            color[0] + layer.colorDelta[0],
            color[1] + layer.colorDelta[1],
            color[2] + layer.colorDelta[2],
          ]
          drawShape(shape, layer.vNoise, layer.offsetX, layer.offsetY, c, layer.alpha * toneAlphaMul)
        }
        drawShapeStroke(shape, layers[0].vNoise, color, leaf.edgeStroke.alpha * toneAlphaMul, leaf.edgeStroke.weight)
        p.pop()
      }

      const drawStem = (stem, toneAlphaMul) => {
        const { start, end, thickness, color, jitter } = stem
        for (let layer = 0; layer < 3; layer++) {
          p.noFill()
          p.stroke(color[0], color[1], color[2], (55 + layer * 14) * toneAlphaMul)
          p.strokeWeight(thickness + layer * 0.3)
          p.beginShape()
          p.vertex(start.x, start.y)
          for (let i = 0; i < jitter.length; i++) {
            const t = (i + 1) / (jitter.length + 1)
            const lx = start.x + (end.x - start.x) * t + jitter[i].dx
            const ly = start.y + (end.y - start.y) * t + jitter[i].dy
            p.vertex(lx, ly)
          }
          p.vertex(end.x, end.y)
          p.endShape()
        }
        p.noStroke()
      }

      const drawBlob = (blob, toneAlphaMul) => {
        p.push()
        p.translate(blob.pos.x, blob.pos.y)
        const { shape, color, layers, pigmentDot } = blob
        for (const layer of layers) {
          const c = [
            color[0] + layer.colorDelta[0],
            color[1] + layer.colorDelta[1],
            color[2] + layer.colorDelta[2],
          ]
          drawShape(shape, layer.vNoise, layer.offsetX, layer.offsetY, c, layer.alpha * toneAlphaMul)
        }
        p.fill(color[0] * 0.5, color[1] * 0.5, color[2] * 0.5, 30 * toneAlphaMul)
        p.ellipse(pigmentDot.dx, pigmentDot.dy, 1.5, 1.5)
        p.pop()
      }

      const drawWashBands = () => {
        for (const band of washBands) {
          p.push()
          p.translate(band.cx, band.cy)
          for (const layer of band.layers) {
            const c = [
              band.color[0] + layer.colorDelta[0],
              band.color[1] + layer.colorDelta[1],
              band.color[2] + layer.colorDelta[2],
            ]
            drawShape(band.shape, layer.vNoise, layer.offsetX, layer.offsetY, c, layer.alpha * 0.6)
          }
          p.pop()
        }
      }

      const TONE_ALPHA = { back: 0.7, mid: 0.88, front: 1.0 }

      const drawPlant = (plant, t) => {
        const sway = (p.noise(plant.swayPhase + t * 0.00028) - 0.5) * 2 * plant.swayAmplitude
        p.push()
        p.translate(plant.x, plant.baseY)
        p.scale(plant.scale)
        p.rotate(sway)
        const toneMul = TONE_ALPHA[plant.layerTone]
        for (const part of plant.parts) {
          if (part.type === 'stem') drawStem(part, toneMul)
        }
        for (const part of plant.parts) {
          if (part.type === 'leaf') drawLeaf(part, toneMul)
          else if (part.type === 'blob') drawBlob(part, toneMul)
        }
        p.pop()
      }

      p.setup = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        const cnv = p.createCanvas(w, h)
        cnv.parent(container)
        p.frameRate(30)
        p.noStroke()
        reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        generateWashBands()
        generatePlants()
        if (reducedMotion) {
          p.noLoop()
          p.redraw()
        }
      }

      p.draw = () => {
        p.clear()
        drawWashBands()
        const t = p.millis()
        for (const pl of plants) drawPlant(pl, t)
      }

      p.windowResized = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        p.resizeCanvas(w, h)
        generateWashBands()
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
