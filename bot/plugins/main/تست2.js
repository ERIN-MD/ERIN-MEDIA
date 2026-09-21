import crypto from "crypto";

const pluginConfig = {
  name: "تست2",
  alias: ["meta2", "rich2"],
  category: "main",
  description: "رسالة Meta AI غنية للاختبار",
  usage: ".تست2",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: true,
  cooldown: 5,
  energi: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const response_id = crypto.randomUUID();
  const text = "{{NGA}}Tarboo-Bot{{/NGA}}\n";

  const sections = [
    // 1. LaTeX Header
    {
      view_model: {
        primitive: {
          text,
          inline_entities: [
            {
              key: "NGA",
              metadata: {
                latex_expression: "MARO",
                latex_image: { url: "https://files.catbox.moe/62rxzh.png", width: 400, height: 400 },
                font_height: 83.333,
                padding: 15,
                __typename: "GenAILatexItem",
              },
            },
          ],
          __typename: "GenAIMarkdownTextUXPrimitive",
        },
        __typename: "GenAISingleLayoutViewModel",
      },
    },
    // 2. صورة البوت
    {
      __typename: "GenAIUnifiedResponseSection",
      view_model: {
        __typename: "GenAISingleLayoutViewModel",
        primitive: {
          __typename: "GenAIImagePrimitive",
          preview_image: { __typename: "GenAIMediaItem", mime_type: "image/jpeg", url: "https://leopard.hosting.pecon.us/dl/jxrso/file.jpg" },
          full_image: { __typename: "GenAIMediaItem", mime_type: "image/jpeg", url: "https://leopard.hosting.pecon.us/dl/jxrso/file.jpg" },
        },
      },
    },
    // 3. الأزرار
    {
      __typename: "GenAIUnifiedResponseSection",
      view_model: {
        primitives: [
          {
            __typename: "GenAI3PExtWidgetPrimitive",
            header: { __typename: "GenAI3PExtWidgetStandardHeader", title: "Tarboo-Bot" },
            body: {
              __typename: "GenAI3PExtCalendarEventList",
              ctas: [
                { label: "⚡ الأوامر", state: "PENDING", kind: "OTHER", tool_call_id: crypto.randomUUID(), toast: { label: "جاري فتح الأوامر", __typename: "GenAI3PExtWidgetToast" }, __typename: "GenAI3PExtWidgetCTA" },
                { label: "🚀 السرعة", state: "PENDING", kind: "OTHER", tool_call_id: crypto.randomUUID(), toast: { label: "جاري فحص السرعة", __typename: "GenAI3PExtWidgetToast" }, __typename: "GenAI3PExtWidgetCTA" },
              ],
              sections: [],
            },
          },
        ],
        __typename: "GenAIActionRowLayoutViewModel",
      },
    },
    // 4. اقتراحات
    {
      __typename: "GenAIUnifiedResponseSection",
      view_model: {
        primitives: [
          { prompt_text: "شغل أغنية", prompt_type: "SUGGESTED_PROMPT", __typename: "GenAIFollowUpSuggestionPillPrimitive" },
          { prompt_text: "صور قطط", prompt_type: "SUGGESTED_PROMPT", __typename: "GenAIFollowUpSuggestionPillPrimitive" },
          { prompt_text: "حالة البوت", prompt_type: "SUGGESTED_PROMPT", __typename: "GenAIFollowUpSuggestionPillPrimitive" },
        ],
        __typename: "GenAIActionRowLayoutViewModel",
      },
    },
    // 5. نتائج بحث
    {
      __typename: "GenAIUnifiedResponseSection",
      view_model: {
        primitive: {
          sources: [
            { source_type: "THIRD_PARTY", source_display_name: "MARO", source_subtitle: "الموقع الرسمي", source_url: "https://mabrokgmal.netlify.app", favicon: { url: "https://leopard.hosting.pecon.us/dl/jxrso/file.jpg", width: 16, height: 16 } },
            { source_type: "THIRD_PARTY", source_display_name: "GitHub", source_subtitle: "المستودع", source_url: "https://github.com/mabrokgmal", favicon: { url: "https://github.com/favicon.ico", width: 16, height: 16 } },
          ],
          search_engine: "MARO Search",
          __typename: "GenAISearchResultPrimitive",
        },
        __typename: "GenAISingleLayoutViewModel",
      },
    },
    // 6. الفوتر
    {
      view_model: {
        primitives: [
          { text: "🏠 `.menu`", __typename: "GenAIMarkdownTextUXPrimitive" },
          { text: "⚙️ `.ping`", __typename: "GenAIMarkdownTextUXPrimitive" },
          { cta_text: "Tarboo-Bot", cta_type: "OPEN_URL", cta_url: "https://mabrokgmal.netlify.app", __typename: "GenAIFooterActionPrimitive" },
        ],
        __typename: "GenAIActionRowLayoutViewModel",
      },
    },
  ];

  const payload = {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [{ messageType: 2, messageText: text }],
          unifiedResponse: {
            data: Buffer.from(JSON.stringify({ response_id, sections })).toString("base64"),
          },
          contextInfo: {
            isForwarded: true,
            forwardOrigin: 4,
            participant: "13135550002@s.whatsapp.net",
            remoteJid: "status@broadcast",
            quotedMessage: { protocolMessage: { type: 25 } },
          },
        },
      },
    },
  };

  await sock.relayMessage(m.chat, payload, {});
}

export { pluginConfig as config, handler };