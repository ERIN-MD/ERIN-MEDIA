import { getDatabase } from '../../src/lib/maro-database.js';
import { handleLinkGuard } from '../../src/lib/maro-link-guard.js';

const pluginConfig = {
  name: 'منع_روابط_واتس', alias: ['antilinkgc'], category: 'group',
  description: 'منع روابط واتساب (مجموعات وقنوات وجهات اتصال)',
  usage: '.منع_روابط_واتس <تشغيل/إيقاف/طريقة> [طرد/حذف]', example: '.منع_روابط_واتس تشغيل',
  isOwner: false, isPremium: false, isGroup: true, isPrivate: false, cooldown: 3, energi: 0, isEnabled: true, isAdmin: true, isBotAdmin: true,
};

function handler(m) {
  return handleLinkGuard(m, getDatabase(), { key: 'antilinkgc', title: 'منع روابط واتساب', detected: 'مجموعات واتساب وقنواتها وروابط wa.me' });
}

export { pluginConfig as config, handler };
