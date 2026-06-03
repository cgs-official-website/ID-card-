import { db, auth } from '../firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, updateDoc, 
  query, orderBy, getDoc, addDoc 
} from 'firebase/firestore';

// Flag to track if Firestore is disabled/restricted
let useLocalStorage = sessionStorage.getItem('use_local_storage') === 'true';

const enableLocalStorageFallback = (reason) => {
  // If the user is not authenticated or is logged in anonymously,
  // permission-denied errors are normal and expected for certain actions.
  // We should not fall back to local storage in these cases.
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    return;
  }
  if (!useLocalStorage) {
    console.warn("Firestore access restricted or failing. Switching to LocalStorage database fallback. Reason:", reason);
    useLocalStorage = true;
    sessionStorage.setItem('use_local_storage', 'true');
  }
};

// --- LocalStorage low-level helpers ---
const getFormsFromLocal = () => {
  return JSON.parse(localStorage.getItem('cgs_forms') || '[]');
};

const saveFormsToLocal = (forms) => {
  localStorage.setItem('cgs_forms', JSON.stringify(forms));
};

const getFieldsFromLocal = (formId) => {
  return JSON.parse(localStorage.getItem(`cgs_fields_${formId}`) || '[]');
};

const saveFieldsToLocal = (formId, fields) => {
  localStorage.setItem(`cgs_fields_${formId}`, JSON.stringify(fields));
};

const getResponsesFromLocal = (formId) => {
  return JSON.parse(localStorage.getItem(`cgs_responses_${formId}`) || '[]');
};

const saveResponsesToLocal = (formId, responses) => {
  localStorage.setItem(`cgs_responses_${formId}`, JSON.stringify(responses));
};

const getLogsFromLocal = () => {
  return JSON.parse(localStorage.getItem('cgs_auditLogs') || '[]');
};

const saveLogsToLocal = (logs) => {
  localStorage.setItem('cgs_auditLogs', JSON.stringify(logs));
};

// --- Exported Unified Database Actions ---

/**
 * Fetch all forms and responses counts
 */
export const fetchFormsList = async () => {
  if (useLocalStorage) {
    return fetchFormsListLocal();
  }

  try {
    const q = query(collection(db, 'forms'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const formsData = [];
    
    for (const formDoc of querySnapshot.docs) {
      const data = formDoc.data();
      // Fetch responses count
      let resCount = 0;
      try {
        const resQuery = await getDocs(collection(db, `forms/${formDoc.id}/responses`));
        resCount = resQuery.size;
      } catch (err) {
        console.warn(`Restricted responses access for form ${formDoc.id}`);
      }
      
      formsData.push({
        id: formDoc.id,
        ...data,
        responsesCount: resCount
      });
    }
    return formsData;
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return fetchFormsListLocal();
    }
    throw error;
  }
};

const fetchFormsListLocal = () => {
  const forms = getFormsFromLocal();
  return forms.map(f => {
    const res = getResponsesFromLocal(f.id);
    return {
      ...f,
      responsesCount: res.length
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Generate sequential Form ID (e.g. CGS-form0001, CGS-form0002)
 */
export const getNextFormId = async (existingForms = null) => {
  try {
    let forms = existingForms;
    if (!forms) {
      forms = await fetchFormsList();
    }
    if (!Array.isArray(forms)) {
      forms = [];
    }
    
    // Find all IDs matching CGS[-_]?form[-_]?\d+ case-insensitively and extract the numeric part
    const ids = forms
      .map(f => f.id)
      .filter(id => id && typeof id === 'string')
      .map(id => {
        const match = id.match(/^CGS[-_]?form[-_]?(\d+)$/i);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(num => num !== null && !isNaN(num));
      
    if (ids.length === 0) {
      return 'CGS-form0001';
    }
    
    const maxId = Math.max(...ids);
    const nextIdVal = maxId + 1;
    const padded = String(nextIdVal).padStart(4, '0');
    return `CGS-form${padded}`;
  } catch (error) {
    console.error("Error generating next form ID:", error);
    return `CGS-form-${Date.now()}`;
  }
};


/**
 * Fetch detailed form options and settings
 */
export const fetchFormDetails = async (formId) => {
  if (useLocalStorage) {
    return fetchFormDetailsLocal(formId);
  }

  try {
    const formSnap = await getDoc(doc(db, 'forms', formId));
    if (!formSnap.exists()) return null;
    return formSnap.data();
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return fetchFormDetailsLocal(formId);
    }
    throw error;
  }
};

const fetchFormDetailsLocal = (formId) => {
  const forms = getFormsFromLocal();
  return forms.find(f => f.id === formId) || null;
};

/**
 * Fetch fields subcollection for a form
 */
export const fetchFormFields = async (formId) => {
  if (useLocalStorage) {
    return fetchFormFieldsLocal(formId);
  }

  try {
    const fieldsSnap = await getDocs(collection(db, `forms/${formId}/fields`));
    return fieldsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return fetchFormFieldsLocal(formId);
    }
    throw error;
  }
};

const fetchFormFieldsLocal = (formId) => {
  const fields = getFieldsFromLocal(formId);
  return fields.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

/**
 * Save form details along with fields (creates or modifies)
 */
export const saveFormObj = async (formId, formDocData, fieldsList, deletedFieldIds) => {
  if (useLocalStorage) {
    return saveFormObjLocal(formId, formDocData, fieldsList, deletedFieldIds);
  }

  try {
    // 1. Write form
    await setDoc(doc(db, 'forms', formId), formDocData, { merge: true });

    // 2. Delete deleted fields in Firestore
    if (deletedFieldIds && deletedFieldIds.length > 0) {
      for (const fId of deletedFieldIds) {
        await deleteDoc(doc(db, `forms/${formId}/fields`, fId));
      }
    }

    // 3. Save current fields
    for (const field of fieldsList) {
      await setDoc(doc(db, `forms/${formId}/fields`, field.id), field, { merge: true });
    }
    return true;
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return saveFormObjLocal(formId, formDocData, fieldsList, deletedFieldIds);
    }
    throw error;
  }
};

const saveFormObjLocal = (formId, formDocData, fieldsList, deletedFieldIds) => {
  const forms = getFormsFromLocal();
  const existingIdx = forms.findIndex(f => f.id === formId);

  const updatedForm = {
    id: formId,
    ...formDocData,
    updatedAt: new Date().toISOString(),
    ...(existingIdx >= 0 ? { createdAt: forms[existingIdx].createdAt, createdBy: forms[existingIdx].createdBy } : { createdAt: new Date().toISOString() })
  };

  if (existingIdx >= 0) {
    forms[existingIdx] = updatedForm;
  } else {
    forms.push(updatedForm);
  }

  saveFormsToLocal(forms);
  saveFieldsToLocal(formId, fieldsList);
  return true;
};

/**
 * Duplicate a form
 */
export const duplicateFormObj = async (formId, newId, newFormDoc, fieldsList) => {
  if (useLocalStorage) {
    return duplicateFormObjLocal(formId, newId, newFormDoc, fieldsList);
  }

  try {
    await setDoc(doc(db, 'forms', newId), newFormDoc);
    for (const field of fieldsList) {
      await setDoc(doc(db, `forms/${newId}/fields`, field.id), field);
    }
    return true;
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return duplicateFormObjLocal(formId, newId, newFormDoc, fieldsList);
    }
    throw error;
  }
};

const duplicateFormObjLocal = (formId, newId, newFormDoc, fieldsList) => {
  const forms = getFormsFromLocal();
  
  const duplicated = {
    id: newId,
    ...newFormDoc,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  forms.push(duplicated);
  saveFormsToLocal(forms);
  saveFieldsToLocal(newId, fieldsList);
  return true;
};

/**
 * Archive form
 */
export const archiveFormObj = async (formId, currentStatus) => {
  if (useLocalStorage) {
    return archiveFormObjLocal(formId, currentStatus);
  }

  try {
    const newStatus = currentStatus === 'archived' ? 'draft' : 'archived';
    await updateDoc(doc(db, 'forms', formId), {
      status: newStatus,
      updatedAt: new Date()
    });
    return newStatus;
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return archiveFormObjLocal(formId, currentStatus);
    }
    throw error;
  }
};

const archiveFormObjLocal = (formId, currentStatus) => {
  const forms = getFormsFromLocal();
  const formIdx = forms.findIndex(f => f.id === formId);
  if (formIdx >= 0) {
    const nextStatus = currentStatus === 'archived' ? 'draft' : 'archived';
    forms[formIdx].status = nextStatus;
    forms[formIdx].updatedAt = new Date().toISOString();
    saveFormsToLocal(forms);
    return nextStatus;
  }
  return currentStatus;
};

/**
 * Update form status (e.g. published, draft, archived)
 */
export const updateFormStatusObj = async (formId, newStatus) => {
  if (useLocalStorage) {
    return updateFormStatusObjLocal(formId, newStatus);
  }

  try {
    await updateDoc(doc(db, 'forms', formId), {
      status: newStatus,
      updatedAt: new Date()
    });
    return newStatus;
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return updateFormStatusObjLocal(formId, newStatus);
    }
    throw error;
  }
};

const updateFormStatusObjLocal = (formId, newStatus) => {
  const forms = getFormsFromLocal();
  const formIdx = forms.findIndex(f => f.id === formId);
  if (formIdx >= 0) {
    forms[formIdx].status = newStatus;
    forms[formIdx].updatedAt = new Date().toISOString();
    saveFormsToLocal(forms);
    return newStatus;
  }
  return newStatus;
};

/**
 * Delete form
 */
export const deleteFormObj = async (formId) => {
  if (useLocalStorage) {
    return deleteFormObjLocal(formId);
  }

  try {
    // 1. Delete fields subcollection
    const fieldsSnap = await getDocs(collection(db, `forms/${formId}/fields`));
    for (const fDoc of fieldsSnap.docs) {
      await deleteDoc(doc(db, `forms/${formId}/fields`, fDoc.id));
    }
    // 2. Delete responses subcollection
    const resSnap = await getDocs(collection(db, `forms/${formId}/responses`));
    for (const rDoc of resSnap.docs) {
      await deleteDoc(doc(db, `forms/${formId}/responses`, rDoc.id));
    }
    // 3. Delete main form document
    await deleteDoc(doc(db, 'forms', formId));
    return true;
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return deleteFormObjLocal(formId);
    }
    throw error;
  }
};

const deleteFormObjLocal = (formId) => {
  const forms = getFormsFromLocal();
  saveFormsToLocal(forms.filter(f => f.id !== formId));
  localStorage.removeItem(`cgs_fields_${formId}`);
  localStorage.removeItem(`cgs_responses_${formId}`);
  return true;
};

/**
 * Fetch all responses for a form
 */
export const fetchFormResponses = async (formId) => {
  if (useLocalStorage) {
    return fetchFormResponsesLocal(formId);
  }

  try {
    const responsesSnap = await getDocs(query(collection(db, `forms/${formId}/responses`), orderBy('submittedAt', 'desc')));
    return responsesSnap.docs.map(doc => {
      const data = doc.data();
      let dateObj = null;
      if (data.submittedAt?.toDate) {
        dateObj = data.submittedAt.toDate();
      } else if (data.submittedAt && data.submittedAt !== 'Disabled') {
        dateObj = new Date(data.submittedAt);
      }
      return {
        id: doc.id,
        ...data,
        dateObj
      };
    });
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return fetchFormResponsesLocal(formId);
    }
    throw error;
  }
};

const fetchFormResponsesLocal = (formId) => {
  const responses = getResponsesFromLocal(formId);
  return responses.map(r => ({
    ...r,
    dateObj: r.submittedAt && r.submittedAt !== 'Disabled' ? new Date(r.submittedAt) : null
  })).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
};

/**
 * Add form submission response
 */
export const saveFormResponse = async (formId, submissionPayload, uploadedFiles) => {
  if (useLocalStorage) {
    return saveFormResponseLocal(formId, submissionPayload, uploadedFiles);
  }

  try {
    const responseDoc = await addDoc(collection(db, `forms/${formId}/responses`), submissionPayload);
    
    // Save response files references
    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        await addDoc(collection(db, 'responseFiles'), {
          responseId: responseDoc.id,
          formId: formId,
          ...file,
          uploadedAt: new Date()
        });
      }
    }
    return responseDoc.id;
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return saveFormResponseLocal(formId, submissionPayload, uploadedFiles);
    }
    throw error;
  }
};

const saveFormResponseLocal = (formId, submissionPayload, uploadedFiles) => {
  const responses = getResponsesFromLocal(formId);
  const newResId = `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const payloadLocal = {
    id: newResId,
    ...submissionPayload,
    submittedAt: submissionPayload.submittedAt instanceof Date ? submissionPayload.submittedAt.toISOString() : submissionPayload.submittedAt
  };

  responses.push(payloadLocal);
  saveResponsesToLocal(formId, responses);

  // Save files mapping
  if (uploadedFiles && uploadedFiles.length > 0) {
    const allFiles = JSON.parse(localStorage.getItem('cgs_responseFiles') || '[]');
    uploadedFiles.forEach(file => {
      allFiles.push({
        id: `file-${Date.now()}`,
        responseId: newResId,
        formId,
        ...file,
        uploadedAt: new Date().toISOString()
      });
    });
    localStorage.setItem('cgs_responseFiles', JSON.stringify(allFiles));
  }

  return newResId;
};

/**
 * Delete a response
 */
export const deleteResponseObj = async (formId, resId) => {
  if (useLocalStorage) {
    return deleteResponseObjLocal(formId, resId);
  }

  try {
    await deleteDoc(doc(db, `forms/${formId}/responses`, resId));
    return true;
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return deleteResponseObjLocal(formId, resId);
    }
    throw error;
  }
};

const deleteResponseObjLocal = (formId, resId) => {
  const responses = getResponsesFromLocal(formId);
  saveResponsesToLocal(formId, responses.filter(r => r.id !== resId));
  return true;
};

/**
 * Fetch audit logs
 */
export const fetchAuditLogsList = async () => {
  if (useLocalStorage) {
    return fetchAuditLogsListLocal();
  }

  try {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return fetchAuditLogsListLocal();
    }
    throw error;
  }
};

const fetchAuditLogsListLocal = () => {
  const logs = getLogsFromLocal();
  return logs.map(l => ({
    ...l,
    timestamp: l.timestamp ? { toDate: () => new Date(l.timestamp) } : null
  })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Write audit log
 */
export const createAuditLogObj = async (action, formId, formTitle, user = 'Admin') => {
  const payload = {
    user,
    action,
    formId,
    formTitle,
    timestamp: new Date()
  };

  if (useLocalStorage) {
    return createAuditLogObjLocal(action, formId, formTitle, user);
  }

  try {
    await addDoc(collection(db, 'auditLogs'), payload);
    return true;
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      return createAuditLogObjLocal(action, formId, formTitle, user);
    }
    throw error;
  }
};

const createAuditLogObjLocal = (action, formId, formTitle, user) => {
  const logs = getLogsFromLocal();
  logs.push({
    id: `log-${Date.now()}`,
    user,
    action,
    formId,
    formTitle,
    timestamp: new Date().toISOString()
  });
  saveLogsToLocal(logs);
  return true;
};

/**
 * Increment form views count
 */
export const incrementFormViews = async (formId) => {
  if (useLocalStorage) {
    incrementFormViewsLocal(formId);
    return;
  }

  try {
    const formRef = doc(db, 'forms', formId);
    const { increment } = await import('firebase/firestore');
    await updateDoc(formRef, {
      views: increment(1)
    });
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      enableLocalStorageFallback(error.message);
      incrementFormViewsLocal(formId);
    }
  }
};

const incrementFormViewsLocal = (formId) => {
  const forms = getFormsFromLocal();
  const formIdx = forms.findIndex(f => f.id === formId);
  if (formIdx >= 0) {
    forms[formIdx].views = (forms[formIdx].views || 0) + 1;
    saveFormsToLocal(forms);
  }
};
