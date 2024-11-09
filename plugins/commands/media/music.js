import axios from "axios";
import { join } from "path";
import { createWriteStream } from "fs";
import { fileURLToPath } from "url";

const config = {
    name: "music",
    aliases: ["song", "ytmusic"],
    description: "Search and download a YouTube audio track.",
    usage: "[song title]",
    cooldown: 3,
    permissions: [0],
    credits: "chilli"
};

const langData = {
    "en_US": {
        "missingPrompt": (prefix) => `🎶 Please provide a song title or artist.\n\nEx: ${prefix}music Bruno Mars`,
        "error": "An error occurred while processing your request.",
        "downloading": "Fetching your song, please hold on 🎶",
        "sending": "Here’s your song! 🎧",
    }
};

// Ensure cache directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, "..");
const cacheFolder = join(__dirname, "cache");

async function onCall({ message, args, getLang, data }) {
    const prefix = data?.thread?.data?.prefix || global.config.PREFIX;

    if (args.length === 0) return message.reply(getLang("missingPrompt")(prefix));

    const query = args.join(" ");
    const requestUrl = `https://dlvc.vercel.app/yt-audio?search=${encodeURIComponent(query)}`;
    await message.react("🎶");

    try {
        const response = await axios.get(requestUrl);

        if (!response.data || !response.data.downloadUrl) {
            await message.react("❌");
            return message.reply(getLang("error"));
        }

        const { title, downloadUrl, time, views, Artist, Album, thumbnail, channelName } = response.data;
        const songPath = join(cacheFolder, `audio_${Date.now()}.mp3`);

        const writer = createWriteStream(songPath);
        const audioResponse = await axios.get(downloadUrl, { responseType: "stream" });
        audioResponse.data.pipe(writer);

        writer.on("finish", async () => {
            await message.react("✅");
            await message.reply({
                body: `🎼 *${title}* by *${Artist}*\n📀 Album: *${Album}*\n⏳ Duration: *${time}*\n👁️ Views: *${views}*\n📺 Channel: *${channelName}*\n\n✨ *Enjoy your music!*`,
                attachment: [global.reader(songPath), thumbnail]
            });
        });

        writer.on("error", async () => {
            await message.react("❌");
            message.reply(getLang("error"));
        });

    } catch (error) {
        console.error("Error in music command:", error);
        await message.react("❌");
        message.reply(getLang("error"));
    }
}

export default {
    config,
    langData,
    onCall
};
