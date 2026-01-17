'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import DocumentationModal from '@/components/admin/DocumentationModal';

export default function AdminDocumentationPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-bpi-dark-bg dark:to-bpi-dark-card p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Documentation Center</h1>
              <p className="text-muted-foreground">Project documentation, guides, and implementation notes</p>
            </div>
          </div>
        </div>

        {/* Quick Access Card */}
        <div className="bg-white dark:bg-bpi-dark-card rounded-xl shadow-lg p-8 border border-gray-200 dark:border-bpi-dark-accent">
          <div className="text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold mb-2">Welcome to Documentation Center</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Access comprehensive documentation, implementation guides, testing checklists, and technical specifications.
              Use the search and filters to quickly find what you need.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              Open Documentation
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Total Documents', value: '30+', icon: '📚' },
            { label: 'Categories', value: '8', icon: '📂' },
            { label: 'Guides', value: '15+', icon: '📖' },
            { label: 'Last Updated', value: 'Today', icon: '🕐' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-bpi-dark-card rounded-xl shadow p-6 border border-gray-200 dark:border-bpi-dark-accent"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation Modal */}
      <DocumentationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
