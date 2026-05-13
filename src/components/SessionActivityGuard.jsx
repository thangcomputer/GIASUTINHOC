import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAllAuthStorage } from '../lib/sessionClient';

const IDLE_MS = 60 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 25_000;

function hasAnyToken() {
  try {
    return !!(localStorage.getItem('auth_token') || localStorage.getItem('admin_token'));
  } catch {
    return false;
  }
}

/**
 * Đăng xuất sau IDLE_MS không có tương tác (chuột/phím/cuộn/chạm).
 * Lắng nghe giasu:auth-lost (401 phiên từ server) để chuyển về đăng nhập.
 */
export default function SessionActivityGuard() {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const lastThrottleRef = useRef(0);

  const goLoginAfterIdle = useCallback(() => {
    clearAllAuthStorage();
    const path = window.location.pathname;
    const isAdminArea = path.startsWith('/admin') && path !== '/admin';
    navigate(isAdminArea ? '/admin' : '/login', {
      replace: true,
      state: {
        sessionMessage:
          'Bạn không có thao tác trong 1 giờ — hệ thống đã đăng xuất để bảo vệ tài khoản.',
      },
    });
  }, [navigate]);

  const scheduleIdleTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (!hasAnyToken()) return;
    timerRef.current = setTimeout(goLoginAfterIdle, IDLE_MS);
  }, [goLoginAfterIdle]);

  const onUserActivity = useCallback(() => {
    if (!hasAnyToken()) return;
    const now = Date.now();
    if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return;
    lastThrottleRef.current = now;
    scheduleIdleTimer();
  }, [scheduleIdleTimer]);

  useEffect(() => {
    const onAuthLost = (ev) => {
      const msg = ev.detail?.message;
      const path = window.location.pathname;
      const isAdminArea = path.startsWith('/admin') && path !== '/admin';
      navigate(isAdminArea ? '/admin' : '/login', {
        replace: true,
        state: msg ? { sessionMessage: msg } : {},
      });
    };
    window.addEventListener('giasu:auth-lost', onAuthLost);
    return () => window.removeEventListener('giasu:auth-lost', onAuthLost);
  }, [navigate]);

  useEffect(() => {
    scheduleIdleTimer();
    const evs = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'wheel'];
    evs.forEach((e) => window.addEventListener(e, onUserActivity, { passive: true }));
    return () => {
      evs.forEach((e) => window.removeEventListener(e, onUserActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleIdleTimer, onUserActivity]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'auth_token' || e.key === 'admin_token') scheduleIdleTimer();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [scheduleIdleTimer]);

  return null;
}
