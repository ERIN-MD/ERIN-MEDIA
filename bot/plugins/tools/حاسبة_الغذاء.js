// حاسبة_الغذاء - أمر لحساب مدة ومقارنة تمويل برنامج الغذاء المجاني

const pluginConfig = {
  name: "حاسبة_الغذاء",
  alias: ["kkmbg"],
  category: "tools",
  description: "حساب مدة ومقارنة تمويل برنامج الغذاء المجاني",
  usage: ".حاسبة_الغذاء <المبلغ>",
  example: ".حاسبة_الغذاء 1000000000",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energi: 1,
  isEnabled: true,
};

function hitungMBG(uang) {
  const pengeluaranPerHari = 319600000000;
  const hargaPorsi = 15000;

  const hariFloat = uang / pengeluaranPerHari;

  const tahun = Math.floor(hariFloat / 365);
  const bulan = Math.floor((hariFloat % 365) / 30);
  const hari = Math.floor(hariFloat % 30);

  const jam = Math.floor((hariFloat % 1) * 24);
  const menit = Math.floor(((hariFloat * 24) % 1) * 60);
  const detik = (((hariFloat * 24 * 60) % 1) * 60);

  const porsi = Math.floor(uang / hargaPorsi);

  const umrDKI = 5400000;
  const umrJateng = 2040000;
  const guruHonorer = 300000;

  const persenDKI = ((uang / umrDKI) * 100).toFixed(1);
  const persenJateng = ((uang / umrJateng) * 100).toFixed(1);
  const kaliGuru = (uang / guruHonorer).toFixed(1);

  const pemain = [
    { nama: "كريستيانو رونالدو (النصر)", gaji: 4500000000000 },
    { nama: "ليونيل ميسي (إنتر ميامي)", gaji: 2100000000000 },
    { nama: "كريم بنزيما (الاتحاد)", gaji: 1700000000000 },
    { nama: "كيليان مبابي (ريال مدريد)", gaji: 1500000000000 },
    { nama: "إرلينج هالاند (مان سيتي)", gaji: 1300000000000 },
    { nama: "فينيسيوس جونيور (ريال مدريد)", gaji: 960000000000 },
    { nama: "محمد صلاح (ليفربول)", gaji: 880000000000 },
    { nama: "ساديو ماني (النصر)", gaji: 864000000000 },
    { nama: "جود بيلينجهام (ريال مدريد)", gaji: 704000000000 },
    { nama: "لامين يامال (برشلونة)", gaji: 688000000000 }
  ];

  const perbandinganPemain = pemain.map(p => {
    const persen = ((uang / p.gaji) * 100);
    return {
      nama: p.nama,
      gaji: p.gaji,
      persen: persen < 0.0001 ? "0%" : persen.toFixed(4) + "%"
    };
  });

  return {
    durasi: {
      tahun,
      bulan,
      hari,
      jam,
      menit,
      detik: detik.toFixed(2)
    },
    pengeluaran: pengeluaranPerHari,
    porsi,
    gajiIndonesia: {
      dki: persenDKI + "%",
      jateng: persenJateng + "%",
      guru: kaliGuru + "×"
    },
    pemain: perbandinganPemain
  };
}

function formatRupiah(angka) {
  const formatted = angka.toLocaleString('ar-EG');
  return angka < 1000 ? `${formatted} فضة` : `${formatted} عملة`;
}

async function handler(m, { args }) {
  if (!args[0]) {
    let txt = `🧮 *حاسبة الغذاء المجاني* 🧮\n\n`;
    txt += `هل تريد معرفة كم من الوقت يمكن لمالك تمويل برنامج الغذاء المجاني في إندونيسيا؟\n\n`;
    txt += `*طريقة الاستخدام:*\n`;
    txt += `👉 \`${m.prefix}حاسبة_الغذاء <المبلغ>\`\n\n`;
    txt += `*مثال:*\n`;
    txt += `\`${m.prefix}حاسبة_الغذاء 1000000000\``;
    return m.reply(txt);
  }

  await m.react("🧮");

  try {
    const uang = Number(args[0].replace(/[^0-9]/g, ''));
    if (isNaN(uang) || uang <= 0) {
      return m.reply("❌ أدخل مبلغاً صحيحاً من المال! (أرقام فقط، مثال: 500000)");
    }

    const data = hitungMBG(uang);

    let contentTxt = `💰 *المبلغ:* ${formatRupiah(uang)}\n\n`;
    contentTxt += `⏳ *مدة تمويل الغذاء:*\n`;
    contentTxt += `${data.durasi.tahun} سنة، ${data.durasi.bulan} شهر، ${data.durasi.hari} يوم\n`;
    contentTxt += `${data.durasi.jam} ساعة، ${data.durasi.menit} دقيقة، ${data.durasi.detik} ثانية\n`;
    contentTxt += `_(بناءً على الإنفاق اليومي ~${(data.pengeluaran / 1000000000).toFixed(1)} مليار/يوم)_\n\n`;
    
    contentTxt += `🍱 *ما يعادل وجبات الطعام:*\n`;
    contentTxt += `${data.porsi.toLocaleString('ar-EG')} وجبة (بـ 15.000 عملة/وجبة)\n\n`;

    contentTxt += `📊 *مقارنة الرواتب في إندونيسيا:*\n`;
    contentTxt += `🏢 الحد الأدنى للأجور جاكرتا (5.4 مليون/شهر): ${data.gajiIndonesia.dki}\n`;
    contentTxt += `🏭 الحد الأدنى للأجور جاوة الوسطى (2.04 مليون/شهر): ${data.gajiIndonesia.jateng}\n`;
    contentTxt += `👨‍🏫 راتب المعلم الفخري (300 ألف/شهر): ${data.gajiIndonesia.guru}\n\n`;

    contentTxt += `⚽ *مقارنة رواتب لاعبي كرة القدم:*\n`;
    for (let p of data.pemain) {
      contentTxt += `🏆 ${p.nama}\n`;
      contentTxt += `💵 ${formatRupiah(p.gaji)}/سنة\n`;
      contentTxt += `📈 النسبة المئوية: ${p.persen}\n\n`;
    }

    let txt = `🍽️ *نتيجة حاسبة الغذاء المجاني* 🍽️\n\n`;
    txt += contentTxt.trim().split("\n").map(line => line.trim() ? `${line}` : ``).join("\n");

    await m.reply(txt);
    await m.react("✅");
  } catch (e) {
    m.reply(`❌ حدث خطأ أثناء الحساب! 😭\nالخطأ: ${e.message}`);
  }
}

export { pluginConfig as config, handler };