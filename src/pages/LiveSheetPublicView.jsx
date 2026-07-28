import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { Save, Loader2, Check, FileSpreadsheet } from 'lucide-react';
import { fetchLiveSheetDetails, submitLiveSheetResponse } from '../utils/dbHelper';
import NotifyModal from '../components/NotifyModal';

const LiveSheetPublicView = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sheetData, setSheetData] = useState(null);
  const [modalConfig, setModalConfig] = useState(null);
  const workbookRef = useRef(null);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    setLoading(true);
    const data = await fetchLiveSheetDetails(id);
    if (data && !data.error) {
      setTitle(data.title || 'Untitled Spreadsheet');
      // Handle stringified JSON properly
      const parsedData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
      if (parsedData && Array.isArray(parsedData)) {
         setSheetData(parsedData);
      } else {
         setSheetData([{ name: "Sheet1", status: 1, order: 0, celldata: [] }]);
      }
    } else {
      setModalConfig({
        type: 'error',
        title: 'Template Not Found',
        message: data?.error ? `Database Error: ${data.error}` : 'The requested spreadsheet template could not be found. Please check if the link is correct.'
      });
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!workbookRef.current) return;
    
    setSubmitting(true);
    
    // get all sheets data
    const allSheets = workbookRef.current.getAllSheets();
    
    // Remove the large 2D 'data' array to save space
    const minimalSheets = allSheets.map(sheet => {
      const { data, ...rest } = sheet;
      return rest;
    });
    
    // Submit as a response
    const result = await submitLiveSheetResponse(id, {
      title: title || 'Untitled Spreadsheet',
      data: JSON.stringify(minimalSheets)
    });

    if (result.success) {
      setSubmitted(true);
      setModalConfig({
        type: 'success',
        title: 'Submitted Successfully',
        message: 'Your spreadsheet has been submitted to the administration successfully!'
      });
    } else {
      setModalConfig({
        type: 'error',
        title: 'Submission Failed',
        message: `Failed to submit the spreadsheet: ${result.error || 'Unknown error'}`
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#181D30]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#111111] border-b border-[#222222]">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-yellow-500/10 rounded-xl">
             <FileSpreadsheet className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white truncate max-w-sm md:max-w-md">{title}</h1>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Public Submission Template</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {submitted ? (
            <span className="text-xs text-green-400 flex items-center gap-1.5 font-bold bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
              <Check className="w-4 h-4" /> Submitted Successfully
            </span>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || loading || !sheetData}
              className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black px-6 py-2.5 rounded-xl font-extrabold text-sm shadow-lg shadow-yellow-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {submitting ? 'Submitting...' : 'Submit Sheet'}
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Container */}
      <div className="flex-1 relative bg-white">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111111] z-50">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
              <div className="text-yellow-500 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Template...</div>
            </div>
          </div>
        ) : sheetData ? (
          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <Workbook
              ref={workbookRef}
              data={sheetData}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#111111] z-50">
             <FileSpreadsheet className="w-16 h-16 text-gray-700 mb-4" />
             <h2 className="text-xl font-bold text-gray-400">Template Not Found</h2>
          </div>
        )}
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

export default LiveSheetPublicView;
