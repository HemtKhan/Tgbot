const express = require('express');
const { exec } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

app.post('/send', async (req, res) => {
    const { chatId, youtubeUrl } = req.body;

    if (!chatId || !youtubeUrl) {
        return res.status(400).send('Missing chatId or youtubeUrl');
    }

    const outputFile = `video_${Date.now()}.mp4`;

    try {
        // Download video
        await new Promise((resolve, reject) => {
            exec(`yt-dlp -f mp4 -o ${outputFile} ${youtubeUrl}`, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error downloading video: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });

        // Upload to Telegram
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('video', fs.createReadStream(outputFile));

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, form, {
            headers: form.getHeaders()
        });

        fs.unlinkSync(outputFile); // cleanup
        res.send('✅ Video sent!');
    } catch (err) {
        console.error(err);
        res.status(500).send('❌ Failed to process video.');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server running...');
});
