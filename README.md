# PlaylistWizard AI - YouTube Playlist Downloader

A modern, AI-powered YouTube playlist and video downloader with a beautiful React frontend and Node.js backend.

## Features

- 🎯 **Real YouTube Downloads**: Actually downloads videos and playlists (not just mock data)
- 📺 **Playlist Support**: Download entire YouTube playlists with proper video naming
- 🎨 **Modern UI**: Beautiful, responsive interface with dark theme
- 📊 **Real-time Progress**: Live download progress tracking
- 🎵 **Multiple Formats**: Support for MP4, MP3, WebM, and AVI formats
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast Downloads**: Optimized downloading with yt-dlp integration
- 🔄 **Queue Management**: Manage multiple downloads simultaneously

## Prerequisites

Before running this application, you need to install:

1. **Node.js** (v16 or higher)
2. **Python** (for yt-dlp)
3. **yt-dlp** (for playlist downloads)

### Installing yt-dlp

```bash
# Install yt-dlp using pip
pip install yt-dlp

# Or using pip3
pip3 install yt-dlp

# Verify installation
yt-dlp --version
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd playlist-wizard-ai
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:3001`

2. **Start the frontend** (in a new terminal)
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Production Mode

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the backend**
   ```bash
   cd backend
   npm start
   ```

## Usage

1. **Open the application** in your browser at `http://localhost:5173`

2. **Add a YouTube URL**:
   - Single video: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Playlist: `https://www.youtube.com/playlist?list=PLAYLIST_ID`

3. **Select quality and format**:
   - Quality: 4K, QHD, Full HD, HD, SD
   - Format: MP4, MP3, WebM, AVI

4. **Click "Add to Queue"** to start downloading

5. **Monitor progress** in the download queue

6. **View completed downloads** in the Library tab

## How It Works

### Backend Architecture

The backend uses a combination of:
- **ytdl-core**: For single video downloads and metadata extraction
- **yt-dlp**: For playlist downloads and advanced features
- **Express.js**: RESTful API server
- **Real-time updates**: Polling mechanism for download progress

### Frontend Features

- **Real-time polling**: Updates download status every 2 seconds
- **Error handling**: Displays meaningful error messages
- **Progress tracking**: Visual progress bars and status indicators
- **Responsive design**: Works on all screen sizes

## File Structure

```
playlist-wizard-ai/
├── src/                    # Frontend React code
│   ├── components/        # React components
│   ├── pages/            # Page components
│   └── hooks/            # Custom React hooks
├── backend/              # Node.js backend
│   ├── server.js         # Basic server (ytdl-core only)
│   ├── server-enhanced.js # Enhanced server (with yt-dlp)
│   └── downloads/        # Downloaded files directory
├── public/               # Static assets
└── package.json          # Frontend dependencies
```

## API Endpoints

### Backend API (Port 3001)

- `GET /api/video-info?url=<youtube_url>` - Get video information
- `GET /api/playlist-info?url=<playlist_url>` - Get playlist information
- `POST /api/download` - Start a download
- `GET /api/download/:id` - Get download status
- `GET /api/downloads` - Get all downloads
- `DELETE /api/download/:id` - Cancel a download

## Troubleshooting

### Common Issues

1. **"yt-dlp is not installed" error**
   - Install yt-dlp: `pip install yt-dlp`
   - Verify installation: `yt-dlp --version`

2. **Download fails with "Video unavailable"**
   - The video might be private, deleted, or region-restricted
   - Try a different video or check the URL

3. **Playlist downloads not working**
   - Ensure yt-dlp is installed
   - Check that the playlist URL is valid
   - Verify the playlist is public

4. **Backend connection errors**
   - Ensure the backend is running on port 3001
   - Check for CORS issues
   - Verify the API_BASE_URL in frontend components

### Performance Tips

- Use the enhanced server (`server-enhanced.js`) for better playlist support
- Install yt-dlp for optimal performance
- Monitor disk space for large downloads
- Use appropriate quality settings to balance speed and file size

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This tool is for educational purposes only. Please respect YouTube's Terms of Service and only download content you have permission to download. The developers are not responsible for any misuse of this software.
