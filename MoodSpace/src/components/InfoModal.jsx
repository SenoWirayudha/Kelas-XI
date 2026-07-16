import { X } from 'lucide-react'

function InfoModal({ type, onClose }) {
  if (!type) return null

  return (
    <div className="mood-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="mood-modal landing-info-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <button type="button" className="mood-modal-close" aria-label="Close" onClick={onClose}>
          <X size={18} />
        </button>
        {type === 'privacy' ? <PrivacyContent /> : <TermsContent />}
      </section>
    </div>
  )
}

function PrivacyContent() {
  return (
    <>
      <h2>Kebijakan Privasi Moodspace</h2>
      <p className="landing-info-modal-date">Terakhir diperbarui: 16 Juli 2026</p>
      <div className="landing-info-modal-body">
        <h3>1. Data yang Kami Kumpulkan</h3>
        <p>Kami mengumpulkan informasi akun (nama, email, foto profil), konten yang Anda unggah (gambar, teks, board, project), serta data teknis dasar (log aktivitas, jenis perangkat) untuk keperluan operasional platform.</p>

        <h3>2. Bagaimana Konten Anda Diproses</h3>
        <p>Setiap gambar yang diunggah akan diproses secara otomatis untuk keperluan pencarian dan rekomendasi, meliputi:</p>
        <p>- Analisis visual (embedding) untuk fitur pencarian berbasis kemiripan gambar</p>
        <p>- Ekstraksi teks dari dalam gambar (OCR) untuk keperluan pencarian dan pencocokan entitas</p>
        <p>Proses ini berjalan otomatis di latar belakang dan tidak melibatkan peninjauan manual terhadap konten pribadi Anda, kecuali dilaporkan oleh pengguna lain.</p>

        <h3>3. Layanan Pihak Ketiga</h3>
        <p>Untuk memperkaya hasil pencarian dan eksplorasi, kami menampilkan gambar dari penyedia eksternal seperti Unsplash, Pexels, Pixabay, TMDB, dan sejumlah API gambar lainnya. Penggunaan gambar dari sumber-sumber ini tunduk pada kebijakan privasi dan lisensi masing-masing penyedia.</p>

        <h3>4. Kolaborasi &amp; Berbagi</h3>
        <p>Jika Anda mengundang orang lain untuk berkolaborasi di sebuah project, mereka akan dapat melihat dan mengedit konten pada project tersebut sesuai dengan izin akses yang Anda berikan.</p>

        <h3>5. Laporan &amp; Moderasi</h3>
        <p>Konten yang dilaporkan oleh pengguna akan ditinjau oleh tim moderasi kami melalui panel admin untuk memastikan kepatuhan terhadap ketentuan komunitas.</p>

        <h3>6. Hak Anda</h3>
        <p>Anda dapat mengakses, mengubah, atau menghapus data dan konten Anda kapan saja melalui pengaturan akun. Untuk permintaan penghapusan akun secara menyeluruh, silakan hubungi kami melalui <strong>support@moodspace.app</strong>.</p>

        <h3>7. Keamanan Data</h3>
        <p>Kami menerapkan langkah-langkah teknis dan organisasional yang wajar untuk melindungi data Anda, namun tidak ada sistem yang sepenuhnya kebal terhadap risiko keamanan.</p>

        <h3>8. Perubahan Kebijakan</h3>
        <p>Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan diinformasikan melalui platform.</p>

        <p>Jika ada pertanyaan mengenai kebijakan privasi ini, hubungi kami di <strong>support@moodspace.app</strong>.</p>
      </div>
    </>
  )
}

function TermsContent() {
  return (
    <>
      <h2>Syarat &amp; Ketentuan Moodspace</h2>
      <p className="landing-info-modal-date">Terakhir diperbarui: 16 Juli 2026</p>
      <div className="landing-info-modal-body">
        <h3>1. Penerimaan Ketentuan</h3>
        <p>Dengan menggunakan Moodspace, Anda menyetujui syarat dan ketentuan ini. Jika tidak setuju, mohon untuk tidak menggunakan layanan kami.</p>

        <h3>2. Kepemilikan Konten</h3>
        <p>Anda tetap memegang hak kepemilikan penuh atas konten yang Anda unggah. Dengan mengunggah konten ke platform, Anda memberikan izin non-eksklusif kepada Moodspace untuk menampilkan, memproses, dan mendistribusikan konten tersebut dalam konteks penggunaan platform (misalnya di Feed, pencarian, atau fitur rekomendasi).</p>

        <h3>3. Konten yang Dilarang</h3>
        <p>Pengguna dilarang mengunggah konten yang melanggar hukum, hak cipta pihak lain, mengandung ujaran kebencian, kekerasan, atau materi yang tidak pantas lainnya. Kami berhak menghapus konten dan/atau menangguhkan akun yang melanggar ketentuan ini.</p>

        <h3>4. Penggunaan Aset Eksternal</h3>
        <p>Gambar yang bersumber dari penyedia pihak ketiga (Unsplash, Pexels, Pixabay, TMDB, dll.) tunduk pada lisensi masing-masing penyedia. Pengguna bertanggung jawab untuk memastikan kepatuhan terhadap lisensi tersebut saat menggunakan aset dalam proyek yang dipublikasikan.</p>

        <h3>5. Fitur Kolaborasi</h3>
        <p>Saat mengundang kolaborator ke sebuah project, Anda bertanggung jawab atas siapa yang diberikan akses. Moodspace tidak bertanggung jawab atas penyalahgunaan akses oleh kolaborator yang Anda undang sendiri.</p>

        <h3>6. Pelaporan &amp; Moderasi</h3>
        <p>Kami berhak meninjau dan menindaklanjuti laporan dari pengguna terkait konten atau perilaku yang melanggar ketentuan komunitas, termasuk namun tidak terbatas pada penghapusan konten dan penangguhan akun.</p>

        <h3>7. Penghentian Layanan</h3>
        <p>Kami berhak menangguhkan atau menghentikan akses akun yang terbukti melanggar ketentuan ini, dengan atau tanpa pemberitahuan sebelumnya, tergantung tingkat pelanggaran.</p>

        <h3>8. Batasan Tanggung Jawab</h3>
        <p>Moodspace disediakan &quot;sebagaimana adanya&quot; tanpa jaminan tersurat maupun tersirat. Kami tidak bertanggung jawab atas kehilangan data, kerusakan, atau kerugian yang timbul dari penggunaan layanan.</p>

        <h3>9. Perubahan Ketentuan</h3>
        <p>Ketentuan ini dapat diperbarui sewaktu-waktu. Penggunaan layanan setelah pembaruan berarti Anda menyetujui ketentuan terbaru.</p>

        <p>Jika ada pertanyaan mengenai ketentuan ini, hubungi kami di <strong>support@moodspace.app</strong>.</p>
      </div>
    </>
  )
}

export default InfoModal
