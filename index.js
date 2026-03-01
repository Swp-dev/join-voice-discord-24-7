process.env.DAVE_DISABLED = "1";

import fs from "fs";
import { Client } from "discord.js-selfbot-v13";
import { joinVoiceChannel } from "@discordjs/voice";


const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
const voiceConnections = [];

const joinVoice = async (bot) => {
  try {
    const guild = bot.guilds.cache.get(config.guildId);
    if (!guild) return console.log(`[Main] Guild not found: ${config.guildId}`);

    const connection = joinVoiceChannel({
      channelId: config.voiceChannelId,
      guildId: config.guildId,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: true, 
      selfDeaf: false, // change true if you want 
    });

    voiceConnections.push({ bot, connection });
    console.log(`[Main] Joined voice channel successfully.`);
  } catch (err) {
    console.log(`[Main] Failed to join voice: ${err.message}`);
  }
};

const leaveVoice = async () => {
  if (voiceConnections.length === 0) {
    console.log("No active voice connections to leave.");
    return;
  }

  for (const { bot, connection } of voiceConnections) {
    try {
      connection.destroy();
      console.log(`[${bot.user.username}] Left voice channel.`);
    } catch (err) {
      console.log(`[${bot.user.username}] Error leaving voice: ${err.message}`);
    }
  }

  voiceConnections.length = 0;
};

const start = async () => {
  const bot = new Client({
    checkUpdate: false,
    sweepers: {
      users: { interval: 3600, filter: () => false },
      messages: { interval: 3600, filter: () => false },
    },
  });

  bot.on("ready", async () => {
    console.log(`[Main] On ${bot.user.username}`);
    await joinVoice(bot);
  });

  bot.on("messageCreate", async (msg) => {
    const content = msg.content.trim().toLowerCase();
    if (content === "!join") {
      console.log("Received !join command → joining voice channel");
      await joinVoice(bot);
      try { await msg.delete(); } catch {}
    }

    if (content === "!out") {
      console.log("Received !out command → leaving voice channel");
      await leaveVoice();
      try { await msg.delete(); } catch {}
    }
  });

  bot.login(config.mainToken);
};

process.on("SIGINT", () => {
  console.log("Manual stop detected. Disconnecting");
  voiceConnections.forEach(({ bot, connection }) => {
    try { connection.destroy(); bot.destroy(); } catch {}
  });
  process.exit(0);
});

start();
