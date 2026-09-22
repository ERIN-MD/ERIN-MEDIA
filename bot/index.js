import "dotenv/config";
import path from "path";
import fs from "fs";
import chokidar from "chokidar";
import config from "./config.js";
import { startConnection } from "./src/connection.js";
import {
  messageHandler,
  groupHandler,
  messageUpdateHandler,
  groupSettingsHandler,
  handleAntiRemoveFromUpsert,
} from "./src/handler.js";
import { loadPlugins, pluginStore } from "./src/lib/maro-plugins.js";
import { initDatabase, getDatabase } from "./src/lib/maro-database.js";
import {
  initScheduler,
  loadScheduledMessages,
  startGroupScheduleChecker,
  startSewaChecker,
} from "./src/lib/maro-scheduler.js";
import { handleAntiTagSW } from "./src/lib/maro-group-protection.js";
import { initSholatScheduler } from "./src/lib/maro-sholat-scheduler.js";
import { initNotifScheduler } from "./src/lib/maro-notif-scheduler.js";
import { initAutoJpmScheduler } from "./src/lib/maro-auto-jpm.js";
import { startMemoryMonitor } from "./src/lib/maro-memory-monitor.js";
import { startTempCleaner } from "./src/lib/maro-temp-cleaner.js";
import { startDailyPruner } from "./src/lib/maro-data-pruner.js";
import { preloadAssets } from "./src/lib/maro-asset-manager.js";
import {
  logger,
  c,
  playBootSequence,
  spinText,
  logConnection,
  logErrorBox,
  divider,
} from "./src/lib/maro-logger.js";

await import("./src/lib/maro-agent.js")
  .then((m) => m.initializeAgent())
  .catch(() => { });

const LOG_NOISE = new Set([
  "Closing",
  "Opening",
  "prekey",
  "_chains",
  "registrationId",
  "chainKey",
  "ephemeralKeyPair",
  "rootKey",
  "indexInfo",
  "pendingPreKey",
  "currentRatchet",
  "baseKey",
  "privKey",
  "Session already",
  "SessionEntry",
]);

function _isNoise(args) {
  const first = typeof args[0] === "string" ? args[0] : "";
  for (const noise of LOG_NOISE) {
    if (first.includes(noise)) return true;
  }
  return false;
}

const _log = console.log;
const _info = console.info;
const _warn = console.warn;

console.log = (...args) => {
  if (_isNoise(args)) return;
  _log.apply(console, args);
};

console.info = (...args) => {
  if (_isNoise(args)) return;
  _info.apply(console, args);
};

console.warn = (...args) => {
  if (_isNoise(args)) return;
  _warn.apply(console, args);
};

const startTime = Date.now();

let pluginWatcher = null;
const reloadDebounce = new Map();
const fileStatCache = new Map();

function startDevWatcher(pluginsPath) {
  if (pluginWatcher) pluginWatcher.close();

  logger.system("dev", "Hot-Reload watcher active for plugins (Chokidar)");

  pluginWatcher = chokidar.watch(pluginsPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  pluginWatcher.on("all", async (event, filePath) => {
    const filename = path.relative(pluginsPath, filePath);
    if (!filename.endsWith(".js")) return;

    const existingTimeout = reloadDebounce.get(filename);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(async () => {
      reloadDebounce.delete(filename);

      if (event === "unlink") {
        const pluginName = path.basename(filename, ".js");
        const { unloadPlugin } = await import("./src/lib/maro-plugins.js");
        const result = unloadPlugin(pluginName);
        if (result.success) logger.warn("plugin", `removed ${filename}`);
        return;
      }

      if (event === "add" || event === "change") {
        try {
          const { hotReloadPlugin } = await import("./src/lib/maro-plugins.js");
          const result = await hotReloadPlugin(filePath);
          if (!result.success) {
            logger.error("plugin", `reload failed: ${filename}: ${result.error}`);
          }
        } catch (error) {
          logger.error("plugin", `reload failed: ${filename}: ${error.message}`);
        }
      }
    }, 500);

    reloadDebounce.set(filename, timeout);
  });

  logger.debug("dev", `Monitoring directory: ${pluginsPath}`);
}

let srcWatcher = null;

function startSrcWatcher(srcPath) {
  if (srcWatcher) srcWatcher.close();

  logger.system("dev", "Hot-Reload watcher active for src (Chokidar)");

  srcWatcher = chokidar.watch(srcPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
  });

  srcWatcher.on("all", (event, filePath) => {
    const filename = path.relative(srcPath, filePath);
    if (!filename.endsWith(".js")) return;

    const existingTimeout = reloadDebounce.get("src_" + filename);
    if (existingTimeout) clearTimeout(existingTimeout);

    const timeout = setTimeout(() => {
      reloadDebounce.delete("src_" + filename);
      if (event === "unlink") {
        logger.warn("dev", `src file removed: ${filename}`);
      } else {
        logger.success("dev", `src changed: ${filename}`);
      }
    }, 500);

    reloadDebounce.set("src_" + filename, timeout);
  });

  logger.debug("dev", `Monitoring directory: ${srcPath}`);
}

function setupAntiCrash() {
  process.on("uncaughtException", (error, origin) => {
    const ignoredErrors = [
      "write EOF",
      "ECONNRESET",
      "EPIPE",
      "ETIMEDOUT",
      "ENOTFOUND",
      "ECONNREFUSED",
      "read ECONNRESET",
    ];
    const isIgnored = ignoredErrors.some(
      (msg) => error.message?.includes(msg) || error.code === msg,
    );
    if (isIgnored) return;

    logErrorBox("uncaught exception", error.message);
    console.error(c.gray(error.stack));
    logger.system("system", "المحرك ما زال يعمل");
  });

  process.on("unhandledRejection", (reason, promise) => {
    logErrorBox("unhandled rejection", String(reason));
    console.error(c.gray("Promise:"), promise);
    logger.system("system", "المحرك ما زال يعمل");
  });

  process.on("warning", (warning) => {
    logger.warn("system", `${warning.name}: ${warning.message}`);
  });

  process.on("SIGINT", async () => {
    console.log("");
    logger.system("system", "تم استلام إشارة التوقف (SIGINT)");
    logger.info("database", "جاري حفظ البيانات...");
    try {
      const db = getDatabase();
      db.save();
      logger.success("database", "تم حفظ جميع البيانات بنجاح");
    } catch (error) {
      logger.warn("database", `فشل الحفظ: ${error.message}`);
    }
    logger.info("system", "تم إيقاف المحرك بأمان");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("");
    logger.system("system", "تم استلام إشارة الإنهاء (SIGTERM)");
    process.exit(0);
  });

  logger.success("system", "نظام الحماية من الانهيار نشط");
}

async function followConfiguredChannel(sock, db) {
  const channelId = config.saluran?.id?.trim();
  if (config.saluran?.autoFollow !== true || !/^\d+@newsletter$/.test(channelId || "")) return;
  if (db.setting("channelFollowed") === channelId) return;

  try {
    await sock.newsletterFollow(channelId);
    db.setting("channelFollowed", channelId);
    await db.save();
    logger.success("CHANNEL", `تمت متابعة قناة المالك: ${config.saluran?.name || channelId}`);
  } catch (error) {
    logger.warn("CHANNEL", `تعذر متابعة قناة المالك: ${error.message}`);
  }
}

async function main() {
  await playBootSequence({
    name: config.bot?.name || "Maro-AI",
    version: config.bot?.version || "1.0.0",
    developer: config.bot?.developer || "Tarboo Bot",
    mode: config.mode || "public",
  });
  setupAntiCrash();

  const dbPath = path.join(
    process.cwd(),
    config.database?.path || "./database/main",
  );
  await initDatabase(dbPath);
  const db = getDatabase();

  await spinText("system", "جاري تشغيل خادم التخزين المؤقت...", { tone: "accent" });
  await preloadAssets(config.assets);

  const savedMode = db.setting("botMode");
  if (savedMode && (savedMode === "self" || savedMode === "public"))
    config.mode = savedMode;
  const savedPremium = db.setting("premiumUsers");
  if (Array.isArray(savedPremium)) config.premiumUsers = savedPremium;
  const savedBanned = db.setting("bannedUsers");
  if (Array.isArray(savedBanned)) config.bannedUsers = savedBanned;

  const pCount = Array.isArray(savedPremium) ? savedPremium.length : 0;
  const bCount = Array.isArray(savedBanned) ? savedBanned.length : 0;
  logger.success(
    "database",
    `تم تهيئة قاعدة البيانات | الوضع: ${config.mode} | مميز: ${pCount} | محظور: ${bCount}`,
  );

  const pluginsPath = path.join(process.cwd(), "plugins");
  const pluginCount = await loadPlugins(pluginsPath);
  logger.success("plugin", `تم تحميل ${pluginCount} وحدة بنجاح`);

  if (config.dev?.enabled && config.dev?.watchPlugins)
    startDevWatcher(pluginsPath);
  if (config.dev?.enabled && config.dev?.watchSrc) {
    const srcPath = path.join(process.cwd(), "src");
    startSrcWatcher(srcPath);
  }

  initScheduler(config);

  const bootTime = Date.now() - startTime;
  logger.success("boot", `تم تهيئة النظام في ${bootTime}ms`);
  divider();
  await spinText("network", "جاري فتح نفق اتصال واتساب...", {
    duration: 900,
    tone: "accent",
  });
  logConnection("connecting", "جاري إنشاء الجلسة وبروتوكول المصافحة");
  console.log("");

  await startConnection({
    onRawMessage: async (msg, sock) => {
      try {
        const db = getDatabase();
        await handleAntiTagSW(msg, sock, db);
      } catch (error) { }
    },

    onMessage: async (msg, sock) => {
      try {
        const handlerPromise = messageHandler(msg, sock);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Handler timeout")), 60000),
        );
        await Promise.race([handlerPromise, timeoutPromise]);
      } catch (error) {
        if (error.message !== "Handler timeout") {
          logger.error("HANDLER", error.message);
          if (config.dev?.debugLog) console.error(c.gray(error.stack));
        }
      }
    },

    onGroupUpdate: async (update, sock) => {
      try {
        await groupHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onMessageUpdate: async (updates, sock) => {
      try {
        await messageUpdateHandler(updates, sock);
      } catch (error) {
        logger.error("MSG", error.message);
      }
    },

    onGroupSettingsUpdate: async (update, sock) => {
      try {
        await groupSettingsHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onStubMessage: async (msg, sock) => {
      try {
        const db = getDatabase();
        await handleAntiRemoveFromUpsert(msg, sock, db);
      } catch (error) {
        logger.error("ANTIDELETE", error.message);
      }
    },

    onConnectionUpdate: async (update, sock) => {
      if (update.connection === "open") {
        logConnection("connected", sock.user?.name || "Bot");
        loadScheduledMessages(sock);
        startGroupScheduleChecker(sock);
        startSewaChecker(sock);
        initScheduler(config, sock);
        initAutoJpmScheduler(sock);
        initSholatScheduler(sock);
        initNotifScheduler(sock);
        await followConfiguredChannel(sock, db);
        
        // ✨ استعادة جلسات البوتات الفرعية
        try {
          const { getAllJadibotSessions, restartJadibotSession } =
            await import("./src/lib/maro-jadibot-manager.js");
          const sessions = getAllJadibotSessions();
          if (sessions.length > 0) {
            logger.info("JADIBOT", `جاري استعادة ${sessions.length} جلسة`);
            for (const session of sessions) {
              try {
                await restartJadibotSession(sock, session.id);
                await new Promise((r) => setTimeout(r, 3000));
              } catch (e) {
                logger.error("JADIBOT", `فشل استعادة ${session.id}: ${e.message}`);
              }
            }
          }
        } catch (e) {
          logger.error("JADIBOT", `فشل في استعادة الجلسات: ${e.message}`);
        }
        const devLabel = config.dev?.enabled ? ` ${c.yellow("• dev")}` : "";
        startMemoryMonitor();
        startTempCleaner();
        startDailyPruner();
        logger.success("ready", `جميع الأنظمة الفرعية تعمل بكامل طاقتها${devLabel}`);
        divider();
      }
    },
  });
}

main().catch((error) => {
  logErrorBox("خطأ فادح", error.message);
  console.error(c.gray(error.stack));
  process.exit(1);
});
