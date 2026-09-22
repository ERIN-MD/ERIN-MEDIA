function linkGuardReply({ title, status, mode, detected, prefix, command }) {
  return `⟡ 🔗 *${title}* ⟡\n\n➤ *الحالة:* ${status === "on" ? "مفعّل ✅" : "معطّل ❌"}\n➤ *الإجراء:* ${mode === "kick" ? "طرد العضو" : "حذف الرسالة"}\n➤ *يكشف:* ${detected}\n\n➤ *تشغيل:* \`${prefix}${command} تشغيل\`\n➤ *إيقاف:* \`${prefix}${command} إيقاف\`\n➤ *تغيير الإجراء:* \`${prefix}${command} طريقة طرد\`\n\n╌╌╌╌╌╌╌╌\n> Tarboo Bot`;
}

function handleLinkGuard(m, db, { key, title, detected }) {
  const option = m.text?.toLowerCase()?.trim();
  const group = db.getGroup(m.chat) || {};
  const modeKey = `${key}Mode`;
  if (!option) return m.reply(linkGuardReply({ title, status: group[key] || "off", mode: group[modeKey] || "remove", detected, prefix: m.prefix, command: m.command }));
  if (["تشغيل", "on"].includes(option)) {
    db.setGroup(m.chat, { [key]: "on" });
    return m.reply(`✦ *تم تفعيل ${title}*\n\n> الإجراء الحالي: ${group[modeKey] === "kick" ? "طرد العضو" : "حذف الرسالة"}\n> Tarboo Bot`);
  }
  if (["ايقاف", "إيقاف", "off"].includes(option)) {
    db.setGroup(m.chat, { [key]: "off" });
    return m.reply(`✦ *تم تعطيل ${title}*\n\n> لن تُصفّى الروابط في هذه المجموعة.\n> Tarboo Bot`);
  }
  const requested = option.replace(/^(?:طريقة|metode)\s*/, "").trim();
  const mode = ["طرد", "kick"].includes(requested) ? "kick" : ["حذف", "remove", "delete"].includes(requested) ? "remove" : null;
  if (!mode) return m.reply(`✦ *خيار غير صالح*\n\n> استخدم: تشغيل، إيقاف، طريقة طرد، أو طريقة حذف.\n> Tarboo Bot`);
  db.setGroup(m.chat, { [key]: "on", [modeKey]: mode });
  return m.reply(`✦ *${title}*\n\n> تم التفعيل بوضع: *${mode === "kick" ? "الطرد" : "الحذف"}*\n> Tarboo Bot`);
}

export { handleLinkGuard };
