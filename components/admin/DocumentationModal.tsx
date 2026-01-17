'use client';

import { useState, useMemo, useEffect } from 'react';
import * as React from 'react';
import { X, BookOpen, Search, Filter, FileText, Clock, Download, ExternalLink, TrendingUp, PieChart, BarChart3, FolderOpen, Code, Database, Settings, Users, Wallet, Gift, Layout, Tag, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { api } from '@/client/trpc';
import { httpBatchLink } from '@trpc/client';

type DocumentCategory = 'all' | 'setup' | 'implementation' | 'testing' | 'admin' | 'database' | 'membership' | 'architecture' | 'guides';
type SortOption = 'name' | 'updated' | 'size' | 'category';

interface DocumentMetadata {
  id: string;
  name: string;
  path: string;
  category: DocumentCategory;
  description: string;
  size: string;
  lastUpdated: string;
  tags: string[];
  priority?: 'high' | 'medium' | 'low';
  starred?: boolean;
}

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// All documentation files with metadata
const DOCUMENTATION_FILES: DocumentMetadata[] = [
  // Root level documentation
  {
    id: 'readme',
    name: 'README.md',
    path: '/README.md',
    category: 'setup',
    description: 'Main project documentation and setup guide',
    size: '12 KB',
    lastUpdated: '2026-01-17',
    tags: ['setup', 'getting-started', 'overview'],
    priority: 'high',
    starred: true,
  },
  {
    id: 'admin-handoff',
    name: 'ADMIN_HANDOFF.md',
    path: '/ADMIN_HANDOFF.md',
    category: 'admin',
    description: 'Admin system handoff and configuration guide',
    size: '8 KB',
    lastUpdated: '2026-01-15',
    tags: ['admin', 'configuration', 'handoff'],
    priority: 'high',
  },
  {
    id: 'bank-withdrawal',
    name: 'BANK_WITHDRAWAL_IMPLEMENTATION.md',
    path: '/BANK_WITHDRAWAL_IMPLEMENTATION.md',
    category: 'implementation',
    description: 'Bank account and withdrawal system implementation guide',
    size: '15 KB',
    lastUpdated: '2026-01-17',
    tags: ['banking', 'withdrawal', 'flutterwave', 'security'],
    priority: 'high',
    starred: true,
  },
  {
    id: 'bpi-analysis',
    name: 'BPI_Project_Analysis_Report.md',
    path: '/BPI_Project_Analysis_Report.md',
    category: 'architecture',
    description: 'Comprehensive project analysis and architecture report',
    size: '45 KB',
    lastUpdated: '2025-12-08',
    tags: ['analysis', 'architecture', 'overview'],
    priority: 'medium',
  },
  {
    id: 'database-seeder-setup',
    name: 'DATABASE_SEEDER_SETUP.md',
    path: '/DATABASE_SEEDER_SETUP.md',
    category: 'database',
    description: 'Database seeder setup and configuration',
    size: '7 KB',
    lastUpdated: '2026-01-10',
    tags: ['database', 'seeder', 'setup'],
    priority: 'medium',
  },
  {
    id: 'database-seeder-quickref',
    name: 'DATABASE_SEEDER_QUICKREF.md',
    path: '/DATABASE_SEEDER_QUICKREF.md',
    category: 'database',
    description: 'Quick reference for database seeding operations',
    size: '5 KB',
    lastUpdated: '2026-01-10',
    tags: ['database', 'seeder', 'reference'],
    priority: 'low',
  },
  {
    id: 'implementation-status',
    name: 'IMPLEMENTATION_STATUS.md',
    path: '/IMPLEMENTATION_STATUS.md',
    category: 'implementation',
    description: 'Current implementation status and progress tracking',
    size: '10 KB',
    lastUpdated: '2026-01-15',
    tags: ['status', 'progress', 'tracking'],
    priority: 'high',
  },
  {
    id: 'implementation-status-testing',
    name: 'IMPLEMENTATION_STATUS_AND_TESTING.md',
    path: '/IMPLEMENTATION_STATUS_AND_TESTING.md',
    category: 'testing',
    description: 'Implementation status with testing checklist',
    size: '12 KB',
    lastUpdated: '2026-01-15',
    tags: ['testing', 'status', 'checklist'],
    priority: 'high',
  },
  {
    id: 'migration',
    name: 'MIGRATION.md',
    path: '/MIGRATION.md',
    category: 'database',
    description: 'Database migration guide and procedures',
    size: '6 KB',
    lastUpdated: '2026-01-12',
    tags: ['migration', 'database'],
    priority: 'medium',
  },
  {
    id: 'palliative-migration',
    name: 'PALLIATIVE_MIGRATION.md',
    path: '/PALLIATIVE_MIGRATION.md',
    category: 'database',
    description: 'Palliative care system data migration',
    size: '8 KB',
    lastUpdated: '2026-01-12',
    tags: ['palliative', 'migration', 'database'],
    priority: 'medium',
  },
  {
    id: 'testing-checklist',
    name: 'TESTING_CHECKLIST.md',
    path: '/TESTING_CHECKLIST.md',
    category: 'testing',
    description: 'Comprehensive testing checklist for all features',
    size: '9 KB',
    lastUpdated: '2026-01-15',
    tags: ['testing', 'checklist', 'qa'],
    priority: 'high',
    starred: true,
  },
  {
    id: 'youtube-setup',
    name: 'YOUTUBE_SETUP.md',
    path: '/YOUTUBE_SETUP.md',
    category: 'setup',
    description: 'YouTube integration setup and configuration',
    size: '6 KB',
    lastUpdated: '2026-01-10',
    tags: ['youtube', 'integration', 'setup'],
    priority: 'low',
  },

  // Docs folder
  {
    id: 'admin-dashboard-quickstart',
    name: 'admin-dashboard-quickstart.md',
    path: '/docs/admin-dashboard-quickstart.md',
    category: 'admin',
    description: 'Quick start guide for admin dashboard',
    size: '8 KB',
    lastUpdated: '2026-01-14',
    tags: ['admin', 'dashboard', 'quickstart'],
    priority: 'high',
    starred: true,
  },
  {
    id: 'admin-dashboard-technical-spec',
    name: 'admin-dashboard-technical-spec.md',
    path: '/docs/admin-dashboard-technical-spec.md',
    category: 'admin',
    description: 'Technical specifications for admin dashboard',
    size: '25 KB',
    lastUpdated: '2026-01-14',
    tags: ['admin', 'dashboard', 'technical', 'spec'],
    priority: 'high',
  },
  {
    id: 'admin-settings-requirements',
    name: 'admin-settings-requirements.md',
    path: '/docs/admin-settings-requirements.md',
    category: 'admin',
    description: 'Admin settings requirements and configuration',
    size: '7 KB',
    lastUpdated: '2026-01-12',
    tags: ['admin', 'settings', 'requirements'],
    priority: 'medium',
  },
  {
    id: 'backup-scheduling',
    name: 'backup-scheduling.md',
    path: '/docs/backup-scheduling.md',
    category: 'database',
    description: 'Database backup scheduling and procedures',
    size: '5 KB',
    lastUpdated: '2026-01-10',
    tags: ['backup', 'database', 'scheduling'],
    priority: 'medium',
  },
  {
    id: 'corrected-membership-architecture',
    name: 'corrected-membership-architecture.md',
    path: '/docs/corrected-membership-architecture.md',
    category: 'membership',
    description: 'Corrected membership system architecture',
    size: '18 KB',
    lastUpdated: '2026-01-13',
    tags: ['membership', 'architecture', 'design'],
    priority: 'high',
  },
  {
    id: 'membership-activation-flow',
    name: 'membership-activation-flow.md',
    path: '/docs/membership-activation-flow.md',
    category: 'membership',
    description: 'Membership activation workflow and process',
    size: '10 KB',
    lastUpdated: '2026-01-13',
    tags: ['membership', 'activation', 'workflow'],
    priority: 'high',
  },
  {
    id: 'membership-implementation-plan',
    name: 'membership-implementation-plan.md',
    path: '/docs/membership-implementation-plan.md',
    category: 'membership',
    description: 'Implementation plan for membership system',
    size: '14 KB',
    lastUpdated: '2026-01-13',
    tags: ['membership', 'implementation', 'planning'],
    priority: 'high',
  },
  {
    id: 'progress-snapshot',
    name: 'progress-snapshot-2025-12-08.md',
    path: '/docs/progress-snapshot-2025-12-08.md',
    category: 'implementation',
    description: 'Project progress snapshot from December 2025',
    size: '11 KB',
    lastUpdated: '2025-12-08',
    tags: ['progress', 'snapshot', 'status'],
    priority: 'low',
  },
  {
    id: 'receipt-locations-guide',
    name: 'receipt-locations-guide.md',
    path: '/docs/receipt-locations-guide.md',
    category: 'guides',
    description: 'Guide to receipt storage locations and access',
    size: '6 KB',
    lastUpdated: '2026-01-12',
    tags: ['receipts', 'storage', 'guide'],
    priority: 'medium',
  },
  {
    id: 'suggestions-improvements',
    name: 'suggestions-improvements.md',
    path: '/docs/suggestions-improvements.md',
    category: 'guides',
    description: 'Suggestions and improvements for the system',
    size: '9 KB',
    lastUpdated: '2026-01-10',
    tags: ['suggestions', 'improvements', 'enhancements'],
    priority: 'low',
  },
  {
    id: 'user-flow-db-audit-coverage',
    name: 'user-flow-db-audit-coverage.md',
    path: '/docs/user-flow-db-audit-coverage.md',
    category: 'architecture',
    description: 'User flow and database audit trail coverage',
    size: '13 KB',
    lastUpdated: '2026-01-11',
    tags: ['audit', 'user-flow', 'database'],
    priority: 'medium',
  },
  {
    id: 'vat-settings-addon',
    name: 'vat-settings-addon.md',
    path: '/docs/vat-settings-addon.md',
    category: 'admin',
    description: 'VAT settings configuration addon',
    size: '5 KB',
    lastUpdated: '2026-01-11',
    tags: ['vat', 'settings', 'tax'],
    priority: 'low',
  },

  // Prisma documentation
  {
    id: 'seeder-readme',
    name: 'SEEDER_README.md',
    path: '/prisma/SEEDER_README.md',
    category: 'database',
    description: 'Prisma seeder documentation and usage',
    size: '8 KB',
    lastUpdated: '2026-01-10',
    tags: ['prisma', 'seeder', 'database'],
    priority: 'medium',
  },
  {
    id: 'prisma-migration-guide',
    name: 'MIGRATION_GUIDE.md',
    path: '/prisma/MIGRATION_GUIDE.md',
    category: 'database',
    description: 'Prisma migration guide and best practices',
    size: '7 KB',
    lastUpdated: '2026-01-12',
    tags: ['prisma', 'migration', 'guide'],
    priority: 'medium',
  },

  // Membership documentation
  {
    id: 'membership-package-system',
    name: 'BPI Membership Package System.txt',
    path: '/membership_docs/BPI Membership Package System.txt',
    category: 'membership',
    description: 'BPI membership package system documentation',
    size: '22 KB',
    lastUpdated: '2025-12-05',
    tags: ['membership', 'packages', 'system'],
    priority: 'high',
  },
  {
    id: 'bpi-token-model',
    name: 'bpitokenmodel.txt',
    path: '/membership_docs/bpitokenmodel.txt',
    category: 'architecture',
    description: 'BPI token economic model and mechanics',
    size: '16 KB',
    lastUpdated: '2025-12-05',
    tags: ['tokenomics', 'model', 'economics'],
    priority: 'high',
  },
];

export default function DocumentationModal({
  isOpen,
  onClose,
}: DocumentationModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Use tRPC utils for imperative queries
  const utils = api.useUtils();

  // Category icons mapping
  const categoryIcons: Record<string, any> = {
    setup: Settings,
    implementation: Code,
    testing: CheckCircle2,
    admin: Users,
    database: Database,
    membership: Gift,
    architecture: Layout,
    guides: BookOpen,
    all: FileText,
  };

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...DOCUMENTATION_FILES];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'updated':
        filtered.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
    }

    // Starred items first
    filtered.sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0));

    return filtered;
  }, [selectedCategory, searchQuery, sortBy]);

  // Analytics data
  const analytics = useMemo(() => {
    const total = DOCUMENTATION_FILES.length;
    const categoryBreakdown: Record<string, number> = {};
    DOCUMENTATION_FILES.forEach(doc => {
      categoryBreakdown[doc.category] = (categoryBreakdown[doc.category] || 0) + 1;
    });

    const priorityBreakdown = {
      high: DOCUMENTATION_FILES.filter(d => d.priority === 'high').length,
      medium: DOCUMENTATION_FILES.filter(d => d.priority === 'medium').length,
      low: DOCUMENTATION_FILES.filter(d => d.priority === 'low').length,
    };

    return {
      total,
      categoryBreakdown,
      priorityBreakdown,
      starred: DOCUMENTATION_FILES.filter(d => d.starred).length,
    };
  }, []);

  // Load document content
  const loadDocument = async (doc: DocumentMetadata) => {
    setIsLoading(true);
    setSelectedDocId(doc.id);
    
    try {
      toast.loading('Loading document...', { id: 'doc-load' });
      
      // Use tRPC utils to fetch document
      const result = await utils.documentation.getDocument.fetch({ 
        filePath: doc.path 
      });
      
      setDocumentContent(result.content);
      
      toast.success('Document loaded', { id: 'doc-load' });
    } catch (error) {
      toast.error('Failed to load document', { id: 'doc-load' });
      console.error('Document load error:', error);
      setDocumentContent('# Error\n\nFailed to load document content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download document
  const downloadDocument = (doc: DocumentMetadata) => {
    if (!documentContent) {
      toast.error('Please load the document first');
      return;
    }

    const blob = new Blob([documentContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Document downloaded');
  };

  // Copy file path
  const copyFilePath = (path: string) => {
    navigator.clipboard.writeText(path);
    toast.success('File path copied to clipboard');
  };

  const selectedDoc = selectedDocId 
    ? DOCUMENTATION_FILES.find(d => d.id === selectedDocId)
    : null;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full bg-white dark:bg-bpi-dark-card shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-bpi-dark-accent bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-bpi-dark-accent dark:to-bpi-dark-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Documentation Center</h2>
                <p className="text-sm text-muted-foreground">{filteredDocuments.length} of {analytics.total} documents</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl hover:bg-gray-200 dark:hover:bg-bpi-dark-accent flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Categories */}
            <div className="w-56 border-r border-gray-200 dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30 p-4 overflow-y-auto">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Categories</h3>
              <div className="space-y-1">
                {[
                  { id: 'all', label: 'All Documents', icon: FileText, count: analytics.total },
                  { id: 'setup', label: 'Setup & Config', icon: Settings, count: analytics.categoryBreakdown.setup || 0 },
                  { id: 'implementation', label: 'Implementation', icon: Code, count: analytics.categoryBreakdown.implementation || 0 },
                  { id: 'testing', label: 'Testing & QA', icon: CheckCircle2, count: analytics.categoryBreakdown.testing || 0 },
                  { id: 'admin', label: 'Admin Guides', icon: Users, count: analytics.categoryBreakdown.admin || 0 },
                  { id: 'database', label: 'Database', icon: Database, count: analytics.categoryBreakdown.database || 0 },
                  { id: 'membership', label: 'Membership', icon: Gift, count: analytics.categoryBreakdown.membership || 0 },
                  { id: 'architecture', label: 'Architecture', icon: Layout, count: analytics.categoryBreakdown.architecture || 0 },
                  { id: 'guides', label: 'User Guides', icon: BookOpen, count: analytics.categoryBreakdown.guides || 0 },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as DocumentCategory)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium'
                        : 'hover:bg-gray-200 dark:hover:bg-bpi-dark-accent text-foreground'
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    <span className="flex-1 text-left text-sm">{cat.label}</span>
                    <span className="text-xs bg-gray-200 dark:bg-bpi-dark-accent px-2 py-0.5 rounded-full">
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Analytics Toggle */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-bpi-dark-accent">
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-bpi-dark-accent transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Analytics</span>
                </button>
              </div>
            </div>

            {/* Documents List */}
            <div className="w-96 flex flex-col overflow-hidden border-r border-gray-200 dark:border-bpi-dark-accent">
              {/* Search & Controls */}
              <div className="p-4 border-b border-gray-200 dark:border-bpi-dark-accent space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-bpi-dark-accent border border-gray-200 dark:border-bpi-dark-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-3 py-2 bg-gray-100 dark:bg-bpi-dark-accent border border-gray-200 dark:border-bpi-dark-accent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="updated">Sort by Last Updated</option>
                    <option value="category">Sort by Category</option>
                  </select>
                </div>
              </div>

              {/* Documents List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No documents found</p>
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <motion.button
                      key={doc.id}
                      onClick={() => loadDocument(doc)}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`w-full p-4 rounded-xl border transition-all text-left ${
                        selectedDocId === doc.id
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                          : 'bg-white dark:bg-bpi-dark-accent border-gray-200 dark:border-bpi-dark-accent hover:border-orange-300 dark:hover:border-orange-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          doc.priority === 'high' 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : doc.priority === 'medium'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {React.createElement(categoryIcons[doc.category] || FileText, { className: 'w-5 h-5' })}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">{doc.name}</h3>
                            {doc.starred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{doc.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {doc.lastUpdated}
                            </span>
                            <span>{doc.size}</span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-bpi-dark-card rounded-full capitalize">
                              {doc.category}
                            </span>
                          </div>
                          {doc.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.tags.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                                  {tag}
                                </span>
                              ))}
                              {doc.tags.length > 3 && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                                  +{doc.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>

            {/* Main Content Pane - Document Preview / Analytics */}
            <div className="flex-1 bg-white dark:bg-bpi-dark-card overflow-y-auto">
              {showAnalytics && !selectedDocId ? (
                <div className="p-6 max-w-6xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Documentation Analytics
                    </h3>

                    {/* Priority Breakdown */}
                    <div className="space-y-3 mb-6">
                      <h4 className="text-sm font-medium text-muted-foreground">Priority Distribution</h4>
                      {[
                        { label: 'High Priority', value: analytics.priorityBreakdown.high, color: 'bg-red-500' },
                        { label: 'Medium Priority', value: analytics.priorityBreakdown.medium, color: 'bg-yellow-500' },
                        { label: 'Low Priority', value: analytics.priorityBreakdown.low, color: 'bg-gray-500' },
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item.label}</span>
                            <span className="font-semibold">{item.value}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-bpi-dark-accent rounded-full h-2">
                            <div
                              className={`${item.color} h-2 rounded-full transition-all`}
                              style={{ width: `${(item.value / analytics.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Category Breakdown */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">Category Breakdown</h4>
                      {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between p-2 bg-white dark:bg-bpi-dark-card rounded-lg">
                          <span className="text-sm capitalize">{category}</span>
                          <span className="text-sm font-semibold px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl">
                        <div className="text-2xl font-bold text-orange-600 mb-1">{analytics.total}</div>
                        <div className="text-xs text-muted-foreground">Total Docs</div>
                      </div>
                      <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl">
                        <div className="text-2xl font-bold text-yellow-600 mb-1">{analytics.starred}</div>
                        <div className="text-xs text-muted-foreground">Starred</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedDoc ? (
                <div className="p-6 max-w-6xl mx-auto">
                  {/* Document Header */}
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{selectedDoc.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedDoc.description}</p>
                      </div>
                      {selectedDoc.starred && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium capitalize">
                          {selectedDoc.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{selectedDoc.size}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="font-medium">{selectedDoc.lastUpdated}</span>
                      </div>
                      {selectedDoc.priority && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Priority:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                            selectedDoc.priority === 'high' 
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : selectedDoc.priority === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                          }`}>
                            {selectedDoc.priority}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {selectedDoc.tags.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedDoc.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-bpi-dark-card text-gray-700 dark:text-gray-300 rounded-lg text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-6">
                      <button 
                        onClick={() => copyFilePath(selectedDoc.path)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">Copy Path</span>
                      </button>
                      <button 
                        onClick={() => downloadDocument(selectedDoc)}
                        disabled={!documentContent || isLoading}
                        className="px-4 py-2 bg-gray-200 dark:bg-bpi-dark-accent hover:bg-gray-300 dark:hover:bg-bpi-dark-card rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Document Preview */}
                  <div className="border-t border-gray-200 dark:border-bpi-dark-accent pt-6">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Preview
                    </h4>
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match;
                              
                              return !isInline ? (
                                <SyntaxHighlighter
                                  style={vscDarkPlus as any}
                                  language={match ? match[1] : undefined}
                                  PreTag="div"
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xl font-semibold mt-3 mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-lg font-medium mt-2 mb-1">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc pl-6 mt-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-6 mt-2">{children}</ol>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-orange-500 pl-4 italic text-gray-600 dark:text-gray-300">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {documentContent}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Select a document to view details</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
