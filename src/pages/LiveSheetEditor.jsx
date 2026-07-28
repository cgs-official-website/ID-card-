import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { ArrowLeft, Save, Loader2, Check, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchLiveSheetDetails, saveLiveSheetObj, getLiveSheetOperationsQuery, addLiveSheetOperation } from '../utils/dbHelper';
import { onSnapshot, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';
import NotifyModal from '../components/NotifyModal';

const LiveSheetEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const [title, setTitle] = useState(isNew ? 'Untitled Spreadsheet' : '');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);
  
  const workbookRef = useRef(null);
  const clientId = useRef(uuidv4());
  
  // Track if we are currently applying an op to prevent infinite loops
  const isApplyingOp = useRef(false);

  useEffect(() => {
    if (!isNew && id) {
      loadSheet();
    } else {
      setSheetData([{ name: "Sheet1", status: 1, order: 0, celldata: [] }]);
    }
  }, [id, isNew]);

  const loadSheet = async () => {
    setLoading(true);
    const data = await fetchLiveSheetDetails(id);
    if (data) {
      setTitle(data.title || 'Untitled Spreadsheet');
      // Handle stringified JSON to prevent Firestore nesting limits
      setSheetData(typeof data.data === 'string' ? JSON.parse(data.data) : data.data || [{ name: "Sheet1", status: 1, order: 0, celldata: [] }]);
    } else {
      setSheetData([{ name: "Sheet1", status: 1, order: 0, celldata: [] }]);
    }
    setLoading(false);
  };

  // Real-time synchronization
  useEffect(() => {
    if (!id || loading || !workbookRef.current) return;

    const q = getLiveSheetOperationsQuery(id);
    if (!q) return;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const opData = change.doc.data();
          // If the op came from another client, apply it to our local workbook
          if (opData.clientId !== clientId.current && opData.ops) {
            try {
              isApplyingOp.current = true;
              workbookRef.current.applyOp(opData.ops);
            } catch (err) {
              console.error("Error applying operation:", err);
            } finally {
              isApplyingOp.current = false;
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [id, loading]);

  const handleOp = (ops) => {
    if (isApplyingOp.current) return; // Don't broadcast ops that we just received from others
    
    // Broadcast our operations to Firebase
    addLiveSheetOperation(id, ops, clientId.current);
  };

  const handleSave = async () => {
    if (!workbookRef.current) return;
    
    setSaving(true);
    
    // get all sheets data
    const allSheets = workbookRef.current.getAllSheets();
    
    // Remove the large 2D 'data' array to save space and avoid 1MB Firestore limit.
    // FortuneSheet automatically reconstructs 'data' from 'celldata' on load.
    const minimalSheets = allSheets.map(sheet => {
      const { data, ...rest } = sheet;
      return rest;
    });
    
    // Save to Firebase (stringify to avoid Firestore nested array limitations)
    const result = await saveLiveSheetObj(id, {
      title: title || 'Untitled Spreadsheet',
      data: JSON.stringify(minimalSheets)
    });

    if (result.success) {
      // Clean up consolidated operations
      try {
        const opsQuery = getLiveSheetOperationsQuery(id);
        if (opsQuery) {
          const opsSnapshot = await getDocs(opsQuery);
          opsSnapshot.docs.forEach(async (d) => {
            await deleteDoc(doc(db, `liveSheets/${id}/operations`, d.id));
          });
        }
      } catch (err) {
        console.error("Error clearing operations:", err);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setModalConfig({
        type: 'error',
        title: 'Save Failed',
        message: `Failed to save the spreadsheet: ${result.error || 'Unknown error'}`
      });
    }
    setSaving(false);
  };

  const handleExport = () => {
    if (!workbookRef.current) return;
    try {
      const sheets = workbookRef.current.getAllSheets();
      const wb = XLSX.utils.book_new();
      
      sheets.forEach(sheet => {
        let data2D = [];
        
        // Convert fortune-sheet data structure to a plain 2D array
        if (sheet.data && sheet.data.length > 0) {
          data2D = sheet.data.map(row => {
            if (!row) return [];
            return row.map(cell => {
              if (!cell) return '';
              return cell.m || cell.v || '';
            });
          });
        } else if (sheet.celldata && sheet.celldata.length > 0) {
          let maxR = 0, maxC = 0;
          sheet.celldata.forEach(cell => {
            if (cell.r > maxR) maxR = cell.r;
            if (cell.c > maxC) maxC = cell.c;
          });
          for (let r = 0; r <= maxR; r++) {
            data2D[r] = [];
            for (let c = 0; c <= maxC; c++) {
              data2D[r][c] = '';
            }
          }
          sheet.celldata.forEach(cell => {
            if (cell.v) {
              data2D[cell.r][cell.c] = cell.v.m || cell.v.v || '';
            }
          });
        } else {
           data2D = [['']];
        }
        
        const ws = XLSX.utils.aoa_to_sheet(data2D);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name || 'Sheet');
      });
      
      XLSX.writeFile(wb, `${title || 'Spreadsheet'}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      setModalConfig({
        type: 'error',
        title: 'Export Failed',
        message: 'Could not generate the Excel file. The sheet might be empty or corrupted.'
      });
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#181D30]">
      {/* Editor Header (Dark Mode Premium Style) */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#111111] border-b border-[#222222]">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/live-sheets')}
            className="p-2 hover:bg-[#222222] rounded-full transition-colors text-gray-400 hover:text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold text-white bg-transparent border border-transparent hover:border-[#333333] focus:border-yellow-500 focus:bg-black/30 rounded-lg px-3 py-1 outline-none transition-all w-80 placeholder:text-gray-600"
              placeholder="Untitled Spreadsheet"
            />

          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#222222] hover:bg-[#333333] text-gray-300 hover:text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer border border-[#333333]"
            title="Download as Excel"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {saved && (
            <span className="text-xs text-green-400 flex items-center gap-1.5 font-bold bg-green-500/10 px-3 py-1.5 rounded-lg">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-6 py-2.5 rounded-xl font-extrabold text-sm shadow-lg shadow-yellow-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Sheet'}
          </button>
        </div>
      </div>

      {/* Spreadsheet Container */}
      <div className="flex-1 relative bg-white">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111111] z-50">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
              <div className="text-yellow-500 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Live Sheet...</div>
            </div>
          </div>
        ) : sheetData ? (
          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <Workbook
              ref={workbookRef}
              data={sheetData}
              onOp={handleOp}
            />
          </div>
        ) : null}
      </div>

      {modalConfig && (
        <NotifyModal
          {...modalConfig}
          onClose={() => setModalConfig(null)}
        />
      )}
    </div>
  );
};

export default LiveSheetEditor;
