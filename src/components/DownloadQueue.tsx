import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Play, Pause, Trash2, MoreHorizontal, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Download {
  id: number | string;
  title: string;
  url: string;
  videoCount: number;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'error';
  progress: number;
  quality: string;
  format: string;
  aiCategory: string;
  estimatedSize: string;
  thumbnails: string[];
  isPlaylist?: boolean;
  author?: string;
  duration?: number;
  error?: string;
}

interface DownloadQueueProps {
  downloads: Download[];
  onUpdateDownload: (id: number | string, updates: Partial<Download>) => void;
}

const API_BASE_URL = 'http://localhost:3001/api';

export const DownloadQueue: React.FC<DownloadQueueProps> = ({ downloads, onUpdateDownload }) => {
  const [pollingDownloads, setPollingDownloads] = useState<Set<string | number>>(new Set());

  // Poll for download status updates
  useEffect(() => {
    const activeDownloads = downloads.filter(d => 
      d.status === 'queued' || d.status === 'downloading'
    );

    if (activeDownloads.length === 0) {
      setPollingDownloads(new Set());
      return;
    }

    const interval = setInterval(async () => {
      for (const download of activeDownloads) {
        try {
          const response = await fetch(`${API_BASE_URL}/download/${download.id}`);
          if (response.ok) {
            const updatedDownload = await response.json();
            onUpdateDownload(download.id, {
              status: updatedDownload.status,
              progress: updatedDownload.progress,
              title: updatedDownload.title,
              error: updatedDownload.error
            });
          }
        } catch (error) {
          console.error('Error polling download status:', error);
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [downloads, onUpdateDownload]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'downloading':
        return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'downloading': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'error': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'paused': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const cancelDownload = async (id: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/download/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        onUpdateDownload(id, { status: 'cancelled' });
      }
    } catch (error) {
      console.error('Error cancelling download:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Download Queue</h2>
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
          {downloads.length} items
        </Badge>
      </div>
      
      {downloads.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-400 text-lg mb-2">No downloads in queue</p>
          <p className="text-slate-500">Add a playlist URL above to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {downloads.map((download) => (
            <div key={download.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center overflow-hidden">
                    {download.thumbnails && download.thumbnails[0] ? (
                      <img src={download.thumbnails[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Play className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-white font-medium truncate">{download.title}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="text-sm text-slate-400">
                          {download.isPlaylist ? `${download.videoCount} videos` : '1 video'}
                        </span>
                        {download.author && (
                          <span className="text-sm text-slate-400">by {download.author}</span>
                        )}
                        {download.duration && (
                          <span className="text-sm text-slate-400">{formatDuration(download.duration)}</span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {download.quality} • {download.format.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {download.aiCategory}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(download.status)}>
                        {getStatusIcon(download.status)}
                        <span className="ml-1 capitalize">{download.status}</span>
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {download.status === 'downloading' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Progress</span>
                        <span className="text-white">{download.progress}%</span>
                      </div>
                      <Progress value={download.progress} className="h-2" />
                    </div>
                  )}
                  
                  {download.status === 'error' && download.error && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-300">
                      Error: {download.error}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>Size: {download.estimatedSize}</span>
                      {download.status === 'downloading' && (
                        <span>Speed: Calculating...</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {(download.status === 'queued' || download.status === 'downloading') && (
                        <Button 
                          size="sm" 
                          onClick={() => cancelDownload(download.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border-red-500/30"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                      
                      {download.status === 'completed' && (
                        <Button 
                          size="sm"
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
