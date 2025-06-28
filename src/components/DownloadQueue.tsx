
import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Play, Pause, Trash2, MoreHorizontal, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Download {
  id: number;
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
}

interface DownloadQueueProps {
  downloads: Download[];
  onUpdateDownload: (id: number, updates: Partial<Download>) => void;
}

export const DownloadQueue: React.FC<DownloadQueueProps> = ({ downloads, onUpdateDownload }) => {
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

  const simulateDownload = (id: number) => {
    onUpdateDownload(id, { status: 'downloading' });
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        onUpdateDownload(id, { status: 'completed', progress: 100 });
        clearInterval(interval);
      } else {
        onUpdateDownload(id, { progress: Math.floor(progress) });
      }
    }, 500);
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
                        <span className="text-sm text-slate-400">{download.videoCount} videos</span>
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
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-slate-400">
                      <span>Size: {download.estimatedSize}</span>
                      {download.status === 'downloading' && (
                        <span>Speed: 12.4 MB/s</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {download.status === 'queued' && (
                        <Button 
                          size="sm" 
                          onClick={() => simulateDownload(download.id)}
                          className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-500/30"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      )}
                      
                      {download.status === 'downloading' && (
                        <Button 
                          size="sm"
                          onClick={() => onUpdateDownload(download.id, { status: 'paused' })}
                          className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/30"
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Pause
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
