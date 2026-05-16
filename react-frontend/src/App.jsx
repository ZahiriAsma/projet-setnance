import React from 'react';
import LoginPage from './components/LoginPage';
import ResetPasswordPage from './components/ResetPasswordPage';

function App() {
  const path = window.location.pathname;

  if (path === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (path === '/dashboard') {
    const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d2b2b 0%, #061515 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif", color: 'white',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px', marginBottom: '16px',
            width: '80px', height: '80px', margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
            borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>📦</div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px' }}>Tableau de Bord</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 28px' }}>
            Bienvenue, <span style={{ color: '#2dd4bf' }}>{user?.name || 'Utilisateur'}</span>
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user');
              sessionStorage.removeItem('auth_token');
              sessionStorage.removeItem('user');
              window.location.href = '/';
            }}
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '12px', padding: '10px 24px',
              color: '#fca5a5', fontWeight: '600',
              cursor: 'pointer', fontSize: '14px',
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  return <LoginPage />;
}

export default App;
