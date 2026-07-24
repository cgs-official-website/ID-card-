import React, { useEffect, useState } from "react";
import { getInvoices, deleteInvoice } from "../firebase/invoiceService";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import { Download, Trash2, Search, Loader2, ReceiptText, CreditCard, IndianRupee, TrendingUp } from "lucide-react";
import NotifyModal from "../components/NotifyModal";

// Helper: Extract valid non-zero amount for an invoice, defaulting to 3500 for legacy/missing paid invoices
export const getInvoiceAmount = (inv) => {
  if (!inv) return 3500;
  const raw = inv.baseAmount ?? inv.base_amount ?? inv.totalAmount ?? inv.total_amount ?? inv.amount ?? inv.price ?? inv.fee ?? inv.cost ?? inv.total;
  const num = Number(raw);
  return (!isNaN(num) && num > 0) ? num : 3500;
};

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState("All");
  const [notify, setNotify] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchInvoices = async () => {
    setLoading(true);
    const result = await getInvoices();
    if (result.success) {
      setInvoices(result.invoices);
      setFilteredInvoices(result.invoices);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const results = invoices.filter(inv => {
      const matchesSearch = 
        inv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.college?.toLowerCase().includes(searchTerm.toLowerCase());

      const invAmount = getInvoiceAmount(inv);
      
      let matchesTier = true;
      if (selectedTierFilter === "3500") {
        matchesTier = invAmount === 3500;
      } else if (selectedTierFilter === "4130") {
        matchesTier = invAmount === 4130;
      } else if (selectedTierFilter === "Other") {
        matchesTier = invAmount !== 3500 && invAmount !== 4130;
      }

      return matchesSearch && matchesTier;
    });
    setFilteredInvoices(results);
    setCurrentPage(1); // Reset to first page on search or filter change
  }, [searchTerm, selectedTierFilter, invoices]);

  const handleDelete = (id) => {
    setPendingDelete(id);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const result = await deleteInvoice(pendingDelete);
    if (result.success) {
      setNotify({
        type: "success",
        title: "Deleted",
        message: "Invoice record has been deleted successfully."
      });
      fetchInvoices();
    } else {
      setNotify({
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete the invoice record."
      });
    }
    setPendingDelete(null);
  };

  const handleDownload = async (invoice) => {
    await generateInvoicePDF(invoice);
  };

  // Helper: compute financial, tier, and course statistics safely
  const totalRevenue = invoices.reduce((sum, inv) => sum + getInvoiceAmount(inv), 0);

  const count3500 = invoices.filter(inv => getInvoiceAmount(inv) === 3500).length;
  const revenue3500 = count3500 * 3500;

  const count4130 = invoices.filter(inv => getInvoiceAmount(inv) === 4130).length;
  const revenue4130 = count4130 * 4130;

  const countOther = invoices.filter(inv => {
    const amt = getInvoiceAmount(inv);
    return amt !== 3500 && amt !== 4130;
  }).length;
  const revenueOther = invoices.reduce((sum, inv) => {
    const amt = getInvoiceAmount(inv);
    return (amt !== 3500 && amt !== 4130) ? sum + amt : sum;
  }, 0);

  const courseMetrics = invoices.reduce((acc, inv) => {
    const course = inv.course || "Other";
    const amt = getInvoiceAmount(inv);
    if (!acc[course]) {
      acc[course] = { count: 0, revenue: 0 };
    }
    acc[course].count += 1;
    acc[course].revenue += amt;
    return acc;
  }, {});

  // Pagination Calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  return (
    <div className="space-y-8 py-6">
      {/* Stats Section */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Invoices Card */}
          <div 
            onClick={() => setSelectedTierFilter("All")}
            className={`premium-card cursor-pointer p-6 flex items-center justify-between group ${
              selectedTierFilter === "All"
                ? "border-yellow-500 shadow-lg shadow-yellow-500/20 bg-[#1A1A1A]"
                : "border-[#222222]/50 hover:border-[#3E4566] hover:bg-[#161616]"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-bold uppercase tracking-wider text-xs">Total Invoices</p>
                {selectedTierFilter === "All" && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">Active</span>
                )}
              </div>
              <h3 className="text-4xl font-black text-white">{invoices.length}</h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">All generated invoices</p>
            </div>
            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
              <ReceiptText className="w-7 h-7 text-yellow-400" />
            </div>
          </div>

          {/* Accurate Revenue Card */}
          <div className="premium-card p-6 flex items-center justify-between">
            <div>
              <p className="text-white font-bold uppercase tracking-wider text-xs mb-1">Accurate Total Revenue</p>
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-teal-300">
                ₹ {totalRevenue.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-gray-400 mt-1 font-medium">Total payment accumulated</p>
            </div>
            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
              <IndianRupee className="w-7 h-7 text-yellow-400" />
            </div>
          </div>

          {/* ₹3,500 Payment Tier Card */}
          <div 
            onClick={() => setSelectedTierFilter("3500")}
            className={`premium-card cursor-pointer p-6 flex items-center justify-between group ${
              selectedTierFilter === "3500"
                ? "border-yellow-500 shadow-lg shadow-yellow-500/20 bg-[#1A1A1A]"
                : "border-[#222222]/50 hover:border-[#3E4566] hover:bg-[#161616]"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-bold uppercase tracking-wider text-xs">₹3,500 Paid</p>
                {selectedTierFilter === "3500" && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">Active</span>
                )}
              </div>
              <h3 className="text-3xl font-black text-white">{count3500} <span className="text-sm text-gray-400 font-normal">paid</span></h3>
              <p className="text-xs font-bold text-yellow-400 mt-1">₹ {revenue3500.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
              <CreditCard className="w-7 h-7 text-yellow-400" />
            </div>
          </div>

          {/* ₹4,130 Payment Tier Card */}
          <div 
            onClick={() => setSelectedTierFilter("4130")}
            className={`premium-card cursor-pointer p-6 flex items-center justify-between group ${
              selectedTierFilter === "4130"
                ? "border-yellow-500 shadow-lg shadow-yellow-500/20 bg-[#1A1A1A]"
                : "border-[#222222]/50 hover:border-[#3E4566] hover:bg-[#161616]"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-bold uppercase tracking-wider text-xs">₹4,130 Paid (GST)</p>
                {selectedTierFilter === "4130" && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">Active</span>
                )}
              </div>
              <h3 className="text-3xl font-black text-white">{count4130} <span className="text-sm text-gray-400 font-normal">paid</span></h3>
              <p className="text-xs font-bold text-yellow-400 mt-1">₹ {revenue4130.toLocaleString("en-IN")}</p>
            </div>
            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center border border-yellow-500/20">
              <TrendingUp className="w-7 h-7 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Course Breakdown stats */}
        {Object.keys(courseMetrics).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">Invoices & Revenue by Course</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(courseMetrics).map(([course, stats]) => (
                <div key={course} className="glass-panel p-5 rounded-3xl flex items-center justify-between hover:shadow-yellow-500/5 transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1 truncate pr-2" title={course}>{course}</p>
                    <h4 className="text-2xl font-black text-white leading-none mt-1">{stats.count} <span className="text-xs font-medium text-gray-400">invoices</span></h4>
                    <p className="text-xs font-bold text-yellow-400 mt-1.5">₹ {stats.revenue.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-black text-yellow-400 border border-[#222222]/50 flex-shrink-0">
                    {Math.round((stats.count / (invoices.length || 1)) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Header and Search */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Invoice History</h2>
          <p className="text-white text-sm font-medium">Manage and re-download previous invoices</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Tier Filter Pills */}
          <div className="flex items-center gap-1 bg-[#111111]/80 p-1.5 rounded-2xl border border-[#222222]/50">
            <button
              onClick={() => setSelectedTierFilter('All')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTierFilter === 'All'
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]/50'
              }`}
            >
              All ({invoices.length})
            </button>
            <button
              onClick={() => setSelectedTierFilter('3500')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTierFilter === '3500'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]/50'
              }`}
            >
              ₹3,500 ({count3500})
            </button>
            <button
              onClick={() => setSelectedTierFilter('4130')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTierFilter === '4130'
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]/50'
              }`}
            >
              ₹4,130 ({count4130})
            </button>
          </div>

          <div className="relative flex-1 lg:flex-none lg:w-72">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search by name, course..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table view */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/60 text-white font-bold border-b border-[#222222]/50">
              <tr>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Candidate</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Course & College</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Amount</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Generated Date</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]/30">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col justify-center items-center gap-4">
                      <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                      <span className="font-medium">Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col items-center gap-2">
                      <ReceiptText className="w-10 h-10 text-white mb-2" />
                      <p className="font-medium text-gray-300">
                        {searchTerm ? `No invoices match "${searchTerm}"` : "No invoices generated yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((inv) => {
                  const invAmount = getInvoiceAmount(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-[#1A1A1A]/50 transition-colors group">
                      <td className="px-8 py-5">
                        <span className="font-bold text-gray-100 text-base">{inv.name}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-white">{inv.course}</div>
                        <div className="text-white text-[10px] uppercase font-black tracking-tight">{inv.college || "N/A"}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-black text-yellow-400 border border-yellow-500/20">
                          ₹ {invAmount.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-gray-300 font-medium">
                        {inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "Recent"}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDownload(inv)}
                            className="p-2 text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all"
                            title="Download PDF"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#222222]/30 bg-black/20">
            <div className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-semibold text-white">{Math.min(indexOfLastItem, filteredInvoices.length)}</span> of{" "}
              <span className="font-semibold text-white">{filteredInvoices.length}</span> invoices
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-[#222222]/50 text-gray-300 hover:bg-[#1A1A1A] disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg shadow-yellow-500/20"
                      : "border border-[#222222]/50 text-gray-300 hover:bg-[#1A1A1A]"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-[#222222]/50 text-gray-300 hover:bg-[#1A1A1A] disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {notify && (
        <NotifyModal
          type={notify.type}
          title={notify.title}
          message={notify.message}
          onClose={() => setNotify(null)}
        />
      )}
      {pendingDelete && (
        <NotifyModal
          type="confirm"
          title="Delete Invoice?"
          message="Are you sure you want to delete this invoice record? This action cannot be undone."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onClose={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
};

export default InvoiceHistory;
