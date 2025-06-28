
import React from 'react';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Sparkles, TrendingUp, Clock, HardDrive } from 'lucide-react';

interface AIInsightsProps {
  downloads: any[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ downloads }) => {
  const insights = [
    {
      title: "Optimal Download Time",
      description: "Best network conditions detected between 2-4 AM",
      icon: Clock,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      title: "Storage Optimization",
      description: "Consider 720p for mobile viewing to save 40% space",
      icon: HardDrive,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      title: "Content Trends",
      description: "Educational content downloads up 150% this month",
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-white">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>AI Insights</span>
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              Smart
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <div className={`w-8 h-8 rounded-lg ${insight.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${insight.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white mb-1">{insight.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-white/5 backdrop-blur-xl border-white/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm">Smart Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['Educational', 'Entertainment', 'Music', 'Gaming', 'Technology'].map((category, index) => (
              <div key={category} className="flex items-center justify-between">
                <span className="text-sm text-slate-300">{category}</span>
                <Badge variant="outline" className="text-xs">
                  {Math.floor(Math.random() * 20) + 1}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
