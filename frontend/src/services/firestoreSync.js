import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

const DUMMY_AREAS = [
  { id: 'north-gate', name: 'North Entrance', type: 'gate' },
  { id: 'south-gate', name: 'South Entrance', type: 'gate' },
  { id: 'east-concourse', name: 'East Concourse', type: 'food' },
  { id: 'west-concourse', name: 'West Concourse', type: 'food' },
  { id: 'fan-zone', name: 'Fan Zone', type: 'attraction' },
];

/**
 * Listens to Firestore for real-time wait times.
 * If dummy Firebase configuration is detected, it falls back to a simulated local interval
 * to ensure the UI remains functional for demonstration purposes.
 */
export const subscribeToVenueStatus = (callback) => {
  // Check if Firebase uses a real project ID
  if (db.app.options.projectId === "YOUR_PROJECT_ID") {
    console.warn("Using Firebase Dummy Mode. Simulating Firestore Real-time stream.");
    const simulateData = () => {
      const data = DUMMY_AREAS.map(area => ({
        ...area,
        waitTime: Math.floor(Math.random() * 25),
        density: Math.random()
      }));
      callback(data);
    };
    
    simulateData(); // Initial load
    const interval = setInterval(simulateData, 5000);
    return () => clearInterval(interval); // Return unsubscribe function
  }

  // Real Firestore Implementation
  const venueRef = collection(db, "venue_status");
  const unsubscribe = onSnapshot(venueRef, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error("Firestore sync error:", error);
  });

  return unsubscribe;
};
