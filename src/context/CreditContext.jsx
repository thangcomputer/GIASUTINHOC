import React, { createContext, useContext, useState, useEffect } from 'react';
import { studentAuthHeaders } from '../lib/authFetch';
import { fetchJsonIfOk } from '../lib/parseApiResponse.js';

const CreditContext = createContext();

export function CreditProvider({ children }) {
  const [credits, setCredits] = useState(0);

  // Sync từ localStorage (giasu_user)
  const syncCredits = () => {
    try {
      const u = JSON.parse(localStorage.getItem('giasu_user'));
      if (u && typeof u.coins === 'number') {
        setCredits(u.coins);
      } else {
        // Fallback for old states
        const saved = localStorage.getItem('user_credits');
        if (saved !== null) setCredits(parseInt(saved, 10));
      }
    } catch {}
  };

  useEffect(() => {
    syncCredits();
    // Fetch direct from Server to be 100% sure
    const fetchApiCredits = async () => {
      try {
        const u = JSON.parse(localStorage.getItem('giasu_user'));
        if (!u?._id) return;
        const res = await fetch(`/api/users/${u._id}`, { headers: studentAuthHeaders() });
        const d = await fetchJsonIfOk(res);
        if (d?.success && typeof d.data?.coins === 'number') {
          setCredits(d.data.coins);
          
          // Update localstorage so other tabs sync up too
          const updatedU = { ...u, coins: d.data.coins };
          localStorage.setItem('giasu_user', JSON.stringify(updatedU));
        }
      } catch {}
    };
    
    fetchApiCredits();
    
    // Auto refresh every 5 seconds just in case
    const interval = setInterval(fetchApiCredits, 5000);
    return () => clearInterval(interval);
  }, []);

  const deductCredits = (amount) => {
    if (credits >= amount) {
      setCredits(prev => prev - amount);
      return true;
    }
    return false;
  };

  const addCredits = (amount) => {
    setCredits(prev => prev + amount);
  };

  return (
    <CreditContext.Provider value={{ credits, setCredits, deductCredits, addCredits }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditContext);
}
