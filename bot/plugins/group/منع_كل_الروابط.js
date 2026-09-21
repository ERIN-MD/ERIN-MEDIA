import { getDatabase } from '../../src/lib/maro-database.js';
import { handleLinkGuard } from '../../src/lib/maro-link-guard.js';

const pluginConfig = {
  name: 'منع_كل_الروابط', alias: ['antilinkall'], category: 'group',
  description: 'منع جميع أنواع روابط الإنترنت',
  usage: '.منع_كل_الروابط <تشغيل/إيقاف/طريقة> [طرد/حذف]', example: '.منع_كل_الروابط تشغيل',
  isOwner: false, isPremium: false, isGroup: true, isPrivate: false, cooldown: 3, energi: 0, isEnabled: true, isAdmin: true, isBotAdmin: true,
};

function handler(m) {
  return handleLinkGuard(m, getDatabase(), { key: 'antilinkall', title: 'منع كل الروابط', detected: 'http وhttps وwww والروابط المختصرة وامتدادات النطاقات' });
}

export { pluginConfig as config, handler };
