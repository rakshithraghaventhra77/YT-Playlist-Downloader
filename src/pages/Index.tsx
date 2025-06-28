
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { UrlInput } from '../components/UrlInput';
import { DownloadQueue } from '../components/DownloadQueue';
import { AIInsights } from '../components/AIInsights';
import { LibraryView } from '../components/LibraryView';
import { StatsOverview } from '../components/StatsOverview';

const Index = () => {
  const [activeTab, setActiveTab] = useState('downloader');
  const [downloads, setDownloads] = useState([]);

  const addDownload = (playlistData) => {
    const newDownload = {
      id: Date.now(),
      title: playlistData.title,
      url: playlistData.url,
      videoCount: playlistData.videoCount,
      status: 'queued',
      progress: 0,
      quality: playlistData.quality,
      format: playlistData.format,
      aiCategory: playlistData.aiCategory,
      estimatedSize: playlistData.estimatedSize,
      thumbnails: playlistData.thumbnails,
    };
    setDownloads(prev => [...prev, newDownload]);
  };

  const updateDownloadStatus = (id, updates) => {
    setDownloads(prev => prev.map(download => 
      download.id === id ? { ...download, ...updates } : download
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="relative z-10 container mx-auto px-6 py-8">
          {activeTab === 'downloader' && (
            <div className="space-y-8">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  Smart YouTube Downloader
                </h1>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  AI-powered playlist downloading with intelligent organization and unlimited HD quality
                </p>
              </div>

              <StatsOverview downloads={downloads} />
              
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <UrlInput onAddDownload={addDownload} />
                  <DownloadQueue 
                    downloads={downloads} 
                    onUpdateDownload={updateDownloadStatus}
                  />
                </div>
                <div>
                  <AIInsights downloads={downloads} />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'library' && (
            <LibraryView downloads={downloads.filter(d => d.status === 'completed')} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
