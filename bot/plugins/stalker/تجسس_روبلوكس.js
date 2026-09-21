// تجسس_روبلوكس - أمر للتجسس على حسابات روبلوكس

import config from "../../config.js";
import te from "../../src/lib/maro-error.js";

const pluginConfig = {
  name: "تجسس_روبلوكس",
  alias: ["robloxstalk"],
  category: "stalker",
  description: "التجسس على حساب روبلوكس عبر اسم المستخدم",
  usage: ".تجسس_روبلوكس <اسم_المستخدم>",
  example: ".تجسس_روبلوكس Linkmon99",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energi: 1,
  isEnabled: true,
};

async function Roblox(username) {
  const search = await fetch(
    `https://users.roblox.com/v1/users/search?keyword=${username}&limit=10`,
  );
  const searchJson = await search.json();

  if (!searchJson.data || !searchJson.data.length) {
    return { error: "المستخدم غير موجود" };
  }

  const user = searchJson.data[0];
  const userId = user.id;

  const [
    detail,
    avatar,
    followers,
    following,
    friends,
    groups,
    games,
    badges,
    inventory,
  ] = await Promise.all([
    fetch(`https://users.roblox.com/v1/users/${userId}`).then((r) => r.json()),
    fetch(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`,
    ).then((r) => r.json()),
    fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`).then(
      (r) => r.json(),
    ),
    fetch(
      `https://friends.roblox.com/v1/users/${userId}/followings/count`,
    ).then((r) => r.json()),
    fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`).then(
      (r) => r.json(),
    ),
    fetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`).then(
      (r) => r.json(),
    ),
    fetch(`https://games.roblox.com/v2/users/${userId}/games?limit=50`).then(
      (r) => r.json(),
    ),
    fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=50`).then(
      (r) => r.json(),
    ),
    fetch(
      `https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=50`,
    )
      .then((r) => r.json())
      .catch(() => null),
  ]);

  let presence = null;
  try {
    const pres = await fetch(`https://presence.roblox.com/v1/presence/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: [userId] }),
    });
    const presJson = await pres.json();
    presence = presJson.userPresences?.[0] || null;
  } catch {}

  return {
    id: detail.id,
    username: detail.name,
    displayName: detail.displayName,
    description: detail.description,
    created: detail.created,
    verified: user.hasVerifiedBadge,
    avatar: avatar.data[0]?.imageUrl,
    social: {
      followers: followers.count,
      following: following.count,
      friends: friends.count,
    },
    groups: groups.data,
    games: games.data,
    badges: badges.data,
    inventory: inventory?.data || "خاص / غير متاح",
    presence,
  };
}

const presenceType = {
  0: "غير متصل",
  1: "متصل",
  2: "في اللعبة",
  3: "في الاستوديو",
};

async function handler(m, { sock }) {
  const username = m.args[0]?.trim();

  if (!username) {
    return m.reply(
      `🎮 *تجسس روبلوكس*\n\n` +
        `> أدخل اسم المستخدم في روبلوكس\n\n` +
        `\`مثال: ${m.prefix}تجسس_روبلوكس Linkmon99\``,
    );
  }

  m.react("🔍");

  try {
    const res = await Roblox(username);

    if (res.error) {
      m.react("❌");
      return m.reply(`❌ اسم المستخدم *${username}* غير موجود`);
    }

    const topGroups =
      res.groups
        ?.slice(0, 5)
        .map(
          (v) =>
            `  ◦ ${v.group.name} (${v.group.memberCount} عضو) — ${v.role.name}`,
        )
        .join("\n") || "  ◦ لا يوجد";

    const topGames =
      res.games
        ?.slice(0, 5)
        .map(
          (v) =>
            `  ◦ ${v.name} (${(v.placeVisits || 0).toLocaleString()} زيارة)`,
        )
        .join("\n") || "  ◦ لا يوجد";

    const topBadges =
      res.badges
        ?.slice(0, 5)
        .map(
          (v) =>
            `  ◦ ${v.name} (${v.statistics?.awardedCount?.toLocaleString() || 0} ممنوحة)`,
        )
        .join("\n") || "  ◦ لا يوجد";

    const topInventory = Array.isArray(res.inventory)
      ? res.inventory
          .slice(0, 5)
          .map(
            (v) =>
              `  ◦ ${v.name} (RAP: ${v.recentAveragePrice?.toLocaleString() || "-"})`,
          )
          .join("\n")
      : `  ◦ ${res.inventory}`;

    const presInfo = res.presence
      ? `الحالة: ${presenceType[res.presence.userPresenceType] || res.presence.userPresenceType}\n  الموقع الأخير: ${res.presence.lastLocation || "-"}\n  مكان المعرف: ${res.presence.placeId || "-"}\n  معرف اللعبة: ${res.presence.gameId || "-"}`
      : "غير متاح";

    const caption =
      `🎮 *تجسس روبلوكس*\n\n` +
      `╭─〔 👤 *الملف الشخصي* 〕─⬣\n` +
      `│ 🆔 المعرف: *${res.id}*\n` +
      `│ 🎄 اسم المستخدم: *${res.username}*\n` +
      `│ 📛 الاسم المعروض: *${res.displayName}*\n` +
      `│ ✅ موثق: ${res.verified ? "نعم" : "لا"}\n` +
      `│ 📅 تاريخ الإنشاء: ${res.created ? new Date(res.created).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "-"}\n` +
      `╰────────────────⬣\n\n` +
      `╭─〔 👥 *التواصل الاجتماعي* 〕─⬣\n` +
      `│ ✦ الأصدقاء: *${res.social.friends?.toLocaleString()}*\n` +
      `│ ✦ المتابعون: *${res.social.followers?.toLocaleString()}*\n` +
      `│ ✦ يتابع: *${res.social.following?.toLocaleString()}*\n` +
      `╰────────────────⬣\n\n` +
      `╭─〔 🟢 *الحضور* 〕─⬣\n` +
      `│ ${presInfo}\n` +
      `╰────────────────⬣\n\n` +
      `╭─〔 📝 *السيرة الذاتية* 〕─⬣\n` +
      `│ ${res.description?.substring(0, 300) || "-"}\n` +
      `╰────────────────⬣\n\n` +
      `╭─〔 👥 *المجموعات* (${res.groups?.length || 0}) 〕─⬣\n` +
      `${topGroups}\n` +
      `╰────────────────⬣\n\n` +
      `╭─〔 🎮 *الألعاب* (${res.games?.length || 0}) 〕─⬣\n` +
      `${topGames}\n` +
      `╰────────────────⬣\n\n` +
      `╭─〔 🏆 *الشارات* (${res.badges?.length || 0}) 〕─⬣\n` +
      `${topBadges}\n` +
      `╰────────────────⬣\n\n` +
      `╭─〔 🎒 *المخزون* 〕─⬣\n` +
      `${topInventory}\n` +
      `╰────────────────⬣\n\n` +
      `🔗 https://roblox.com/users/${res.id}/profile`;

    m.react("✅");

    if (res.avatar) {
      await sock.sendMessage(
        m.chat,
        {
          image: { url: res.avatar },
          caption: caption,
          contextInfo: {
            externalAdReply: {
              title: `🎮 ${res.displayName || res.username}`,
              body: `@${res.username} • ${res.social.friends || 0} أصدقاء`,
              thumbnailUrl: res.avatar,
              sourceUrl: `https://roblox.com/users/${res.id}/profile`,
              mediaType: 1,
              renderLargerThumbnail: true,
              showAdAttribution: true
            }
          }
        },
        { quoted: m },
      );
    } else {
      await m.reply(caption);
    }
  } catch (e) {
    m.react("☢");
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

export { pluginConfig as config, handler };