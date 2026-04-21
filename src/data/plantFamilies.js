// Common name keywords → plant family for rotation tracking
export const PLANT_FAMILIES = {
  // Solanaceae (nightshades)
  tomato: 'Solanaceae', pepper: 'Solanaceae', eggplant: 'Solanaceae',
  potato: 'Solanaceae', tomatillo: 'Solanaceae',
  // Brassicaceae (brassicas)
  cabbage: 'Brassicaceae', broccoli: 'Brassicaceae', cauliflower: 'Brassicaceae',
  kale: 'Brassicaceae', brussels: 'Brassicaceae', kohlrabi: 'Brassicaceae',
  radish: 'Brassicaceae', turnip: 'Brassicaceae', arugula: 'Brassicaceae',
  // Cucurbitaceae (cucurbits)
  cucumber: 'Cucurbitaceae', squash: 'Cucurbitaceae', zucchini: 'Cucurbitaceae',
  pumpkin: 'Cucurbitaceae', melon: 'Cucurbitaceae', watermelon: 'Cucurbitaceae',
  // Fabaceae (legumes)
  bean: 'Fabaceae', pea: 'Fabaceae', lentil: 'Fabaceae',
  soybean: 'Fabaceae', peanut: 'Fabaceae', chickpea: 'Fabaceae',
  // Apiaceae (umbellifers)
  carrot: 'Apiaceae', parsnip: 'Apiaceae', celery: 'Apiaceae',
  fennel: 'Apiaceae', dill: 'Apiaceae', parsley: 'Apiaceae', cilantro: 'Apiaceae',
  // Alliaceae
  onion: 'Alliaceae', garlic: 'Alliaceae', leek: 'Alliaceae', chive: 'Alliaceae',
  // Asteraceae (composites)
  lettuce: 'Asteraceae', endive: 'Asteraceae', artichoke: 'Asteraceae',
  sunflower: 'Asteraceae', chicory: 'Asteraceae',
  // Lamiaceae (mints)
  basil: 'Lamiaceae', mint: 'Lamiaceae', oregano: 'Lamiaceae',
  thyme: 'Lamiaceae', rosemary: 'Lamiaceae', sage: 'Lamiaceae',
  // Chenopodiaceae (goosefoots)
  spinach: 'Chenopodiaceae', beet: 'Chenopodiaceae', chard: 'Chenopodiaceae',
  // Poaceae (grasses/grains)
  corn: 'Poaceae', wheat: 'Poaceae',
}

export function detectFamily(name) {
  if (!name) return null
  const lower = name.toLowerCase()
  for (const [keyword, family] of Object.entries(PLANT_FAMILIES)) {
    if (lower.includes(keyword)) return family
  }
  return null
}
