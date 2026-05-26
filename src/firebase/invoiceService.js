import { db } from "./paymentConfig";
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

export const saveInvoice = async (invoiceData) => {
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
    console.error("Firebase Details - ProjectID:", db.app.options.projectId);
    console.error("Error adding document to Firestore: ", error);
    // Return specific error message if available
    return { 
      success: false, 
      error: error.message || "Unknown Firebase error",
      code: error.code
    };
  }
};

export const getInvoices = async () => {
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
    return { success: false, error };
  }
};

export const deleteInvoice = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting document: ", error);
    return { success: false, error };
  }
};
