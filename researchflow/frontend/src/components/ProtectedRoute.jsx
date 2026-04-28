import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

/**
 * ProtectedRoute
 * Wraps routes to ensure only authenticated users can access them.
 */
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // 1. While checking auth status, show a centered loading spinner
  if (loading) {
    return (
      <div className="bg-zinc-950 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. If loading is finished and no user is found, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;