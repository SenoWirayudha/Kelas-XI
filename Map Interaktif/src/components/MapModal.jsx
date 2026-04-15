import { useEffect, useState } from 'react'
import './MapModal.css'

const REGION_MODAL_DATA = {
  sidoarjo: {
    description:
      'Kawasan pusat Kota Sidoarjo dengan aktivitas pemerintahan, ekonomi, dan ruang publik yang ramai dikunjungi masyarakat setiap hari.',
    carouselImages: [
      '/Gambar Kecamatan/Kec Sidoarjo.jpg',
      '/Sidoarjo.jpg',
      '/Alun-alun Sidoarjo.jpg'
    ],
    destinations: [
      {
        name: 'Alun-Alun Sidoarjo',
        location: 'Kec. Sidoarjo, Kabupaten Sidoarjo, Jawa Timur',
        image:
          '/Alun-alun Sidoarjo.jpg',
      },
      {
        name: 'Suncity Waterpark Sidoarjo',
        location: 'Jl. Pahlawan No.1, Rw6, Sidokumpul, Kec. Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61212',
        image:
          '/Suncity WP.jpeg',
      },
      {
        name: 'Kampoeng Batik Jetis',
        location: 'Jalan P. Diponegoro, Lemah Putro, Lemahputro, Kec. Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61213',
        image:
          '/Kampoeng.jpg',
      },
      {
        name: 'Puspa Lebo',
        location: 'GMX8+WPP, Jl. Raya Lebo No.48, Lebo, Kec. Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61223',
        image:
          '/Puspa Lebo.jpg',
      },
      {
        name: 'Kolam Renang GOR Sidoarjo',
        location: 'Jl. Pahlawan No.200, Wismasarinadi, Magersari, Kec. Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61212',
        image:
          '/Kolam Gor.jpg',
      },
      {
        name: 'WonderZone Sidoarjo',
        location: 'Jl. Diponegoro No.2, Rw5, Sidokumpul, Kec. Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61212',
        image:
          '/wonderzone.webp',
      },
    ],
    transportation: [
      {
        name: 'Stasiun Sidoarjo',
        type: 'Stasiun Kereta',
        description: 'Jl. Stasiun, Lemah Putro, Lemahputro, Kec. Sidoarjo, Kabupaten Sidoarjo, Jawa Timur 61213',
        image: '/St Sidoarjo.jpg',
      },
    ],
  },
  buduran: {
    description:
      'wilayah strategis di Kabupaten Sidoarjo, Jawa Timur, yang berfungsi sebagai penyangga antara pusat kota Sidoarjo dan Surabaya. Terdiri dari 15 desa, wilayah ini didominasi kawasan permukiman, industri kecil/menengah, serta jalur arteri dan kereta api yang aktif. Pelayanan publik seperti KTP/KK tersedia melalui hotline resmi.',
    carouselImages: [
      'Gambar Kecamatan/Buduran.png',
      '/Mpu.jpg',
      '/Buduran.jpg',
    ],
    destinations: [
      {
        name: 'Museum Mpu Tantular',
        location: 'Buduran, Sidoarjo',
        image:
          '/Mpu.jpg',
      },
      {
        name: 'Taman Abhirama',
        location: 'Buduran, Sidoarjo',
        image:
          '/Abirama.webp'
      },
      {
        name: 'Delta Fishing',
        location: 'Jl. Mbah Sholeh No.1, Prasungtambak, Prasung, Kec. Buduran, Kabupaten Sidoarjo, Jawa Timur 61252',
        image:
          '/delta fishing.jpeg',
      },
    ],
  },
  porong: {
    description:
      'salah satu kecamatan di Kabupaten Sidoarjo, Jawa Timur, yang terletak sekitar 12 km selatan Kota Sidoarjo. Wilayah strategis ini berbatasan dengan Kabupaten Pasuruan, serta menjadi jalur perlintasan utama. Porong dikenal dengan Sungai Porong, sentra industri rumahan seperti Kampung Wisata Panci di Desa Kebakalan, dan terdampak fenomena Lumpur Lapindo.',
    carouselImages: [
      'Gambar Kecamatan/Porong.png',
      '/Lumpur Lapindo 2.jpg',
      '/Candi Pari.jpg',
    ],
    destinations: [
      {
        name: 'Lumpur Lapindo',
        location: 'Porong, Sidoarjo',
        image:
          '/Lumpur Lapindo 2.jpg',
      },
      {
        name: 'Candi Pari',
        location: 'Jl. Kartini, Candipari Wetan, Candipari, Kec. Porong, Kabupaten Sidoarjo, Jawa Timur 61274',
        image:
          '/Candi Pari.jpg',
      },
    ],
    transportation: [
      {
        name: 'Stasiun Porong',
        type: 'Stasiun Kereta',
        description: 'Jl. Jenggolo, Mindi, Kec. Porong, Kabupaten Sidoarjo, Jawa Timur 61274',
        image: '/St Porong.jpg',
      },
    ],
  },
  jabon: {
    description:
      'Sebuah kecamatan di Kabupaten Sidoarjo, Jawa Timur, dan sejenis pohon kayu cepat tumbuh (Anthocephalus cadamba). Kecamatan Jabon (Sidoarjo) berbatasan dengan Pasuruan, sementara pohon Jabon adalah komoditas andalan industri perkayuan karena tumbuh cepat dan lurus.',
    carouselImages: [
      'Gambar Kecamatan/Jabon.png',
      'Gambar Kecamatan/Jabon 2.png',
      '/bahari tlocor.jpg',
      '/pulau lusi.jpg',
    ],
    destinations: [
      {
        name: 'Wisata Bahari Tlocor',
        location: 'Kupang, Kec. Jabon, Kabupaten Sidoarjo, Jawa Timur 61276',
        image:
          '/bahari tlocor.jpg',
      },
      {
        name: 'Pulau Lusi',
        location: 'Kec. Jabon, Kabupaten Sidoarjo',
        image:
          '/pulau lusi.jpg',
      },
    ],
    transportation: [
    ],
  },
  sedati: {
    description:
      'wilayah strategis di Kabupaten Sidoarjo, Jawa Timur (kode pos 61253), yang menaungi Bandara Internasional Juanda. Terkenal dengan kawasan pesisir, Sedati memiliki potensi wisata bahari, kuliner, dan menjadi area pengembangan investasi. Wilayah ini terdiri dari 16 desa, termasuk Sedati Gede, Betro, dan Cemandi.',
    carouselImages: [
      'Gambar Kecamatan/Sedati.png',
    ],
    destinations: [
      {
        name: 'Pasar Albatros',
        location: 'JQ96+HGM, Manyar, Sedati Agung, Kec. Sedati, Kabupaten Sidoarjo, Jawa Timur 61253',
        image:
          '/Albatros.webp',
      },
    ],
    transportation: [
      {
        name: 'Bandar Udara Internasional Juanda',
        type: 'Bandar Udara',
        description: 'Parkir Area Inap, Kepuh, Betro, Kec. Sedati, Kabupaten Sidoarjo, Jawa Timur 61253',
        image: '/Juanda.jpg',
      },
    ],
  },
  waru: {
    description:
      'wilayah strategis di Kabupaten Sidoarjo, Jawa Timur, yang berbatasan langsung dengan Kota Surabaya dan merupakan pusat industri serta transportasi penting. Wilayah ini dikenal sebagai gerbang selatan Surabaya, menampung Terminal Purabaya (Terminal Bungurasih), dan memiliki 17 desa/kelurahan dengan pusat pemerintahan di Desa Janti.',
    carouselImages: [
      'Gambar Kecamatan/Waru 1.png',
      'Gambar Kecamatan/Waru 2.png',
      '/Stasiun_Waru.jpg',
    ],
    destinations: [
      {
        name: 'Pondok Tjandra Indah Sports Club',
        location: 'Jl. Taman Asri Selatan No.48, Tambaksari, Tambakrejo, Kec. Waru, Kabupaten Sidoarjo, Jawa Timur 61256',
        image:
          '/Sport Waru.webp',
      },
    ],
    transportation: [
      {
        name: 'Stasiun Waru',
        type: 'Stasiun Kereta',
        description: 'Jl. Raya Waru, Kedungrejo, Kec. Waru, Kabupaten Sidoarjo, Jawa Timur 61256',
        image: '/Stasiun_Waru.jpg',
      },
      {
        name: 'Terminal Bungurasih (Purabaya)',
        type: 'Terminal Bus',
        description: 'Kasian, Jl. Bungurasih Timur No.31, Kasian, Bungurasih, Kec. Waru, Kabupaten Sidoarjo, Jawa Timur 61256',
        image: '/Tm Bungur.jpg',
      },
    ],
  },
  gedangan: {
    description:
      'salah satu kecamatan di Kabupaten Sidoarjo, Jawa Timur, yang dikenal sebagai kawasan industri logam dan kerajinan topi (Desa Punggul). Terletak strategis berbatasan dengan Waru dan Buduran, wilayah ini sering mengalami kemacetan lalu lintas akibat perempatan kereta api. Kantor kecamatan berlokasi di Jl. Sukodono No. 1, Keboansikep.',
    carouselImages: [
      '/Gedangan.jpg',
    ],
    destinations: [
    ],
    transportation: [
      {
        name: 'Stasiun Gedangan',
        type: 'Stasiun Kereta',
        description: 'JL. Stasiun, No. 1, Gedangan, 61257, Indonesia, Jawa Timur 61254',
        image: '/St Gedangan.jpg',
      }
    ],
  },
  taman: {
    description:
      'salah satu kecamatan strategis di Kabupaten Sidoarjo, Jawa Timur, yang berbatasan langsung dengan Surabaya dan Gresik. Kawasan ini merupakan jalur utama penghubung antar wilayah. Ibu kota kecamatan ini dikenal sebagai Sepanjang.',
    carouselImages: [
      
    ],
    destinations: [
      {
        name: 'Citra Harmoni Waterpark',
        location: 'Perumahan Citra Harmoni Km. 20 Jl. Raya Trosobo Bringin Bendo, Jl. Citra Harmoni Blk. I1, Trosobo, Kec. Taman, Kabupaten Sidoarjo, Jawa Timur 61257',
        image:
          '/CitraHarmoni.webp',
      },
    ],
    transportation: [
      {
        name: 'Stasiun Sepanjang',
        type: 'Stasiun Kereta',
        description: 'Jl. Raya St., Wonocolo, Kec. Taman, Kabupaten Sidoarjo, Jawa Timur 61257',
        image: '/St Sepanjang.jpg',
      }
    ],
  },
  sukodono: {
    description:
      'Salah satu kecamatan di Kabupaten Sidoarjo, Provinsi Jawa Timur, yang berbatasan dengan Taman, Gedangan, Buduran, dan Sidoarjo. Wilayah ini terkenal dengan komoditas pertanian dan UMKM.',
    carouselImages: [
      '/Sukodono.jpg',
    ],
    destinations: [
      {
        name: 'Loka Asri Park',
        location: 'Jl. Raya Suko Legok, Dusun Legok, Suko, Kec. Sukodono, Kabupaten Sidoarjo, Jawa Timur 61258',
        image:
          '/Loka Asri.jpg',
      },
    ],
    transportation: [],
  },
  krian: {
    description:
      'salah satu kecamatan strategis di Kabupaten Sidoarjo, Jawa Timur, yang berfungsi sebagai pusat perdagangan dan jalur transportasi utama (jalur lintas selatan dan kereta api). Terletak 20 km barat daya Surabaya, Krian terdiri dari 22 desa/kelurahan dengan wilayah industri dan pemukiman yang padat. ',
    carouselImages: [
      
    ],
    destinations: [
      {
        name: 'Kraton Waterpark',
        location: 'Perumahan Kraton Superblock, Jl. Bypass Krian No.KM. 30, Sidomukti, Kraton, Kec. Krian, Kabupaten Sidoarjo, Jawa Timur 61262',
        image:
          '/Kraton.jpeg',
      },
    ],
    transportation: [
      {
        name: 'Stasiun Krian',
        type: 'Stasiun Kereta',
        description: 'Krian, Kec. Krian, Kabupaten Sidoarjo, Jawa Timur 61262',
        image: '/St Krian.jpg',
      },
    ],
  },
  balongbendo: {
    description:
      'salah satu kecamatan di ujung barat Kabupaten Sidoarjo, Jawa Timur, yang berbatasan langsung dengan Kabupaten Gresik dan Mojokerto. Kecamatan ini terdiri dari 20 desa, dilalui jalan negara, dan terletak sekitar 26 km dari pusat kota Sidoarjo',
    carouselImages: [
      '/Balongbendo.jpg',
    ],
    destinations: [
    ],
    transportation: [],
  },
  tarik: {
    description:
      'salah satu kecamatan di Kabupaten Sidoarjo, Provinsi Jawa Timur, yang berbatasan langsung dengan Mojokerto. Terkenal sebagai wilayah pertanian dengan luas sekitar 3.603,51 Ha, Tarik dilalui jalur kereta api utama selatan Jawa dan didukung industri besar seperti PT Tjiwi Kimia.',
    carouselImages: [
    ],
    destinations: [
      
    ],
    transportation: [
      {
      name: 'Stasiun Kedinding',
      type: 'Stasiun Kereta',
      description: 'Kedinding, Kec. Tarik, Kabupaten Sidoarjo, Jawa Timur 61264',
      image: '/St Kedinding.jpg',
      },
    ],
  },
  prambon: {
    description:
      'salah satu kecamatan di Kabupaten Sidoarjo, Jawa Timur, dengan pusat pemerintahan di Desa Prambon. Wilayah ini berbatasan langsung dengan Kabupaten Mojokerto dan memiliki pelayanan publik berprestasi dengan nilai IPP 4,15 (kategori Sangat Baik). Prambon merupakan wilayah administratif penting dengan berbagai desa. ',
    carouselImages: [
    ],
    destinations: [
      {
        name: 'Alas Prambon',
        location: 'GH7P+FG, Jl. Kates, Ngingas, Simpang, Kec. Prambon, Kabupaten Sidoarjo, Jawa Timur 61264',
        image:
          '/Prambon.webp',
      },
      {
        name: 'Kolam Renang Jedong Cangkring',
        location: 'Jl. Kh Amin, RT.16/RW.04, Gempol, Jedongcangkring, Kec. Prambon, Kabupaten Sidoarjo, Jawa Timur 61264',
        image:
          '/JC.webp',
      },
    ],
    transportation: [],
  },
  krembung: {
    description:
      'salah satu dari 18 kecamatan di Kabupaten Sidoarjo, Jawa Timur, dengan kode pos 61275. Wilayah ini berbatasan dengan Tulangan (utara), Porong (timur), Kabupaten Mojokerto (selatan), dan Prambon (barat). Kantor Kecamatan Krembung berlokasi di Jl. Raya Krembung No. 06, menyediakan layanan administrasi pada hari Senin-Kamis (08.00-15.00) dan Jumat (08.00-13.00).',
    carouselImages: [
    
    ],
    destinations: [
      // {
      //   name: 'Kawasan Industri Krembung',
      //   location: 'Kec. Krembung, Kabupaten Sidoarjo, Jawa Timur',
      //   image:
      //     '/placeholder-krembung.jpg',
      // },
    ],
    transportation: [],
  },
  tanggulangin: {
    description:
      'salah satu kecamatan di Kabupaten Sidoarjo, Jawa Timur, yang terletak sekitar 9 km selatan pusat kota Sidoarjo. Terkenal sebagai pusat industri kerajinan kulit (tas dan koper), wilayah ini berbatasan dengan Porong dan Candi, serta terdiri dari 19 desa/kelurahan seperti Kalitengah, Kludan, dan Kedensari.',
    carouselImages: [
      '/Tas Tanggulangin.jpg',
      '/St Tanggulangin.jpg',
    ],
    destinations: [
      {
        name: 'Pusgitta (Pusat Tas Grosir Tanggulangin)',
        location: 'Jl. Raya Kludan No.31A, Kludan, Kec. Tanggulangin, Kabupaten Sidoarjo, Jawa Timur 61272',
        image:
          '/Tas Tanggulangin.jpg',
      },
    ],
    transportation: [
      {
        name: 'Stasiun Tanggulangin',
        type: 'Stasiun Kereta',
        description: 'Jl. Raya Tanggulangin No.25, Kedunganten, Kalitengah, Kec. Tanggulangin, Kabupaten Sidoarjo, Jawa Timur 61272',
        image: '/St Tanggulangin.jpg',
      },
    ],
  },
  candi: {
    description:
      'salah satu kecamatan di Kabupaten Sidoarjo, Jawa Timur, dengan luas wilayah 40,67 km². Terletak strategis di selatan kota Sidoarjo, kecamatan ini berbatasan dengan Kecamatan Sidoarjo (utara), Selat Madura (timur), Tanggulangin (selatan), dan Tulangan (barat), serta menjadi pusat industri dan perumahan. Kantor Kec. Candi berlokasi di Jl. Moch. Ridwan No.1.',
    carouselImages: [
      '/placeholder-candi.jpg',
    ],
    destinations: [
      {
        name: 'Candi Dermo',
        location: 'Kec. Candi, Kabupaten Sidoarjo, Jawa Timur',
        image:
          '/placeholder-candi.jpg',
      },
    ],
    transportation: [],
  },
  tulangan: {
    description:
      'salah satu kecamatan di Kabupaten Sidoarjo, Jawa Timur, dengan pusat pemerintahan di Desa Tulangan. Wilayah ini memiliki 22 desa, berbatasan dengan Wonoayu, Krembung, Tanggulangin, dan Prambon. Kecamatan ini berjarak sekitar 17 km dari ibukota Kabupaten Sidoarjo dan memiliki populasi lebih dari 78.000 jiwa.',
    carouselImages: [
      '/St Tulangan.jpg',
    ],
    destinations: [
      // {
      //   name: 'Wisata Peternakan Tulangan',
      //   location: 'Kec. Tulangan, Kabupaten Sidoarjo, Jawa Timur',
      //   image:
      //     '/placeholder-tulangan.jpg',
      // },
    ],
    transportation: [
      {
        name: 'Stasiun Tulangan',
        type: 'Stasiun Kereta',
        description: 'Jl. Raya Tanggulangin No.25, Kedunganten, Kalitengah, Kec. Tanggulangin, Kabupaten Sidoarjo, Jawa Timur 61272',
        image: '/St Tulangan.jpg',
      },
    ],
  },
  wonoayu: {
    description:
      'kecamatan di Kabupaten Sidoarjo, Jawa Timur, yang terletak strategis di jalur provinsi. Wilayah ini terdiri dari beberapa desa, dengan pusat pemerintahan di Jalan Raya Wonoayu No. 83, serta berkembang menjadi area hunian dengan banyaknya pilihan rumah dijual. Pelayanan publik, termasuk administrasi kependudukan, tersedia di kantor kecamatan.',
    carouselImages: [
      '/placeholder-wonoayu.jpg',
    ],
    destinations: [
      {
        name: 'Candi Dermo',
        location: 'Dusun Candidermo, RT.04/RW.03, Candi Dermo, Candinegoro, Kec. Wonoayu, Kabupaten Sidoarjo, Jawa Timur 61261',
        image:
          '/candi dermo.jpeg',
      },
    ],
    transportation: [],
  },
}

function MapModal({ open, onClose, regionName }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImageSet, setFailedImageSet] = useState(new Set())
  const modalData =
    REGION_MODAL_DATA[regionName?.toLowerCase()] || REGION_MODAL_DATA.sidoarjo
  const { destinations, description, transportation } = modalData

  const validCarouselImages = (modalData.carouselImages || [])
    .filter((src) => typeof src === 'string' && src.trim() !== '')
    .filter((src) => !failedImageSet.has(src))

  const imageCount = validCarouselImages.length
  const canSlide = imageCount > 1

  const hasDestinations = destinations && destinations.length > 0
  const hasTransportation = transportation && transportation.length > 0

  useEffect(() => {
    if (!open || !canSlide) {
      return
    }

    const intervalId = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % imageCount)
    }, 3500)

    return () => clearInterval(intervalId)
  }, [open, canSlide, imageCount])

  useEffect(() => {
    // Reset failed image cache and active slide when region changes/open toggles.
    setFailedImageSet(new Set())
    setActiveIndex(0)
  }, [regionName, open])

  useEffect(() => {
    if (activeIndex >= imageCount) {
      setActiveIndex(0)
    }
  }, [activeIndex, imageCount])

  if (!open) {
    return null
  }

  const goToPrev = () => {
    if (!canSlide) {
      return
    }

    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? imageCount - 1 : prevIndex - 1,
    )
  }

  const goToNext = () => {
    if (!canSlide) {
      return
    }

    setActiveIndex((prevIndex) => (prevIndex + 1) % imageCount)
  }

  const handleCarouselImageError = (src) => {
    setFailedImageSet((prev) => {
      const next = new Set(prev)
      next.add(src)
      return next
    })
  }

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div
        className="map-modal-root"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Informasi ${regionName}`}
      >
        <header className="map-modal-header">
          <h2>{regionName}</h2>
          <button type="button" className="map-modal-close" onClick={onClose}>
            x
          </button>
        </header>

        <div className="map-modal-content">
          <section className="carousel-section">
            <div className="carousel-stage">
              {imageCount === 0 ? (
                <div className="carousel-empty">{regionName}</div>
              ) : (
                validCarouselImages.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt={`${regionName} slide ${index + 1}`}
                    className={`carousel-image ${index === activeIndex ? 'active' : ''} ${!canSlide ? 'no-transition' : ''}`}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={() => handleCarouselImageError(src)}
                  />
                ))
              )}

              {canSlide && (
                <>
                  <button type="button" className="carousel-arrow left" onClick={goToPrev}>
                    ‹
                  </button>
                  <button type="button" className="carousel-arrow right" onClick={goToNext}>
                    ›
                  </button>
                </>
              )}
            </div>

            {canSlide && (
              <div className="carousel-dots">
                {validCarouselImages.map((_, index) => (
                  <button
                    key={`dot-${index + 1}`}
                    type="button"
                    className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="region-info-section">
            <p>{description}</p>
          </section>

          {hasDestinations && (
            <section className="destination-section">
              <h3>Destinasi Wisata</h3>
              <div className="destination-scroll">
                {destinations.map((destination) => (
                  <article key={destination.name} className="destination-card">
                    <img src={destination.image} alt={destination.name} />
                    <div>
                      <strong>{destination.name}</strong>
                      <p>{destination.location}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {hasTransportation && (
            <section className="transportation-section">
              <h3>Transportasi</h3>
              <div className="transportation-scroll">
                {transportation.map((transport) => (
                  <article key={transport.name} className="transportation-card">
                    <img src={transport.image} alt={transport.name} />
                    <div>
                      <strong>{transport.name}</strong>
                      <p className="transport-type">{transport.type}</p>
                      <p>{transport.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default MapModal
