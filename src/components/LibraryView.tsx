
import React, { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, Grid, List, Filter, Play, Share, Download } from 'lucide-react';

interface LibraryViewProps {
  downloads: any[];
}

export const LibraryView: React.FC<LibraryViewProps> = ({ downloads }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDownloads = downloads.filter(download =>
    download.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Your Library</h1>
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
          {downloads.length} Downloaded
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-slate-400"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {filteredDownloads.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-400 text-lg mb-2">No completed downloads yet</p>
          <p className="text-slate-500">Complete some downloads to see them here</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredDownloads.map((download) => (
            <div
              key={download.id}
              className={`bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 hover:border-white/20 transition-all group ${
                viewMode === 'list' ? 'p-4' : 'p-6'
              }`}
            >
              {viewMode === 'grid' ? (
                <div className="space-y-4">
                  <div className="aspect-video bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center overflow-hidden">
                    {download.thumbnails && download.thumbnails[0] ? (
                      <img src={download.thumbnails[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Play className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-white font-medium mb-2 line-clamp-2">{download.title}</h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {download.videoCount} videos
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {download.aiCategory}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30">
                        <Play className="w-3 h-3 mr-1" />
                        Play
                      </Button>
                      <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                        <Share className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-12 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {download.thumbnails && download.thumbnails[0] ? (
                      <img src={download.thumbnails[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Play className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{download.title}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm text-slate-400">{download.videoCount} videos</span>
                      <Badge variant="outline" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                        {download.aiCategory}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm" className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30">
                      <Play className="w-3 h-3 mr-1" />
                      Play
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
