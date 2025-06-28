import express from 'express';
import cors from 'cors';
import ytdl from 'ytdl-core';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create downloads directory
const downloadsDir = path.join(__dirname, 'downloads');
fs.ensureDirSync(downloadsDir);

// Store active downloads
const activeDownloads = new Map();

// Utility function to sanitize filename
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Get video info
app.get('/api/video-info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;
    
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    const availableFormats = {
      video: formats.map(format => ({
        itag: format.itag,
        quality: format.qualityLabel,
        container: format.container,
        hasVideo: format.hasVideo,
        hasAudio: format.hasAudio
      })),
      audio: audioFormats.map(format => ({
        itag: format.itag,
        quality: format.audioBitrate + 'kbps',
        container: format.container,
        hasVideo: format.hasVideo,
        hasAudio: format.hasAudio
      }))
    };

    res.json({
      title: videoDetails.title,
      description: videoDetails.description,
      duration: videoDetails.lengthSeconds,
      author: videoDetails.author.name,
      thumbnail: videoDetails.thumbnails[0]?.url,
      formats: availableFormats,
      isPlaylist: url.includes('playlist')
    });
  } catch (error) {
    console.error('Error getting video info:', error);
    res.status(500).json({ error: 'Failed to get video info' });
  }
});

// Get playlist info
app.get('/api/playlist-info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.includes('playlist')) {
      return res.status(400).json({ error: 'Not a playlist URL' });
    }

    // Extract playlist ID from URL
    const playlistId = url.match(/[?&]list=([^&]+)/)?.[1];
    if (!playlistId) {
      return res.status(400).json({ error: 'Invalid playlist URL' });
    }

    // For now, we'll simulate playlist info since ytdl-core doesn't directly support playlists
    // In a real implementation, you'd use youtube-dl or yt-dlp for playlist support
    const mockPlaylistInfo = {
      title: `Playlist ${playlistId}`,
      videoCount: Math.floor(Math.random() * 50) + 10,
      playlistId: playlistId,
      url: url
    };

    res.json(mockPlaylistInfo);
  } catch (error) {
    console.error('Error getting playlist info:', error);
    res.status(500).json({ error: 'Failed to get playlist info' });
  }
});

// Start download
app.post('/api/download', async (req, res) => {
  try {
    const { url, quality, format, isPlaylist } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const downloadId = uuidv4();
    const downloadInfo = {
      id: downloadId,
      url: url,
      quality: quality || '1080p',
      format: format || 'mp4',
      status: 'queued',
      progress: 0,
      title: '',
      error: null,
      startTime: new Date(),
      completedTime: null
    };

    activeDownloads.set(downloadId, downloadInfo);

    // Start download process
    processDownload(downloadId, url, quality, format, isPlaylist);

    res.json({ 
      downloadId, 
      message: 'Download started',
      download: downloadInfo
    });
  } catch (error) {
    console.error('Error starting download:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
});

// Get download status
app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const download = activeDownloads.get(id);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }
  
  res.json(download);
});

// Get all downloads
app.get('/api/downloads', (req, res) => {
  const downloads = Array.from(activeDownloads.values());
  res.json(downloads);
});

// Cancel download
app.delete('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const download = activeDownloads.get(id);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }
  
  download.status = 'cancelled';
  activeDownloads.set(id, download);
  
  res.json({ message: 'Download cancelled' });
});

// Process download function
async function processDownload(downloadId, url, quality, format, isPlaylist) {
  const download = activeDownloads.get(downloadId);
  
  try {
    download.status = 'downloading';
    activeDownloads.set(downloadId, download);

    if (isPlaylist) {
      await downloadPlaylist(downloadId, url, quality, format);
    } else {
      await downloadVideo(downloadId, url, quality, format);
    }
  } catch (error) {
    console.error('Download error:', error);
    download.status = 'error';
    download.error = error.message;
    activeDownloads.set(downloadId, download);
  }
}

// Download single video
async function downloadVideo(downloadId, url, quality, format) {
  const download = activeDownloads.get(downloadId);
  
  try {
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title;
    download.title = videoTitle;
    
    const sanitizedTitle = sanitizeFilename(videoTitle);
    const fileName = `${sanitizedTitle}.${format}`;
    const filePath = path.join(downloadsDir, fileName);
    
    let stream;
    if (format === 'mp3') {
      stream = ytdl(url, { 
        quality: 'highestaudio',
        filter: 'audioonly'
      });
    } else {
      stream = ytdl(url, { 
        quality: quality || 'highest',
        filter: format => format.hasVideo && format.hasAudio
      });
    }
    
    const writeStream = fs.createWriteStream(filePath);
    
    let downloadedBytes = 0;
    const totalBytes = parseInt(info.formats[0]?.contentLength || '0');
    
    stream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (totalBytes > 0) {
        download.progress = Math.round((downloadedBytes / totalBytes) * 100);
        activeDownloads.set(downloadId, download);
      }
    });
    
    stream.pipe(writeStream);
    
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        download.status = 'completed';
        download.progress = 100;
        download.completedTime = new Date();
        download.filePath = filePath;
        activeDownloads.set(downloadId, download);
        resolve();
      });
      
      writeStream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    throw error;
  }
}

// Download playlist (simplified implementation)
async function downloadPlaylist(downloadId, url, quality, format) {
  const download = activeDownloads.get(downloadId);
  
  try {
    // For now, we'll simulate playlist download
    // In a real implementation, you'd use youtube-dl or yt-dlp
    download.title = `Playlist Download`;
    download.progress = 0;
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      download.progress = i;
      activeDownloads.set(downloadId, download);
    }
    
    download.status = 'completed';
    download.completedTime = new Date();
    activeDownloads.set(downloadId, download);
    
  } catch (error) {
    throw error;
  }
}

// Clean up completed downloads (run every hour)
cron.schedule('0 * * * *', () => {
  const now = new Date();
  for (const [id, download] of activeDownloads.entries()) {
    if (download.status === 'completed' || download.status === 'error') {
      const hoursSinceCompletion = (now - download.completedTime) / (1000 * 60 * 60);
      if (hoursSinceCompletion > 24) {
        activeDownloads.delete(id);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
}); 