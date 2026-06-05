// ============================================================
// Google Apps Script — Upload Files (Images + PDFs) to Drive
// Folder ID: 1DsIAklg29b3wmEHFpxQV4l4MeJCpWUdy
// ============================================================

var ROOT_FOLDER_ID = '1DsIAklg29b3wmEHFpxQV4l4MeJCpWUdy';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === 'upload') {
      return handleUpload(data);
    } else if (action === 'organize') {
      return handleOrganize(data);
    } else {
      return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ──────────────────────────────────────────────────────────────
// handleUpload: Save a base64-encoded file (any type) to Drive
// ──────────────────────────────────────────────────────────────
function handleUpload(data) {
  var base64   = data.base64;
  var fileName = data.fileName || ('upload_' + new Date().getTime());
  var mimeType = data.mimeType || 'application/octet-stream';

  if (!base64) {
    return jsonResponse({ success: false, error: 'No base64 data provided.' });
  }

  // Decode base64 → binary blob
  var decoded = Utilities.base64Decode(base64);
  var blob    = Utilities.newBlob(decoded, mimeType, fileName);

  // Upload to the root Drive folder
  var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  var file       = rootFolder.createFile(blob);

  // Make publicly viewable (anyone with the link can view)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return jsonResponse({
    success: true,
    fileId:  file.getId(),
    url:     'https://drive.google.com/file/d/' + file.getId() + '/view?usp=sharing'
  });
}

// ──────────────────────────────────────────────────────────────
// handleOrganize: Move uploaded files into a candidate sub-folder
// ──────────────────────────────────────────────────────────────
function handleOrganize(data) {
  var candidateName = data.candidateName || 'Unknown_User';
  var fileIds       = data.fileIds || [];

  if (fileIds.length === 0) {
    return jsonResponse({ success: true, message: 'No files to organize.' });
  }

  // Clean the folder name (remove special chars)
  var safeName   = candidateName.replace(/[^\w\s-]/g, '').trim() || 'Unknown_User';
  var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);

  // Find or create a sub-folder for this candidate
  var subFolder;
  var existing = rootFolder.getFoldersByName(safeName);
  if (existing.hasNext()) {
    subFolder = existing.next();
  } else {
    subFolder = rootFolder.createFolder(safeName);
  }

  // Move each file into the candidate's sub-folder
  var movedUrls = [];
  fileIds.forEach(function(fileId) {
    try {
      var file = DriveApp.getFileById(fileId);
      // Add to sub-folder, then remove from root folder
      subFolder.addFile(file);
      rootFolder.removeFile(file);
      movedUrls.push('https://drive.google.com/file/d/' + fileId + '/view?usp=sharing');
    } catch (moveErr) {
      Logger.log('Could not move file ' + fileId + ': ' + moveErr);
    }
  });

  return jsonResponse({
    success:   true,
    folder:    safeName,
    movedUrls: movedUrls
  });
}

// ──────────────────────────────────────────────────────────────
// Helper: Return a JSON ContentService response with CORS headers
// ──────────────────────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ──────────────────────────────────────────────────────────────
// doGet — Health-check endpoint (useful for testing the deploy)
// ──────────────────────────────────────────────────────────────
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'CGS Drive Upload Script is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
