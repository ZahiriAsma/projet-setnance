import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Sliders, Mail, Lock, Check, Loader2, RefreshCw, Camera } from 'lucide-react';
import api from '../api/axios';
import { useTranslation } from '../hooks/useTranslation';

// Traductions
const TRANSLATIONS = {
  fr: {
    settings: 'Paramètres', settingsDesc: 'Gérez votre profil et les préférences système',
    save: 'Enregistrer', saving: 'Enregistrement...', loading: 'Chargement de vos paramètres...',
    profile: 'Profil utilisateur', security: 'Sécurité', notifications: 'Notifications', system: 'Système',
    personalInfo: 'Informations personnelles', firstName: 'Prénom', lastName: 'Nom', email: 'Email',
    phone: 'Téléphone', establishment: 'Établissement', role: 'Rôle', changeAvatar: 'Changer avatar',
    newPassword: 'Nouveau mot de passe', confirmPassword: 'Confirmer le nouveau mot de passe',
    notifPrefs: 'Préférences de notification', stockAlerts: 'Alertes critiques de stock',
    stockAlertsDesc: 'Recevoir une notification lorsque le stock est bas.',
    weeklyReports: 'Rapports hebdomadaires', weeklyReportsDesc: 'Synthèse globale de la consommation et budget.',
    newMarches: 'Nouveaux Marchés publics', newMarchesDesc: "Notification à l'attribution d'un nouveau marché.",
    sysPrefs: 'Préférences système', language: "Langue de l'interface", theme: 'Thème visuel',
    itemsPerPage: 'Éléments par page (Listes)', light: 'Thème Clair (Par défaut)', dark: 'Thème Sombre',
    savedOk: 'Paramètres enregistrés avec succès !', errOccured: 'Une erreur est survenue lors de la mise à jour.',
    errPassword: 'Veuillez saisir un nouveau mot de passe.', errPasswordMatch: 'Les mots de passe ne correspondent pas.',
    pwdPlaceholder: 'Au moins 6 caractères', pwdConfirmPlaceholder: 'Ressaisir le mot de passe',
    notAvailable: 'Non renseigné',
  },
  ar: {
    settings: 'الإعدادات', settingsDesc: 'إدارة ملفك الشخصي وتفضيلات النظام',
    save: 'حفظ', saving: 'جاري الحفظ...', loading: 'جاري تحميل إعداداتك...',
    profile: 'الملف الشخصي', security: 'الأمان', notifications: 'الإشعارات', system: 'النظام',
    personalInfo: 'المعلومات الشخصية', firstName: 'الاسم الأول', lastName: 'اسم العائلة', email: 'البريد الإلكتروني',
    phone: 'الهاتف', establishment: 'المؤسسة', role: 'الدور', changeAvatar: 'تغيير الصورة',
    newPassword: 'كلمة المرور الجديدة', confirmPassword: 'تأكيد كلمة المرور',
    notifPrefs: 'تفضيلات الإشعارات', stockAlerts: 'تنبيهات المخزون الحرجة',
    stockAlertsDesc: 'تلقي إشعار عند انخفاض المخزون.',
    weeklyReports: 'التقارير الأسبوعية', weeklyReportsDesc: 'ملخص الاستهلاك والميزانية.',
    newMarches: 'المناقصات الجديدة', newMarchesDesc: 'إشعار عند منح مناقصة جديدة.',
    sysPrefs: 'تفضيلات النظام', language: 'لغة الواجهة', theme: 'المظهر البصري',
    itemsPerPage: 'العناصر لكل صفحة', light: 'الوضع الفاتح (افتراضي)', dark: 'الوضع الداكن',
    savedOk: 'تم حفظ الإعدادات بنجاح!', errOccured: 'حدث خطأ أثناء التحديث.',
    errPassword: 'الرجاء إدخال كلمة مرور جديدة.', errPasswordMatch: 'كلمتا المرور غير متطابقتين.',
    pwdPlaceholder: '٦ أحرف على الأقل', pwdConfirmPlaceholder: 'أعد إدخال كلمة المرور',
    notAvailable: 'غير متوفر',
  },
  en: {
    settings: 'Settings', settingsDesc: 'Manage your profile and system preferences',
    save: 'Save', saving: 'Saving...', loading: 'Loading your settings...',
    profile: 'User Profile', security: 'Security', notifications: 'Notifications', system: 'System',
    personalInfo: 'Personal Information', firstName: 'First Name', lastName: 'Last Name', email: 'Email',
    phone: 'Phone', establishment: 'Establishment', role: 'Role', changeAvatar: 'Change avatar',
    newPassword: 'New password', confirmPassword: 'Confirm new password',
    notifPrefs: 'Notification Preferences', stockAlerts: 'Critical stock alerts',
    stockAlertsDesc: 'Receive a notification when stock is low.',
    weeklyReports: 'Weekly reports', weeklyReportsDesc: 'Overall consumption and budget summary.',
    newMarches: 'New public tenders', newMarchesDesc: 'Notification when a new tender is awarded.',
    sysPrefs: 'System Preferences', language: 'Interface Language', theme: 'Visual Theme',
    itemsPerPage: 'Items per page (Lists)', light: 'Light Theme (Default)', dark: 'Dark Theme',
    savedOk: 'Settings saved successfully!', errOccured: 'An error occurred during the update.',
    errPassword: 'Please enter a new password.', errPasswordMatch: 'Passwords do not match.',
    pwdPlaceholder: 'At least 6 characters', pwdConfirmPlaceholder: 'Re-enter the password',
    notAvailable: 'Not provided',
  },
};

const ParametresContent = () => {
  const [activeSubTab, setActiveSubTab] = useState('profile');
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    phone: '',
    role: '',
    establishment: '',
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

  // System parameters from global translation context
  const { sysConfig, setSysConfig, lang, isRtl, isDark } = useTranslation();

  const t = TRANSLATIONS[sysConfig?.language || 'fr'] || TRANSLATIONS.fr;
  const isRtlLang = (sysConfig?.language || 'fr') === 'ar';

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/user');
      const data = response.data;
      const name = data.name || '';
      const parts = name.trim().split(' ');
      setFormData(prev => ({
        ...prev,
        prenom: parts[0] || '',
        nom: parts.slice(1).join(' ') || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || '',
        establishment: data.establishment || '',
      }));
      setLoading(false);
    } catch (error) {
      const localUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
      const name = localUser.name || '';
      const parts = name.trim().split(' ');
      setFormData(prev => ({
        ...prev,
        prenom: parts[0] || '',
        nom: parts.slice(1).join(' ') || '',
        email: localUser.email || '',
        phone: localUser.phone || '',
        role: localUser.role || '',
        establishment: localUser.establishment || '',
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
    const val = e.target.name === 'itemsPerPage' ? parseInt(e.target.value, 10) : e.target.value;
    setSysConfig(prev => ({
      ...prev,
      [e.target.name]: val
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const combinedName = `${formData.prenom.trim()} ${formData.nom.trim()}`.trim();
      const payload = { name: combinedName, email: formData.email };
      if (activeSubTab === 'security') {
        if (!formData.password) { setErrorMsg(t.errPassword); setSaving(false); return; }
        if (formData.password !== formData.password_confirmation) { setErrorMsg(t.errPasswordMatch); setSaving(false); return; }
        payload.password = formData.password;
        payload.password_confirmation = formData.password_confirmation;
      }
      const response = await api.put('/user/profile', payload);
      const storage = localStorage.getItem('auth_token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(response.data.user));
      window.dispatchEvent(new Event('user-profile-updated'));
      setSuccessMsg(t.savedOk);
      setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
    } catch (error) {
      setErrorMsg(error.response?.data?.message || t.errOccured);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    const f = firstName ? firstName.trim().charAt(0) : '';
    const l = lastName ? lastName.trim().charAt(0) : '';
    if (!f && !l) return 'KA';
    return (f + l).toUpperCase();
  };

  const tabs = [
    { id: 'profile', label: t.profile, icon: User },
    { id: 'security', label: t.security, icon: Shield },
    { id: 'notifications', label: t.notifications, icon: Bell },
    { id: 'system', label: t.system, icon: Sliders },
  ];

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', boxSizing: 'border-box' };
  const disabledStyle = { ...inputStyle, color: '#94a3b8', backgroundColor: '#f8fafc', cursor: 'not-allowed' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' };
  const labelDisabledStyle = { ...labelStyle, color: '#94a3b8' };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
        <RefreshCw size={24} color="#0f766e" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>{t.loading}</span>
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: isRtl ? "'Noto Sans Arabic', 'Segoe UI', sans-serif" : "'Inter', sans-serif" }}>
      <style>{`
        .param-tab { display:flex; align-items:center; gap:8px; padding:12px 18px; border:none; background:none; font-size:13px; font-weight:600; color:#64748b; border-bottom:2px solid transparent; cursor:pointer; transition:all 0.2s; }
        .param-tab:hover { color:#0f766e; }
        .param-tab-active { color:#0f766e; border-bottom:2px solid #0f766e; }
        .toggle-switch { position:relative; display:inline-block; width:44px; height:22px; }
        .toggle-switch input { opacity:0; width:0; height:0; }
        .slider { position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:#cbd5e1; transition:.3s; border-radius:34px; }
        .slider:before { position:absolute; content:""; height:16px; width:16px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%; }
        input:checked + .slider { background-color:#10b981; }
        input:checked + .slider:before { transform:translateX(22px); }
        .btn-green-primary { background-color:#0f766e; color:white; border:none; border-radius:8px; padding:10px 22px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all 0.2s ease-in-out; box-shadow:0 4px 6px -1px rgba(15,118,110,0.15); }
        .btn-green-primary:hover { background-color:#0d5c56; box-shadow:0 4px 10px -1px rgba(15,118,110,0.25); }
        .btn-green-primary:active { background-color:#0a4641; transform:translateY(1px); }
        .btn-green-secondary { background-color:transparent; color:#0f766e; border:1px solid #cbd5e1; border-radius:8px; padding:8px 16px; font-size:11px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s ease-in-out; }
        .btn-green-secondary:hover { background-color:rgba(15,118,110,0.04); border-color:#0f766e; }
      `}</style>

      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
          <div>
            <h1 style={{ fontSize:'22px', fontWeight:'700', color:'#0f172a', margin:'0 0 6px 0' }}>{t.settings}</h1>
            <p style={{ color:'#64748b', fontSize:'13px', margin:0 }}>{t.settingsDesc}</p>
          </div>
          <button onClick={handleSubmit} disabled={saving} className="btn-green-primary">
            {saving ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> {t.saving}</> : <><Check size={16} /> {t.save}</>}
          </button>
        </div>

        {/* Messages */}
        {successMsg && <div style={{ padding:'12px 16px', backgroundColor:'#ecfdf5', border:'1px solid #10b981', color:'#047857', borderRadius:'10px', fontSize:'13px', fontWeight:'600', marginBottom:'20px' }}>{successMsg}</div>}
        {errorMsg && <div style={{ padding:'12px 16px', backgroundColor:'#fef2f2', border:'1px solid #ef4444', color:'#b91c1c', borderRadius:'10px', fontSize:'13px', fontWeight:'600', marginBottom:'20px' }}>{errorMsg}</div>}

        {/* Sub-tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #e2e8f0', gap:'8px', marginBottom:'24px' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button key={tab.id} onClick={() => { setActiveSubTab(tab.id); setSuccessMsg(''); setErrorMsg(''); }} className={`param-tab ${isActive ? 'param-tab-active' : ''}`}>
                <Icon size={16} />{tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: Profile */}
        {activeSubTab === 'profile' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'24px' }}>
            {/* Avatar Card */}
            <div style={{ backgroundColor:'white', borderRadius:'12px', border:'1px solid #cbd5e1', padding:'24px 32px', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'24px' }}>
                <div style={{ width:'72px', height:'72px', borderRadius:'12px', backgroundColor:'#0f766e', color:'white', fontSize:'28px', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {getInitials(formData.prenom, formData.nom)}
                </div>
                <div style={{ flex:1 }}>
                  <h3 style={{ margin:'0 0 4px 0', fontSize:'16px', fontWeight:'700', color:'#0f172a' }}>
                    {formData.prenom || formData.nom ? `${formData.prenom} ${formData.nom}` : 'Utilisateur'}
                  </h3>
                  <p style={{ margin:'0 0 12px 0', fontSize:'12px', color:'#64748b', fontWeight:'500' }}>
                    {formData.role || 'Gestionnaire'}{formData.establishment ? ` · ${formData.establishment}` : ''}
                  </p>
                  <button type="button" className="btn-green-secondary"><Camera size={12} /> {t.changeAvatar}</button>
                </div>
              </div>
            </div>

            {/* Personal Info Grid */}
            <div style={{ backgroundColor:'white', borderRadius:'12px', border:'1px solid #cbd5e1', padding:'32px 36px', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin:'0 0 24px 0', fontSize:'14px', fontWeight:'700', color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.03em', borderBottom:'1px solid #f1f5f9', paddingBottom:'16px' }}>{t.personalInfo}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', rowGap:'24px', columnGap:'32px' }}>
                <div>
                  <label style={labelStyle}>{t.firstName}</label>
                  <input type="text" name="prenom" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t.lastName}</label>
                  <input type="text" name="nom" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>{t.email}</label>
                  <input type="email" name="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
                </div>
                {formData.phone ? (
                  <div>
                    <label style={labelDisabledStyle}>{t.phone}</label>
                    <input type="text" value={formData.phone} disabled style={disabledStyle} />
                  </div>
                ) : null}
                {formData.establishment ? (
                  <div>
                    <label style={labelDisabledStyle}>{t.establishment}</label>
                    <input type="text" value={formData.establishment} disabled style={disabledStyle} />
                  </div>
                ) : null}
                {formData.role ? (
                  <div>
                    <label style={labelDisabledStyle}>{t.role}</label>
                    <input type="text" value={formData.role} disabled style={disabledStyle} />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Security */}
        {activeSubTab === 'security' && (
          <div style={{ backgroundColor:'white', borderRadius:'12px', border:'1px solid #cbd5e1', padding:'28px 32px', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin:'0 0 20px 0', fontSize:'14px', fontWeight:'700', color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.03em', borderBottom:'1px solid #f1f5f9', paddingBottom:'12px' }}>{t.newPassword}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <div>
                <label style={labelStyle}>{t.newPassword}</label>
                <div style={{ position:'relative' }}>
                  <Lock size={16} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                  <input type="password" name="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ ...inputStyle, paddingLeft:'36px' }} placeholder={t.pwdPlaceholder} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t.confirmPassword}</label>
                <div style={{ position:'relative' }}>
                  <Lock size={16} style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
                  <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={e => setFormData({...formData, password_confirmation: e.target.value})} style={{ ...inputStyle, paddingLeft:'36px' }} placeholder={t.pwdConfirmPlaceholder} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Notifications */}
        {activeSubTab === 'notifications' && (
          <div style={{ backgroundColor:'white', borderRadius:'12px', border:'1px solid #cbd5e1', padding:'28px 32px', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin:'0 0 20px 0', fontSize:'14px', fontWeight:'700', color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.03em', borderBottom:'1px solid #f1f5f9', paddingBottom:'12px' }}>{t.notifPrefs}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
              {[
                { key:'stockAlerts', title: t.stockAlerts, desc: t.stockAlertsDesc },
                { key:'weeklyReports', title: t.weeklyReports, desc: t.weeklyReportsDesc },
                { key:'newMarches', title: t.newMarches, desc: t.newMarchesDesc },
              ].map((item, i) => (
                <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 0', borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'#0f172a', marginBottom:'2px' }}>{item.title}</div>
                    <div style={{ fontSize:'12px', color:'#64748b' }}>{item.desc}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={notifs[item.key]} onChange={() => setNotifs(p => ({...p, [item.key]: !p[item.key]}))} />
                    <span className="slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: System */}
        {activeSubTab === 'system' && (
          <div style={{ backgroundColor:'white', borderRadius:'12px', border:'1px solid #cbd5e1', padding:'28px 32px', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
            <h3 style={{ margin:'0 0 20px 0', fontSize:'14px', fontWeight:'700', color:'#0f172a', textTransform:'uppercase', letterSpacing:'0.03em', borderBottom:'1px solid #f1f5f9', paddingBottom:'12px' }}>{t.sysPrefs}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              <div style={{ display:'flex', gap:'16px' }}>
                <div style={{ flex:1 }}>
                  <label style={labelStyle}>{t.language}</label>
                  <select name="language" value={sysConfig.language} onChange={handleSysChange} style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', outline:'none', fontSize:'13px', color:'#334155', backgroundColor:'white' }}>
                    <option value="fr">Français (FR)</option>
                    <option value="ar">العربية (AR)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>
                <div style={{ flex:1 }}>
                  <label style={labelStyle}>{t.theme}</label>
                  <select name="theme" value={sysConfig.theme} onChange={handleSysChange} style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #cbd5e1', outline:'none', fontSize:'13px', color:'#334155', backgroundColor:'white' }}>
                    <option value="light">{t.light}</option>
                    <option value="dark">{t.dark}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParametresContent;
