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

const WHEAT_GOLD = [
  [188, 168, 95],
  [205, 185, 110],
  [165, 145, 75],
]

const FOXGLOVE_PINK = [
  [225, 165, 195],
  [205, 145, 175],
  [240, 185, 210],
]
const FOXGLOVE_PURPLE = [
  [180, 125, 195],
  [160, 105, 175],
]

const IRIS_PURPLE = [
  [125, 90, 165],
  [105, 75, 145],
  [145, 110, 185],
]
const IRIS_YELLOW = [
  [225, 175, 65],
  [205, 155, 50],
]
const IRIS_ACCENT = [220, 175, 65]

const BEAN_POD_GREEN = [
  [110, 145, 70],
  [125, 160, 85],
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

const teardropShape = (length, width, steps = 14) => {
  // Wide near pivot, narrows to point at far end. Used for strawberries.
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = length * t
    let w
    if (t < 0.25) {
      w = width * (0.55 + 0.45 * (t / 0.25))
    } else {
      const t2 = (t - 0.25) / 0.75
      w = width * (1 - t2 * t2 * 0.95)
    }
    pts.push({ x, y: -w * 0.5 })
  }
  for (let i = steps - 1; i >= 0; i--) {
    const t = i / steps
    const x = length * t
    let w
    if (t < 0.25) {
      w = width * (0.55 + 0.45 * (t / 0.25))
    } else {
      const t2 = (t - 0.25) / 0.75
      w = width * (1 - t2 * t2 * 0.95)
    }
    pts.push({ x, y: w * 0.5 })
  }
  return pts
}

const bladeShape = (length, width, steps = 8) => {
  // Grass blade: wider at base, pointed at tip. Drawn as filled silhouette.
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = length * t
    const w = width * (1 - t * 0.92)
    pts.push({ x, y: -w })
  }
  for (let i = steps - 1; i >= 0; i--) {
    const t = i / steps
    const x = length * t
    const w = width * (1 - t * 0.92)
    pts.push({ x, y: w })
  }
  return pts
}

const bellShape = (height, mouthWidth, steps = 12) => {
  // Trumpet/bell: attachment at (0,0), flared mouth at y=height. Hangs in +y direction.
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const profile = Math.pow(t, 1.3)
    pts.push({ x: mouthWidth * 0.5 * profile, y: height * t })
  }
  // flared rim curls outward at the bottom
  pts.push({ x: mouthWidth * 0.45, y: height * 1.06 })
  pts.push({ x: 0, y: height * 1.12 })
  pts.push({ x: -mouthWidth * 0.45, y: height * 1.06 })
  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    const profile = Math.pow(t, 1.3)
    pts.push({ x: -mouthWidth * 0.5 * profile, y: height * t })
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

const buildGrassLong = (palette) => {
  const parts = []
  const blades = 9 + Math.floor(rand(0, 4))
  const spread = rand(28, 44)
  const clusterCurve = rand(-3.5, 3.5)
  for (let i = 0; i < blades; i++) {
    const offX = (i - blades / 2) * (spread / blades) + rand(-3, 3)
    const h = rand(60, 110)
    const tipDrift = clusterCurve * 1.5 + rand(-5, 5)
    const curveAmount = clusterCurve + rand(-2, 2)
    parts.push(newCurvedStem({ x: offX, y: 0 }, { x: offX + tipDrift, y: -h }, rand(1.3, 2.0), randPick(palette), curveAmount, 6))
  }
  // mix in a few filled lance leaves (broader leafy shapes among the blades)
  const leafies = 3 + Math.floor(rand(0, 4))
  for (let i = 0; i < leafies; i++) {
    const offX = rand(-spread * 0.5, spread * 0.5)
    const h = rand(35, 75)
    const wid = rand(2.5, 4.5)
    const tilt = rand(-0.45, 0.45)
    const shape = lanceShape(h, wid, 1.4)
    parts.push(newLeaf({
      pivot: { x: offX, y: 0 },
      angle: -Math.PI / 2 + tilt,
      shape,
      color: randPick(palette),
      layers: 3,
      edgeAmp: 1.0,
    }))
  }
  return parts
}

const buildGrassTuft = (palette) => {
  // Short, tightly clustered pointed blades — filled triangular silhouettes.
  const parts = []
  const blades = 10 + Math.floor(rand(0, 8))
  const spread = rand(14, 24)
  const tallest = rand(36, 62)
  for (let i = 0; i < blades; i++) {
    const offX = (i - blades / 2) * (spread / blades) + rand(-1.5, 1.5)
    const h = tallest * rand(0.5, 1.0)
    const wid = rand(1.5, 2.4)
    const tilt = rand(-0.32, 0.32)
    const shape = bladeShape(h, wid)
    parts.push(newLeaf({
      pivot: { x: offX, y: 0 },
      angle: -Math.PI / 2 + tilt,
      shape,
      color: randPick(palette),
      layers: 3,
      edgeAmp: 0.9,
    }))
  }
  return parts
}

const buildGrassFan = (palette) => {
  // Medium fountain-like clump: wider blades fanning outward.
  const parts = []
  const blades = 5 + Math.floor(rand(0, 4))
  const spread = rand(18, 30)
  const tallest = rand(45, 75)
  for (let i = 0; i < blades; i++) {
    const offX = (i - blades / 2) * (spread / blades) + rand(-2, 2)
    const t = blades > 1 ? (i + 0.5) / blades : 0.5
    const tilt = (t - 0.5) * 0.95 + rand(-0.18, 0.18)
    const h = tallest * rand(0.7, 1.0)
    const wid = rand(2.0, 3.2)
    const shape = bladeShape(h, wid)
    parts.push(newLeaf({
      pivot: { x: offX, y: 0 },
      angle: -Math.PI / 2 + tilt,
      shape,
      color: randPick(palette),
      layers: 3,
      edgeAmp: 1.0,
    }))
  }
  // mix in 2-3 broader lance leaves between blades
  const leafies = 2 + Math.floor(rand(0, 2))
  for (let i = 0; i < leafies; i++) {
    const offX = rand(-spread * 0.5, spread * 0.5)
    const h = rand(28, 55)
    const wid = rand(3, 5)
    const tilt = rand(-0.35, 0.35)
    const shape = lanceShape(h, wid, 1.2)
    parts.push(newLeaf({
      pivot: { x: offX, y: 0 },
      angle: -Math.PI / 2 + tilt,
      shape,
      color: randPick(palette),
      layers: 3,
      edgeAmp: 1.0,
    }))
  }
  return parts
}

const buildGrass = (palette) => {
  const r = Math.random()
  if (r < 0.32) return buildGrassTuft(palette)
  if (r < 0.58) return buildGrassFan(palette)
  return buildGrassLong(palette)
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
      const r = rand(4, 6)
      parts.push(newBlob({ x: fx, y: fy }, r, r * rand(0.9, 1.05), randPick(TOMATO_RED), 5, 1.4))
      // green calyx — small pointed leaves at top of fruit
      const calyxColor = randPick(palette)
      for (let cn = 0; cn < 4; cn++) {
        const cAng = -Math.PI / 2 + (cn - 1.5) * 0.45
        const cShape = lanceShape(rand(2.5, 4), 0.8, 1.7)
        parts.push(newLeaf({
          pivot: { x: fx, y: fy - r * 0.85 },
          angle: cAng,
          shape: cShape,
          color: calyxColor,
          layers: 2,
          edgeAmp: 0.6,
        }))
      }
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
  const fR = rand(10, 14)
  parts.push(newBlob({ x: fx, y: fy }, fR, fR * 0.85, randPick(PUMPKIN_ORANGE), 6, 2.0))
  // ribs — curved darker arcs across the fruit
  const ribCount = 3
  const ribColor = [165, 90, 30]
  for (let r = 0; r < ribCount; r++) {
    const tFrac = (r + 1) / (ribCount + 1)
    const ribX = fx + (tFrac - 0.5) * fR * 1.3
    const startY = fy - fR * 0.78
    const endY = fy + fR * 0.78
    const ribCurve = (tFrac - 0.5) * fR * 0.6
    parts.push(newCurvedStem(
      { x: ribX, y: startY },
      { x: ribX, y: endY },
      1.0,
      ribColor,
      ribCurve,
      5,
    ))
  }
  // brown stem nub on top
  parts.push(newBlob({ x: fx + rand(-1.5, 1.5), y: fy - fR * 0.95 }, 1.4, 2.2, [115, 80, 38], 4, 0.7))
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
  // 1-2 berries — teardrop shape with calyx and seeds
  const berries = 1 + Math.floor(rand(0, 2))
  for (let b = 0; b < berries; b++) {
    const fx = rand(-8, 8)
    const fy = rand(-8, -2)
    const bSize = rand(8, 11)
    const bWid = bSize * rand(0.85, 1.0)
    const shape = teardropShape(bSize, bWid)
    const berryColor = randPick(STRAWBERRY_RED)
    parts.push(newLeaf({
      pivot: { x: fx, y: fy },
      angle: Math.PI / 2 + rand(-0.15, 0.15),
      shape,
      color: berryColor,
      layers: 5,
      edgeAmp: 1.3,
    }))
    // seed dots on the berry surface
    for (let s = 0; s < 6; s++) {
      const sx = fx + rand(-bWid * 0.35, bWid * 0.35)
      const sy = fy + rand(bSize * 0.1, bSize * 0.75)
      parts.push(newBlob({ x: sx, y: sy }, 0.55, 0.55, [200, 175, 80], 2, 0.4))
    }
    // green calyx — 5 small pointed shapes radiating from top of berry
    for (let cn = 0; cn < 5; cn++) {
      const cAng = -Math.PI / 2 + (cn - 2) * 0.42
      const cShape = lanceShape(rand(3, 4.5), 0.9, 1.7)
      parts.push(newLeaf({
        pivot: { x: fx, y: fy },
        angle: cAng,
        shape: cShape,
        color: main,
        layers: 2,
        edgeAmp: 0.6,
      }))
    }
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

const buildWheat = (palette) => {
  const parts = []
  const stemH = rand(95, 130)
  const main = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-2, 2), y: -stemH }, 1.0, main, 5))
  // narrow basal leaves
  for (let i = 0; i < 2; i++) {
    const y = -stemH * (0.18 + i * 0.14)
    const lShape = lanceShape(rand(15, 22), rand(1.2, 1.8), 1.6)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: i % 2 === 0 ? 0.3 : Math.PI - 0.3, shape: lShape, color: main, layers: 3, edgeAmp: 1.2 }))
  }
  // herringbone seed pairs along the upper stem
  const seedStart = -stemH * 0.55
  const seedEnd = -stemH - 4
  const pairs = 9 + Math.floor(rand(0, 4))
  for (let i = 0; i < pairs; i++) {
    const t = pairs > 1 ? i / (pairs - 1) : 0
    const y = seedStart + (seedEnd - seedStart) * t
    const seedShape = lanceShape(rand(5, 8), rand(1.4, 2), 1.5)
    const goldColor = randPick(WHEAT_GOLD)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: -Math.PI / 2 - 0.32, shape: seedShape, color: goldColor, layers: 3, edgeAmp: 1.0 }))
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: -Math.PI / 2 + 0.32, shape: seedShape, color: goldColor, layers: 3, edgeAmp: 1.0 }))
  }
  // tip
  const tipShape = lanceShape(8, 1.6, 1.6)
  parts.push(newLeaf({ pivot: { x: 0, y: -stemH }, angle: -Math.PI / 2, shape: tipShape, color: randPick(WHEAT_GOLD), layers: 3, edgeAmp: 1.0 }))
  return parts
}

const buildFoxglove = (palette) => {
  const parts = []
  const stemH = rand(110, 145)
  const main = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-2, 2), y: -stemH }, 1.5, main, 6))
  // basal leaves
  for (let i = 0; i < 2; i++) {
    const y = -stemH * (0.15 + i * 0.1)
    const lShape = lanceShape(rand(13, 18), rand(4, 6), 0.9)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: i % 2 === 0 ? 0.4 : Math.PI - 0.4, shape: lShape, color: main, layers: 3, edgeAmp: 1.4 }))
  }
  // bells alternate along upper stem
  const bellColors = Math.random() < 0.55 ? FOXGLOVE_PINK : FOXGLOVE_PURPLE
  const bells = 5 + Math.floor(rand(0, 3))
  const sideBias = Math.random() < 0.5 ? -1 : 1
  for (let i = 0; i < bells; i++) {
    const t = i / Math.max(1, bells - 1)
    const y = -stemH * (0.45 + t * 0.5)
    const bH = rand(9, 13) * (1 - t * 0.25)
    const bW = bH * rand(0.7, 0.9)
    const shape = bellShape(bH, bW)
    const sd = i % 2 === 0 ? sideBias : -sideBias
    const tilt = sd * (0.25 + rand(-0.1, 0.1))
    parts.push(newLeaf({ pivot: { x: sd * 2, y }, angle: tilt, shape, color: randPick(bellColors), layers: 4, edgeAmp: 1.3 }))
  }
  return parts
}

const buildIris = (palette) => {
  const parts = []
  const stemH = rand(80, 110)
  const main = randPick(palette)
  // fan of 4–6 sword leaves rising from base
  const swords = 4 + Math.floor(rand(0, 3))
  for (let i = 0; i < swords; i++) {
    const t = (i + 0.5) / swords
    const ang = -Math.PI / 2 + (t - 0.5) * Math.PI * 0.65
    const len = rand(50, 75)
    const wid = rand(2.6, 4)
    const shape = lanceShape(len, wid, 1.4)
    parts.push(newLeaf({ pivot: { x: rand(-2, 2), y: 0 }, angle: ang, shape, color: main, layers: 3, edgeAmp: 1.3 }))
  }
  // central stem
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-2, 2), y: -stemH }, 1.4, main, 5))
  const cy = -stemH
  const flowerPalette = Math.random() < 0.7 ? IRIS_PURPLE : IRIS_YELLOW
  // 3 drooping outer petals — wider lance shapes pointing down/out
  for (let i = 0; i < 3; i++) {
    const ang = Math.PI / 2 + (i - 1) * 0.55
    const shape = lanceShape(rand(11, 15), rand(4.5, 6), 0.8)
    parts.push(newLeaf({ pivot: { x: 0, y: cy }, angle: ang, shape, color: randPick(flowerPalette), layers: 4, edgeAmp: 1.6 }))
  }
  // 3 upright inner petals — narrower, pointing up
  for (let i = 0; i < 3; i++) {
    const ang = -Math.PI / 2 + (i - 1) * 0.4
    const shape = lanceShape(rand(7, 10), rand(3, 4), 1.0)
    parts.push(newLeaf({ pivot: { x: 0, y: cy }, angle: ang, shape, color: randPick(flowerPalette), layers: 4, edgeAmp: 1.4 }))
  }
  parts.push(newBlob({ x: 0, y: cy }, 2, 2.5, IRIS_ACCENT, 4, 1.0))
  return parts
}

const buildBeanPole = (palette) => {
  const parts = []
  const stemH = rand(105, 140)
  const main = randPick(palette)
  parts.push(newStem({ x: 0, y: 0 }, { x: rand(-3, 3), y: -stemH }, 1.5, main, 6))
  // broad oval leaves up the stem
  const leafNodes = 3 + Math.floor(rand(0, 2))
  for (let i = 1; i <= leafNodes; i++) {
    const t = i / (leafNodes + 1)
    const y = -stemH * t
    const side = i % 2 === 0 ? -1 : 1
    const shape = lanceShape(rand(11, 15), rand(5.5, 7.5), 0.85)
    parts.push(newLeaf({ pivot: { x: 0, y }, angle: side > 0 ? -0.1 : Math.PI + 0.1, shape, color: main, layers: 4, edgeAmp: 1.6 }))
  }
  // long thin pods hanging down
  const pods = 3 + Math.floor(rand(0, 3))
  for (let i = 0; i < pods; i++) {
    const t = rand(0.4, 0.85)
    const y = -stemH * t
    const x = rand(-7, 7)
    const podLen = rand(20, 32)
    const podWid = rand(1.8, 2.6)
    const shape = lanceShape(podLen, podWid, 0.9)
    parts.push(newLeaf({ pivot: { x, y }, angle: Math.PI / 2 + rand(-0.18, 0.18), shape, color: randPick(BEAN_POD_GREEN), layers: 4, edgeAmp: 1.3 }))
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
  wheat: buildWheat,
  foxglove: buildFoxglove,
  iris: buildIris,
  beanpole: buildBeanPole,
}

const SPECIES_KEYS = ['grass', 'poppy', 'coneflower', 'lupine', 'daisy', 'sunflower', 'tomato', 'pumpkin', 'strawberry', 'pepper', 'wheat', 'foxglove', 'iris', 'beanpole']
// Front: emphasize varied silhouettes (spikes, bells, fans, pods) over radial flowers.
const SPECIES_WEIGHTS_FRONT = [0.13, 0.06, 0.05, 0.07, 0.05, 0.06, 0.10, 0.08, 0.07, 0.07, 0.06, 0.07, 0.06, 0.07]
const SPECIES_WEIGHTS_MID   = [0.20, 0.07, 0.06, 0.10, 0.06, 0.05, 0.07, 0.04, 0.05, 0.05, 0.07, 0.06, 0.06, 0.06]
const SPECIES_WEIGHTS_BACK  = [0.40, 0.07, 0.06, 0.08, 0.06, 0.03, 0.03, 0.02, 0.02, 0.02, 0.10, 0.05, 0.03, 0.03]

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
          ? { back: 18, mid: 24, front: 32 }
          : { back: 46, mid: 62, front: 78 }
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

      const boost = (v, mul) => Math.max(0, Math.min(255, v * mul))

      const drawLeaf = (leaf, toneAlphaMul, brightMul) => {
        p.push()
        p.translate(leaf.pivot.x, leaf.pivot.y)
        p.rotate(leaf.angle)
        const { shape, color, layers } = leaf
        for (const layer of layers) {
          const c = [
            boost(color[0], brightMul) + layer.colorDelta[0],
            boost(color[1], brightMul) + layer.colorDelta[1],
            boost(color[2], brightMul) + layer.colorDelta[2],
          ]
          drawShape(shape, layer.vNoise, layer.offsetX, layer.offsetY, c, layer.alpha * toneAlphaMul)
        }
        drawShapeStroke(shape, layers[0].vNoise, color, leaf.edgeStroke.alpha * toneAlphaMul, leaf.edgeStroke.weight)
        p.pop()
      }

      const drawStem = (stem, toneAlphaMul, brightMul) => {
        const { start, end, thickness, color, jitter } = stem
        for (let layer = 0; layer < 3; layer++) {
          p.noFill()
          p.stroke(boost(color[0], brightMul), boost(color[1], brightMul), boost(color[2], brightMul), (55 + layer * 14) * toneAlphaMul)
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

      const drawBlob = (blob, toneAlphaMul, brightMul) => {
        p.push()
        p.translate(blob.pos.x, blob.pos.y)
        const { shape, color, layers, pigmentDot } = blob
        for (const layer of layers) {
          const c = [
            boost(color[0], brightMul) + layer.colorDelta[0],
            boost(color[1], brightMul) + layer.colorDelta[1],
            boost(color[2], brightMul) + layer.colorDelta[2],
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
      const BRIGHTNESS = { back: 0.92, mid: 1.0, front: 1.14 }

      const drawPlant = (plant, t) => {
        const sway = (p.noise(plant.swayPhase + t * 0.00028) - 0.5) * 2 * plant.swayAmplitude
        p.push()
        p.translate(plant.x, plant.baseY)
        p.scale(plant.scale)
        p.rotate(sway)
        const toneMul = TONE_ALPHA[plant.layerTone]
        const brightMul = BRIGHTNESS[plant.layerTone]
        for (const part of plant.parts) {
          if (part.type === 'stem') drawStem(part, toneMul, brightMul)
        }
        for (const part of plant.parts) {
          if (part.type === 'leaf') drawLeaf(part, toneMul, brightMul)
          else if (part.type === 'blob') drawBlob(part, toneMul, brightMul)
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
