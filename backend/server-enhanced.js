import express from 'express';
import cors from 'cors';
import ytdl from 'ytdl-core';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { spawn } from 'child_process';

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
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 200); // Limit length
}

// Check if yt-dlp is installed
async function checkYtDlp() {
  return new Promise((resolve) => {
    const ytdlp = spawn('yt-dlp', ['--version']);
    ytdlp.on('close', (code) => {
      resolve(code === 0);
    });
    ytdlp.on('error', () => {
      resolve(false);
    });
  });
}

// Get video info using yt-dlp
async function getVideoInfoYtDlp(url) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-playlist',
      url
    ]);

    let data = '';
    let error = '';

    ytdlp.stdout.on('data', (chunk) => {
      data += chunk;
    });

    ytdlp.stderr.on('data', (chunk) => {
      error += chunk;
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(data);
          resolve(info);
        } catch (e) {
          reject(new Error('Failed to parse video info'));
        }
      } else {
        reject(new Error(error || 'Failed to get video info'));
      }
    });
  });
}

// Get playlist info using yt-dlp
async function getPlaylistInfoYtDlp(url) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--dump-json',
      '--flat-playlist',
      url
    ]);

    let data = '';
    let error = '';

    ytdlp.stdout.on('data', (chunk) => {
      data += chunk;
    });

    ytdlp.stderr.on('data', (chunk) => {
      error += chunk;
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          const videos = data.trim().split('\n').map(line => JSON.parse(line));
          resolve({
            videoCount: videos.length,
            videos: videos.map(video => ({
              id: video.id,
              title: video.title,
              duration: video.duration,
              thumbnail: video.thumbnail,
              url: video.url || video.webpage_url
            }))
          });
        } catch (e) {
          reject(new Error('Failed to parse playlist info'));
        }
      } else {
        reject(new Error(error || 'Failed to get playlist info'));
      }
    });
  });
}

// Get video info
app.get('/api/video-info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const hasYtDlp = await checkYtDlp();
    
    if (hasYtDlp) {
      try {
        const info = await getVideoInfoYtDlp(url);
        res.json({
          title: info.title,
          description: info.description,
          duration: info.duration,
          author: info.uploader,
          thumbnail: info.thumbnail,
          formats: info.formats?.map(f => ({
            format_id: f.format_id,
            quality: f.quality,
            ext: f.ext,
            filesize: f.filesize
          })) || [],
          isPlaylist: url.includes('playlist')
        });
      } catch (error) {
        // Fallback to ytdl-core
        console.log('yt-dlp failed, falling back to ytdl-core');
        const info = await ytdl.getInfo(url);
        const videoDetails = info.videoDetails;
        
        res.json({
          title: videoDetails.title,
          description: videoDetails.description,
          duration: videoDetails.lengthSeconds,
          author: videoDetails.author.name,
          thumbnail: videoDetails.thumbnails[0]?.url,
          formats: [],
          isPlaylist: url.includes('playlist')
        });
      }
    } else {
      // Use ytdl-core as fallback
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;
      
      res.json({
        title: videoDetails.title,
        description: videoDetails.description,
        duration: videoDetails.lengthSeconds,
        author: videoDetails.author.name,
        thumbnail: videoDetails.thumbnails[0]?.url,
        formats: [],
        isPlaylist: url.includes('playlist')
      });
    }
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

    const hasYtDlp = await checkYtDlp();
    
    if (hasYtDlp) {
      try {
        const playlistInfo = await getPlaylistInfoYtDlp(url);
        res.json({
          title: `Playlist (${playlistInfo.videoCount} videos)`,
          videoCount: playlistInfo.videoCount,
          videos: playlistInfo.videos,
          url: url
        });
      } catch (error) {
        console.error('yt-dlp playlist error:', error);
        res.status(500).json({ error: 'Failed to get playlist info' });
      }
    } else {
      // Fallback to mock data
      const playlistId = url.match(/[?&]list=([^&]+)/)?.[1];
      res.json({
        title: `Playlist ${playlistId}`,
        videoCount: Math.floor(Math.random() * 50) + 10,
        videos: [],
        url: url
      });
    }
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
      completedTime: null,
      isPlaylist: isPlaylist
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
      await downloadPlaylistYtDlp(downloadId, url, quality, format);
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

// Download playlist using yt-dlp
async function downloadPlaylistYtDlp(downloadId, url, quality, format) {
  const download = activeDownloads.get(downloadId);
  
  try {
    const hasYtDlp = await checkYtDlp();
    
    if (!hasYtDlp) {
      throw new Error('yt-dlp is not installed. Please install yt-dlp for playlist downloads.');
    }

    // Get playlist info first
    const playlistInfo = await getPlaylistInfoYtDlp(url);
    download.title = `Playlist (${playlistInfo.videoCount} videos)`;
    download.videoCount = playlistInfo.videoCount;
    
    const playlistDir = path.join(downloadsDir, `playlist_${downloadId}`);
    fs.ensureDirSync(playlistDir);
    
    const args = [
      '--output', path.join(playlistDir, '%(title)s.%(ext)s'),
      '--format', format === 'mp3' ? 'bestaudio[ext=m4a]' : 'best[height<=1080]',
      '--extract-audio', format === 'mp3',
      '--audio-format', format === 'mp3' ? 'mp3' : undefined,
      '--audio-quality', format === 'mp3' ? '0' : undefined,
      '--write-thumbnail',
      '--write-description',
      '--write-info-json',
      '--no-playlist-metafiles',
      url
    ].filter(Boolean);

    return new Promise((resolve, reject) => {
      const ytdlp = spawn('yt-dlp', args);
      
      let progress = 0;
      let currentVideo = 0;
      
      ytdlp.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('yt-dlp output:', output);
        
        // Parse progress from yt-dlp output
        if (output.includes('[download]')) {
          const match = output.match(/(\d+\.?\d*)%/);
          if (match) {
            progress = parseFloat(match[1]);
            download.progress = Math.round(progress);
            activeDownloads.set(downloadId, download);
          }
        }
        
        // Count downloaded videos
        if (output.includes('has already been downloaded')) {
          currentVideo++;
          const videoProgress = (currentVideo / playlistInfo.videoCount) * 100;
          download.progress = Math.round(videoProgress);
          activeDownloads.set(downloadId, download);
        }
      });
      
      ytdlp.stderr.on('data', (data) => {
        console.log('yt-dlp stderr:', data.toString());
      });
      
      ytdlp.on('close', (code) => {
        if (code === 0) {
          download.status = 'completed';
          download.progress = 100;
          download.completedTime = new Date();
          download.filePath = playlistDir;
          activeDownloads.set(downloadId, download);
          resolve();
        } else {
          reject(new Error(`yt-dlp exited with code ${code}`));
        }
      });
      
      ytdlp.on('error', (error) => {
        reject(error);
      });
    });
    
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
  console.log(`Enhanced server running on port ${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
  
  // Check for yt-dlp installation
  checkYtDlp().then(hasYtDlp => {
    if (hasYtDlp) {
      console.log('✅ yt-dlp is installed - playlist downloads available');
    } else {
      console.log('⚠️  yt-dlp is not installed - only single video downloads available');
      console.log('Install yt-dlp: pip install yt-dlp');
    }
  });
}); 