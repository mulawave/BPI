"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiClock, 
  FiChevronDown, 
  FiChevronUp,
  FiPlay,
  FiCheck,
  FiX,
  FiEdit3,
  FiSave
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface TestResult {
  status: 'not-tested' | 'passed' | 'partial' | 'failed';
  notes: string;
  observations: string;
}

interface FeatureStatus {
  name: string;
  status: 'complete' | 'partial' | 'mock';
  description: string;
  files: string[];
}

export default function TestingDashboard() {
  const [activeTab, setActiveTab] = useState<'status' | 'tests' | 'recommendations'>('status');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['auth']));
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [editingTest, setEditingTest] = useState<string | null>(null);

  // Implementation Status Data
  const fullyImplemented: FeatureStatus[] = [
    {
      name: "Authentication System",
      status: "complete",
      description: "Login, Registration, OAuth, Session Management",
      files: ["app/(auth)/*", "server/auth.ts"]
    },
    {
      name: "Multi-Currency System",
      status: "complete",
      description: "10 currencies, real-time conversion, switcher",
      files: ["contexts/CurrencyContext.tsx", "server/trpc/router/currency.ts"]
    },
    {
      name: "Notification System",
      status: "complete",
      description: "18+ notification types, status-based messaging",
      files: ["server/services/notification.service.ts"]
    },
    {
      name: "Receipt Generation",
      status: "complete",
      description: "HTML receipts with BeepAgro branding",
      files: ["server/services/receipt.service.ts", "app/api/receipt/[type]/[transactionId]/route.ts"]
    },
    {
      name: "Wallet Deposits",
      status: "complete",
      description: "Cash/BPT deposits with VAT tracking",
      files: ["server/trpc/router/wallet.ts"]
    },
    {
      name: "Wallet Withdrawals",
      status: "complete",
      description: "Auto-approval, fee calculation, receipts",
      files: ["server/trpc/router/wallet.ts"]
    },
    {
      name: "Membership - Wallet Payment",
      status: "complete",
      description: "Balance checking, wallet deduction",
      files: ["app/membership/activate/[packageId]/page.tsx", "server/trpc/router/package.ts"]
    }
  ];

  const partiallyImplemented: FeatureStatus[] = [
    {
      name: "Payment Gateway Integration",
      status: "partial",
      description: "UI ready, APIs not integrated",
      files: ["app/membership/activate/[packageId]/page.tsx"]
    },
    {
      name: "Bank Transfer Verification",
      status: "partial",
      description: "UI exists, backend verification missing",
      files: ["app/membership/payment/bank-transfer/page.tsx"]
    },
    {
      name: "Dashboard Analytics",
      status: "partial",
      description: "Basic implementation, charts missing",
      files: ["app/dashboard/page.tsx"]
    }
  ];

  const mockData: FeatureStatus[] = [
    {
      name: "Withdrawal Processing",
      status: "mock",
      description: "3-second setTimeout simulation",
      files: ["server/trpc/router/wallet.ts"]
    },
    {
      name: "Payment Gateway Deposits",
      status: "mock",
      description: "Mock payment simulation",
      files: ["server/trpc/router/wallet.ts"]
    },
    {
      name: "Admin Approval System",
      status: "mock",
      description: "Auto-approval only, no admin UI",
      files: []
    },
    {
      name: "Email Notifications",
      status: "mock",
      description: "Database only, no email service",
      files: ["server/services/notification.service.ts"]
    }
  ];

  // Test Cases
  const testCases = [
    {
      id: 'test-registration',
      category: 'Authentication',
      name: 'User Registration with Referral',
      steps: [
        'Navigate to /register',
        'Use referral link: /register?ref=TESTREF123',
        'Fill form with valid data',
        'Solve math captcha',
        'Submit form'
      ],
      expected: [
        'Referral code appears in form',
        'Math captcha displays correctly',
        'User created in database',
        'Redirected to login page',
        'Success toast appears'
      ]
    },
    {
      id: 'test-login',
      category: 'Authentication',
      name: 'User Login',
      steps: [
        'Navigate to /login',
        'Enter valid credentials',
        'Click Sign In'
      ],
      expected: [
        'Redirect to /dashboard',
        'Session persists on refresh',
        'Protected routes accessible',
        'User details in dashboard'
      ]
    },
    {
      id: 'test-currency',
      category: 'Currency',
      name: 'Currency Switcher',
      steps: [
        'Login to dashboard',
        'Find currency dropdown in topbar',
        'Note current balance',
        'Switch from NGN to USD',
        'Observe all values'
      ],
      expected: [
        'Dropdown visible',
        'All values convert automatically',
        'Selection persists',
        'No page reload',
        'Values convert back correctly'
      ]
    },
    {
      id: 'test-deposit',
      category: 'Wallet',
      name: 'Cash Wallet Deposit',
      steps: [
        'Go to wallet section',
        'Click "Deposit to Cash Wallet"',
        'Enter amount: 10000 NGN',
        'Select Mock Payment',
        'Submit'
      ],
      expected: [
        'Pending notification',
        'Processing notification',
        'Balance updates',
        '7.5% VAT calculated',
        'Completed notification with receipt',
        'Transaction in history'
      ]
    },
    {
      id: 'test-withdrawal-small',
      category: 'Wallet',
      name: 'Withdrawal (Auto-Approved)',
      steps: [
        'Ensure wallet has ≥1000 NGN',
        'Click "Withdraw from Cash Wallet"',
        'Enter amount: 500 NGN',
        'Ensure bank details set',
        'Submit'
      ],
      expected: [
        'Auto-approval triggered',
        'Processing notification',
        '2.5% fee deducted',
        'Completed notification',
        'Balance reduced',
        'Receipt link works'
      ]
    },
    {
      id: 'test-membership-wallet',
      category: 'Membership',
      name: 'Membership Purchase with Wallet',
      steps: [
        'Ensure sufficient balance',
        'Navigate to /membership',
        'Select a package',
        'Click Activate',
        'Select Wallet payment',
        'Confirm'
      ],
      expected: [
        'Wallet option first',
        'Balance displayed',
        'Payment processes',
        'Balance deducted',
        'Membership activated',
        'Success notification'
      ]
    },
    {
      id: 'test-bank-transfer',
      category: 'Membership',
      name: 'Bank Transfer Payment',
      steps: [
        'Navigate to /membership',
        'Select package',
        'Choose Bank Transfer (Nigeria)',
        'Verify redirect'
      ],
      expected: [
        'Option not "Coming Soon"',
        'Redirects to bank transfer page',
        'BeepAgro details displayed',
        'Copy buttons work',
        'Toast on copy'
      ]
    },
    {
      id: 'test-receipt',
      category: 'Receipts',
      name: 'Deposit Receipt',
      steps: [
        'Complete a deposit',
        'Click receipt link in notification',
        'Or visit /api/receipt/deposit/{id}'
      ],
      expected: [
        'HTML receipt loads',
        'BeepAgro branding visible',
        'Amount, VAT, total shown',
        'Transaction details correct',
        'Print-ready format'
      ]
    }
  ];

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateTestResult = (testId: string, field: keyof TestResult, value: string | TestResult['status']) => {
    setTestResults(prev => ({
      ...prev,
      [testId]: {
        ...prev[testId],
        [field]: value
      } as TestResult
    }));
  };

  const saveTestResult = (testId: string) => {
    setEditingTest(null);
    toast.success('Test result saved');
    // In production, save to database
  };

  const getStatusIcon = (status: FeatureStatus['status']) => {
    switch (status) {
      case 'complete':
        return <FiCheckCircle className="text-green-500" />;
      case 'partial':
        return <FiAlertCircle className="text-yellow-500" />;
      case 'mock':
        return <FiClock className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: FeatureStatus['status']) => {
    const styles = {
      complete: 'bg-green-500/10 text-green-500 border-green-500/20',
      partial: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      mock: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    };

    const labels = {
      complete: 'Production Ready',
      partial: 'Partial',
      mock: 'Mock/Placeholder'
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTestStatusBadge = (status: TestResult['status']) => {
    const styles = {
      'not-tested': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      'passed': 'bg-green-500/10 text-green-500 border-green-500/20',
      'partial': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      'failed': 'bg-red-500/10 text-red-500 border-red-500/20'
    };

    const labels = {
      'not-tested': 'Not Tested',
      'passed': 'Passed',
      'partial': 'Partial',
      'failed': 'Failed'
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const FeatureCard = ({ feature }: { feature: FeatureStatus }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon(feature.status)}
          <h3 className="font-semibold text-gray-900 dark:text-white">{feature.name}</h3>
        </div>
        {getStatusBadge(feature.status)}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{feature.description}</p>
      {feature.files.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {feature.files.map((file, idx) => (
            <code key={idx} className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {file}
            </code>
          ))}
        </div>
      )}
    </motion.div>
  );

  const TestCard = ({ test }: { test: typeof testCases[0] }) => {
    const isExpanded = expandedSections.has(test.id);
    const result = testResults[test.id] || { status: 'not-tested', notes: '', observations: '' };
    const isEditing = editingTest === test.id;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
      >
        <div
          className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          onClick={() => toggleSection(test.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{test.category}</span>
                {getTestStatusBadge(result.status)}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{test.name}</h3>
            </div>
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-200 dark:border-gray-700"
            >
              <div className="p-4 bg-gray-50 dark:bg-green-900/30/50">
                {/* Test Steps */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <FiPlay className="text-blue-500" />
                    How to Test
                  </h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {test.steps.map((step, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Expected Results */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <FiCheck className="text-green-500" />
                    Expected Results
                  </h4>
                  <ul className="space-y-1">
                    {test.expected.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <FiCheckCircle className="text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Test Status Selection */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Test Result</h4>
                  <div className="flex gap-2">
                    {(['passed', 'partial', 'failed', 'not-tested'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => updateTestResult(test.id, 'status', status)}
                        className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                          result.status === status
                            ? status === 'passed' ? 'bg-green-500 text-white border-green-500'
                            : status === 'partial' ? 'bg-yellow-500 text-white border-yellow-500'
                            : status === 'failed' ? 'bg-red-500 text-white border-red-500'
                            : 'bg-gray-500 text-white border-gray-500'
                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {status === 'passed' ? <FiCheck className="inline mr-1" /> 
                          : status === 'failed' ? <FiX className="inline mr-1" />
                          : status === 'partial' ? <FiAlertCircle className="inline mr-1" />
                          : <FiClock className="inline mr-1" />}
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    What Happened?
                  </label>
                  <textarea
                    value={result.notes}
                    onChange={(e) => updateTestResult(test.id, 'notes', e.target.value)}
                    placeholder="Describe what happened during testing..."
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                {/* Observations */}
                <div className="mb-4">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    User Observations
                  </label>
                  <textarea
                    value={result.observations}
                    onChange={(e) => updateTestResult(test.id, 'observations', e.target.value)}
                    placeholder="Any observations, suggestions, or improvements..."
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={() => saveTestResult(test.id)}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FiSave />
                  Save Test Result
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Implementation Status & Testing Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track implementation progress and conduct systematic feature testing
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {fullyImplemented.length} Complete
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {partiallyImplemented.length} Partial
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {mockData.length} Mock/Placeholder
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            {(['status', 'tests', 'recommendations'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'status' && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Fully Implemented */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" />
                  Fully Implemented Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fullyImplemented.map((feature, idx) => (
                    <FeatureCard key={idx} feature={feature} />
                  ))}
                </div>
              </div>

              {/* Partially Implemented */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiAlertCircle className="text-yellow-500" />
                  Partially Implemented Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {partiallyImplemented.map((feature, idx) => (
                    <FeatureCard key={idx} feature={feature} />
                  ))}
                </div>
              </div>

              {/* Mock/Placeholder */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiClock className="text-gray-400" />
                  Mock Data / Placeholder Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockData.map((feature, idx) => (
                    <FeatureCard key={idx} feature={feature} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {testCases.map((test) => (
                <TestCard key={test.id} test={test} />
              ))}
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  General Feedback
                </h3>
                <textarea
                  placeholder="Overall impressions, general feedback..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={5}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Critical Issues
                </h3>
                <textarea
                  placeholder="List any critical issues that need immediate attention..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={5}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Improvement Suggestions
                </h3>
                <textarea
                  placeholder="Suggestions for improvements, enhancements, UX tweaks..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={5}
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Feature Requests
                </h3>
                <textarea
                  placeholder="New features you'd like to see implemented..."
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={5}
                />
              </div>

              <button
                onClick={() => toast.success('Recommendations saved!')}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FiSave />
                Save All Recommendations
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
