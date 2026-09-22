// ═══════════════════════════════════════════════
// 📁 src/scraper/femboy-checker.js
// 🎀 أداة فحص - كم أنت Femboy؟
// ═══════════════════════════════════════════════

function cekfemboy(nama, options = {}) {
    try {
        if (!nama) throw new Error('أدخل الاسم أولاً!');
        
        const percent = Math.floor(Math.random() * 101);
        let desc = '';
        let imgUrl = '';
        let level = '';
        
        if (percent < 20) {
            desc = 'رجل جداً! 😎';
            imgUrl = 'https://cek-seberapa-femboy.vercel.app/img/normal.gif';
            level = 'ذكر';
        } else if (percent < 40) {
            desc = 'فيه هالة نعومة شوية~ 🌸';
            imgUrl = 'https://cek-seberapa-femboy.vercel.app/img/dibwh40.gif';
            level = 'لطيف';
        } else if (percent < 60) {
            desc = 'فيمبوي محترم 😘';
            imgUrl = 'https://cek-seberapa-femboy.vercel.app/img/dibwh60.gif';
            level = 'فيمبوي';
        } else if (percent < 80) {
            desc = 'فيمبوي حقيقي 💅✨';
            imgUrl = 'https://cek-seberapa-femboy.vercel.app/img/dibwh80.gif';
            level = 'فيمبوي متقدم';
        } else {
            desc = 'فيمبوي أسطوري 🔥💖';
            imgUrl = 'https://cek-seberapa-femboy.vercel.app/img/femboyyyy.gif';
            level = 'أسطورة';
        }
        
        return {
            status: true,
            nama: nama,
            percent: percent,
            level: level,
            text: `${nama}، أنت ${percent}% فيمبوي! ${desc}`,
            gif: imgUrl,
        };
    } catch (error) {
        return {
            status: false,
            error: error.message,
        };
    }
}

export default cekfemboy;
export { cekfemboy };