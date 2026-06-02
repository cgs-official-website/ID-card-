import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

const COLLECTION_NAME = "invoices";

// Flag to track if Firestore is disabled/restricted
let useLocalStorage = sessionStorage.getItem("use_local_storage_invoices") === "true";

const enableLocalStorageFallback = (reason) => {
  if (!useLocalStorage) {
    console.warn("Firestore access restricted or failing for invoices. Switching to LocalStorage backup. Reason:", reason);
    useLocalStorage = true;
    sessionStorage.setItem("use_local_storage_invoices", "true");
  }
};

// --- LocalStorage helpers ---
const getInvoicesFromLocal = () => {
  return JSON.parse(localStorage.getItem("cgs_invoices") || "[]");
};

const saveInvoicesToLocal = (invoices) => {
  localStorage.setItem("cgs_invoices", JSON.stringify(invoices));
};

const saveInvoiceLocal = (invoiceData) => {
  const currentYear = new Date().getFullYear();
  const localInvoices = getInvoicesFromLocal();
  
  let nextNum = 1;
  for (const inv of localInvoices) {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(`CGS-INV-${currentYear}-`)) {
      const parts = inv.invoiceNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
        break; // Sorted newest first, so we stop at the first match
      }
    }
  }

  const invoiceNumber = `CGS-INV-${currentYear}-${String(nextNum).padStart(4, '0')}`;
  const newId = `inv-local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const localInvoiceDoc = {
    ...invoiceData,
    id: newId,
    invoiceNumber,
    createdAt: new Date().toISOString()
  };

  localInvoices.unshift(localInvoiceDoc);
  saveInvoicesToLocal(localInvoices);

  return { success: true, id: newId, invoiceNumber };
};

const getInvoicesLocal = () => {
  const localInvoices = getInvoicesFromLocal();
  const mapped = localInvoices.map(inv => ({
    ...inv,
    createdAt: inv.createdAt ? { toDate: () => new Date(inv.createdAt) } : null
  }));
  return { success: true, invoices: mapped };
};

const deleteInvoiceLocal = (id) => {
  const localInvoices = getInvoicesFromLocal();
  const updated = localInvoices.filter(inv => inv.id !== id);
  saveInvoicesToLocal(updated);
  return { success: true };
};

// --- Exported Actions ---

export const saveInvoice = async (invoiceData) => {
  if (useLocalStorage) {
    return saveInvoiceLocal(invoiceData);
  }

  try {
    const currentYear = new Date().getFullYear();
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    let nextNum = 1;
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      if (data.invoiceNumber && data.invoiceNumber.startsWith(`CGS-INV-${currentYear}-`)) {
        const parts = data.invoiceNumber.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
          break; // First match since it's ordered by newest first
        }
      }
    }
    
    const invoiceNumber = `CGS-INV-${currentYear}-${String(nextNum).padStart(4, '0')}`;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...invoiceData,
      invoiceNumber,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, invoiceNumber };
  } catch (error) {
    console.error("Error adding document to Firestore: ", error);
    enableLocalStorageFallback(error.message);
    return saveInvoiceLocal(invoiceData);
  }
};

export const getInvoices = async () => {
  if (useLocalStorage) {
    return getInvoicesLocal();
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const invoices = [];
    querySnapshot.forEach((doc) => {
      invoices.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, invoices };
  } catch (error) {
    console.error("Error getting documents: ", error);
    enableLocalStorageFallback(error.message);
    return getInvoicesLocal();
  }
};

export const deleteInvoice = async (id) => {
  if (useLocalStorage || id.startsWith("inv-local-") || id.startsWith("LOCAL-")) {
    return deleteInvoiceLocal(id);
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting document: ", error);
    enableLocalStorageFallback(error.message);
    return deleteInvoiceLocal(id);
  }
};

