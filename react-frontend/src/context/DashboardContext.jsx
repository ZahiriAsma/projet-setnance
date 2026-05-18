import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { analyzeMenuBudget, MENU_PRICE_LIMIT_DH } from '../utils/menuPrices';

const DashboardContext = createContext(null);

const NOTIF_STORAGE_KEY = 'internat_notifications';

function loadStoredNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadSysConfig() {
  try {
    const raw = localStorage.getItem('sysConfig');
    return raw ? JSON.parse(raw) : { theme: 'light', language: 'fr', itemsPerPage: 10 };
  } catch {
    return { theme: 'light', language: 'fr', itemsPerPage: 10 };
  }
}

export function DashboardProvider({ children, onNavigate }) {
  const [notifications, setNotifications] = useState(loadStoredNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [sysConfig, setSysConfigState] = useState(loadSysConfig);

  const setSysConfig = useCallback((updated) => {
    const next = typeof updated === 'function' ? updated(sysConfig) : updated;
    setSysConfigState(next);
    localStorage.setItem('sysConfig', JSON.stringify(next));
  }, [sysConfig]);

  useEffect(() => {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const addNotification = useCallback((notification) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      read: false,
      createdAt: new Date().toISOString(),
      type: 'info',
      ...notification,
    };
    setNotifications((prev) => {
      const exists = prev.some(
        (n) => n.title === notification.title && n.message === notification.message
      );
      if (exists) return prev;
      return [entry, ...prev].slice(0, 30);
    });
    return entry;
  }, []);

  const markNotificationRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const checkMenuPrices = useCallback(
    (formData, dayLabel) => {
      const { total, overItems, exceeds } = analyzeMenuBudget(formData);
      if (!exceeds) return false;

      let message;
      if (overItems.length > 0 && total > MENU_PRICE_LIMIT_DH) {
        message = `Le menu du ${dayLabel} : ${overItems.length} article(s) > ${MENU_PRICE_LIMIT_DH} DH et total ${total.toFixed(2)} DH/résident.`;
      } else if (overItems.length > 0) {
        message = `Le menu du ${dayLabel} contient ${overItems.length} article(s) au-delà de ${MENU_PRICE_LIMIT_DH} DH (${overItems.map((i) => i.label).join(', ')}).`;
      } else {
        message = `Le menu du ${dayLabel} totalise ${total.toFixed(2)} DH/résident (seuil : ${MENU_PRICE_LIMIT_DH} DH).`;
      }

      addNotification({
        type: 'alert',
        title: 'Alerte coût menu',
        message,
        tab: 'menus',
      });

      return true;
    },
    [addNotification]
  );

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/search', { params: { q: searchQuery.trim() } });
        setSearchResults(res.data);
      } catch (err) {
        console.error('Erreur recherche:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSelect = useCallback(
    (result) => {
      if (onNavigate && result.tab) {
        onNavigate(result.tab, result);
      }
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
    },
    [onNavigate]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      checkMenuPrices,
      searchQuery,
      setSearchQuery,
      searchResults,
      searchLoading,
      showNotifications,
      setShowNotifications,
      showSearchResults,
      setShowSearchResults,
      handleSearchSelect,
      sysConfig,
      setSysConfig,
    }),
    [
      notifications,
      unreadCount,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      checkMenuPrices,
      searchQuery,
      searchResults,
      searchLoading,
      showNotifications,
      showSearchResults,
      handleSearchSelect,
      sysConfig,
      setSysConfig,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return ctx;
}
