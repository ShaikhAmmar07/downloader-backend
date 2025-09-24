const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send('Downloader backend is awake and running!');
});

app.get('/download-info', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log(`Fetching info for: ${videoUrl}`);
    try {
        const metadata = await youtubedl(videoUrl, {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificate: true,
            preferFreeFormats: true,
        });
        
        const formats = metadata.formats
            .filter(f => (f.vcodec !== 'none' || f.acodec !== 'none') && f.url)
            .map(f => {
                let quality = f.height ? `${f.height}p` : `${Math.round(f.abr)}kbps`;
                let type = 'Video + Audio';
                if (f.vcodec === 'none' && f.acodec !== 'none') {
                    type = 'Audio Only';
                }
                return { quality, type, url: f.url, ext: f.ext };
            });

        console.log(`Found ${formats.length} formats.`);
        res.json(formats);

    } catch (error) {
        console.error('Error fetching video info:', error.message);
        res.status(500).json({ error: 'Failed to fetch video information. The URL might be invalid or private.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
