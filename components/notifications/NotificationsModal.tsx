'use client';

import { useState, useMemo } from 'react';
import { X, Bell, Filter, Search, Check, Archive, Trash2, Mail, MailOpen, TrendingUp, PieChart, BarChart3, Clock, AlertCircle, Wallet, Users, Gift, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NotificationCategory = 'all' | 'unread' | 'read' | 'archived' | 'system' | 'wallet' | 'membership' | 'community' | 'rewards';
type SortOption = 'newest' | 'oldest' | 'priority';

interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  archived?: boolean;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (ids: string[]) => void;
  onArchive: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onArchive,
  onDelete,
}: NotificationsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Category icons mapping
  const categoryIcons: Record<string, any> = {
    system: Settings,
    wallet: Wallet,
    membership: Users,
    community: Users,
    rewards: Gift,
    default: Bell,
  };

  // Filter notifications by category
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    // Category filter
    switch (selectedCategory) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead);
        break;
      case 'read':
        filtered = filtered.filter(n => n.isRead);
        break;
      case 'archived':
        filtered = filtered.filter(n => n.archived);
        break;
      case 'system':
      case 'wallet':
      case 'membership':
      case 'community':
      case 'rewards':
        filtered = filtered.filter(n => n.category === selectedCategory);
        break;
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      filtered.sort((a, b) => (priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']));
    }

    return filtered;
  }, [notifications, selectedCategory, searchQuery, sortBy]);

  // Analytics data
  const analytics = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const read = total - unread;
    const archived = notifications.filter(n => n.archived).length;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    notifications.forEach(n => {
      const cat = n.category || 'other';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    // Last 7 days trend
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: notifications.filter(n => {
          const nDate = new Date(n.createdAt);
          return nDate.toDateString() === date.toDateString();
        }).length,
      };
    });

    return {
      total,
      unread,
      read,
      archived,
      readRate: total > 0 ? Math.round((read / total) * 100) : 0,
      categoryBreakdown,
      last7Days,
    };
  }, [notifications]);

  // Toggle notification selection
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedNotifications);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedNotifications(newSet);
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  // Bulk actions
  const handleBulkMarkAsRead = () => {
    onMarkAsRead(Array.from(selectedNotifications));
    setSelectedNotifications(new Set());
  };

  const handleBulkArchive = () => {
    onArchive(Array.from(selectedNotifications));
    setSelectedNotifications(new Set());
  };

  const handleBulkDelete = () => {
    onDelete(Array.from(selectedNotifications));
    setSelectedNotifications(new Set());
  };

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Get priority badge
  const getPriorityBadge = (priority?: string) => {
    if (!priority || priority === 'low') return null;
    
    const colors = {
      urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[priority as keyof typeof colors]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const selectedNotification = selectedNotificationId 
    ? notifications.find(n => n.id === selectedNotificationId)
    : null;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full h-[90vh] max-w-7xl bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-bpi-dark-accent bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-bpi-dark-accent dark:to-bpi-dark-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Notifications Center</h2>
                <p className="text-sm text-muted-foreground">{analytics.unread} unread of {analytics.total} total</p>
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
            <div className="w-64 border-r border-gray-200 dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30 p-4 overflow-y-auto">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Categories</h3>
              <div className="space-y-1">
                {[
                  { id: 'all', label: 'All Notifications', icon: Bell, count: analytics.total },
                  { id: 'unread', label: 'Unread', icon: Mail, count: analytics.unread },
                  { id: 'read', label: 'Read', icon: MailOpen, count: analytics.read },
                  { id: 'archived', label: 'Archived', icon: Archive, count: analytics.archived },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as NotificationCategory)}
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

                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-bpi-dark-accent">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">By Type</h3>
                  {['system', 'wallet', 'membership', 'community', 'rewards'].map(type => {
                    const Icon = categoryIcons[type];
                    const count = analytics.categoryBreakdown[type] || 0;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedCategory(type as NotificationCategory)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          selectedCategory === type
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium'
                            : 'hover:bg-gray-200 dark:hover:bg-bpi-dark-accent text-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1 text-left text-sm capitalize">{type}</span>
                        <span className="text-xs bg-gray-200 dark:bg-bpi-dark-accent px-2 py-0.5 rounded-full">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Middle Pane - Notifications List */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search & Controls */}
              <div className="p-4 border-b border-gray-200 dark:border-bpi-dark-accent space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-bpi-dark-accent rounded-lg bg-white dark:bg-bpi-dark-accent/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Sort & Bulk Actions */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleSelectAll}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-bpi-dark-accent rounded-lg hover:bg-gray-100 dark:hover:bg-bpi-dark-accent transition-colors"
                    >
                      {selectedNotifications.size === filteredNotifications.length ? 'Deselect All' : 'Select All'}
                    </button>
                    
                    {selectedNotifications.size > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleBulkMarkAsRead}
                          className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Mark Read
                        </button>
                        <button
                          onClick={handleBulkArchive}
                          className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1"
                        >
                          <Archive className="w-4 h-4" />
                          Archive
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-bpi-dark-accent rounded-lg bg-white dark:bg-bpi-dark-accent/50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priority">By Priority</option>
                  </select>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No notifications found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification, index) => {
                      const Icon = categoryIcons[notification.category || 'default'] || Bell;
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`group flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                            selectedNotificationId === notification.id
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700'
                              : notification.isRead
                              ? 'bg-gray-50 dark:bg-bpi-dark-accent/30 border-gray-200 dark:border-bpi-dark-accent hover:border-gray-300 dark:hover:border-gray-600'
                              : 'bg-white dark:bg-bpi-dark-card border-orange-200 dark:border-orange-900/50 hover:shadow-md'
                          }`}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedNotifications.has(notification.id)}
                            onChange={() => toggleSelection(notification.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />

                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            notification.isRead ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gradient-to-br from-orange-500 to-yellow-500'
                          }`}>
                            <Icon className={`w-5 h-5 ${notification.isRead ? 'text-gray-500' : 'text-white'}`} />
                          </div>

                          {/* Content */}
                          <div
                            className="flex-1 min-w-0"
                            onClick={() => {
                              setSelectedNotificationId(notification.id);
                              setShowAnalytics(false);
                              if (!notification.isRead) {
                                onMarkAsRead([notification.id]);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`font-semibold text-sm ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </h4>
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              {notification.category && (
                                <span className="capitalize">{notification.category}</span>
                              )}
                            </div>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Analytics or Reading Pane */}
            <div className="w-96 border-l border-gray-200 dark:border-bpi-dark-accent bg-gray-50 dark:bg-bpi-dark-accent/30 overflow-y-auto">
              {showAnalytics && !selectedNotification ? (
                /* Analytics Dashboard */
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-orange-600" />
                    Analytics & Insights
                  </h3>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                      <div className="text-2xl font-bold text-orange-600">{analytics.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                      <div className="text-2xl font-bold text-blue-600">{analytics.unread}</div>
                      <div className="text-xs text-muted-foreground">Unread</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                      <div className="text-2xl font-bold text-green-600">{analytics.readRate}%</div>
                      <div className="text-xs text-muted-foreground">Read Rate</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                      <div className="text-2xl font-bold text-purple-600">{analytics.archived}</div>
                      <div className="text-xs text-muted-foreground">Archived</div>
                    </div>
                  </div>

                  {/* 7-Day Trend */}
                  <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                    <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      Last 7 Days
                    </h4>
                    <div className="space-y-2">
                      {analytics.last7Days.map((day, i) => {
                        const maxCount = Math.max(...analytics.last7Days.map(d => d.count), 1);
                        const percentage = (day.count / maxCount) * 100;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-8">{day.date}</span>
                            <div className="flex-1 h-6 bg-gray-200 dark:bg-bpi-dark-accent rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                              />
                            </div>
                            <span className="text-xs font-medium text-foreground w-6">{day.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                    <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-orange-600" />
                      By Category
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(analytics.categoryBreakdown).map(([category, count], i) => {
                        const Icon = categoryIcons[category] || Bell;
                        const percentage = analytics.total > 0 ? Math.round((count / analytics.total) * 100) : 0;
                        const colors = ['from-orange-500 to-yellow-500', 'from-blue-500 to-cyan-500', 'from-green-500 to-emerald-500', 'from-purple-500 to-pink-500', 'from-red-500 to-orange-500'];
                        return (
                          <div key={category} className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground capitalize">{category}</span>
                                <span className="text-xs text-muted-foreground">{percentage}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-bpi-dark-accent rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ delay: i * 0.1, duration: 0.5 }}
                                  className={`h-full bg-gradient-to-r ${colors[i % colors.length]} rounded-full`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : selectedNotification ? (
                /* Reading Pane */
                <div className="p-6">
                  <button
                    onClick={() => {
                      setSelectedNotificationId(null);
                      setShowAnalytics(true);
                    }}
                    className="mb-4 text-sm text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                  >
                    ← Back to Analytics
                  </button>

                  <div className="space-y-4">
                    {/* Icon & Title */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                        {(() => {
                          const Icon = categoryIcons[selectedNotification.category || 'default'] || Bell;
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          {selectedNotification.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getPriorityBadge(selectedNotification.priority)}
                          {selectedNotification.category && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-bpi-dark-accent capitalize">
                              {selectedNotification.category}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(selectedNotification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="p-4 bg-white dark:bg-bpi-dark-card rounded-xl border border-gray-200 dark:border-bpi-dark-accent">
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {selectedNotification.message}
                      </p>
                    </div>

                    {/* Link/Receipt Button */}
                    {selectedNotification.link && (
                      <a
                        href={selectedNotification.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      >
                        <Mail className="w-4 h-4" />
                        {selectedNotification.link.includes('/receipt/') ? 'Download Receipt' : 'View Link'}
                      </a>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          onMarkAsRead([selectedNotification.id]);
                          setSelectedNotificationId(null);
                        }}
                        className="w-full px-4 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Mark as Read
                      </button>
                      <button
                        onClick={() => {
                          onArchive([selectedNotification.id]);
                          setSelectedNotificationId(null);
                        }}
                        className="w-full px-4 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Archive className="w-4 h-4" />
                        Archive
                      </button>
                      <button
                        onClick={() => {
                          onDelete([selectedNotification.id]);
                          setSelectedNotificationId(null);
                        }}
                        className="w-full px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>

                    {/* Metadata */}
                    <div className="p-4 bg-gray-50 dark:bg-bpi-dark-accent/50 rounded-xl text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Notification ID:</span>
                        <span className="font-mono">{selectedNotification.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Received:</span>
                        <span>{new Date(selectedNotification.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={selectedNotification.isRead ? 'text-green-600' : 'text-orange-600'}>
                          {selectedNotification.isRead ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
