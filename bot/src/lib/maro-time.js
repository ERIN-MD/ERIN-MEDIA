import moment from 'moment-timezone'

const TIMEZONE = 'Africa/Cairo'
moment.locale('ar')

// ═══════════════════════════════════════════════
// دوال الوقت الأساسية
// ═══════════════════════════════════════════════

function now() {
    return moment.tz(TIMEZONE)
}

function formatTime(format = 'HH:mm:ss') {
    return moment.tz(TIMEZONE).format(format)
}

function formatDate(format = 'DD-MM-YYYY') {
    return moment.tz(TIMEZONE).format(format)
}

function formatDateTime(format = 'DD-MM-YYYY HH:mm:ss') {
    return moment.tz(TIMEZONE).format(format)
}

function formatFull(format = 'dddd, DD MMMM YYYY HH:mm:ss') {
    return moment.tz(TIMEZONE).format(format)
}

function getHour() {
    return parseInt(moment.tz(TIMEZONE).format('HH'), 10)
}

function getMinute() {
    return parseInt(moment.tz(TIMEZONE).format('mm'), 10)
}

function getCurrentTimeString() {
    return moment.tz(TIMEZONE).format('HH:mm')
}

function fromTimestamp(timestamp, format = 'DD-MM-YYYY HH:mm:ss') {
    return moment(timestamp).tz(TIMEZONE).format(format)
}

function getLocalDateObject() {
    return moment.tz(TIMEZONE).toDate()
}

// ═══════════════════════════════════════════════
// دوال الوقت النسبي (Relative Time)
// ═══════════════════════════════════════════════

function timeAgo(timestamp) {
    return moment(timestamp).tz(TIMEZONE).fromNow()
}

function timeUntil(timestamp) {
    return moment(timestamp).tz(TIMEZONE).toNow()
}

function duration(ms) {
    const d = moment.duration(ms)
    const days = Math.floor(d.asDays())
    const hours = d.hours()
    const minutes = d.minutes()
    const seconds = d.seconds()
    let result = ''
    if (days > 0) result += `${days} يوم `
    if (hours > 0) result += `${hours} ساعة `
    if (minutes > 0) result += `${minutes} دقيقة `
    if (seconds > 0) result += `${seconds} ثانية`
    return result.trim() || '0 ثانية'
}

// ═══════════════════════════════════════════════
// دوال التحقق والصلاحية
// ═══════════════════════════════════════════════

function isExpired(timestamp, durationMs) {
    return moment().tz(TIMEZONE).diff(moment(timestamp), 'ms') > durationMs
}

function getDaysBetween(start, end) {
    return moment(end).tz(TIMEZONE).diff(moment(start).tz(TIMEZONE), 'days')
}

function isToday(timestamp) {
    return moment(timestamp).tz(TIMEZONE).isSame(moment.tz(TIMEZONE), 'day')
}

function isYesterday(timestamp) {
    return moment(timestamp).tz(TIMEZONE).isSame(moment.tz(TIMEZONE).subtract(1, 'day'), 'day')
}

function getRemainingDays(timestamp) {
    const nowDate = moment.tz(TIMEZONE)
    const end = moment(timestamp).tz(TIMEZONE)
    return end.diff(nowDate, 'days')
}

// ═══════════════════════════════════════════════
// دوال مناسبة للبوت
// ═══════════════════════════════════════════════

function getGreeting(name = '') {
    const hour = getHour()
    if (hour >= 5 && hour < 12) return `صباح الخير ${name} ☀️`
    if (hour >= 12 && hour < 15) return `ظهر الخير ${name} 🌤️`
    if (hour >= 15 && hour < 18) return `مساء الخير ${name} 🌅`
    return `مساء الخير ${name} 🌙`
}

function getTimeEmoji() {
    const hour = getHour()
    if (hour >= 5 && hour < 8) return '🌅'
    if (hour >= 8 && hour < 12) return '☀️'
    if (hour >= 12 && hour < 15) return '🌤️'
    if (hour >= 15 && hour < 18) return '🌅'
    if (hour >= 18 && hour < 21) return '🌙'
    return '🌑'
}

// ═══════════════════════════════════════════════
// دوال التنسيق المتقدمة
// ═══════════════════════════════════════════════

function formatRupiah(amount) {
    return 'Rp ' + amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatNumber(amount) {
    if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + 'M'
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'Jt'
    if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K'
    return amount.toString()
}

function getDayName(date = null) {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const d = date ? moment(date).tz(TIMEZONE) : now()
    return days[d.day()]
}

function getMonthName(date = null) {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const d = date ? moment(date).tz(TIMEZONE) : now()
    return months[d.month()]
}

// ═══════════════════════════════════════════════
// دوال الكولدون والمؤقتات
// ═══════════════════════════════════════════════

function getCooldownRemaining(lastUsed, cooldownSeconds) {
    const elapsed = moment.tz(TIMEZONE).diff(moment(lastUsed).tz(TIMEZONE), 'seconds')
    const remaining = cooldownSeconds - elapsed
    return remaining > 0 ? remaining : 0
}

function formatCooldown(seconds) {
    if (seconds <= 0) return 'جاهز ✅'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    let result = ''
    if (h > 0) result += `${h}س `
    if (m > 0) result += `${m}د `
    if (s > 0) result += `${s}ث`
    return result.trim()
}

function addTime(amount, unit = 'minutes') {
    return moment.tz(TIMEZONE).add(amount, unit).toDate()
}

// ═══════════════════════════════════════════════
// دوال عمر الحساب وإعادة التعيين
// ═══════════════════════════════════════════════

function getAccountAge(createdAt) {
    const nowDate = moment.tz(TIMEZONE)
    const created = moment(createdAt).tz(TIMEZONE)
    const days = nowDate.diff(created, 'days')
    if (days < 1) return 'أقل من يوم'
    if (days < 30) return `${days} يوم`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} شهر`
    const years = Math.floor(days / 365)
    return `${years} سنة`
}

function getNextResetTime(resetHour = 0) {
    let reset = moment.tz(TIMEZONE).hour(resetHour).minute(0).second(0)
    if (reset.isBefore(moment.tz(TIMEZONE))) {
        reset.add(1, 'day')
    }
    return reset
}

// ═══════════════════════════════════════════════
// دوال إضافية مفيدة
// ═══════════════════════════════════════════════

function getSeason() {
    const month = parseInt(moment.tz(TIMEZONE).format('M'), 10)
    if (month >= 3 && month <= 5) return 'الربيع 🌸'
    if (month >= 6 && month <= 8) return 'الصيف ☀️'
    if (month >= 9 && month <= 11) return 'الخريف 🍂'
    return 'الشتاء ❄️'
}

function getRamadanStatus() {
    // يمكن تعديله حسب التقويم الهجري
    const nowDate = moment.tz(TIMEZONE)
    const month = nowDate.month() + 1
    const day = nowDate.date()
    // مثال تقريبي - يحتاج تحديث سنوي
    return false
}

function getUptimeFormatted(startTime) {
    const ms = moment.tz(TIMEZONE).diff(moment(startTime))
    return duration(ms)
}

// ═══════════════════════════════════════════════
// تصدير جميع الدوال
// ═══════════════════════════════════════════════

export {
    // الأساسية
    now, formatTime, formatDate, formatDateTime, formatFull,
    getHour, getMinute, getCurrentTimeString, fromTimestamp, getLocalDateObject,
    // الوقت النسبي
    timeAgo, timeUntil, duration,
    // التحقق والصلاحية
    isExpired, getDaysBetween, isToday, isYesterday, getRemainingDays,
    // مناسبة للبوت
    getGreeting, getTimeEmoji,
    // التنسيق المتقدم
    formatRupiah, formatNumber, getDayName, getMonthName,
    // الكولدون والمؤقتات
    getCooldownRemaining, formatCooldown, addTime,
    // عمر الحساب وإعادة التعيين
    getAccountAge, getNextResetTime,
    // إضافية
    getSeason, getRamadanStatus, getUptimeFormatted,
    TIMEZONE
}