export const imageSources = {
  'art-1': 'https://image.tmdb.org/t/p/original/vNrXoT45xscHY6AN4IGf44vHxVJ.jpg',
  'art-2': 'https://i.pinimg.com/736x/50/0e/d6/500ed6835b635bf08c04da3a12f3f1ea.jpg',
  'art-3': 'https://i1-e.pinimg.com/1200x/a4/7b/d4/a47bd47f1fd06ad72da62c7cb1fee1e9.jpg',
  'art-4': 'https://i.pinimg.com/736x/8f/1d/cd/8f1dcdeb0b0b6cdb6f839a85fd0b23b8.jpg',
  'art-5': 'https://i1-e.pinimg.com/1200x/09/84/16/098416a31a9feb3d48d417a1b09156e1.jpg',
  'art-6': 'https://i1-e.pinimg.com/1200x/22/b0/23/22b023d8f325d779c595bf010f450fb3.jpg',
  'project-art-lumina': 'https://i.pinimg.com/736x/2a/a8/fa/2aa8fa97fb4162ba649632e0d2a6e29d.jpg',
  'project-art-concrete': 'https://i.pinimg.com/736x/c2/d1/40/c2d140c405d88a6145cc400555c0da2f.jpg',
  'project-art-chromatic': 'https://i1-e.pinimg.com/1200x/aa/aa/4a/aaaa4a2b48ff05b60d2d97fc99bb5b81.jpg',
  'project-art-noir': 'https://i1-e.pinimg.com/1200x/09/b6/a3/09b6a3912d1b931f7463912d024ed943.jpg',
  'project-art-nexus': 'https://i.pinimg.com/736x/18/af/e1/18afe11b0d2ed4ebe0d72e0f8e5bbd01.jpg',
  'project-art-orbital': 'https://i.pinimg.com/736x/d9/43/82/d943827250dba64271202703d55bbde6.jpg',
}

export function getImageSource(key) {
  return imageSources[key] || key
}
