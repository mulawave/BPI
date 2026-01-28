"use client";
import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Receipt, DollarSign, Calendar, FileText, Download } from "lucide-react";
import { FiX, FiFileText, FiDownload } from "react-icons/fi";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { api } from "@/client/trpc";
import { useCurrency } from "@/contexts/CurrencyContext";

interface TaxesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaxesModal({ isOpen, onClose }: TaxesModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { formatAmount } = useCurrency();

  // Fetch tax payment history with pagination
  const { data: taxData, isLoading } = api.taxes.getTaxHistory.useQuery(
    { page: currentPage, limit: itemsPerPage },
    { enabled: isOpen }
  );

  if (!isOpen) return null;

  const totalPages = taxData ? Math.ceil(taxData.totalCount / itemsPerPage) : 1;

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleExport = () => {
    if (!taxData?.taxes || taxData.taxes.length === 0) return;

    const headers = ["Date", "Description", "Total Paid", "Item Cost", "Tax Amount"];
    const csvData = taxData.taxes.map((tax: any) => [
      new Date(tax.date).toLocaleDateString(),
      tax.description,
      tax.totalPaid.toFixed(2),
      tax.itemCost.toFixed(2),
      tax.taxAmount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row: any[]) => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tax_history_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white dark:bg-bpi-dark-card rounded-2xl shadow-2xl m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <FiFileText className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Tax History</h2>
                <p className="text-blue-100 text-sm">Track all your tax payments and contributions</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <FiX className="w-7 h-7" />
            </button>
          </div>

          {/* Total Taxes Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Taxes Paid</p>
                <p className="text-3xl font-bold">{formatAmount(taxData?.totalTaxes || 0)}</p>
              </div>
              <button
                onClick={handleExport}
                disabled={!taxData?.taxes || taxData.taxes.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <FiDownload className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-250px)] overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-muted-foreground">Loading tax records...</p>
              </div>
            </div>
          )}

          {/* Tax Records Table */}
          {!isLoading && taxData && (
            <>
              {taxData.taxes.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-10 h-10 text-blue-600 dark:text-blue-400 opacity-50" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Tax Payments Yet</h3>
                  <p className="text-muted-foreground">Your tax payment history will appear here</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-green-800/50">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-green-950/30 border-b border-gray-200 dark:border-green-800/50">
                          <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              Date
                            </div>
                          </th>
                          <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              Description
                            </div>
                          </th>
                          <th className="text-right py-4 px-4 text-sm font-semibold text-foreground">
                            <div className="flex items-center gap-2 justify-end">
                              <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              Total Paid
                            </div>
                          </th>
                          <th className="text-right py-4 px-4 text-sm font-semibold text-foreground">Item Cost</th>
                          <th className="text-right py-4 px-4 text-sm font-semibold text-foreground">
                            <div className="flex items-center gap-2 justify-end">
                              <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              Tax Amount
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxData.taxes.map((tax: any, index: number) => (
                          <tr
                            key={tax.id}
                            className={`border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors ${
                              index % 2 === 0 ? 'bg-white dark:bg-green-950/30' : 'bg-gray-50/50 dark:bg-green-900/30'
                            }`}
                          >
                            <td className="py-4 px-4 text-sm text-foreground">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                {new Date(tax.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-foreground max-w-xs">
                              <div className="font-medium">{tax.description}</div>
                              {tax.reference && (
                                <div className="text-xs text-muted-foreground mt-1">Ref: {tax.reference}</div>
                              )}
                            </td>
                            <td className="py-4 px-4 text-sm font-semibold text-foreground text-right">
                              {formatAmount(tax.totalPaid)}
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground text-right">
                              {formatAmount(tax.itemCost)}
                            </td>
                            <td className="py-4 px-4 text-sm font-bold text-blue-600 dark:text-blue-400 text-right">
                              <div className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                                {formatAmount(tax.taxAmount)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-green-800/50">
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, taxData.totalCount)}</span> of <span className="font-semibold text-foreground">{taxData.totalCount}</span> records
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-9 h-9 rounded-lg ${
                                  currentPage === pageNum
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-bold'
                                    : 'bg-gray-100 dark:bg-green-900/30 text-foreground hover:bg-gray-200 dark:hover:bg-green-800/40 font-medium'
                                } transition-all text-sm`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
              </>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
