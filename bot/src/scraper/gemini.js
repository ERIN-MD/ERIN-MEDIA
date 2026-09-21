// ═══════════════════════════════════════════════
// 📁 src/scraper/gemini.js
// 🤖 Gemini Scraper - برمجة عكسية مباشرة من جوجل
// ═══════════════════════════════════════════════

import axios from "axios";

async function gemini(input = {}) {
  const payload = typeof input === "string" ? { message: input } : input || {};
  const { message, instruction = "", sessionId = null, language = "ar" } = payload;

  try {
    if (!message) throw new Error("النص مطلوب.");

    let resumeArray = null;
    let cookie = null;
    let savedInstruction = instruction;

    // استرجاع الجلسة السابقة
    if (sessionId) {
      try {
        const sessionData = JSON.parse(
          Buffer.from(sessionId, "base64").toString(),
        );
        resumeArray = sessionData.resumeArray;
        cookie = sessionData.cookie;
        savedInstruction = instruction || sessionData.instruction || "";
      } catch (e) {
        console.error("خطأ في تحليل الجلسة:", e.message);
      }
    }

    // الحصول على cookie جديد
    if (!cookie) {
      const { headers } = await axios.post(
        "https://gemini.google.com/_/BardChatUi/data/batchexecute?rpcids=maGuAc&source-path=%2F&bl=boq_assistant-bard-web-server_20250814.06_p1&f.sid=-7816331052118000090&hl=" + language + "&_reqid=173780&rt=c",
        "f.req=%5B%5B%5B%22maGuAc%22%2C%22%5B0%5D%22%2Cnull%2C%22generic%22%5D%5D%5D&",
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          timeout: 15000,
        },
      );

      cookie = headers["set-cookie"]?.[0]?.split("; ")[0] || "";
    }

    if (!cookie) throw new Error("فشل الحصول على cookie");

    const requestBody = [
      [message, 0, null, null, null, null, 0],
      [language === "ar" ? "ar-EG" : "en-US"],
      resumeArray || ["", "", "", null, null, null, null, null, null, ""],
      null,
      null,
      null,
      [1],
      1,
      null,
      null,
      1,
      0,
      null,
      null,
      null,
      null,
      null,
      [[0]],
      1,
      null,
      null,
      null,
      null,
      null,
      [
        "",
        "",
        savedInstruction,
        null,
        null,
        null,
        null,
        null,
        0,
        null,
        1,
        null,
        null,
        null,
        [],
      ],
      null,
      null,
      1,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      1,
      null,
      null,
      null,
      null,
      [1],
    ];

    const bodyPayload = [null, JSON.stringify(requestBody)];

    const { data } = await axios.post(
      "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?bl=boq_assistant-bard-web-server_20250729.06_p0&f.sid=4206607810970164620&hl=" + language + "&_reqid=2813378&rt=c",
      new URLSearchParams({ "f.req": JSON.stringify(bodyPayload) }).toString(),
      {
        headers: {
          "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
          "x-goog-ext-525001261-jspb":
            '[1,null,null,null,"9ec249fc9ad08861",null,null,null,[4]]',
          cookie: cookie,
        },
        timeout: 30000,
      },
    );

    const match = Array.from(data.matchAll(/^\d+\n(.+?)\n/gm));
    const array = match.reverse();
    let parse1 = null;

    for (const item of array) {
      const selectedArray = item?.[1];
      if (!selectedArray) continue;

      try {
        const realArray = JSON.parse(selectedArray);
        const candidate = realArray?.[0]?.[2];
        if (!candidate) continue;

        const parsed = JSON.parse(candidate);
        if (parsed?.[4]?.[0]?.[1]?.[0]) {
          parse1 = parsed;
          break;
        }
      } catch {}
    }

    if (!parse1) {
      throw new Error("فشل تحليل رد Gemini.");
    }

    const newResumeArray = [...parse1[1], parse1[4][0][0]];
    const text = parse1[4][0][1][0].replace(/\*\*(.+?)\*\*/g, "*$1*");

    const newSessionId = Buffer.from(
      JSON.stringify({
        resumeArray: newResumeArray,
        cookie: cookie,
        instruction: savedInstruction,
      }),
    ).toString("base64");

    return {
      status: true,
      text: text,
      sessionId: newSessionId,
      language,
    };
  } catch (error) {
    if (error?.response?.data) {
      const apiMessage =
        typeof error.response.data === "string"
          ? error.response.data
          : error.response.data.message || error.response.data.error;
      if (apiMessage) {
        error.message = apiMessage;
      }
    }

    return {
      status: false,
      error: error.message,
      language,
    };
  }
}

export { gemini as chat };
export default gemini;