// ═══════════════════════════════════════════════
// 📁 src/scraper/google-news.js
// 📰 Google News Scraper - بحث في أخبار جوجل
// ═══════════════════════════════════════════════

import * as cheerio from "cheerio";
import axios from "axios";

const ENGINE_CONFIG = Object.freeze({
  TARGET_HOST: "news.google.com",
  DEFAULT_LANG: "ar",
  DEFAULT_REGION: "EG",
  NETWORK_TIMEOUT: 8500,
  UA_POOL:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
});

class EngineException extends Error {
  constructor(message, coreCode) {
    super(message);
    this.name = "EngineException";
    this.coreCode = coreCode;
    this.timestamp = Date.now();
  }
}

class GoogleScraperKernel {
  constructor() {
    this.resolverHost = ENGINE_CONFIG.TARGET_HOST;
  }

  $extractCipherPayload(sourceUrl) {
    if (!sourceUrl || typeof sourceUrl !== "string") return null;
    const pointer = sourceUrl.indexOf("articles/");
    if (pointer === -1) return null;
    return sourceUrl.substring(pointer + 9).split("?")[0];
  }

  $transformSerialization(cipherText) {
    let serialized = cipherText.replace(/-/g, "+").replace(/_/g, "/");
    const padMetric = serialized.length % 4;
    if (padMetric > 0) {
      serialized += "=".repeat(4 - padMetric);
    }
    return serialized;
  }

  compileBinaryPayload(rawUrl) {
    try {
      const token = this.$extractCipherPayload(rawUrl);
      if (!token) return rawUrl;

      const targetMatrix = this.$transformSerialization(token);
      const byteBuffer = Buffer.from(targetMatrix, "base64");
      const streamOutput = byteBuffer.toString("utf-8");

      const urlVector = streamOutput.match(/https?:\/\/[^\s"\><]+/g);
      return urlVector && urlVector.length > 0 ? urlVector[0] : rawUrl;
    } catch (kernelFault) {
      return rawUrl;
    }
  }

  async executeQueryPipeline(searchToken, options = {}) {
    if (!searchToken || searchToken.trim().length === 0) {
      return { status: false, error: "كلمة البحث لا يمكن أن تكون فارغة" };
    }

    const lang = options.lang || ENGINE_CONFIG.DEFAULT_LANG;
    const region = options.region || ENGINE_CONFIG.DEFAULT_REGION;
    const limit = options.limit || 20;

    const queryHex = encodeURIComponent(searchToken);
    const endpointUri = `https://${this.resolverHost}/rss/search?q=${queryHex}&hl=${lang}&gl=${region}&ceid=${region}:${lang}`;

    try {
      const networkResponse = await axios.get(endpointUri, {
        timeout: options.timeout || ENGINE_CONFIG.NETWORK_TIMEOUT,
        headers: {
          "User-Agent": ENGINE_CONFIG.UA_POOL,
        },
      });

      if (networkResponse.status !== 200) {
        throw new EngineException(
          `فشل الاتصال: ${networkResponse.status}`,
          0x02,
        );
      }

      const documentContext = cheerio.load(networkResponse.data, {
        xmlMode: true,
      });
      const allocationPool = [];

      documentContext("item").each((index, structuralNode) => {
        if (limit && index >= limit) return;

        const nodeLink = documentContext(structuralNode).find("link").text();
        const processedAddress = this.compileBinaryPayload(nodeLink);

        const dataEntity = {
          index: index + 1,
          title: documentContext(structuralNode).find("title").text(),
          url: processedAddress,
          date: documentContext(structuralNode).find("pubDate").text(),
          source: documentContext(structuralNode).find("source").text(),
        };

        allocationPool.push(dataEntity);
      });

      return {
        status: true,
        query: searchToken,
        count: allocationPool.length,
        results: allocationPool,
      };
    } catch (pipelineError) {
      return {
        status: false,
        error: pipelineError.message,
        query: searchToken,
      };
    }
  }
}

async function GoogleSearch(query, options = {}) {
  const kernel = new GoogleScraperKernel();
  return kernel.executeQueryPipeline(query, options);
}

export { GoogleSearch };