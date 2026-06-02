/**
 * Helper to escape XML characters
 */
function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an Excel XML Spreadsheet (SpreadsheetML) file and triggers download
 * Compatible with Microsoft Excel, Google Sheets, LibreOffice.
 * @param {Array<string>} headers - Table header column names
 * @param {Array<Object>} rows - Array of response data rows mapping key-value fields
 * @param {Array<string>} keys - Keys in the rows to export in order
 * @param {string} fileName - File name to save as
 */
export function exportToXLSX(headers, rows, keys, fileName = 'export') {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-excel:sheets"
 xmlns:o="urn:schemas-microsoft-excel:office"
 xmlns:x="urn:schemas-microsoft-excel:excel"
 xmlns:ss="urn:schemas-microsoft-excel:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-excel:office">
  <Author>CGS Admin Panel</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Responses">
  <Table>`;

  // Create Header Row
  xml += '\n   <Row ss:Height="22">';
  headers.forEach(header => {
    xml += `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`;
  });
  xml += '</Row>';

  // Create Data Rows
  rows.forEach(row => {
    xml += '\n   <Row>';
    keys.forEach(key => {
      const val = row[key];
      let cellType = 'String';
      let cellValue = val;

      if (typeof val === 'number') {
        cellType = 'Number';
      } else if (typeof val === 'boolean') {
        cellValue = val ? 'Yes' : 'No';
      } else if (val && typeof val === 'object') {
        // e.g. Arrays, Sub-objects
        cellValue = JSON.stringify(val);
      }

      xml += `<Cell><Data ss:Type="${cellType}">${escapeXml(cellValue)}</Data></Cell>`;
    });
    xml += '</Row>';
  });

  xml += `\n  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-excel:excel">
   <PageSetup>
    <Header x:Margin="0.3"/>
    <Footer x:Margin="0.3"/>
   </PageSetup>
   <Selected/>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.xls`; // Excel opens XML spreadsheets with .xls extension
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates a standard UTF-8 CSV file and triggers download
 * @param {Array<string>} headers - Table header column names
 * @param {Array<Object>} rows - Array of response data rows mapping key-value fields
 * @param {Array<string>} keys - Keys in the rows to export in order
 * @param {string} fileName - File name to save as
 */
export function exportToCSV(headers, rows, keys, fileName = 'export') {
  let csvContent = '\uFEFF'; // UTF-8 BOM to prevent excel parsing issues with special characters

  // Header Row
  csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\r\n';

  // Data Rows
  rows.forEach(row => {
    const rowValues = keys.map(key => {
      let val = row[key];
      if (val === null || val === undefined) return '';
      if (typeof val === 'boolean') return val ? 'Yes' : 'No';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvContent += rowValues.join(',') + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
