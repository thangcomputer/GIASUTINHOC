import React, { createContext, useContext, useState, useEffect } from 'react';
import { studentAuthHeaders } from '../lib/authFetch';
import { handleSessionFatal401 } from '../lib/sessionClient';
import { notifyGiasuUserUpdated } from '../lib/giasuUserSync.js';

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
        const u = JSON.parse(localStorage.getItem('giasu_user') || '{}');
        if (!u?._id) return;
        const res = await fetch(`/api/users/${u._id}`, { headers: studentAuthHeaders() });
        const text = await res.text();
        let d = null;
        try {
          d = text && String(text).trim() ? JSON.parse(text) : null;
        } catch {
          d = null;
        }
        if (handleSessionFatal401(res, d)) return;
        if (!res.ok || !d?.success || !d.data) return;
        const row = d.data;
        if (String(u._id) !== String(row._id)) return;
        if (typeof row.coins === 'number') {
          setCredits(row.coins);
        }
        const updatedU = { ...u };
        if (typeof row.coins === 'number') updatedU.coins = row.coins;
        const pid = String(row.activeCoinPlanId ?? '').trim();
        if (pid) {
          updatedU.activeCoinPlanId = pid;
          updatedU.activeCoinPlanBillingCycle = row.activeCoinPlanBillingCycle || '';
          updatedU.activeCoinPlanPaidAt = row.activeCoinPlanPaidAt ?? updatedU.activeCoinPlanPaidAt;
          updatedU.activeCoinPlanValidUntil = row.activeCoinPlanValidUntil ?? updatedU.activeCoinPlanValidUntil;
        } else {
          updatedU.activeCoinPlanId = '';
          updatedU.activeCoinPlanBillingCycle = '';
          updatedU.activeCoinPlanPaidAt = null;
          updatedU.activeCoinPlanValidUntil = null;
        }
        localStorage.setItem('giasu_user', JSON.stringify(updatedU));
        notifyGiasuUserUpdated();
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
