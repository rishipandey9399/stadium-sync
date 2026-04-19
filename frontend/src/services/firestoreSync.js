import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Listens to Firestore for real-time venue status.
 * In production mode, this requires a healthy connection to the 'venue_status' collection.
 */
export const subscribeToVenueStatus = (callback) => {
  // Validate initialized Firestore
  if (!db.app.options.projectId) {
    console.error("Firebase not initialized. Real-time sync disabled.");
    return () => {};
  }

  try {
    const venueRef = collection(db, "venue_status");
    const q = query(venueRef, orderBy("name", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      callback(data);
    }, (error) => {
      console.warn("Firestore sync error (check your Firestore rules or indices):", error);
    });

    return unsubscribe;
  } catch (err) {
    console.error("Failed to establish Firestore stream:", err);
    return () => {};
  }
};
