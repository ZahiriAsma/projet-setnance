import React, { useRef, useEffect } from 'react';
import {
  Search, Bell, Settings, ChevronRight, FileText, Users, CalendarDays, AlertTriangle,
} from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const TAB_LABELS = {
  dashboard: 'Tableau de bord',
  marches: 'Marchés',
  fournisseurs: 'Fournisseurs',
  menus: 'Menus journaliers',
  stock: 'Stock',
  rapports: 'Rapports & statistiques',
  parametres: 'Paramètres',
};

const TYPE_ICONS = {
  marche: FileText,
  fournisseur: Users,
  menu: CalendarDays,
};

const DashboardHeader = ({ activeTab }) => {
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    showNotifications,
    setShowNotifications,
    showSearchResults,
    setShowSearchResults,
    handleSearchSelect,
  } = useDashboard();

  useEffect(() => {
    const onDocClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [setShowNotifications, setShowSearchResults]);

  return (
    <header style={{
      backgroundColor: 'white', padding: '16px 32px', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0',
      position: 'relative', zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
        <span style={{ color: '#94a3b8' }}>InterNat Stock</span>
        <ChevronRight size={14} style={{ margin: '0 8px' }} />
        <span style={{ color: '#0f172a', fontWeight: '600' }}>
          {TAB_LABELS[activeTab] || 'Tableau de bord'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div ref={searchRef} style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Rechercher produit, marché, fournisseur..."
            style={{
              width: '100%', padding: '10px 10px 10px 36px', backgroundColor: '#f8fafc',
              border: `1px solid ${showSearchResults && searchQuery ? '#0f766e' : '#e2e8f0'}`,
              borderRadius: '20px', outline: 'none', fontSize: '13px', color: '#334155',
              boxSizing: 'border-box',
            }}
          />

          {showSearchResults && searchQuery.trim().length >= 2 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
              backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)', maxHeight: '320px', overflowY: 'auto',
            }}>
              {searchLoading ? (
                <p style={{ padding: '14px 16px', margin: 0, fontSize: '13px', color: '#64748b' }}>Recherche...</p>
              ) : searchResults.length === 0 ? (
                <p style={{ padding: '14px 16px', margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Aucun résultat pour « {searchQuery} »
                </p>
              ) : (
                searchResults.map((result) => {
                  const Icon = TYPE_ICONS[result.type] || FileText;
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => handleSearchSelect(result)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                        padding: '12px 16px', border: 'none', borderBottom: '1px solid #f1f5f9',
                        backgroundColor: 'white', cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                    >
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ecfdf5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={16} color="#0f766e" />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{result.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{result.subtitle}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b' }}>
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowNotifications((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '4px' }}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-8px', backgroundColor: '#ef4444',
                  color: 'white', fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '10px',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '340px',
                backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
                }}>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      style={{ background: 'none', border: 'none', color: '#0f766e', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p style={{ padding: '20px 16px', margin: 0, fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                      Aucune notification
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => markNotificationRead(n.id)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px',
                          border: 'none', borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                          backgroundColor: n.read ? 'white' : '#fffbeb',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          {n.type === 'alert' && <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />}
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{n.title}</div>
                            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>{n.message}</p>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                              {new Date(n.createdAt).toLocaleString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <Settings size={20} />
          </button>
        </div>

        <div style={{
          width: '32px', height: '32px', backgroundColor: '#0f766e', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
          fontSize: '12px', fontWeight: 'bold',
        }}>
          KA
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;




