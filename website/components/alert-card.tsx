'use client';

import { Bell, AlertTriangle, Calendar, Copy } from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  count: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface AlertCardProps {
  alert: Alert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const iconMap: { [key: string]: any } = {
    Bell: Bell,
    AlertTriangle: AlertTriangle,
    Calendar: Calendar,
    Copy: Copy,
  };

  const colorMap: { [key: string]: string } = {
    'bg-blue-50': 'border-blue-200 text-blue-700',
    'bg-yellow-50': 'border-yellow-200 text-yellow-700',
    'bg-red-50': 'border-red-200 text-red-700',
    'bg-purple-50': 'border-purple-200 text-purple-700',
  };

  const Icon = iconMap[alert.icon];
  const colorClass = colorMap[alert.color];

  return (
    <div className={`${alert.color} border ${colorClass} rounded-lg p-4 space-y-2`}>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <span className="font-bold text-2xl">{alert.count}</span>
      </div>
      <h3 className="font-semibold text-slate-900">{alert.title}</h3>
      <p className="text-sm text-slate-600">{alert.description}</p>
      <a href="#" className="inline-block text-sm font-medium text-teal-600 hover:text-teal-700 mt-2">
        View {alert.type === 'reminder' ? 'schedule' : 'details'} →
      </a>
    </div>
  );
}
