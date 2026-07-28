import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Table as TableIcon, FileSpreadsheet, Eye, Search, Download } from 'lucide-react';
import { fetchLiveSheetDetails, fetchLiveSheetResponses } from '../utils/dbHelper';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import * as XLSX from 'xlsx';

const LiveSheetResponses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingResponse, setViewingResponse] = useState(null);
  
  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const tmpl = await fetchLiveSheetDetails(id);
    setTemplate(tmpl);
    
    if (tmpl) {
      const resps = await fetchLiveSheetResponses(id);
      setResponses(resps);
    }
    setLoading(false);
  };

  const handleViewResponse = (response) => {
    const parsedData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    setViewingResponse({ ...response, parsedData });
  };

  const handleExport = (response) => {
    try {
      const parsedData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      const wb = XLSX.utils.book_new();
      
      parsedData.forEach(sheet => {
        let data2D = [];
        if (sheet.data && sheet.data.length > 0) {
          data2D = sheet.data.map(row => (row || []).map(cell => cell ? (cell.m || cell.v || '') : ''));
        } else if (sheet.celldata && sheet.celldata.length > 0) {
          let maxR = 0, maxC = 0;
          sheet.celldata.forEach(cell => {
            if (cell.r > maxR) maxR = cell.r;
            if (cell.c > maxC) maxC = cell.c;
          });
          for (let r = 0; r <= maxR; r++) {
            data2D[r] = [];
            for (let c = 0; c <= maxC; c++) { data2D[r][c] = ''; }
          }
          sheet.celldata.forEach(cell => {
            if (cell.v) data2D[cell.r][cell.c] = cell.v.m || cell.v.v || '';
          });
        } else {
           data2D = [['']];
        }
        
        const ws = XLSX.utils.aoa_to_sheet(data2D);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name || 'Sheet');
      });
      
      XLSX.writeFile(wb, `Submission_${response.id}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to export Excel file.");
    }
  };

  const filteredResponses = responses.filter(r => 
    (r.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.submittedAt || '').includes(searchTerm)
  );

  if (viewingResponse) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-[#181D30]">
        <div className="flex items-center justify-between px-6 py-3 bg-[#111111] border-b border-[#222222]">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setViewingResponse(null)}
              className="p-2 hover:bg-[#222222] rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white">Viewing Submission: {template?.title}</h1>
              <p className="text-[11px] font-bold text-gray-400 uppercase mt-0.5">
                Submitted: {new Date(viewingResponse.submittedAt).toLocaleString()} | ID: {viewingResponse.id}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-1 relative bg-white">
          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <Workbook data={viewingResponse.parsedData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/live-sheets')}
          className="p-2 hover:bg-[#222222] rounded-full transition-colors text-gray-400 hover:text-white border border-[#222222]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight mb-1">Sheet Submissions</h2>
          <p className="text-gray-400 text-sm font-medium">Viewing responses for: <span className="text-yellow-400 font-bold">{template?.title || 'Unknown Template'}</span></p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full md:w-80">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4.5 w-4.5 text-gray-500" />
        </div>
        <input
          type="text"
          placeholder="Search by ID or Date..."
          className="w-full bg-[#111111]/80 border border-[#222222] text-white text-sm rounded-xl focus:ring-yellow-500 focus:border-yellow-500 block pl-10 p-3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Responses List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="bg-[#111111]/80 backdrop-blur-md p-10 rounded-3xl border border-[#222222]/50 text-center">
          <FileSpreadsheet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Submissions Found</h3>
          <p className="text-gray-400">Nobody has submitted this sheet yet.</p>
        </div>
      ) : (
        <div className="bg-[#111111]/80 backdrop-blur-md rounded-3xl border border-[#222222]/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-[#222222]/50">
                <tr>
                  <th className="px-6 py-4 font-black tracking-wider">Submission ID</th>
                  <th className="px-6 py-4 font-black tracking-wider">Date Submitted</th>
                  <th className="px-6 py-4 font-black tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]/50">
                {filteredResponses.map((resp) => (
                  <tr key={resp.id} className="hover:bg-[#1A1A1A] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                          <TableIcon className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-gray-400 group-hover:text-white transition-colors">{resp.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {new Date(resp.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleExport(resp)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold transition-all text-xs"
                          title="Download Excel"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewResponse(resp)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 font-bold transition-all text-xs"
                        >
                          <Eye className="w-4 h-4" /> View Sheet
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSheetResponses;
