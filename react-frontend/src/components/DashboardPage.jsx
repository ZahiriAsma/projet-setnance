import React, { useState } from 'react';
import { 
  LayoutDashboard, FileText, Package, Users, BarChart3, CalendarDays, Settings, LogOut, 
  Search, Bell, FileSpreadsheet, AlertTriangle, ArrowRight, ChevronRight, Clock, AlertCircle, TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import MarchesContent from './MarchesContent';
import FournisseursContent from './FournisseursContent';

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

  // Recharts Data
  const barData = [
    { name: 'Jan', val1: 4000, val2: 2400 },
    { name: 'Fév', val1: 3000, val2: 1398 },
    { name: 'Mar', val1: 2000, val2: 4800 },
    { name: 'Avr', val1: 2780, val2: 3908 },
    { name: 'Mai', val1: 1890, val2: 4800 },
    { name: 'Juin', val1: 2390, val2: 3800 },
    { name: 'Juil', val1: 3490, val2: 4300 },
    { name: 'Août', val1: 4490, val2: 3300 },
    { name: 'Sep', val1: 2890, val2: 4500 },
    { name: 'Oct', val1: 3390, val2: 2500 },
    { name: 'Nov', val1: 3890, val2: 2100 },
    { name: 'Déc', val1: 4290, val2: 3600 },
  ];

  const pieData = [
    { name: 'Alimentation', value: 42, color: '#10b981' },
    { name: 'Hygiène', value: 28, color: '#f59e0b' },
    { name: 'Entretien', value: 15, color: '#3b82f6' },
    { name: 'Divers', value: 15, color: '#ef4444' },
  ];

  // Components for layout
  const NavItem = ({ id, icon: Icon, label, badge, indent = false }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '10px 16px',
        backgroundColor: activeTab === id ? '#0f766e' : 'transparent',
        borderLeft: activeTab === id ? '4px solid #10b981' : '4px solid transparent',
        color: activeTab === id ? 'white' : '#cbd5e1',
        border: 'none', borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: activeTab === id ? '#10b981' : 'transparent',
        cursor: 'pointer', textAlign: 'left',
        fontSize: '13px', fontWeight: activeTab === id ? '600' : '500',
        transition: 'all 0.2s', borderRadius: '0 8px 8px 0',
        marginBottom: '4px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Icon size={18} style={{ opacity: activeTab === id ? 1 : 0.7 }} />
        {label}
      </div>
      {badge && (
        <span style={{ 
          backgroundColor: '#ef4444', color: 'white', fontSize: '10px', 
          fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' 
        }}>
          {badge}
        </span>
      )}
    </button>
  );

  const NavGroup = ({ title }) => (
    <div style={{ 
      fontSize: '10px', fontWeight: '700', color: '#64748b', 
      letterSpacing: '0.05em', marginTop: '24px', marginBottom: '8px', 
      paddingLeft: '20px', textTransform: 'uppercase' 
    }}>
      {title}
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── SIDEBAR ── */}
      <aside style={{ 
        width: '260px', backgroundColor: '#0f172a', color: 'white', 
        display: 'flex', flexDirection: 'column', flexShrink: 0
      }}>
        {/* Brand */}
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', height: '36px', background: 'linear-gradient(135deg, #0f766e, #10b981)', 
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Package size={20} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px' }}>InterNat Stock</div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Gestion des internats OFPPT</div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }}>
          <NavGroup title="NAVIGATION PRINCIPALE" />
          <NavItem id="dashboard" icon={LayoutDashboard} label="Tableau de bord" />
          <NavItem id="marches" icon={FileText} label="Marchés" badge="2" />
          <NavItem id="stock" icon={Package} label="Stock" />
          <NavItem id="fournisseurs" icon={Users} label="Fournisseurs" />

          <NavGroup title="ANALYSE" />
          <NavItem id="rapports" icon={BarChart3} label="Rapports & statistiques" />
          <NavItem id="menus" icon={CalendarDays} label="Menus journaliers" />

          <NavGroup title="SYSTÈME" />
          <NavItem id="parametres" icon={Settings} label="Paramètres" />
        </div>

        {/* User Profile & Logout */}
        <div style={{ padding: '20px' }}>
          <div style={{ 
            backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                width: '36px', height: '36px', backgroundColor: '#0f766e', 
                borderRadius: '8px', display: 'flex', alignItems: 'center', 
                justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', position: 'relative'
              }}>
                KA
                <div style={{ 
                  position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', 
                  backgroundColor: '#10b981', border: '2px solid #1e293b', borderRadius: '50%' 
                }}></div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Karim Alaoui</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gestionnaire de stock</div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '0', background: 'none', border: 'none',
                color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <header style={{ 
          backgroundColor: 'white', padding: '16px 32px', display: 'flex', 
          justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            <span style={{ color: '#94a3b8' }}>InterNat Stock</span>
            <ChevronRight size={14} style={{ margin: '0 8px' }} />
            <span style={{ color: '#0f172a', fontWeight: '600' }}>
              {activeTab === 'dashboard' && 'Tableau de bord'}
              {activeTab === 'marches' && 'Marchés'}
              {activeTab === 'fournisseurs' && 'Fournisseurs'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" placeholder="Rechercher produit, marché, fournisseur..." 
                style={{
                  width: '100%', padding: '10px 10px 10px 36px', backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0', borderRadius: '20px', outline: 'none', fontSize: '13px', color: '#334155'
                }}
              />
            </div>
            {/* Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
                <Bell size={20} />
                <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span>
              </button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Settings size={20} /></button>
            </div>
            {/* User Avatar Small */}
            <div style={{ width: '32px', height: '32px', backgroundColor: '#0f766e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
              KA
            </div>
          </div>
        </header>

        {/* Dashboard Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
              
              {/* Welcome Banner */}
            <div style={{ 
              background: 'linear-gradient(135deg, #0f766e 0%, #10b981 100%)', 
              borderRadius: '16px', padding: '28px 32px', color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)', marginBottom: '24px'
            }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 8px 0' }}>Bonjour, Karim 👋</h1>
                <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Mardi 16 Janvier 2024 - Internat OFPPT Casablanca - Tout est sous contrôle.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '12px 20px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '800' }}>94%</div>
                  <div style={{ fontSize: '11px', opacity: 0.9, textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Taux de remplissage</div>
                </div>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
              {[
                { label: 'MARCHÉS ACTIFS', value: '12', trend: '+ 2 ce trimestre', icon: <FileSpreadsheet size={20} color="#2563eb" />, bg: 'rgba(37,99,235,0.1)', tColor: '#10b981' },
                { label: 'PRODUITS EN STOCK', value: '1,247', trend: '+ 5% ce mois', icon: <Package size={20} color="#10b981" />, bg: 'rgba(16,185,129,0.1)', tColor: '#10b981' },
                { label: 'FOURNISSEURS', value: '38', trend: '4 en attente', icon: <Users size={20} color="#2563eb" />, bg: 'rgba(37,99,235,0.1)', tColor: '#f59e0b' },
                { label: 'ALERTES DE STOCK', value: '5', trend: 'Action requise', icon: <AlertCircle size={20} color="#ef4444" />, bg: 'rgba(239,68,68,0.1)', tColor: '#ef4444' }
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em' }}>{stat.label}</div>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {stat.icon}
                    </div>
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: stat.tColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {stat.trend.includes('+') ? <TrendingUp size={14} /> : (stat.tColor === '#ef4444' ? <AlertTriangle size={14} /> : null)}
                    {stat.trend}
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
              
              {/* Bar Chart */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={18} color="#0f766e" />
                    Consommation mensuelle (2024)
                  </h3>
                  <button style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Rapport</button>
                </div>
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="val1" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar dataKey="val2" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Chart */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PieChart size={18} color="#0f766e" />
                    Répartition budget
                  </h3>
                </div>
                <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>842K</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>MAD</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  {pieData.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                      <div style={{ flex: 1 }}>{item.name}</div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.value}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
              
              {/* Table */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#0f766e" />
                    Dernières commandes
                  </h3>
                  <button style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>Voir tout</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ paddingBottom: '12px', fontWeight: '600' }}>N° MARCHÉ</th>
                      <th style={{ paddingBottom: '12px', fontWeight: '600' }}>FOURNISSEUR</th>
                      <th style={{ paddingBottom: '12px', fontWeight: '600' }}>PRODUIT</th>
                      <th style={{ paddingBottom: '12px', fontWeight: '600' }}>MONTANT</th>
                      <th style={{ paddingBottom: '12px', fontWeight: '600' }}>STATUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'M-2024-001', vendor: 'DISMA Maroc', product: 'Denrées alimentaires', amount: '124,000 MAD', status: 'Livré', sColor: '#10b981', sBg: 'rgba(16,185,129,0.1)' },
                      { id: 'M-2024-002', vendor: 'AGRO Casablanca', product: 'Produits hygiéniques', amount: '45,500 MAD', status: 'En cours', sColor: '#f59e0b', sBg: 'rgba(245,158,11,0.1)' },
                      { id: 'M-2024-003', vendor: 'EQUIP Pro', product: 'Matériel d\'entretien', amount: '22,800 MAD', status: 'Livré', sColor: '#10b981', sBg: 'rgba(16,185,129,0.1)' },
                      { id: 'M-2024-004', vendor: 'SOPROMA', product: 'Légumes & fruits', amount: '31,200 MAD', status: 'Retard', sColor: '#ef4444', sBg: 'rgba(239,68,68,0.1)' },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: i !== 3 ? '1px solid #f1f5f9' : 'none' }}>
                        <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: '600', color: '#0f766e' }}>{row.id}</td>
                        <td style={{ padding: '16px 0', fontSize: '13px', color: '#334155', fontWeight: '500' }}>{row.vendor}</td>
                        <td style={{ padding: '16px 0', fontSize: '13px', color: '#64748b' }}>{row.product}</td>
                        <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{row.amount}</td>
                        <td style={{ padding: '16px 0' }}>
                          <span style={{ backgroundColor: row.sBg, color: row.sColor, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Alerts */}
              <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={18} color="#ef4444" />
                    Alertes
                  </h3>
                  <div style={{ width: '20px', height: '20px', backgroundColor: '#ef4444', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>3</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { title: 'Stock bas critique', desc: 'Viandes moutons - reste 2 jours', icon: <AlertTriangle size={16} color="#ef4444" />, bg: 'rgba(239,68,68,0.1)', border: '#ef4444' },
                    { title: 'Livraison M-2024-002', desc: 'Retard de 2 jours signalé', icon: <Clock size={16} color="#f59e0b" />, bg: 'rgba(245,158,11,0.1)', border: '#f59e0b' },
                    { title: 'Facture à valider', desc: 'DISMA Maroc - 124,000 MAD', icon: <FileText size={16} color="#3b82f6" />, bg: 'rgba(59,130,246,0.1)', border: '#3b82f6' },
                  ].map((alert, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', borderLeft: `3px solid ${alert.border}` }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: alert.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {alert.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>{alert.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{alert.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            </div>
          )}
          {activeTab === 'marches' && <MarchesContent />}
          {activeTab === 'fournisseurs' && <FournisseursContent />}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
