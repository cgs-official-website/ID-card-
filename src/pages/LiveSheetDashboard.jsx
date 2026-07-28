import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Plus, Search, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { fetchLiveSheetsList, deleteLiveSheetObj } from '../utils/dbHelper';
import NotifyModal from '../components/NotifyModal';

const LiveSheetDashboard = () => {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    setLoading(true);
    const data = await fetchLiveSheetsList();
    setSheets(data);
    setLoading(false);
  };

  const handleCreateNew = () => {
    let nextNum = 1;
    const zunaSheets = sheets.filter(s => s.id && s.id.startsWith('ZUNASHEET'));
    if (zunaSheets.length > 0) {
      const nums = zunaSheets.map(s => {
        const numPart = s.id.replace('ZUNASHEET', '');
        const parsed = parseInt(numPart, 10);
        return isNaN(parsed) ? 0 : parsed;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const newId = `ZUNASHEET${nextNum.toString().padStart(3, '0')}`;
    
    navigate(`/live-sheets/edit/${newId}?new=true`);
  };

  const handleDelete = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setModalConfig({
      type: 'confirm',
      title: 'Delete Sheet',
      message: 'Are you sure you want to delete this spreadsheet? This action cannot be undone.',
      confirmText: 'Delete Sheet',
      onConfirm: async () => {
        await deleteLiveSheetObj(id);
        fetchSheets();
      }
    });
  };

  const filteredSheets = sheets.filter(sheet => 
    (sheet.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sheet.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 bg-transparent relative">
      {/* Control Actions Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Live Sheets</h2>
          <p className="text-gray-400 text-sm font-medium">Create, edit, and collaborate on spreadsheets directly</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleCreateNew}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white text-sm font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Sheet
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search sheets by title..."
            className="w-full bg-[#111111]/80 border border-[#222222] text-white text-sm rounded-xl focus:ring-green-500 focus:border-green-500 block pl-10 p-3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Sheets Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : filteredSheets.length === 0 ? (
        <div className="bg-[#111111]/80 backdrop-blur-md p-10 rounded-3xl border border-[#222222]/50 text-center">
          <Table className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Sheets Found</h3>
          <p className="text-gray-400 mb-6">You haven't created any live sheets yet, or no sheets match your search.</p>
          <button
            onClick={handleCreateNew}
            className="px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Your First Sheet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSheets.map(sheet => {
            const updatedDate = sheet.updatedAt ? new Date(sheet.updatedAt).toLocaleDateString() : 'Unknown';
            return (
              <Link 
                key={sheet.id}
                to={`/live-sheets/edit/${sheet.id}`}
                className="bg-[#181D30]/60 p-5 rounded-2xl border border-[#222222]/40 flex flex-col gap-4 hover:border-green-500/50 hover:bg-[#1A2235] transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-green-500/10 text-green-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Table className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-white text-base leading-snug truncate" title={sheet.title}>{sheet.title || 'Untitled Spreadsheet'}</h4>
                    <div className="text-[10px] text-gray-500 font-mono mt-1 truncate" title={sheet.id}>ID: {sheet.id}</div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  Updated: <span className="text-gray-300 font-bold">{updatedDate}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#222222]/30 mt-auto">
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/live-sheets/edit/${sheet.id}`); }}
                    className="flex items-center justify-center gap-1 p-2 rounded-lg bg-[#111111] hover:bg-green-500/10 border border-[#222222]/50 hover:border-green-500/30 text-[11px] font-bold text-gray-400 hover:text-green-500 transition-all shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Edit</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      const url = `${window.location.origin}/public/sheet/${sheet.id}`;
                      navigator.clipboard.writeText(url);
                      setModalConfig({
                        type: 'success',
                        title: 'Link Copied!',
                        message: 'Public share link has been copied to your clipboard.'
                      });
                    }}
                    className="flex items-center justify-center gap-1 p-2 rounded-lg bg-[#111111] hover:bg-blue-500/10 border border-[#222222]/50 hover:border-blue-500/30 text-[11px] font-bold text-gray-400 hover:text-blue-500 transition-all shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Share</span>
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/live-sheets/${sheet.id}/responses`); }}
                    className="flex items-center justify-center gap-1 p-2 rounded-lg bg-[#111111] hover:bg-yellow-500/10 border border-[#222222]/50 hover:border-yellow-500/30 text-[11px] font-bold text-gray-400 hover:text-yellow-500 transition-all shadow-sm"
                  >
                    <Table className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Data</span>
                  </button>
                  <button 
                    onClick={(e) => handleDelete(sheet.id, e)}
                    className="flex items-center justify-center gap-1 p-2 rounded-lg bg-[#111111] hover:bg-red-500/10 border border-[#222222]/50 hover:border-red-500/30 text-[11px] font-bold text-gray-400 hover:text-red-500 transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Delete</span>
                  </button>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {modalConfig && (
        <NotifyModal
          {...modalConfig}
          onClose={() => setModalConfig(null)}
        />
      )}
    </div>
  );
};

export default LiveSheetDashboard;
