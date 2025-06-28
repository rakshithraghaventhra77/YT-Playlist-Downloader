
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Download, CheckCircle, Clock, HardDrive } from 'lucide-react';

interface StatsOverviewProps {
  downloads: any[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ downloads }) => {
  const stats = [
    {
      title: "Total Downloads",
      value: downloads.length.toString(),
      change: "+12% from last week",
      icon: Download,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      title: "Completed",
      value: downloads.filter(d => d.status === 'completed').length.toString(),
      change: "98% success rate",
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      title: "In Queue",
      value: downloads.filter(d => d.status === 'queued' || d.status === 'downloading').length.toString(),
      change: "Average wait: 2 min",
      icon: Clock,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20"
    },
    {
      title: "Storage Used",
      value: "42.8 GB",
      change: "12% of available space",
      icon: HardDrive,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-white/5 backdrop-blur-xl border-white/10 hover:bg-white/10 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-300 mb-2">{stat.title}</p>
                <p className="text-xs text-slate-400">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
