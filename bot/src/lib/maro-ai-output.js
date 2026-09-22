const FOOTER = "> Tarboo Bot";

function withFooter(text = "") {
  const normalized = String(text).trim();
  return normalized.includes(FOOTER) ? normalized : `${normalized}\n\n${FOOTER}`;
}

async function sendAiText(m, text, options = {}) {
  return m.reply(withFooter(text), options);
}

async function sendAiMedia(sock, m, content, caption = "") {
  const payload = { ...content };
  if (caption) payload.caption = withFooter(caption);
  return sock.sendMessage(m.chat, payload, { quoted: m });
}

async function sendAiDocument(sock, m, buffer, { fileName = "marobot-output.txt", mimetype = "text/plain", caption = "" } = {}) {
  return sendAiMedia(sock, m, { document: buffer, fileName, mimetype }, caption);
}

async function sendAiCard(m, { title, body, hint = "" }) {
  return sendAiText(m, `╭─〔 ${title} 〕\n${body}${hint ? `\n╰─〔 ${hint} 〕` : "\n╰─────────────"}`);
}

export { FOOTER, withFooter, sendAiText, sendAiMedia, sendAiDocument, sendAiCard };
