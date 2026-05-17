import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Sliders, Mail, Lock, Check, Loader2, RefreshCw, Camera } from 'lucide-react';
import api from '../api/axios';

const ParametresContent = () => {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    password_confirmation: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Notifications toggles
  const [notifs, setNotifs] = useState({
    stockAlerts: true,
    weeklyReports: false,
    newMarches: true,
  });

  // System parameters
  const [sysConfig, setSysConfig] = useState({
    theme: 'light',
    language: 'fr',
    itemsPerPage: 10,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/user');
      const name = response.data.name || '';
      const email = response.data.email || '';
      
      // Split full name into prenom and nom
      const parts = name.trim().split(' ');
      const prenom = parts[0] || '';
      const nom = parts.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        prenom: prenom,
        nom: nom,
        email: email
      }));
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement du profil', error);
      // Fallback to local storage
      const localUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      const name = localUser.name || '';
      const email = localUser.email || '';
      
      const parts = name.trim().split(' ');
      const prenom = parts[0] || '';
      const nom = parts.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        prenom: prenom,
        nom: nom,
        email: email
      }));
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleToggleNotif = (key) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSysChange = (e) => {
    setSysConfig({ ...sysConfig, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Re-combine prenom and nom to form full name for the database 'name' attribute
      const combinedName = `${formData.prenom.trim()} ${formData.nom.trim()}`.trim();
      
      const payload = {
        name: combinedName,
        email: formData.email
      };

      if (activeSubTab === 'security') {
        if (!formData.password) {
          setErrorMsg('Veuillez saisir un nouveau mot de passe.');
          setSaving(false);
          return;
        }
        if (formData.password !== formData.password_confirmation) {
          setErrorMsg('Les mots de passe ne correspondent pas.');
          setSaving(false);
          return;
        }
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }

      const response = await api.put('/user/profile', payload);

      // Save updated user in correct storage
      const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(response.data.user));

      // Emit custom event to notify DashboardPage in real-time
      window.dispatchEvent(new Event('user-profile-updated'));

      setSuccessMsg('Paramètres enregistrés avec succès !');
      
      // Clear security inputs
      setFormData(prev => ({
        ...prev,
        password: '',
        password_confirmation: ''
      }));
    } catch (error) {
      console.error('Erreur de sauvegarde', error.response || error);
      const msg = error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  // Get Initials for Avatar
  const getInitials = (firstName, lastName) => {
    const f = firstName ? firstName.trim().charAt(0) : '';
    const l = lastName ? lastName.trim().charAt(0) : '';
    if (!f && !l) return 'KA';
    return (f + l).toUpperCase();
  };

  const tabs = [
    { id: 'profile', label: 'Profil utilisateur', icon: User },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'Système', icon: Sliders },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <RefreshCw size={24} className="spin" color="#0f766e" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Chargement de vos paramètres...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* CSS Styles */}
      <style>{`
        .param-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          border: none;
          background: none;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        .param-tab:hover {
          color: #0f766e;
        }
        .param-tab-active {
          color: #0f766e;
          border-bottom: 2px solid #0f766e;
        }
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 22px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: #cbd5e1;
          transition: .3s;
          border-radius: 34px;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .slider {
          background-color: #10b981;
        }
        input:checked + .slider:before {
          transform: translateX(22px);
        }

        /* Green Primary Button styles with smooth interactive hover/active states */
        .btn-green-primary {
          background-color: #0f766e;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 4px 6px -1px rgba(15, 118, 110, 0.15);
        }
        .btn-green-primary:hover {
          background-color: #0d5c56;
          box-shadow: 0 4px 10px -1px rgba(15, 118, 110, 0.25);
        }
        .btn-green-primary:active {
          background-color: #0a4641;
          transform: translateY(1px);
        }

        /* Green Secondary Button style for Avatar button */
        .btn-green-secondary {
          background-color: transparent;
          color: #0f766e;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease-in-out;
        }
        .btn-green-secondary:hover {
          background-color: rgba(15, 118, 110, 0.04);
          border-color: #0f766e;
        }
        .btn-green-secondary:active {
          background-color: rgba(15, 118, 110, 0.08);
          transform: translateY(1px);
        }
      `}</style>

      {/* Header title & Save Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', maxWidth: '700px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>Paramètres</h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Gérez votre profil et les préférences système</p>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={saving}
          className="btn-green-primary"
        >
          {saving ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement...
            </>
          ) : (
            <>
              <Check size={16} /> Enregistrer
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', border: '1px solid #10b981', color: '#047857', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', maxWidth: '700px' }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #ef4444', color: '#b91c1c', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '20px', maxWidth: '700px' }}>
          {errorMsg}
        </div>
      )}

      {/* Navigation sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '8px', marginBottom: '24px', maxWidth: '700px' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id);
                setSuccessMsg('');
                setErrorMsg('');
              }}
              className={`param-tab ${isActive ? 'param-tab-active' : ''}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div>
        
        {/* TAB 1: User Profile */}
        {activeSubTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
            
            {/* Card 1: Horizontal Avatar Card on Top (Matches layout in user image) */}
            <div style={{ 
              backgroundColor: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', 
              padding: '24px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                {/* Rounded square avatar */}
                <div style={{ 
                  width: '72px', height: '72px', borderRadius: '12px', backgroundColor: '#0f766e',
                  color: 'white', fontSize: '28px', fontWeight: 'bold', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {getInitials(formData.prenom, formData.nom)}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                    {formData.prenom || formData.nom ? `${formData.prenom} ${formData.nom}` : 'Utilisateur'}
                  </h3>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    Gestionnaire de stock · Internat OFPPT Casablanca
                  </p>
                  
                  <button 
                    type="button"
                    className="btn-green-secondary"
                  >
                    <Camera size={12} /> Changer avatar
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Personal Info grid below Avatar Card */}
            <div style={{ 
              backgroundColor: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', 
              padding: '32px 36px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                Informations personnelles
              </h3>
              
              {/* Spacing further increased to 32px for maximum separation */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '32px', columnGap: '32px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Prénom</label>
                  <input 
                    type="text" name="prenom" value={formData.prenom} onChange={handleInputChange} required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="Karim"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Nom</label>
                  <input 
                    type="text" name="nom" value={formData.nom} onChange={handleInputChange} required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="Alaoui"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Email</label>
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleInputChange} required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="k.alaoui@ofppt.ma"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>Téléphone</label>
                  <input 
                    type="text" value="+212 6 61 23 45 67" disabled
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#94a3b8', backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>Établissement</label>
                  <input 
                    type="text" value="Internat OFPPT Casablanca" disabled
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#94a3b8', backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '8px' }}>Rôle</label>
                  <input 
                    type="text" value="Gestionnaire de stock" disabled
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#94a3b8', backgroundColor: '#f8fafc', cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Security */}
        {activeSubTab === 'security' && (
          <div style={{ 
            backgroundColor: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', 
            padding: '28px 32px', maxWidth: '700px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              Modifier le mot de passe
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="password" name="password" value={formData.password} onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="Au moins 6 caractères"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Confirmer le nouveau mot de passe</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="Ressaisir le mot de passe"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Notifications */}
        {activeSubTab === 'notifications' && (
          <div style={{ 
            backgroundColor: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', 
            padding: '28px 32px', maxWidth: '700px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              Préférences de notification
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>Alertes critiques de stock</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Recevoir une notification lorsque le stock est bas.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifs.stockAlerts} onChange={() => handleToggleNotif('stockAlerts')} />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>Rapports hebdomadaires</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Synthèse globale de la consommation et budget.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifs.weeklyReports} onChange={() => handleToggleNotif('weeklyReports')} />
                  <span className="slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '2px' }}>Nouveaux Marchés publics</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Notification à l'attribution d'un nouveau marché.</div>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={notifs.newMarches} onChange={() => handleToggleNotif('newMarches')} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: System */}
        {activeSubTab === 'system' && (
          <div style={{ 
            backgroundColor: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', 
            padding: '28px 32px', maxWidth: '700px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '14px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              Préférences système
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Langue de l'interface</label>
                  <select 
                    name="language" value={sysConfig.language} onChange={handleSysChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'white' }}
                  >
                    <option value="fr">Français (FR)</option>
                    <option value="ar">العربية (AR)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Thème visuel</label>
                  <select 
                    name="theme" value={sysConfig.theme} onChange={handleSysChange}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'white' }}
                  >
                    <option value="light">Thème Clair (Par défaut)</option>
                    <option value="dark">Thème Sombre</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Éléments par page (Listes)</label>
                <select 
                  name="itemsPerPage" value={sysConfig.itemsPerPage} onChange={handleSysChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'white' }}
                >
                  <option value={10}>10 éléments</option>
                  <option value={25}>25 éléments</option>
                  <option value={50}>50 éléments</option>
                </select>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default ParametresContent;
