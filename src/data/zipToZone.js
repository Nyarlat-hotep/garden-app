// USDA Plant Hardiness Zone lookup keyed by 3-digit US ZIP prefix.
// Approximate per-state representative zone — coarse but offline and deterministic.
// Source: USDA 2023 Plant Hardiness Zone Map, condensed to the most common zone
// within each prefix band. Plants will use this to filter "growable in my area".

const ZIP_ZONE_RANGES = [
  // [startPrefix, endPrefix, zone]
  [10, 27, '6a'],    // Massachusetts
  [28, 29, '7a'],    // Rhode Island
  [30, 38, '5b'],    // New Hampshire
  [39, 49, '5a'],    // Maine
  [50, 59, '4b'],    // Vermont
  [60, 69, '6b'],    // Connecticut
  [70, 85, '6b'],    // New Jersey — north
  [86, 89, '7a'],    // New Jersey — south
  [100, 119, '7a'],  // New York — NYC and Long Island
  [120, 149, '5b'],  // New York — upstate
  [150, 196, '6a'],  // Pennsylvania
  [197, 199, '7a'],  // Delaware
  [200, 205, '7b'],  // District of Columbia
  [206, 219, '7a'],  // Maryland
  [220, 246, '7a'],  // Virginia
  [247, 268, '6a'],  // West Virginia
  [270, 289, '7b'],  // North Carolina
  [290, 299, '8a'],  // South Carolina
  [300, 319, '8a'],  // Georgia
  [320, 349, '9b'],  // Florida
  [350, 369, '8a'],  // Alabama
  [370, 385, '7a'],  // Tennessee
  [386, 397, '8a'],  // Mississippi
  [400, 427, '6b'],  // Kentucky
  [430, 459, '6a'],  // Ohio
  [460, 479, '6a'],  // Indiana
  [480, 499, '5b'],  // Michigan
  [500, 528, '5a'],  // Iowa
  [530, 549, '5a'],  // Wisconsin
  [550, 567, '4a'],  // Minnesota
  [570, 577, '4a'],  // South Dakota
  [580, 588, '3b'],  // North Dakota
  [590, 599, '4b'],  // Montana
  [600, 629, '6a'],  // Illinois
  [630, 658, '6b'],  // Missouri
  [660, 679, '6b'],  // Kansas
  [680, 693, '5a'],  // Nebraska
  [700, 714, '9a'],  // Louisiana
  [716, 729, '7b'],  // Arkansas
  [730, 749, '7a'],  // Oklahoma
  [750, 799, '8b'],  // Texas
  [800, 816, '5b'],  // Colorado
  [820, 831, '4b'],  // Wyoming
  [832, 838, '5b'],  // Idaho
  [840, 847, '6b'],  // Utah
  [850, 865, '9a'],  // Arizona
  [870, 884, '7a'],  // New Mexico
  [889, 898, '7a'],  // Nevada
  [900, 928, '10a'], // California — south
  [930, 961, '9a'],  // California — north and central
  [967, 968, '12a'], // Hawaii
  [970, 979, '8b'],  // Oregon
  [980, 994, '8a'],  // Washington
  [995, 999, '4b'],  // Alaska (Anchorage area; interior is colder)
]

export function getZoneForZipPrefix(prefixStr) {
  const n = parseInt(prefixStr, 10)
  if (Number.isNaN(n)) return null
  for (const [start, end, zone] of ZIP_ZONE_RANGES) {
    if (n >= start && n <= end) return zone
  }
  return null
}
