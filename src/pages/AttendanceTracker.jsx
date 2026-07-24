import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { 
  Upload, FileSpreadsheet, Search, Download, User, Calendar, CheckCircle, 
  XCircle, Clock, ChevronRight, RefreshCw, Sparkles, Filter, Info, 
  ArrowRight, FileDown, Eye, X, ClipboardCheck, Users, Archive, FolderOpen
} from 'lucide-react';

const AttendanceTracker = () => {
  const [loading, setLoading] = useState(false);
  const [fileData, setFileData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [parsedFiles, setParsedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isZip, setIsZip] = useState(false);
  const [zipFilesList, setZipFilesList] = useState([]);
  
  // Mapping State
  const [mappingStep, setMappingStep] = useState(false);
  const [mappings, setMappings] = useState({
    name: '',
    id: '',
    date: '',
    status: '',
    checkIn: '',
    checkOut: '',
    workingHours: ''
  });

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Tab State: 'dashboard' | 'roster' | 'days' | 'records'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Details Modal States
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [daySearch, setDaySearch] = useState('');

  const fileInputRef = useRef(null);

  // Parse Excel Date Serial Number to readable string
  const formatExcelDate = (excelDate) => {
    if (!excelDate) return 'N/A';
    if (excelDate instanceof Date) {
      return excelDate.toLocaleDateString();
    }
    // If it's a number (Excel date serial)
    if (!isNaN(excelDate) && typeof excelDate === 'number') {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toLocaleDateString();
    }
    return String(excelDate);
  };

  // Parse Date from Filename (fallback)
  const parseDateFromFilename = (filename) => {
    let name = filename.split('/').pop().split('\\').pop().replace(/\.[^/.]+$/, "");
    let cleanName = name.replace(/[-_.]/g, ' ').trim();
    
    // Check if cleanName is a valid parseable date string
    const timestamp = Date.parse(cleanName);
    if (!isNaN(timestamp)) {
      return new Date(timestamp).toLocaleDateString();
    }
    
    // Try formats like DD MM YYYY or YYYY MM DD
    const numMatches = cleanName.match(/\d+/g);
    if (numMatches && numMatches.length >= 3) {
      const p1 = parseInt(numMatches[0]);
      const p2 = parseInt(numMatches[1]);
      const p3 = parseInt(numMatches[2]);
      
      // Case 1: YYYY MM DD
      if (numMatches[0].length === 4) {
        const date = new Date(p1, p2 - 1, p3);
        if (!isNaN(date.getTime())) return date.toLocaleDateString();
      }
      // Case 2: DD MM YYYY or MM DD YYYY
      if (numMatches[2].length === 4) {
        if (p2 <= 12) {
          const date = new Date(p3, p2 - 1, p1);
          if (!isNaN(date.getTime())) return date.toLocaleDateString();
        }
      }
    }

    // Month name matcher fallback
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const nameLower = cleanName.toLowerCase();
    for (let mIdx = 0; mIdx < months.length; mIdx++) {
      if (nameLower.includes(months[mIdx])) {
        const dayMatch = nameLower.match(/\b\d{1,2}\b/);
        if (dayMatch) {
          const day = parseInt(dayMatch[0]);
          const yearMatch = nameLower.match(/\b\d{4}\b/);
          const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
          const date = new Date(year, mIdx, day);
          if (!isNaN(date.getTime())) return date.toLocaleDateString();
        }
      }
    }

    return name; // Return cleaned filename text if unable to parse date
  };

  // Process data after mappings are confirmed
  const processParsedData = (filesList, currentMappings) => {
    setLoading(true);
    setTimeout(() => {
      try {
        const allRows = [];
        const processedFilesInfo = [];
        
        filesList.forEach((fileEntry, fileIdx) => {
          const workbook = XLSX.read(fileEntry.data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          const fileDate = parseDateFromFilename(fileEntry.name);
          
          rows.forEach((row, rowIdx) => {
            const nameVal = row[currentMappings.name] ? String(row[currentMappings.name]).trim() : 'Unknown';
            const idVal = currentMappings.id && row[currentMappings.id] ? String(row[currentMappings.id]).trim() : 'N/A';
            
            // If date column is mapped and exists in the row, use it. Otherwise fall back to filename date
            const dateVal = currentMappings.date && row[currentMappings.date] 
              ? formatExcelDate(row[currentMappings.date]) 
              : fileDate;
              
            const statusVal = currentMappings.status && row[currentMappings.status] 
              ? String(row[currentMappings.status]).trim() 
              : 'Present';
              
            const checkInVal = currentMappings.checkIn && row[currentMappings.checkIn] ? String(row[currentMappings.checkIn]).trim() : 'N/A';
            const checkOutVal = currentMappings.checkOut && row[currentMappings.checkOut] ? String(row[currentMappings.checkOut]).trim() : 'N/A';
            const workingHoursVal = currentMappings.workingHours && row[currentMappings.workingHours] ? String(row[currentMappings.workingHours]).trim() : 'N/A';

            allRows.push({
              key: `${fileIdx}-${rowIdx}`,
              name: nameVal,
              employeeId: idVal,
              date: dateVal,
              status: statusVal,
              checkIn: checkInVal,
              checkOut: checkOutVal,
              workingHours: workingHoursVal,
              sourceFile: fileEntry.name.split('/').pop()
            });
          });

          processedFilesInfo.push({
            filename: fileEntry.name.split('/').pop(),
            date: fileDate,
            recordCount: rows.length
          });
        });

        setParsedRows(allRows);
        setParsedFiles(processedFilesInfo);
        setMappingStep(false);
      } catch (err) {
        console.error("Error processing mapping:", err);
        alert("Failed to parse data with selected column mappings.");
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  // Attempt auto mapping headers to common keys
  const autoMapHeaders = (detectedHeaders) => {
    const newMappings = {
      name: '',
      id: '',
      date: '',
      status: '',
      checkIn: '',
      checkOut: '',
      workingHours: ''
    };

    const headerLower = detectedHeaders.map(h => String(h).toLowerCase().trim());

    // Match patterns
    const namePatterns = ['name', 'employee name', 'emp name', 'emp_name', 'user', 'username', 'candidate name'];
    const idPatterns = ['id', 'emp id', 'employee id', 'emp_id', 'code', 'employee code', 'staff id'];
    const datePatterns = ['date', 'attendance date', 'day', 'date/time', 'attendance_date'];
    const statusPatterns = ['status', 'attendance status', 'attendance', 'present/absent', 'present'];
    const checkInPatterns = ['check in', 'checkin', 'in time', 'in_time', 'time in', 'start time'];
    const checkOutPatterns = ['check out', 'checkout', 'out time', 'out_time', 'time out', 'end time'];
    const hoursPatterns = ['hours', 'working hours', 'duration', 'work hours', 'hours worked', 'time worked'];

    const findMatch = (patterns) => {
      for (const pattern of patterns) {
        const idx = headerLower.findIndex(h => h.includes(pattern) || pattern.includes(h));
        if (idx !== -1) return detectedHeaders[idx];
      }
      return '';
    };

    newMappings.name = findMatch(namePatterns) || detectedHeaders[0];
    newMappings.id = findMatch(idPatterns);
    newMappings.date = findMatch(datePatterns); // if empty, fallback to file date
    newMappings.status = findMatch(statusPatterns);
    newMappings.checkIn = findMatch(checkInPatterns);
    newMappings.checkOut = findMatch(checkOutPatterns);
    newMappings.workingHours = findMatch(hoursPatterns);

    setMappings(newMappings);
    setMappingStep(true);
  };

  // File Upload Handler
  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setFileName(file.name);

    try {
      const isZipFile = file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';
      setIsZip(isZipFile);

      if (isZipFile) {
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);
        const filesList = [];
        const promises = [];

        loadedZip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && !relativePath.startsWith('__MACOSX/') && !relativePath.includes('.DS_Store')) {
            const ext = relativePath.split('.').pop().toLowerCase();
            if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
              promises.push((async () => {
                const arrayBuffer = await zipEntry.async("arraybuffer");
                filesList.push({
                  name: relativePath,
                  data: arrayBuffer
                });
              })());
            }
          }
        });

        await Promise.all(promises);

        if (filesList.length === 0) {
          alert("No Excel (.xlsx/.xls) or CSV files found inside the uploaded ZIP!");
          setLoading(false);
          return;
        }

        // Sort files by filename to parse dates in order
        filesList.sort((a, b) => a.name.localeCompare(b.name));
        setZipFilesList(filesList);

        // Read the first file to detect headers for mappings
        const workbook = XLSX.read(filesList[0].data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        if (rawJson.length === 0) {
          alert("The first Excel file in the ZIP is empty!");
          setLoading(false);
          return;
        }

        const detectedHeaders = Object.keys(rawJson[0]);
        setHeaders(detectedHeaders);
        setFileData(filesList); // Save lists as fileData reference
        autoMapHeaders(detectedHeaders);

      } else {
        // Single File Upload
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
            
            if (rawJson.length === 0) {
              alert("The uploaded excel sheet is empty!");
              setLoading(false);
              return;
            }

            const detectedHeaders = Object.keys(rawJson[0]);
            setHeaders(detectedHeaders);
            
            const singleFileEntry = [{
              name: file.name,
              data: new Uint8Array(data)
            }];
            
            setZipFilesList(singleFileEntry);
            setFileData(singleFileEntry);
            autoMapHeaders(detectedHeaders);
          } catch (err) {
            console.error("Error parsing single file:", err);
            alert("Failed to parse the Excel file. Make sure it is a valid format.");
          } finally {
            setLoading(false);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      console.error("Error reading ZIP/File:", err);
      alert("An error occurred while uploading the file.");
      setLoading(false);
    } finally {
      if (!isZip) {
        // Single file reader onload is async, so loading is disabled inside it.
        // For ZIP, loading is disabled here.
      }
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  // Mapping confirmation
  const handleConfirmMappings = (e) => {
    e.preventDefault();
    if (!mappings.name) {
      alert("Employee Name column is required!");
      return;
    }
    processParsedData(zipFilesList, mappings);
  };

  // Clear state
  const handleClear = () => {
    setFileData(null);
    setHeaders([]);
    setParsedRows([]);
    setParsedFiles([]);
    setFileName('');
    setIsZip(false);
    setZipFilesList([]);
    setMappingStep(false);
    setSelectedEmployee(null);
    setSelectedDay(null);
    setSearchTerm('');
    setSelectedStatus('All');
    setCurrentPage(1);
  };

  // Group data by employee to construct summary
  const getEmployeeGroupedData = () => {
    const employeesMap = {};
    parsedRows.forEach(row => {
      const empId = row.employeeId !== 'N/A' ? row.employeeId : '';
      const key = empId ? `${row.name} (${empId})` : row.name;
      
      if (!employeesMap[key]) {
        employeesMap[key] = {
          name: row.name,
          employeeId: row.employeeId,
          records: [],
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          totalWorkingHours: 0,
          hoursRecordCount: 0
        };
      }
      
      employeesMap[key].records.push(row);

      // Status metrics
      const statusText = row.status.toLowerCase();
      if (statusText.includes('present') || statusText === 'p') {
        employeesMap[key].presentCount++;
      } else if (statusText.includes('absent') || statusText === 'a') {
        employeesMap[key].absentCount++;
      } else if (statusText.includes('late') || statusText === 'l') {
        employeesMap[key].lateCount++;
        employeesMap[key].presentCount++; // late counts as presence
      } else {
        employeesMap[key].presentCount++;
      }

      if (row.workingHours !== 'N/A') {
        const hours = parseFloat(row.workingHours);
        if (!isNaN(hours)) {
          employeesMap[key].totalWorkingHours += hours;
          employeesMap[key].hoursRecordCount++;
        }
      }
    });

    // Sort by name
    return Object.values(employeesMap).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Group records by Day/File
  const getDaysGroupedData = () => {
    const daysMap = {};
    parsedRows.forEach(row => {
      const key = row.date;
      if (!daysMap[key]) {
        daysMap[key] = {
          date: row.date,
          filename: row.sourceFile,
          records: [],
          presentCount: 0,
          absentCount: 0,
          lateCount: 0
        };
      }

      daysMap[key].records.push(row);

      const statusText = row.status.toLowerCase();
      if (statusText.includes('present') || statusText === 'p') {
        daysMap[key].presentCount++;
      } else if (statusText.includes('absent') || statusText === 'a') {
        daysMap[key].absentCount++;
      } else if (statusText.includes('late') || statusText === 'l') {
        daysMap[key].lateCount++;
        daysMap[key].presentCount++;
      } else {
        daysMap[key].presentCount++;
      }
    });

    return Object.values(daysMap).sort((a, b) => {
      const d1 = new Date(a.date);
      const d2 = new Date(b.date);
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        return a.date.localeCompare(b.date);
      }
      return d1 - d2;
    });
  };

  const employeesSummaryList = getEmployeeGroupedData();
  const daysSummaryList = getDaysGroupedData();

  // Aggregate stats
  const totalRecordsCount = parsedRows.length;
  const uniqueEmployeesCount = employeesSummaryList.length;
  const averageAttendanceRate = uniqueEmployeesCount > 0 
    ? (employeesSummaryList.reduce((acc, emp) => acc + (emp.presentCount / emp.records.length), 0) / uniqueEmployeesCount * 100).toFixed(1)
    : 0;

  // Find date range
  const getDateRange = () => {
    if (parsedRows.length === 0) return 'N/A';
    try {
      const dates = parsedRows
        .map(r => new Date(r.date))
        .filter(d => !isNaN(d.getTime()));
      if (dates.length === 0) {
        // Try fallback to text dates
        const dateStrings = [...new Set(parsedRows.map(r => r.date))];
        if (dateStrings.length > 1) {
          return `${dateStrings[0]} - ${dateStrings[dateStrings.length - 1]}`;
        }
        return dateStrings[0] || 'N/A';
      }
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      return `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;
    } catch {
      return 'Multiple Dates';
    }
  };

  // Filter records
  const filteredRecords = parsedRows.filter(row => {
    const matchSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      row.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.sourceFile.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (selectedStatus === 'All') return matchSearch;
    if (selectedStatus === 'Present') {
      return matchSearch && (row.status.toLowerCase().includes('present') || row.status.toLowerCase() === 'p');
    }
    if (selectedStatus === 'Absent') {
      return matchSearch && (row.status.toLowerCase().includes('absent') || row.status.toLowerCase() === 'a');
    }
    if (selectedStatus === 'Late') {
      return matchSearch && (row.status.toLowerCase().includes('late') || row.status.toLowerCase() === 'l');
    }
    return matchSearch;
  });

  // Table pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredRecords.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);

  // Filter lists
  const filteredEmployeesList = employeesSummaryList.filter(emp => 
    emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  const filteredDaysList = daysSummaryList.filter(day => 
    day.date.toLowerCase().includes(daySearch.toLowerCase()) ||
    day.filename.toLowerCase().includes(daySearch.toLowerCase())
  );

  // Exporters
  const downloadIndividualData = (emp, format = 'xlsx') => {
    const formattedRecords = emp.records.map((r, i) => ({
      'S.No': i + 1,
      'Date': r.date,
      'Employee ID': r.employeeId,
      'Employee Name': r.name,
      'Check-In': r.checkIn,
      'Check-Out': r.checkOut,
      'Working Hours': r.workingHours,
      'Status': r.status,
      'Source File': r.sourceFile
    }));

    if (format === 'csv') {
      const headersStr = Object.keys(formattedRecords[0]).join(',');
      const rowsStr = formattedRecords.map(row => 
        Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
      ).join('\n');
      
      const csvContent = `data:text/csv;charset=utf-8,${headersStr}\n${rowsStr}`;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${emp.name.replace(/\s+/g, '_')}_Attendance.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(formattedRecords);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance Sheet');
      
      const maxColWidth = Object.keys(formattedRecords[0]).map(key => {
        let maxLen = key.length;
        formattedRecords.forEach(row => {
          const valLen = String(row[key] || '').length;
          if (valLen > maxLen) maxLen = valLen;
        });
        return { wch: maxLen + 3 };
      });
      ws['!cols'] = maxColWidth;

      XLSX.writeFile(wb, `${emp.name.replace(/\s+/g, '_')}_Attendance.xlsx`);
    }
  };

  // Download daily logs sheet
  const downloadDailyData = (day) => {
    const formatted = day.records.map((r, i) => ({
      'S.No': i + 1,
      'Employee ID': r.employeeId,
      'Employee Name': r.name,
      'Check-In': r.checkIn,
      'Check-Out': r.checkOut,
      'Working Hours': r.workingHours,
      'Status': r.status
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Day Attendance');
    XLSX.writeFile(wb, `${day.date.replace(/[\/\\:]/g, '_')}_Daily_Attendance.xlsx`);
  };

  // Bulk separate worksheets workbook download
  const downloadBulkSeparatedWorkbook = () => {
    const wb = XLSX.utils.book_new();
    
    employeesSummaryList.forEach(emp => {
      const formattedRecords = emp.records.map((r, i) => ({
        'S.No': i + 1,
        'Date': r.date,
        'Employee ID': r.employeeId,
        'Employee Name': r.name,
        'Check-In': r.checkIn,
        'Check-Out': r.checkOut,
        'Working Hours': r.workingHours,
        'Status': r.status,
        'Source File': r.sourceFile
      }));

      const ws = XLSX.utils.json_to_sheet(formattedRecords);
      
      const maxColWidth = Object.keys(formattedRecords[0]).map(key => {
        let maxLen = key.length;
        formattedRecords.forEach(row => {
          const valLen = String(row[key] || '').length;
          if (valLen > maxLen) maxLen = valLen;
        });
        return { wch: maxLen + 3 };
      });
      ws['!cols'] = maxColWidth;

      const sanitizedName = emp.name.replace(/[\[\]\*\?\/\\:]/g, '').substring(0, 30);
      XLSX.utils.book_append_sheet(wb, ws, sanitizedName);
    });

    XLSX.writeFile(wb, `Separated_Employee_Attendance_Sheets.xlsx`);
  };

  // Bulk separate Excel files inside a new ZIP download
  const downloadSeparatedZip = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        const zip = new JSZip();
        
        employeesSummaryList.forEach(emp => {
          const formattedRecords = emp.records.map((r, i) => ({
            'S.No': i + 1,
            'Date': r.date,
            'Employee ID': r.employeeId,
            'Employee Name': r.name,
            'Check-In': r.checkIn,
            'Check-Out': r.checkOut,
            'Working Hours': r.workingHours,
            'Status': r.status,
            'Source File': r.sourceFile
          }));

          const ws = XLSX.utils.json_to_sheet(formattedRecords);
          
          const maxColWidth = Object.keys(formattedRecords[0]).map(key => {
            let maxLen = key.length;
            formattedRecords.forEach(row => {
              const valLen = String(row[key] || '').length;
              if (valLen > maxLen) maxLen = valLen;
            });
            return { wch: maxLen + 3 };
          });
          ws['!cols'] = maxColWidth;

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
          
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const safeName = emp.name.replace(/[^a-zA-Z0-9]/g, '_');
          zip.file(`${safeName}_Attendance.xlsx`, wbout);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Separated_Employee_Attendance_Zip.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("ZIP packaging error:", err);
        alert("Failed to compile separated files into ZIP.");
      } finally {
        setLoading(false);
      }
    }, 100);
  };

  return (
    <div className="space-y-8 bg-transparent max-w-6xl mx-auto py-2 relative">
      
      {/* Absolute Loading Spinner overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex flex-col justify-center items-center gap-4">
          <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-extrabold text-white text-sm tracking-wide">Processing Attendance Sheets...</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Attendance Module</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Attendance Tracker</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Upload daily logs (individual or ZIP) and separate employee sheets instantly.</p>
        </div>
        
        {fileData && parsedRows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {isZip && (
              <button
                onClick={downloadSeparatedZip}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-white font-bold py-3 px-4.5 rounded-2xl shadow-lg shadow-yellow-500/20 transition-all cursor-pointer text-xs"
              >
                <Archive className="w-4 h-4" />
                Download Separated ZIP
              </button>
            )}
            <button
              onClick={downloadBulkSeparatedWorkbook}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold py-3 px-4.5 rounded-2xl transition-all cursor-pointer text-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Multi-Sheet Excel
            </button>
            <button
              onClick={handleClear}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 border border-[#222222]/50 bg-[#111111]/30 hover:bg-[#1A1A1A]/50 text-gray-300 hover:text-white font-bold py-3 px-4.5 rounded-2xl transition-all cursor-pointer text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Upload Zone */}
      {!fileData && (
        <div className="space-y-6">
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`w-full min-h-[350px] bg-[#111111]/40 backdrop-blur-md rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all duration-300 cursor-pointer ${
              isDragging 
                ? 'border-yellow-500 bg-yellow-500/5 shadow-2xl shadow-yellow-500/10' 
                : 'border-[#222222]/60 hover:border-yellow-500/50 hover:bg-[#111111]/60 shadow-[0_8px_30px_rgb(0,0,0,0.2)]'
            }`}
            onClick={triggerFileInput}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv,.zip" 
              className="hidden" 
            />
            
            <div className="w-20 h-20 bg-gradient-to-tr from-yellow-500/10 to-yellow-500/10 border border-yellow-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-inner group">
              <Upload className="w-10 h-10 text-yellow-400 group-hover:trangray-y-[-4px] transition-transform duration-300" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Upload Attendance Files</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
              Drag and drop a single Excel sheet or a **ZIP file containing daily attendance sheets** (e.g., May month files) here. We'll automatically unpack and merge them.
            </p>

            <div className="inline-flex items-center gap-3.5 px-4 py-2.5 bg-black/60 border border-[#222222]/40 rounded-2xl text-xs text-gray-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <span>Auto-extracts dates from filenames (e.g., "01-May.xlsx")</span>
            </div>
          </div>
          
          {/* Instructions Card */}
          <div className="bg-[#111111]/60 backdrop-blur-md border border-[#222222]/50 rounded-3xl p-6.5 shadow-md flex items-start gap-4">
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-400 flex-shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-white">How daily-to-employee division works</h4>
              <p className="text-xs text-gray-400 leading-relaxed max-w-3xl">
                Upload a ZIP archive containing individual daily spreadsheets. The tracker extracts each sheet, maps column headers once (or automatically), matches employee entries across all days, and computes aggregated metrics. You can then download consolidated monthly logs for any individual employee, or download a freshly packaged ZIP of separated user files.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Column Mapping Wizard */}
      {!parsedRows.length && fileData && mappingStep && (
        <div className="max-w-xl mx-auto bg-[#111111]/80 backdrop-blur-md rounded-3xl border border-[#222222] shadow-2xl p-8 space-y-6 animate-in zoom-in duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Match Spreadsheet Columns</h2>
              <p className="text-xs text-gray-500">
                Confirm which headers represent core attendance attributes in <b>{fileName}</b>:
              </p>
            </div>
          </div>

          <form onSubmit={handleConfirmMappings} className="space-y-5">
            <div className="space-y-4 bg-black/40 border border-[#222222]/30 p-5 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Employee Name Column *</label>
                <select 
                  value={mappings.name} 
                  onChange={(e) => setMappings({ ...mappings, name: e.target.value })}
                  className="w-full bg-[#111111]/85 border border-[#222222]/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-yellow-500"
                  required
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Employee ID (Optional)</label>
                  <select 
                    value={mappings.id} 
                    onChange={(e) => setMappings({ ...mappings, id: e.target.value })}
                    className="w-full bg-[#111111]/85 border border-[#222222]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="">None / Auto Detect</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date (Opt - Else File Date)</label>
                  <select 
                    value={mappings.date} 
                    onChange={(e) => setMappings({ ...mappings, date: e.target.value })}
                    className="w-full bg-[#111111]/85 border border-[#222222]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="">Extract Date from Filename</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status (Optional)</label>
                  <select 
                    value={mappings.status} 
                    onChange={(e) => setMappings({ ...mappings, status: e.target.value })}
                    className="w-full bg-[#111111]/85 border border-[#222222]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="">None (Default: Present)</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hours Worked (Optional)</label>
                  <select 
                    value={mappings.workingHours} 
                    onChange={(e) => setMappings({ ...mappings, workingHours: e.target.value })}
                    className="w-full bg-[#111111]/85 border border-[#222222]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="">None</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#222222]/30 pt-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Check-In Column</label>
                  <select 
                    value={mappings.checkIn} 
                    onChange={(e) => setMappings({ ...mappings, checkIn: e.target.value })}
                    className="w-full bg-[#111111]/85 border border-[#222222]/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">None</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Check-Out Column</label>
                  <select 
                    value={mappings.checkOut} 
                    onChange={(e) => setMappings({ ...mappings, checkOut: e.target.value })}
                    className="w-full bg-[#111111]/85 border border-[#222222]/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">None</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                <span>Extract {isZip ? `${zipFilesList.length} Files` : 'File'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="border border-[#222222]/50 bg-[#111111]/30 hover:bg-[#1A1A1A]/50 text-gray-300 font-bold py-3.5 px-6 rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Aggregated Panel */}
      {fileData && parsedRows.length > 0 && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Stats Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Total Records */}
            <div className="bg-[#111111]/80 backdrop-blur-md p-6 rounded-3xl border border-[#222222]/50 shadow-md flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">Total Records</p>
                <h3 className="text-3xl font-black text-white">{totalRecordsCount}</h3>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 text-yellow-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>

            {/* Total Employees */}
            <div className="bg-[#111111]/80 backdrop-blur-md p-6 rounded-3xl border border-[#222222]/50 shadow-md flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">Total Employees</p>
                <h3 className="text-3xl font-black text-white">{uniqueEmployeesCount}</h3>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 text-yellow-400">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Present Rate */}
            <div className="bg-[#111111]/80 backdrop-blur-md p-6 rounded-3xl border border-[#222222]/50 shadow-md flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">Attendance Rate</p>
                <h3 className="text-3xl font-black text-white">{averageAttendanceRate}%</h3>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 text-yellow-400">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            {/* Date Period or Zip Source count */}
            <div className="bg-[#111111]/80 backdrop-blur-md p-6 rounded-3xl border border-[#222222]/50 shadow-md flex items-center justify-between">
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                  {isZip ? 'ZIP Files Extracted' : 'Date Period'}
                </p>
                <h3 className={`font-black text-white ${isZip ? 'text-3xl' : 'text-sm mt-2 truncate w-40'}`}>
                  {isZip ? `${parsedFiles.length} Days` : getDateRange()}
                </h3>
              </div>
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 text-yellow-400">
                {isZip ? <FolderOpen className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#222222]/40 pb-px overflow-x-auto gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`pb-4 px-5 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'border-yellow-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Employee Summaries ({uniqueEmployeesCount})
            </button>
            {isZip && (
              <button
                onClick={() => setActiveTab('days')}
                className={`pb-4 px-5 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'days' 
                    ? 'border-yellow-500 text-white' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Daily Breakdowns ({daysSummaryList.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('records')}
              className={`pb-4 px-5 font-bold text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'records' 
                  ? 'border-yellow-500 text-white' 
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              All Raw Logs ({filteredRecords.length})
            </button>
          </div>

          {/* Tab 1: Employee Summaries View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Search & Actions Panel */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <h3 className="text-lg font-bold text-white">Aggregated Employee Records</h3>
                <div className="relative w-full sm:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4.5 w-4.5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    className="search-input"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Roster Cards Grid */}
              {filteredEmployeesList.length === 0 ? (
                <div className="bg-[#111111]/40 backdrop-blur-md rounded-3xl p-12 text-center border border-[#222222]/50">
                  <Search className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="font-semibold text-white">No employees matched your search query</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredEmployeesList.map((emp) => {
                    const presencePercent = (emp.presentCount / emp.records.length * 100).toFixed(0);
                    return (
                      <div 
                        key={emp.name + emp.employeeId} 
                        className="bg-[#111111]/80 backdrop-blur-md border border-[#222222]/50 rounded-3xl p-6 shadow-md hover:border-yellow-500/50 hover:shadow-yellow-500/5 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-gradient-to-tr from-yellow-400/20 to-yellow-500/20 rounded-xl flex items-center justify-center font-bold text-yellow-400 border border-yellow-500/20">
                                <User className="w-5.5 h-5.5" />
                              </div>
                              <div className="truncate max-w-[150px]">
                                <h4 className="font-extrabold text-white text-base truncate" title={emp.name}>{emp.name}</h4>
                                <span className="inline-block text-[10px] font-bold text-gray-500 bg-black border border-[#222222]/40 px-2 py-0.5 rounded-md mt-0.5">
                                  ID: {emp.employeeId}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-black text-yellow-400">{presencePercent}%</div>
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight">Attendance</span>
                            </div>
                          </div>

                          {/* Stats details */}
                          <div className="grid grid-cols-3 gap-2 bg-black/40 border border-[#222222]/30 p-3 rounded-2xl text-center text-xs">
                            <div>
                              <div className="font-extrabold text-gray-400">{emp.records.length}</div>
                              <div className="text-[9px] font-bold text-gray-500">Days</div>
                            </div>
                            <div className="border-x border-[#222222]/30">
                              <div className="font-extrabold text-yellow-400">{emp.presentCount}</div>
                              <div className="text-[9px] font-bold text-gray-500">Present</div>
                            </div>
                            <div>
                              <div className="font-extrabold text-red-400">{emp.absentCount}</div>
                              <div className="text-[9px] font-bold text-gray-500">Absent</div>
                            </div>
                          </div>

                          {emp.hoursRecordCount > 0 && (
                            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-500" /> Avg Work Hours:</span>
                              <span className="font-bold text-white">{(emp.totalWorkingHours / emp.hoursRecordCount).toFixed(1)} hrs/day</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2.5 mt-6 pt-4 border-t border-[#222222]/30">
                          <button
                            onClick={() => setSelectedEmployee(emp)}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-[#222222]/60 bg-[#111111]/30 hover:bg-[#1A1A1A]/50 text-white font-bold py-2 rounded-xl transition-all cursor-pointer text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Monthly Logs
                          </button>
                          
                          <button
                            onClick={() => downloadIndividualData(emp, 'xlsx')}
                            className="flex items-center justify-center p-2 rounded-xl border border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-all cursor-pointer"
                            title="Export Employee Excel"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Daily Breakdowns (Day-by-Day View) */}
          {activeTab === 'days' && isZip && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <h3 className="text-lg font-bold text-white">Daily Attendance Files</h3>
                <div className="relative w-full sm:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4.5 w-4.5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by date or file name..."
                    className="search-input"
                    value={daySearch}
                    onChange={(e) => setDaySearch(e.target.value)}
                  />
                </div>
              </div>

              {filteredDaysList.length === 0 ? (
                <div className="bg-[#111111]/40 backdrop-blur-md rounded-3xl p-12 text-center border border-[#222222]/50">
                  <Calendar className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="font-semibold text-white">No dates found matching search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredDaysList.map((day) => {
                    const totalEntries = day.records.length;
                    const presentRate = totalEntries > 0 ? (day.presentCount / totalEntries * 100).toFixed(0) : 0;
                    return (
                      <div 
                        key={day.date}
                        className="bg-[#111111]/80 backdrop-blur-md border border-[#222222]/50 rounded-3xl p-6 shadow-md hover:border-yellow-500/50 hover:shadow-yellow-500/5 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 bg-gradient-to-tr from-yellow-500/20 to-yellow-500/10 rounded-xl flex items-center justify-center font-bold text-yellow-400 border border-yellow-500/20">
                                <Calendar className="w-5.5 h-5.5" />
                              </div>
                              <div className="truncate max-w-[150px]">
                                <h4 className="font-extrabold text-white text-base truncate" title={day.date}>{day.date}</h4>
                                <span className="inline-block text-[9px] font-bold text-gray-500 truncate max-w-[130px]" title={day.filename}>
                                  File: {day.filename}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-black text-yellow-400">{presentRate}%</div>
                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight">Presence</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 bg-black/40 border border-[#222222]/30 p-3 rounded-2xl text-center text-xs">
                            <div>
                              <div className="font-extrabold text-gray-300">{totalEntries}</div>
                              <div className="text-[9px] font-bold text-gray-500">Tracked</div>
                            </div>
                            <div>
                              <div className="font-extrabold text-yellow-400">{day.presentCount}</div>
                              <div className="text-[9px] font-bold text-gray-500">Present</div>
                            </div>
                            <div>
                              <div className="font-extrabold text-red-400">{day.absentCount}</div>
                              <div className="text-[9px] font-bold text-gray-500">Absent</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2.5 mt-6 pt-4 border-t border-[#222222]/30">
                          <button
                            onClick={() => setSelectedDay(day)}
                            className="flex-1 flex items-center justify-center gap-1.5 border border-[#222222]/60 bg-[#111111]/30 hover:bg-[#1A1A1A]/50 text-white font-bold py-2 rounded-xl transition-all cursor-pointer text-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Records
                          </button>
                          <button
                            onClick={() => downloadDailyData(day)}
                            className="p-2 border border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-xl transition-all cursor-pointer"
                            title="Export Day Sheets"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Combined Raw Records */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              {/* Filter Row */}
              <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-[#111111]/40 p-4.5 border border-[#222222]/50 rounded-3xl">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4.5 w-4.5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search logs by Employee, ID, file name or status..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 border border-[#222222]/40 bg-black/30 rounded-2xl text-xs text-gray-400">
                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                    <span>Filter:</span>
                  </div>
                  {['All', 'Present', 'Absent', 'Late'].map(status => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        selectedStatus === status 
                          ? 'bg-yellow-500 border-transparent text-white' 
                          : 'border-[#222222]/50 text-gray-400 hover:text-white bg-transparent'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Logs Table */}
              <div className="bg-[#111111]/80 backdrop-blur-md rounded-3xl shadow-md border border-[#222222]/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-black/60 text-white font-bold border-b border-[#222222]/50">
                      <tr>
                        <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Employee</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Employee ID</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Date</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Check-In / Out</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Hours</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-[10px] hidden lg:table-cell">Source File</th>
                        <th className="px-6 py-4 uppercase tracking-wider text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]/30">
                      {currentRows.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                            No attendance records matched criteria.
                          </td>
                        </tr>
                      ) : (
                        currentRows.map((row) => {
                          const statusLower = row.status.toLowerCase();
                          const isAbsent = statusLower.includes('absent') || statusLower === 'a';
                          const isLate = statusLower.includes('late') || statusLower === 'l';
                          
                          return (
                            <tr key={row.key} className="hover:bg-[#1A1A1A]/40 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-extrabold text-white">{row.name}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-0.5 bg-black text-[11px] font-bold border border-[#222222]/50 rounded-md text-gray-300">
                                  {row.employeeId}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-300 font-semibold">
                                {row.date}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-gray-400">
                                <span className="text-white">{row.checkIn}</span>
                                {row.checkOut !== 'N/A' && <span className="mx-1 text-gray-600">→</span>}
                                {row.checkOut !== 'N/A' && <span className="text-white">{row.checkOut}</span>}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-white">
                                {row.workingHours !== 'N/A' ? `${row.workingHours} hrs` : '—'}
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-500 font-medium hidden lg:table-cell truncate max-w-[120px]" title={row.sourceFile}>
                                {row.sourceFile}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase border ${
                                  isAbsent 
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                    : isLate 
                                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                                      : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                }`}>
                                  {isAbsent ? <XCircle className="w-3 h-3" /> : isLate ? <Clock className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-[#222222]/30 bg-black/20">
                    <div className="text-xs text-gray-400">
                      Showing <span className="font-semibold text-white">{indexOfFirstRow + 1}</span> to{" "}
                      <span className="font-semibold text-white">{Math.min(indexOfLastRow, filteredRecords.length)}</span> of{" "}
                      <span className="font-semibold text-white">{filteredRecords.length}</span> entries
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#222222]/50 text-gray-300 hover:bg-[#1A1A1A] disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
                      >
                        Prev
                      </button>
                      <span className="text-xs text-gray-400 font-bold px-2">Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-[#222222]/50 text-gray-300 hover:bg-[#1A1A1A] disabled:opacity-50 disabled:hover:bg-transparent transition-all cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Employee Modal: Monthly aggregated list */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111111] rounded-[2.5rem] shadow-2xl border border-[#222222] w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in scale-in duration-300">
            <div className="p-6 pb-4 border-b border-[#222222]/50 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedEmployee.name}</h3>
                  <span className="text-xs font-bold text-gray-500">Employee ID: {selectedEmployee.employeeId}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="p-2 hover:bg-[#1A1A1A] rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#111111]">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-black/60 border border-[#222222]/40 p-4.5 rounded-2xl">
                  <div className="text-2xl font-black text-white">{selectedEmployee.records.length}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mt-1">Total Days</div>
                </div>
                <div className="bg-yellow-500/5 border border-yellow-500/10 p-4.5 rounded-2xl">
                  <div className="text-2xl font-black text-yellow-400">{selectedEmployee.presentCount}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mt-1">Days Present</div>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 p-4.5 rounded-2xl">
                  <div className="text-2xl font-black text-red-400">{selectedEmployee.absentCount}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mt-1">Days Absent</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Aggregated Attendance Logs</h4>
                <div className="bg-black/40 border border-[#222222]/30 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/80 text-gray-400 font-bold sticky top-0 border-b border-[#222222]/50">
                      <tr>
                        <th className="px-4.5 py-3">Date</th>
                        <th className="px-4.5 py-3">Check-In/Out</th>
                        <th className="px-4.5 py-3 text-center">Hours</th>
                        <th className="px-4.5 py-3 hidden md:table-cell">File Source</th>
                        <th className="px-4.5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]/30 text-gray-300">
                      {selectedEmployee.records.map((rec, i) => {
                        const statusLower = rec.status.toLowerCase();
                        const isAbsent = statusLower.includes('absent') || statusLower === 'a';
                        const isLate = statusLower.includes('late') || statusLower === 'l';
                        return (
                          <tr key={i} className="hover:bg-[#1A1A1A]/25 transition-colors">
                            <td className="px-4.5 py-3 font-semibold text-white">{rec.date}</td>
                            <td className="px-4.5 py-3 text-gray-400 font-medium">
                              {rec.checkIn !== 'N/A' ? `${rec.checkIn} - ${rec.checkOut}` : '—'}
                            </td>
                            <td className="px-4.5 py-3 text-center text-white font-bold">
                              {rec.workingHours !== 'N/A' ? `${rec.workingHours} hrs` : '—'}
                            </td>
                            <td className="px-4.5 py-3 text-gray-500 font-medium hidden md:table-cell truncate max-w-[100px]" title={rec.sourceFile}>
                              {rec.sourceFile}
                            </td>
                            <td className="px-4.5 py-3 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase ${
                                isAbsent 
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                  : isLate 
                                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#222222]/50 flex flex-wrap gap-3.5 bg-black/40">
              <button
                onClick={() => downloadIndividualData(selectedEmployee, 'xlsx')}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg transition-all cursor-pointer text-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Download Monthly Excel (XLSX)
              </button>
              <button
                onClick={() => downloadIndividualData(selectedEmployee, 'csv')}
                className="flex-1 flex items-center justify-center gap-2 border border-[#222222]/50 bg-[#111111]/30 hover:bg-[#1A1A1A]/50 text-gray-300 hover:text-white font-bold py-3.5 px-5 rounded-2xl transition-all cursor-pointer text-xs"
              >
                <FileDown className="w-4 h-4" />
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Modal: Drilldown details for a specific day */}
      {selectedDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111111] rounded-[2.5rem] shadow-2xl border border-[#222222] w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in scale-in duration-300">
            <div className="p-6 pb-4 border-b border-[#222222]/50 flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-tr from-yellow-500 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedDay.date}</h3>
                  <span className="text-xs font-bold text-gray-500">Daily Logs • File: {selectedDay.filename}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-[#1A1A1A] rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#111111]">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-black/60 border border-[#222222]/40 p-4.5 rounded-2xl">
                  <div className="text-2xl font-black text-white">{selectedDay.records.length}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mt-1">Total Logs</div>
                </div>
                <div className="bg-yellow-500/5 border border-yellow-500/10 p-4.5 rounded-2xl">
                  <div className="text-2xl font-black text-yellow-400">{selectedDay.presentCount}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mt-1">Present</div>
                </div>
                <div className="bg-red-500/5 border border-red-500/10 p-4.5 rounded-2xl">
                  <div className="text-2xl font-black text-red-400">{selectedDay.absentCount}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mt-1">Absent</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">User Attendance List</h4>
                <div className="bg-black/40 border border-[#222222]/30 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-black/80 text-gray-400 font-bold sticky top-0 border-b border-[#222222]/50">
                      <tr>
                        <th className="px-4.5 py-3">Employee Name</th>
                        <th className="px-4.5 py-3">Employee ID</th>
                        <th className="px-4.5 py-3">Check-In/Out</th>
                        <th className="px-4.5 py-3 text-center">Hours</th>
                        <th className="px-4.5 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222222]/30 text-gray-300">
                      {selectedDay.records.map((rec, i) => {
                        const statusLower = rec.status.toLowerCase();
                        const isAbsent = statusLower.includes('absent') || statusLower === 'a';
                        const isLate = statusLower.includes('late') || statusLower === 'l';
                        return (
                          <tr key={i} className="hover:bg-[#1A1A1A]/25 transition-colors">
                            <td className="px-4.5 py-3 font-semibold text-white">{rec.name}</td>
                            <td className="px-4.5 py-3">
                              <span className="px-1.5 py-0.5 bg-black text-[9px] font-bold border border-[#222222]/50 rounded-md text-gray-300">
                                {rec.employeeId}
                              </span>
                            </td>
                            <td className="px-4.5 py-3 text-gray-400 font-medium">
                              {rec.checkIn !== 'N/A' ? `${rec.checkIn} - ${rec.checkOut}` : '—'}
                            </td>
                            <td className="px-4.5 py-3 text-center text-white font-bold">
                              {rec.workingHours !== 'N/A' ? `${rec.workingHours} hrs` : '—'}
                            </td>
                            <td className="px-4.5 py-3 text-right">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase ${
                                isAbsent 
                                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                  : isLate 
                                    ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                              }`}>
                                {rec.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#222222]/50 bg-black/40">
              <button
                onClick={() => downloadDailyData(selectedDay)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg transition-all cursor-pointer text-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Daily Sheet (XLSX)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
