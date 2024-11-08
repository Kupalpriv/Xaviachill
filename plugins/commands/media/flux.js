// Import necessary modules
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import apiConfig from './api'; // Importing the API configuration file

// Get the current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cachePath = './plugins/commands/cache';

// Configuration for the command
const config = {
    name: "flux",
    version: "1.0.0",
    permissions: 0,
    credits: "chill",
    description: "Generate an image with a prompt using Jonel's API",
    usage: "[prompt]",
    cooldown: 3,
    category: "Images",
};

// Define the function to handle the command
async function onCall({ message, args }) {
    if (args.length === 0) {
        return message.reply("Please provide a prompt for the image generation.\n\nExample: flux cat");
    }

    const prompt = args.join(" ");
    message.reply("Generating image...");

    try {
        // Fetch the generated image from the API
        const response = await axios.get(`${apiConfig.flux}?prompt=${encodeURIComponent(prompt)}`, {
            responseType: 'arraybuffer'
        });

        if (response.status !== 200) {
            return message.reply("An error occurred while generating the image.");
        }

        const imgBuffer = Buffer.from(response.data, 'binary');

        // Ensure the cache directory exists
        await fs.ensureDir(cachePath);

        // Save the generated image to the cache directory
        const filePath = path.join(cachePath, `flux_${Date.now()}.png`);
        await fs.outputFile(filePath, imgBuffer);

        // Send the generated image as a reply
        await message.reply({
            body: "Here is your generated image:",
            attachment: fs.createReadStream(filePath)
        });
    } catch (error) {
        console.error("Error in flux command:", error);
        message.reply("An error occurred while generating the image.");
    }
}

// Export the command configuration and handler function
export default {
    config,
    onCall
};
