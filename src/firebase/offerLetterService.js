import { db, auth } from "./paymentConfig";
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

const COLLECTION_NAME = "offer_letters";

// Flag to track if Firestore is disabled/restricted
let useLocalStorage = sessionStorage.getItem("use_local_storage_offer_letters") === "true";

const enableLocalStorageFallback = (reason) => {
  if (!auth.currentUser) {
    return;
  }
  if (!useLocalStorage) {
    console.warn("Firestore access restricted or failing for offer letters. Switching to LocalStorage backup. Reason:", reason);
    useLocalStorage = true;
    sessionStorage.setItem("use_local_storage_offer_letters", "true");
  }
};

// --- LocalStorage helpers ---
const getOfferLettersFromLocal = () => {
  return JSON.parse(localStorage.getItem("cgs_offer_letters") || "[]");
};

const saveOfferLettersToLocal = (offers) => {
  localStorage.setItem("cgs_offer_letters", JSON.stringify(offers));
};

const saveOfferLetterLocal = (offerData) => {
  const currentYear = new Date().getFullYear();
  const localOffers = getOfferLettersFromLocal();
  
  let nextNum = 1;
  for (const offer of localOffers) {
    if (offer.offerNumber && offer.offerNumber.startsWith(`CGS-OFF-${currentYear}-`)) {
      const parts = offer.offerNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
        break; 
      }
    }
  }

  const offerNumber = `CGS-OFF-${currentYear}-${String(nextNum).padStart(4, '0')}`;
  const newId = `off-local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const localOfferDoc = {
    ...offerData,
    id: newId,
    offerNumber,
    createdAt: new Date().toISOString()
  };

  localOffers.unshift(localOfferDoc);
  saveOfferLettersToLocal(localOffers);

  return { success: true, id: newId, offerNumber };
};

const getOfferLettersLocal = () => {
  const localOffers = getOfferLettersFromLocal();
  const mapped = localOffers.map(offer => ({
    ...offer,
    createdAt: offer.createdAt ? { toDate: () => new Date(offer.createdAt) } : null
  }));
  return { success: true, offerLetters: mapped };
};

const deleteOfferLetterLocal = (id) => {
  const localOffers = getOfferLettersFromLocal();
  const updated = localOffers.filter(offer => offer.id !== id);
  saveOfferLettersToLocal(updated);
  return { success: true };
};

// --- Exported Actions ---

export const saveOfferLetter = async (offerData) => {
  if (useLocalStorage) {
    return saveOfferLetterLocal(offerData);
  }

  try {
    const currentYear = new Date().getFullYear();
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    let nextNum = 1;
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      if (data.offerNumber && data.offerNumber.startsWith(`CGS-OFF-${currentYear}-`)) {
        const parts = data.offerNumber.split('-');
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
          nextNum = lastNum + 1;
          break; 
        }
      }
    }
    
    const offerNumber = `CGS-OFF-${currentYear}-${String(nextNum).padStart(4, '0')}`;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...offerData,
      offerNumber,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id, offerNumber };
  } catch (error) {
    console.error("Error adding document to Firestore: ", error);
    enableLocalStorageFallback(error.message);
    return saveOfferLetterLocal(offerData);
  }
};

export const getOfferLetters = async () => {
  if (useLocalStorage) {
    return getOfferLettersLocal();
  }

  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const offerLetters = [];
    querySnapshot.forEach((doc) => {
      offerLetters.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, offerLetters };
  } catch (error) {
    console.error("Error getting documents: ", error);
    enableLocalStorageFallback(error.message);
    return getOfferLettersLocal();
  }
};

export const deleteOfferLetter = async (id) => {
  if (useLocalStorage || id.startsWith("off-local-") || id.startsWith("LOCAL-")) {
    return deleteOfferLetterLocal(id);
  }

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return { success: true };
  } catch (error) {
    console.error("Error deleting document: ", error);
    enableLocalStorageFallback(error.message);
    return deleteOfferLetterLocal(id);
  }
};
