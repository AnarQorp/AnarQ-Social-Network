import React from 'react';
import { QsocialDashboard } from '@/components/qsocial';

export default function QSocialPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">QSocial</h1>
          <p className="text-slate-600">AnarQ & Q Ecosystem Hub</p>
        </div>
        <QsocialDashboard />
      </div>
    </div>
  );
}
