import axios from 'axios' // مكتبة الطلبات
import NodeCache from 'node-cache' // نظام التخزين المؤقت

// ═══════════════════════════════════════════════
// 🕌 API مواقيت الصلاة - Aladhan API (عربي)
// ═══════════════════════════════════════════════
const BASE_URL = 'https://api.aladhan.com/v1';
const DEFAULT_COUNTRY = 'Egypt'; // الدولة الافتراضية: مصر
const METHOD = 5; // طريقة الحساب: 5 = الهيئة المصرية العامة للمساحة
const cache = new NodeCache({ stdTTL: 86400 }); // تخزين مؤقت 24 ساعة

// ═══════════════════════════════════════════════
// 🔍 البحث عن مدينة
// ═══════════════════════════════════════════════
async function searchKota(query, country = DEFAULT_COUNTRY) {
    const key = `kota_${query.toLowerCase()}_${country}`;
    const cached = cache.get(key);
    if (cached) return cached;

    try {
        const url = `${BASE_URL}/calendarByAddress?address=${encodeURIComponent(query + ', ' + country)}&method=${METHOD}&month=6&year=2025`;
        const { data } = await axios.get(url, { timeout: 15000 });

        if (data?.code === 200) {
            const result = {
                id: query.toLowerCase().replace(/\s+/g, '_'),
                lokasi: query,
                country: country,
            };
            cache.set(key, result);
            return result;
        }
        return null;
    } catch (error) {
        console.error('[SholatAPI] فشل البحث عن المدينة:', error.message);
        return null;
    }
}

// ═══════════════════════════════════════════════
// 📋 جلب جميع المدن (غير مدعوم في Aladhan - نرجع قائمة محلية)
// ═══════════════════════════════════════════════
async function fetchAllKota() {
    // قائمة المدن العربية الشائعة
    const defaultCities = [
        { id: 'cairo', lokasi: 'القاهرة' },
        { id: 'alexandria', lokasi: 'الإسكندرية' },
        { id: 'giza', lokasi: 'الجيزة' },
        { id: 'mansoura', lokasi: 'المنصورة' },
        { id: 'tanta', lokasi: 'طنطا' },
        { id: 'assiut', lokasi: 'أسيوط' },
        { id: 'suez', lokasi: 'السويس' },
        { id: 'port_said', lokasi: 'بورسعيد' },
        { id: 'luxor', lokasi: 'الأقصر' },
        { id: 'aswan', lokasi: 'أسوان' },
        { id: 'mecca', lokasi: 'مكة المكرمة' },
        { id: 'medina', lokasi: 'المدينة المنورة' },
        { id: 'riyadh', lokasi: 'الرياض' },
        { id: 'jeddah', lokasi: 'جدة' },
        { id: 'dubai', lokasi: 'دبي' },
        { id: 'abu_dhabi', lokasi: 'أبو ظبي' },
        { id: 'doha', lokasi: 'الدوحة' },
        { id: 'kuwait', lokasi: 'الكويت' },
        { id: 'muscat', lokasi: 'مسقط' },
        { id: 'amman', lokasi: 'عمان' },
        { id: 'baghdad', lokasi: 'بغداد' },
        { id: 'khartoum', lokasi: 'الخرطوم' },
        { id: 'tunis', lokasi: 'تونس' },
        { id: 'algiers', lokasi: 'الجزائر' },
        { id: 'rabat', lokasi: 'الرباط' },
        { id: 'casablanca', lokasi: 'الدار البيضاء' },
    ];
    return defaultCities;
}

// ═══════════════════════════════════════════════
// 📅 جلب جدول الصلاة اليومي
// ═══════════════════════════════════════════════
async function getTodaySchedule(kotaId, country = DEFAULT_COUNTRY) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const cityName = kotaId.replace(/_/g, ' ');
    const key = `jadwal_${kotaId}_${year}_${month}_${day}`;
    const cached = cache.get(key);
    if (cached) return cached;

    try {
        const url = `${BASE_URL}/calendarByAddress?address=${encodeURIComponent(cityName + ', ' + country)}&method=${METHOD}&month=${month}&year=${year}`;
        const { data } = await axios.get(url, { timeout: 15000 });

        if (data?.code === 200 && data.data) {
            const todayData = data.data[day - 1];
            if (todayData) {
                cache.set(key, todayData);
                return todayData;
            }
        }
        throw new Error('لم يتم العثور على بيانات اليوم');
    } catch (error) {
        console.error('[SholatAPI] فشل جلب جدول الصلاة:', error.message);
        throw new Error('فشل جلب جدول الصلاة');
    }
}

// ═══════════════════════════════════════════════
// 🕐 استخراج أوقات الصلاة
// ═══════════════════════════════════════════════
function extractPrayerTimes(jadwalData) {
    if (!jadwalData || !jadwalData.timings) {
        return {
            imsak: '-',
            subuh: '-',
            terbit: '-',
            dhuha: '-',
            dzuhur: '-',
            ashar: '-',
            maghrib: '-',
            isya: '-',
        };
    }

    const t = jadwalData.timings;

    return {
        imsak: t.Imsak ? t.Imsak.substring(0, 5) : '-',
        subuh: t.Fajr ? t.Fajr.substring(0, 5) : '-',
        terbit: t.Sunrise ? t.Sunrise.substring(0, 5) : '-',
        dhuha: t.Sunrise ? addMinutes(t.Sunrise.substring(0, 5), 30) : '-',
        dzuhur: t.Dhuhr ? t.Dhuhr.substring(0, 5) : '-',
        ashar: t.Asr ? t.Asr.substring(0, 5) : '-',
        maghrib: t.Maghrib ? t.Maghrib.substring(0, 5) : '-',
        isya: t.Isha ? t.Isha.substring(0, 5) : '-',
    };
}

// ═══════════════════════════════════════════════
// 🛠️ دوال مساعدة
// ═══════════════════════════════════════════════

/** إضافة دقائق إلى وقت */
function addMinutes(time, minutes) {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/** مسح التخزين المؤقت */
function clearCache() {
    cache.flushAll();
}

// ═══════════════════════════════════════════════
// 📤 تصدير الدوال
// ═══════════════════════════════════════════════
export {
    searchKota,      // البحث عن مدينة
    fetchAllKota,    // جلب كل المدن
    getTodaySchedule, // جدول اليوم
    extractPrayerTimes, // استخراج الأوقات
    clearCache,      // مسح المؤقت
};