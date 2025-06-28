import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Link, Sparkles, Download } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface UrlInputProps {
  onAddDownload: (playlistData: any) => void;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const UrlInput: React.FC<UrlInputProps> = ({ onAddDownload }) => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('1080p');
  const [format, setFormat] = useState('mp4');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const analyzeUrl = async () => {
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL or playlist link.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const isPlaylist = url.includes('playlist');
      
      // Get video/playlist info from backend
      const infoResponse = await fetch(
        `${API_BASE_URL}/${isPlaylist ? 'playlist-info' : 'video-info'}?url=${encodeURIComponent(url)}`
      );
      
      if (!infoResponse.ok) {
        throw new Error('Failed to get video/playlist info');
      }
      
      const info = await infoResponse.json();
      
      // Start the download
      const downloadResponse = await fetch(`${API_BASE_URL}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          quality: quality,
          format: format,
          isPlaylist: isPlaylist
        }),
      });
      
      if (!downloadResponse.ok) {
        throw new Error('Failed to start download');
      }
      
      const downloadData = await downloadResponse.json();
      
      const playlistData = {
        id: downloadData.downloadId,
        title: info.title || 'Unknown Title',
        url: url,
        videoCount: info.videoCount || 1,
        quality: quality,
        format: format,
        aiCategory: isPlaylist ? "Playlist" : "Single Video",
        estimatedSize: "Calculating...",
        thumbnails: info.thumbnail ? [info.thumbnail] : [],
        status: 'queued',
        progress: 0,
        isPlaylist: isPlaylist,
        author: info.author || 'Unknown Author',
        duration: info.duration || 0
      };
      
      onAddDownload(playlistData);
      setUrl('');
      
      toast({
        title: "Download Started!",
        description: `${playlistData.videoCount} video(s) queued for download`,
      });
      
    } catch (error) {
      console.error('Error analyzing URL:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze URL. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className="flex items-center space-x-2 mb-4">
        <Link className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold text-white">Add Playlist</h2>
        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
          <Sparkles className="w-3 h-3 mr-1" />
          AI-Powered
        </Badge>
      </div>
      
      <div className="space-y-4">
        <div>
          <Input
            placeholder="Paste YouTube playlist or video URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 h-12"
          />
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Quality</label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4K">4K (2160p)</SelectItem>
                <SelectItem value="1440p">QHD (1440p)</SelectItem>
                <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                <SelectItem value="720p">HD (720p)</SelectItem>
                <SelectItem value="480p">SD (480p)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Format</label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-white/5 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4 (Video)</SelectItem>
                <SelectItem value="mp3">MP3 (Audio)</SelectItem>
                <SelectItem value="webm">WebM</SelectItem>
                <SelectItem value="avi">AVI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              onClick={analyzeUrl}
              disabled={!url || isAnalyzing}
              className="w-full h-10 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Add to Queue</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
