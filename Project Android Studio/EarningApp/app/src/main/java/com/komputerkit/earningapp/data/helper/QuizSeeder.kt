package com.komputerkit.earningapp.data.helper

import com.komputerkit.earningapp.data.entity.QuizQuestion

object QuizSeeder {
    
    fun getAllQuestions(): List<QuizQuestion> {
        return listOf(
            // SAINS (categoryId = 1)
            QuizQuestion(categoryId = 1, question = "Apa planet terbesar di tata surya?", optionA = "Mars", optionB = "Jupiter", optionC = "Saturnus", optionD = "Neptunus", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 1, question = "Berapa jumlah kromosom pada manusia normal?", optionA = "23 pasang", optionB = "24 pasang", optionC = "22 pasang", optionD = "25 pasang", correctAnswer = "A", points = 15),
            QuizQuestion(categoryId = 1, question = "Apa gas yang paling banyak di atmosfer bumi?", optionA = "Oksigen", optionB = "Karbon Dioksida", optionC = "Nitrogen", optionD = "Hidrogen", correctAnswer = "C", points = 10),
            QuizQuestion(categoryId = 1, question = "Berapa kecepatan cahaya di ruang hampa?", optionA = "300.000 km/s", optionB = "150.000 km/s", optionC = "450.000 km/s", optionD = "200.000 km/s", correctAnswer = "A", points = 15),
            QuizQuestion(categoryId = 1, question = "Apa simbol kimia untuk emas?", optionA = "Go", optionB = "Au", optionC = "Ag", optionD = "Gd", correctAnswer = "B", points = 10),
            
            // SEJARAH (categoryId = 2)
            QuizQuestion(categoryId = 2, question = "Kapan Indonesia merdeka?", optionA = "17 Agustus 1945", optionB = "17 Agustus 1944", optionC = "17 Agustus 1946", optionD = "17 Agustus 1947", correctAnswer = "A", points = 10),
            QuizQuestion(categoryId = 2, question = "Siapa presiden pertama Indonesia?", optionA = "Soeharto", optionB = "Soekarno", optionC = "Habibie", optionD = "Megawati", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 2, question = "Siapa yang menemukan benua Amerika?", optionA = "Marco Polo", optionB = "Vasco da Gama", optionC = "Christopher Columbus", optionD = "Ferdinand Magellan", correctAnswer = "C", points = 15),
            QuizQuestion(categoryId = 2, question = "Perang Dunia II berakhir tahun?", optionA = "1944", optionB = "1945", optionC = "1946", optionD = "1947", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 2, question = "Candi Borobudur dibangun pada masa kerajaan?", optionA = "Majapahit", optionB = "Sriwijaya", optionC = "Syailendra", optionD = "Mataram Kuno", correctAnswer = "C", points = 15),
            
            // TEKNOLOGI (categoryId = 3)
            QuizQuestion(categoryId = 3, question = "Apa kepanjangan dari HTML?", optionA = "Hyper Text Markup Language", optionB = "High Tech Modern Language", optionC = "Home Tool Markup Language", optionD = "Hyperlinks Text Mark Language", correctAnswer = "A", points = 10),
            QuizQuestion(categoryId = 3, question = "Siapa pendiri Microsoft?", optionA = "Steve Jobs", optionB = "Bill Gates", optionC = "Mark Zuckerberg", optionD = "Elon Musk", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 3, question = "Apa bahasa pemrograman untuk Android?", optionA = "Swift", optionB = "Python", optionC = "Kotlin", optionD = "Ruby", correctAnswer = "C", points = 15),
            QuizQuestion(categoryId = 3, question = "Tahun berapa Google didirikan?", optionA = "1996", optionB = "1998", optionC = "2000", optionD = "2002", correctAnswer = "B", points = 15),
            QuizQuestion(categoryId = 3, question = "Apa singkatan dari CPU?", optionA = "Central Processing Unit", optionB = "Computer Personal Unit", optionC = "Central Program Utility", optionD = "Computer Processing Unit", correctAnswer = "A", points = 10),
            
            // MATEMATIKA (categoryId = 4)
            QuizQuestion(categoryId = 4, question = "Berapa hasil dari 12 x 12?", optionA = "124", optionB = "144", optionC = "154", optionD = "164", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 4, question = "Berapa akar kuadrat dari 81?", optionA = "7", optionB = "8", optionC = "9", optionD = "10", correctAnswer = "C", points = 10),
            QuizQuestion(categoryId = 4, question = "Berapa nilai π (pi) yang paling mendekati?", optionA = "3.14", optionB = "3.12", optionC = "3.16", optionD = "3.18", correctAnswer = "A", points = 10),
            QuizQuestion(categoryId = 4, question = "Jika x + 5 = 12, berapa nilai x?", optionA = "5", optionB = "6", optionC = "7", optionD = "8", correctAnswer = "C", points = 15),
            QuizQuestion(categoryId = 4, question = "Berapa jumlah sudut dalam segitiga?", optionA = "90 derajat", optionB = "180 derajat", optionC = "270 derajat", optionD = "360 derajat", correctAnswer = "B", points = 10),
            
            // BAHASA (categoryId = 5)
            QuizQuestion(categoryId = 5, question = "Apa sinonim dari kata 'cerdas'?", optionA = "Bodoh", optionB = "Pandai", optionC = "Lambat", optionD = "Malas", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 5, question = "Kata 'beautiful' dalam bahasa Indonesia adalah?", optionA = "Cantik", optionB = "Bagus", optionC = "Indah", optionD = "Elok", correctAnswer = "C", points = 10),
            QuizQuestion(categoryId = 5, question = "Apa lawan kata dari 'panas'?", optionA = "Hangat", optionB = "Dingin", optionC = "Sejuk", optionD = "Lembab", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 5, question = "Apa bahasa Inggris dari 'meja'?", optionA = "Chair", optionB = "Table", optionC = "Desk", optionD = "Board", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 5, question = "Kata 'quickly' termasuk jenis kata?", optionA = "Noun", optionB = "Verb", optionC = "Adjective", optionD = "Adverb", correctAnswer = "D", points = 15),
            
            // GEOGRAFI (categoryId = 6)
            QuizQuestion(categoryId = 6, question = "Apa ibukota Indonesia?", optionA = "Bandung", optionB = "Surabaya", optionC = "Jakarta", optionD = "Medan", correctAnswer = "C", points = 10),
            QuizQuestion(categoryId = 6, question = "Gunung tertinggi di dunia adalah?", optionA = "Gunung Kilimanjaro", optionB = "Gunung Everest", optionC = "Gunung Fuji", optionD = "Gunung Rinjani", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 6, question = "Berapa jumlah benua di dunia?", optionA = "5", optionB = "6", optionC = "7", optionD = "8", correctAnswer = "C", points = 10),
            QuizQuestion(categoryId = 6, question = "Sungai terpanjang di dunia adalah?", optionA = "Sungai Amazon", optionB = "Sungai Nil", optionC = "Sungai Yangtze", optionD = "Sungai Mississippi", correctAnswer = "B", points = 15),
            QuizQuestion(categoryId = 6, question = "Negara dengan jumlah penduduk terbanyak?", optionA = "India", optionB = "China", optionC = "Amerika Serikat", optionD = "Indonesia", correctAnswer = "A", points = 15),
            
            // OLAHRAGA (categoryId = 7)
            QuizQuestion(categoryId = 7, question = "Berapa jumlah pemain sepak bola dalam satu tim?", optionA = "10", optionB = "11", optionC = "12", optionD = "13", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 7, question = "Olahraga apa yang menggunakan raket dan shuttlecock?", optionA = "Tenis", optionB = "Badminton", optionC = "Squash", optionD = "Tenis Meja", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 7, question = "Olimpiade musim panas 2024 diadakan di?", optionA = "Tokyo", optionB = "Paris", optionC = "Los Angeles", optionD = "Beijing", correctAnswer = "B", points = 15),
            QuizQuestion(categoryId = 7, question = "Siapa pemain basket legendaris dengan nomor 23?", optionA = "Kobe Bryant", optionB = "LeBron James", optionC = "Michael Jordan", optionD = "Stephen Curry", correctAnswer = "C", points = 15),
            QuizQuestion(categoryId = 7, question = "Berapa set maksimal dalam pertandingan tenis Grand Slam pria?", optionA = "3 set", optionB = "4 set", optionC = "5 set", optionD = "6 set", correctAnswer = "C", points = 15),
            
            // SENI (categoryId = 8)
            QuizQuestion(categoryId = 8, question = "Siapa pelukis terkenal lukisan Mona Lisa?", optionA = "Pablo Picasso", optionB = "Vincent van Gogh", optionC = "Leonardo da Vinci", optionD = "Michelangelo", correctAnswer = "C", points = 15),
            QuizQuestion(categoryId = 8, question = "Alat musik tradisional Jawa yang dipukul adalah?", optionA = "Angklung", optionB = "Gamelan", optionC = "Sasando", optionD = "Kolintang", correctAnswer = "B", points = 10),
            QuizQuestion(categoryId = 8, question = "Berapa warna dalam pelangi?", optionA = "5", optionB = "6", optionC = "7", optionD = "8", correctAnswer = "C", points = 10),
            QuizQuestion(categoryId = 8, question = "Apa nama tarian tradisional Bali yang terkenal?", optionA = "Tari Saman", optionB = "Tari Kecak", optionC = "Tari Piring", optionD = "Tari Jaipong", correctAnswer = "B", points = 15),
            QuizQuestion(categoryId = 8, question = "Museum Louvre berada di negara?", optionA = "Italia", optionB = "Spanyol", optionC = "Prancis", optionD = "Jerman", correctAnswer = "C", points = 15)
        )
    }
}
