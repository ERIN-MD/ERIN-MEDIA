# فحص محدود لنقاط النهاية ذات الأولوية

> أُرسلت طلبات GET عامة فقط بلا مفاتيح أو معرّفات مستخدم أو تنزيل ملفات أو استدعاءات تحويل. يُقرأ أول 2KB كحد أقصى لأغراض التحقق من البنية.

| المصدر | الملف/الملفات | HTTP | نوع المحتوى | زمن (ms) | بنية مختصرة أو خطأ |
|---|---|---:|---|---:|---|
| waifu-slap | `plugins/fun/صفع.js` | غير متاح | — | 319 | ENOTFOUND |
| maro-api | `plugins/canvas + plugins/sticker` | غير متاح | — | 51 | EAI_AGAIN |
| zenzxz-api | `plugins/canvas/avatarjpg.js` | غير متاح | — | 4075 | EAI_AGAIN |
| snowping-api | `plugins/ai/سنوai.js + plugins/tools` | غير متاح | — | 346 | EAI_AGAIN |
| ilovepin | `src/scraper/pindl.js` | غير متاح | — | 534 | EAI_AGAIN |
| redvid | `src/scraper/reddit.js` | 200 | text/html; charset=UTF-8 | 3182 | نص مختصر: <!DOCTYPE html><html lang="en"><head> <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fi |
| brat-quoted | `plugins/sticker/qc.js` | 200 | text/html; charset=utf-8 | 6184 | نص مختصر: </script><!DOCTYPE html> <html lang="en" class="dark"> <head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, init |
| gimita-cdn | `plugins/group/ترحيب.js + plugins/group/وداع.js` | 530 | text/html; charset=UTF-8 | 2507 | نص مختصر: <!doctype html> <!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US"> <![endif]--> <!--[if IE 7]> <html class="no-js ie7 oldie" lang |
| denay-qr | `plugins/tools/qr.js` | 530 | text/html; charset=UTF-8 | 2815 | نص مختصر: <!doctype html> <!--[if lt IE 7]> <html class="no-js ie6 oldie" lang="en-US"> <![endif]--> <!--[if IE 7]> <html class="no-js ie7 oldie" lang |

## الاستنتاج

المصادر التي لا تستجيب تقنياً أو لا تعطي البنية المتوقعة تُعامل كمصادر تحتاج استبدالاً أو fallback؛ أما الاستجابة الناجحة هنا فلا تثبت نجاح تدفقات التحويل أو التنزيل الفعلية.
