"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdInfo, MdExpandMore, MdExpandLess } from "react-icons/md";

interface GuideSection {
  title: string;
  icon: React.ReactNode;
  items: string[] | { label?: string; text: string }[];
  type?: "ul" | "ol";
}

interface AdminPageGuideProps {
  title: string;
  sections: GuideSection[];
  features?: string[];
  proTip?: string;
  warning?: string;
}

export default function AdminPageGuide({
  title,
  sections,
  features,
  proTip,
  warning,
}: AdminPageGuideProps) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.03 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl shadow-lg border-2 border-blue-200 dark:border-blue-800 overflow-hidden"
    >
      <button
        onClick={() => setShowGuide(!showGuide)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <MdInfo className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click to {showGuide ? "hide" : "view"} guide & features
            </p>
          </div>
        </div>
        {showGuide ? (
          <MdExpandLess className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        ) : (
          <MdExpandMore className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-blue-200 dark:border-blue-800"
          >
            <div className="px-6 py-6 space-y-6">
              {/* Sections */}
              {sections.map((section, idx) => (
                <div key={idx}>
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </h4>
                  {section.type === "ol" ? (
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      {section.items.map((item, i) => {
                        if (typeof item === "string") {
                          return <li key={i} dangerouslySetInnerHTML={{ __html: item }} />;
                        }
                        return (
                          <li key={i}>
                            {item.label && <span className="font-semibold">{item.label}</span>}
                            {item.text}
                          </li>
                        );
                      })}
                    </ol>
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300 ml-6">
                      {section.items.map((item, i) => {
                        if (typeof item === "string") {
                          return <li key={i} dangerouslySetInnerHTML={{ __html: item }} />;
                        }
                        return (
                          <li key={i}>
                            {item.label && <span className="font-semibold">{item.label}: </span>}
                            {item.text}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}

              {/* Features */}
              {features && features.length > 0 && (
                <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                  <h4 className="text-md font-bold text-gray-900 dark:text-white mb-3">
                    ✨ Key Features
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Tip */}
              {proTip && (
                <div className="bg-white dark:bg-bpi-dark-card rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    💡 Pro Tip
                  </h5>
                  <p
                    className="text-sm text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: proTip }}
                  />
                </div>
              )}

              {/* Warning */}
              {warning && (
                <div className="bg-yellow-50 dark:bg-yellow-950/50 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <h5 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
                    ⚠️ Important
                  </h5>
                  <p
                    className="text-sm text-yellow-800 dark:text-yellow-300"
                    dangerouslySetInnerHTML={{ __html: warning }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
