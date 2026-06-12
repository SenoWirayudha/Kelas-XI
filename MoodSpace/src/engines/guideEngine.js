export const uniqueGuides = (guides) => guides.filter((guide, index, allGuides) => (
  allGuides.findIndex((candidate) => (
    candidate.axis === guide.axis &&
    candidate.value === guide.value &&
    candidate.type === guide.type
  )) === index
))
