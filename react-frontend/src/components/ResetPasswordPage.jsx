import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/logo.png';

const inputStyle = (focused) => ({
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${focused ? '#14b8a6' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '12px',
    padding: '13px 14px 13px 44px',
    color: 'white', fontSize: '14px', outline: 'none',
    transition: 'border-color 0.2s',
});

const labelStyle = {
    display: 'block', color: 'rgba(255,255,255,0.5)',
    fontSize: '11px', fontWeight: '700',
    letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px',
};

const ResetPasswordPage = () => {
    // Read token and email from URL query params
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    const emailParam = params.get('email') || '';

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [focused, setFocused] = useState('');

    // Strength indicator
    const getStrength = (pwd) => {
        if (pwd.length === 0) return { level: 0, label: '', color: 'transparent' };
        if (pwd.length < 6) return { level: 1, label: 'Trop court', color: '#ef4444' };
        if (pwd.length < 8 || !/[0-9]/.test(pwd)) return { level: 2, label: 'Moyen', color: '#f59e0b' };
        if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && pwd.length >= 8) return { level: 3, label: 'Fort', color: '#14b8a6' };
        return { level: 2, label: 'Moyen', color: '#f59e0b' };
    };
    const strength = getStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== passwordConfirm) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }
        if (password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/reset-password', {
                token,
                email: emailParam,
                password,
                password_confirmation: passwordConfirm,
            });
            setSuccess(true);
        } catch (err) {
            const data = err.response?.data;
            setError(data?.message || 'Le lien est invalide ou expiré.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', width: '100%',
            background: 'linear-gradient(135deg, #0d2b2b 0%, #0a2020 40%, #081a1a 70%, #061515 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            padding: '24px', boxSizing: 'border-box',
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', justifyContent: 'center' }}>
                    <div style={{
                        width: '44px', height: '44px',
                        background: 'linear-gradient(135deg, #14b8a6, #0d9488)',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <img src={logo} alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>InterNat Stock</div>
                        <div style={{ fontSize: '10px', color: '#2dd4bf', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase' }}>OFPPT · SYSTÈME DE GESTION</div>
                    </div>
                </div>

                {/* Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '24px', padding: '40px 36px',
                    boxSizing: 'border-box',
                    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                }}>
                    {success ? (
                        /* ── Success ── */
                        <div style={{ textAlign: 'center', padding: '8px 0' }}>
                            <div style={{
                                width: '68px', height: '68px', margin: '0 auto 20px',
                                background: 'rgba(20,184,166,0.15)',
                                border: '2px solid #14b8a6', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <CheckCircle style={{ width: '32px', height: '32px', color: '#14b8a6' }} />
                            </div>
                            <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 10px' }}>
                                Mot de passe mis à jour !
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0 0 28px', lineHeight: '1.6' }}>
                                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.
                            </p>
                            <button
                                onClick={() => window.location.href = '/'}
                                style={{
                                    background: 'linear-gradient(90deg, #0d9488, #14b8a6)',
                                    border: 'none', borderRadius: '12px',
                                    padding: '13px 32px', color: 'white',
                                    fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                }}
                            >
                                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                                Se connecter
                            </button>
                        </div>
                    ) : (
                        /* ── Form ── */
                        <>
                            <div style={{ marginBottom: '28px' }}>
                                <div style={{
                                    width: '48px', height: '48px', marginBottom: '16px',
                                    background: 'rgba(20,184,166,0.1)',
                                    border: '1px solid rgba(20,184,166,0.3)', borderRadius: '14px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <ShieldCheck style={{ width: '22px', height: '22px', color: '#14b8a6' }} />
                                </div>
                                <h2 style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>
                                    Nouveau mot de passe
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', margin: 0 }}>
                                    Choisissez un mot de passe sécurisé pour{' '}
                                    <span style={{ color: '#2dd4bf' }}>{emailParam}</span>
                                </p>
                            </div>

                            {/* Invalid token warning */}
                            {!token && (
                                <div style={{
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.35)',
                                    borderRadius: '10px', padding: '10px 14px',
                                    color: '#fca5a5', fontSize: '13px', marginBottom: '18px',
                                }}>
                                    ⚠️ Lien de réinitialisation invalide ou expiré.
                                </div>
                            )}

                            {error && (
                                <div style={{
                                    background: 'rgba(239,68,68,0.1)',
                                    border: '1px solid rgba(239,68,68,0.35)',
                                    borderRadius: '10px', padding: '10px 14px',
                                    color: '#fca5a5', fontSize: '13px', marginBottom: '18px',
                                }}>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* New Password */}
                                <div>
                                    <label style={labelStyle}>Nouveau mot de passe</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: focused === 'pwd' ? '#14b8a6' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }} />
                                        <input
                                            type={showPassword ? 'text' : 'password'} value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••" required
                                            style={{ ...inputStyle(focused === 'pwd'), paddingRight: '44px' }}
                                            onFocus={() => setFocused('pwd')}
                                            onBlur={() => setFocused('')}
                                        />
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}>
                                            {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                                        </button>
                                    </div>

                                    {/* Strength bar */}
                                    {password.length > 0 && (
                                        <div style={{ marginTop: '8px' }}>
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} style={{
                                                        flex: 1, height: '3px', borderRadius: '99px',
                                                        background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.1)',
                                                        transition: 'background 0.3s',
                                                    }} />
                                                ))}
                                            </div>
                                            <span style={{ fontSize: '11px', color: strength.color }}>{strength.label}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label style={labelStyle}>Confirmer le mot de passe</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: focused === 'confirm' ? '#14b8a6' : 'rgba(255,255,255,0.3)', transition: 'color 0.2s' }} />
                                        <input
                                            type={showConfirm ? 'text' : 'password'} value={passwordConfirm}
                                            onChange={e => setPasswordConfirm(e.target.value)}
                                            placeholder="••••••••" required
                                            style={{
                                                ...inputStyle(focused === 'confirm'),
                                                paddingRight: '44px',
                                                borderColor: passwordConfirm && password !== passwordConfirm
                                                    ? '#ef4444'
                                                    : (focused === 'confirm' ? '#14b8a6' : 'rgba(255,255,255,0.1)'),
                                            }}
                                            onFocus={() => setFocused('confirm')}
                                            onBlur={() => setFocused('')}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex' }}>
                                            {showConfirm ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                                        </button>
                                    </div>
                                    {passwordConfirm && password !== passwordConfirm && (
                                        <p style={{ color: '#f87171', fontSize: '11px', marginTop: '6px' }}>
                                            ✗ Les mots de passe ne correspondent pas
                                        </p>
                                    )}
                                    {passwordConfirm && password === passwordConfirm && password.length >= 6 && (
                                        <p style={{ color: '#14b8a6', fontSize: '11px', marginTop: '6px' }}>
                                            ✓ Les mots de passe correspondent
                                        </p>
                                    )}
                                </div>

                                <button type="submit" disabled={loading || !token} style={{
                                    background: !token ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #0d9488, #14b8a6)',
                                    border: 'none', borderRadius: '12px',
                                    padding: '14px', color: 'white',
                                    fontSize: '15px', fontWeight: '700',
                                    cursor: (loading || !token) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '10px',
                                    opacity: loading ? 0.8 : 1,
                                }}>
                                    {loading
                                        ? <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                                        : 'Réinitialiser le mot de passe'
                                    }
                                </button>

                                <button type="button" onClick={() => window.location.href = '/'} style={{
                                    background: 'none', border: 'none',
                                    color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                                    fontSize: '13px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', gap: '6px',
                                }}>
                                    <ArrowLeft style={{ width: '14px', height: '14px' }} /> Retour à la connexion
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginTop: '20px' }}>
                    InterNat Stock v2.4.1 · OFPPT © 2025
                </p>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
};

export default ResetPasswordPage;
