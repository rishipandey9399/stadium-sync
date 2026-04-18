import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up
  const signup = async (email, password) => {
    // Note: Since you're likely using dummy config, this will throw an error in real usage
    // until valid Firebase credentials are provided.
    // For presentation purposes, we will mock success if Firebase is not properly configured.
    try {
      return await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/invalid-api-key') {
         console.warn("Using Firebase Dummy Mode. Mock login successful.");
         setCurrentUser({ email });
         return { user: { email } };
      }
      throw error;
    }
  };

  // Log in
  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (error.code === 'auth/invalid-api-key') {
         console.warn("Using Firebase Dummy Mode. Mock login successful.");
         setCurrentUser({ email });
         return { user: { email } };
      }
      throw error;
    }
  };

  // Log out
  const logout = () => {
    if (auth.app.options.apiKey === "YOUR_API_KEY") {
        setCurrentUser(null);
        return Promise.resolve();
    }
    return signOut(auth);
  };

  useEffect(() => {
    if (auth.app.options.apiKey === "YOUR_API_KEY") {
       setLoading(false);
       return () => {}; // Mock unsubscribe
    }

    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
