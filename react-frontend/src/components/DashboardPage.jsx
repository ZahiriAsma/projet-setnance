import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Tableau de bord' },
    { id: 'stock', icon: <Package size={20} />, label: 'Gestion Stock' },
    { id: 'orders', icon: <ShoppingCart size={20} />, label: 'Commandes' },
    { id: 'suppliers', icon: <Users size={20} />, label: 'Fournisseurs' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Paramètres' },
  ];

  const stats = [
    { label: 'Articles en stock', value: '1,245', icon: <Package size={24} color="#2563eb" />, trend: '+12%', color: 'rgba(37, 99, 235, 0.1)' },
    { label: 'Commandes en cours', value: '38', icon: <ShoppingCart size={24} color="#059669" />, trend: '+5%', color: 'rgba(5, 150, 105, 0.1)' },
    { label: 'Ruptures de stock', value: '12', icon: <AlertCircle size={24} color="#dc2626" />, trend: '-2%', color: 'rgba(220, 38, 38, 0.1)' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '260px', 
        backgroundColor: '#1e293b', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
            borderRadius: '10px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px'
          }}>📦</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '16px' }}>InterNat Stock</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Espace de gestion</div>
          </div>
        </div>

        <nav style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', padding: '12px 16px',
                backgroundColor: activeTab === item.id ? '#2563eb' : 'transparent',
                color: activeTab === item.id ? 'white' : '#cbd5e1',
                border: 'none', borderRadius: '10px',
                cursor: 'pointer', textAlign: 'left',
                fontSize: '14px', fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '24px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              width: '100%', padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: 'none', borderRadius: '10px',
              cursor: 'pointer', textAlign: 'left',
              fontSize: '14px', fontWeight: '500',
            }}
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header */}
        <header style={{ 
          backgroundColor: 'white', 
          padding: '16px 32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              style={{
                width: '100%', padding: '10px 10px 10px 40px',
                backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: '8px', outline: 'none', fontSize: '14px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button style={{ background: 'none', border: 'none', position: 'relative', cursor: 'pointer' }}>
              <Bell size={20} color="#64748b" />
              <span style={{ 
                position: 'absolute', top: '-4px', right: '-4px', 
                width: '8px', height: '8px', backgroundColor: '#ef4444', 
                borderRadius: '50%' 
              }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{user?.name || 'Administrateur'}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{user?.email || 'admin@ofppt.ma'}</div>
              </div>
              <div style={{ 
                width: '40px', height: '40px', 
                backgroundColor: '#e2e8f0', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#475569', fontWeight: 'bold'
              }}>
                {(user?.name || 'A')[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div style={{ padding: '32px', overflowY: 'auto' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>
            Tableau de bord
          </h1>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ 
                backgroundColor: 'white', padding: '24px', 
                borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: '20px'
              }}>
                <div style={{ 
                  width: '56px', height: '56px', 
                  backgroundColor: stat.color, borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: stat.trend.startsWith('+') ? '#059669' : '#dc2626' }}>
                      {stat.trend}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity Placeholder */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Activités Récentes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '16px', borderBottom: i !== 4 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563eb' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>Nouvelle commande réceptionnée</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Il y a 2 heures</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
