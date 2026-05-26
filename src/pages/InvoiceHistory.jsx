import React, { useEffect, useState } from "react";
import { getInvoices, deleteInvoice } from "../firebase/invoiceService";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import { Download, Trash2, Search, Loader2, ReceiptText, CreditCard } from "lucide-react";
import NotifyModal from "../components/NotifyModal";

const InvoiceHistory = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
    const results = invoices.filter(inv => 
      inv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.college?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(results);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, invoices]);

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

  // Helper: compute course count statistics
  const courseCounts = invoices.reduce((acc, inv) => {
    const course = inv.course || "Other";
    acc[course] = (acc[course] || 0) + 1;
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
        <div className="grid grid-cols-1 gap-6">
          {/* Total Invoices Card */}
          <div className="bg-[#131726]/80 backdrop-blur-md p-6 rounded-3xl border border-[#2D334A]/50 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between">
            <div>
              <p className="text-white font-bold uppercase tracking-wider text-xs mb-1">Total Invoices Generated</p>
              <h3 className="text-4xl font-black text-white">{invoices.length}</h3>
            </div>
            <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center border border-violet-500/20">
              <ReceiptText className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Course Breakdown stats */}
        {Object.keys(courseCounts).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Invoices by Course</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(courseCounts).map(([course, count]) => (
                <div key={course} className="bg-[#131726]/50 backdrop-blur-md p-5 rounded-3xl border border-[#2D334A]/30 shadow-sm flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1 truncate pr-2" title={course}>{course}</p>
                    <h4 className="text-2xl font-black text-white leading-none mt-1">{count}</h4>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-[#0B0F19] text-violet-400 border border-[#2D334A]/50 flex-shrink-0">
                    {Math.round((count / invoices.length) * 100)}%
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

        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search by name, course..."
            className="pl-12 w-full rounded-2xl border border-[#2D334A]/50 bg-[#131726]/50 px-5 py-3.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all placeholder:text-slate-500 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table view */}
      <div className="bg-[#131726]/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-[#2D334A]/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#0B0F19]/60 text-white font-bold border-b border-[#2D334A]/50">
              <tr>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Candidate</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Course & College</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px]">Generated Date</th>
                <th className="px-8 py-5 uppercase tracking-wider text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D334A]/30">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col justify-center items-center gap-4">
                      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                      <span className="font-medium">Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-8 py-16 text-center text-white">
                    <div className="flex flex-col items-center gap-2">
                      <ReceiptText className="w-10 h-10 text-white mb-2" />
                      <p className="font-medium text-slate-300">
                        {searchTerm ? `No invoices match "${searchTerm}"` : "No invoices generated yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#1E243D]/50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="font-bold text-slate-100 text-base">{inv.name}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-white">{inv.course}</div>
                      <div className="text-white text-[10px] uppercase font-black tracking-tight">{inv.college || "N/A"}</div>
                    </td>
                    <td className="px-8 py-5 text-slate-300 font-medium">
                      {inv.createdAt?.toDate ? inv.createdAt.toDate().toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "Recent"}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownload(inv)}
                          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                          title="Download PDF"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(inv.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-[#2D334A]/30 bg-[#0B0F19]/20">
            <div className="text-sm text-slate-400">
              Showing <span className="font-semibold text-white">{indexOfFirstItem + 1}</span> to{" "}
              <span className="font-semibold text-white">{Math.min(indexOfLastItem, filteredInvoices.length)}</span> of{" "}
              <span className="font-semibold text-white">{filteredInvoices.length}</span> invoices
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-[#2D334A]/50 text-slate-300 hover:bg-[#1E243D] disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    currentPage === page
                      ? "bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20"
                      : "border border-[#2D334A]/50 text-slate-300 hover:bg-[#1E243D]"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-[#2D334A]/50 text-slate-300 hover:bg-[#1E243D] disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
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
