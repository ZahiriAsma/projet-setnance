import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, LayoutDashboard, BarChart3, BellRing, ClipboardCheck, LogIn, X, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/logo.png';
import cardBg from '../assets/login_bg.png';

/* ─────────────── Shared Styles ─────────────── */
const inputStyle = (focused) => ({
    width: '100%', boxSizing: 'border-box',
    background: '#ffffff',
    border: `1px solid ${focused ? '#22c55e' : '#e2e8f0'}`,
    borderRadius: '8px',
    padding: '13px 14px 13px 44px',
    color: '#0f172a', fontSize: '14px', outline: 'none',
    transition: 'all 0.3s ease',
    boxShadow: focused ? '0 0 0 3px rgba(34, 197, 94, 0.2)' : 'none',
});

const labelStyle = {
    display: 'block',
    color: '#ffffff',
    fontSize: '11px', fontWeight: '700',
    letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px',
};

/* ─────────────── Forgot Password Modal ─────────────── */
const ForgotModal = ({ onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const [focused, setFocused] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/forgot-password', { email });
            setSent(true);
        } catch (err) {
            const data = err.response?.data;
            setError(data?.message || 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', backdropFilter: 'blur(8px)',
        }}>
            <div style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '24px', padding: '36px 32px',
                width: '100%', maxWidth: '420px',
                boxSizing: 'border-box', position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                color: '#ffffff',
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '6px', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center',
                    transition: 'all 0.2s',
                }}>
                    <X style={{ width: '16px', height: '16px' }} />
                </button>

                {sent ? (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <div style={{
                            width: '64px', height: '64px', margin: '0 auto 20px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '2px solid #22c55e', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Mail style={{ width: '28px', height: '28px', color: '#22c55e' }} />
                        </div>
                        <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 10px' }}>
                            Email envoyé !
                        </h3>
                        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 8px' }}>
                            Un lien de réinitialisation a été envoyé à
                        </p>
                        <p style={{ color: '#22c55e', fontWeight: '600', fontSize: '14px', margin: '0 0 24px' }}>
                            {email}
                        </p>
                        <p style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '12px', margin: '0 0 28px', lineHeight: '1.6' }}>
                            Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe. Le lien expire dans <strong style={{ color: 'rgba(255, 255, 255, 0.7)' }}>60 minutes</strong>.
                        </p>
                        <button onClick={onClose} style={{
                            background: '#22c55e',
                            border: 'none', borderRadius: '8px',
                            padding: '12px 32px', color: 'white',
                            fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                        }}>
                            Retour à la connexion
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{
                                width: '48px', height: '48px', marginBottom: '16px',
                                background: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Mail style={{ width: '22px', height: '22px', color: '#22c55e' }} />
                            </div>
                            <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>
                                Mot de passe oublié ?
                            </h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
                                Entrez votre adresse email. Vous recevrez un lien pour créer un nouveau mot de passe.
                            </p>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.15)',
                                border: '1px solid rgba(239,68,68,0.4)',
                                borderRadius: '8px', padding: '10px 14px',
                                color: '#fca5a5', fontSize: '13px', marginBottom: '18px',
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>ADRESSE EMAIL</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail style={{
                                        position: 'absolute', left: '14px', top: '50%',
                                        transform: 'translateY(-50%)', width: '18px', height: '18px',
                                        color: focused ? '#22c55e' : '#94a3b8',
                                        transition: 'color 0.2s',
                                    }} />
                                    <input
                                        type="email" value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="admin@gmail.com" required
                                        style={inputStyle(focused)}
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={loading} style={{
                                background: '#22c55e',
                                border: 'none', borderRadius: '8px',
                                padding: '13px', color: 'white',
                                fontWeight: '600', fontSize: '14px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '8px',
                                opacity: loading ? 0.75 : 1,
                            }}>
                                {loading
                                    ? <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                                    : 'Envoyer le lien'
                                }
                            </button>

                            <button type="button" onClick={onClose} style={{
                                background: 'none', border: 'none',
                                color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                                fontSize: '13px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '6px',
                                transition: 'color 0.2s',
                            }}
                                onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}>
                                <ArrowLeft style={{ width: '14px', height: '14px' }} />
                                Retour à la connexion
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

/* ─────────────── Main Login Page ─────────────── */
const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [showForgot, setShowForgot] = useState(false);
    const [focused, setFocused] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/login', { email, password });
            const { access_token, user } = response.data;
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('auth_token', access_token);
            storage.setItem('user', JSON.stringify(user));
            setTimeout(() => { window.location.href = '/dashboard'; }, 800);
        } catch (err) {
            const data = err.response?.data;
            const msg = data?.message
                || (data?.errors ? Object.values(data.errors).flat()[0] : null)
                || 'Identifiants incorrects.';
            setError(msg);
            setLoading(false);
        }
    };

    const features = [
        { icon: <LayoutDashboard style={{ width: '16px', height: '16px', color: 'white' }} />, text: "Gestion complète du stock en temps réel" },
        { icon: <ClipboardCheck style={{ width: '16px', height: '16px', color: 'white' }} />, text: "Workflow intégré des marchés et bons de commande" },
        { icon: <BarChart3 style={{ width: '16px', height: '16px', color: 'white' }} />, text: "Rapports analytiques et tableaux de bord dynamiques" },
        { icon: <BellRing style={{ width: '16px', height: '16px', color: 'white' }} />, text: "Alertes automatiques de rupture de stock" },
    ];

    return (
        <>
            {showForgot && <ForgotModal onClose={() => setShowForgot(false)} />}

            <div style={{
                minHeight: '100vh', width: '100%',
                backgroundImage: `url(${cardBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                padding: '24px', boxSizing: 'border-box',
                position: 'relative'
            }}>
                {/* Subtle dark overlay for readability if needed, though the image might have it */}
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 0 }}></div>

                <div style={{
                    maxWidth: '1200px', width: '100%',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '60px', flexWrap: 'wrap',
                    zIndex: 1, position: 'relative'
                }}>
                    {/* ── LEFT ── */}
                    <div style={{ flex: 1, minWidth: '320px', color: '#ffffff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
                            <div style={{
                                width: '70px', height: '70px',
                                border: '4px solid #10b981',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                            }}>
                                <img src={logo} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1.1', color: '#ffffff' }}>InterNat Stock</div>
                                <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase' }}>OFFPT - SYSTÈME DE GESTION</div>
                            </div>
                        </div>

                        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: '800', lineHeight: '1.2', margin: '0 0 20px 0', color: '#ffffff' }}>
                            La gestion de stock<br />
                            <span style={{ color: '#34d399' }}>réinventée</span> pour les internats
                        </h1>

                        <p style={{ color: '#ffffff', fontSize: '16px', lineHeight: '1.6', margin: '0 0 40px 0', maxWidth: '520px' }}>
                            Pilotez vos marchés, stocks, fournisseurs et menus journaliers depuis une interface moderne, intuitive et centralisée.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {features.map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '32px', height: '32px', flexShrink: 0,
                                        background: '#0f766e',
                                        borderRadius: '8px',
                                        border: '1px solid #14b8a6',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {React.cloneElement(f.icon, { style: { ...f.icon.props.style, color: '#4ade80' } })}
                                    </div>
                                    <span style={{ color: '#ffffff', fontSize: '15px', fontWeight: '500' }}>{f.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── RIGHT: LOGIN CARD ── */}
                    <div style={{
                        width: '100%', maxWidth: '420px',
                        background: 'rgba(30, 41, 59, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '24px', padding: '48px 40px',
                        boxSizing: 'border-box',
                        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                        flexShrink: 0,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    }}>
                        <div style={{ marginBottom: '36px' }}>
                            <h2 style={{ color: '#ffffff', fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
                                Bienvenue
                            </h2>
                            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', margin: 0 }}>
                                Connectec vous à votte espare de gestion
                            </p>
                        </div>

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {error && (
                                <div style={{
                                    background: 'rgba(239,68,68,0.15)',
                                    border: '1px solid rgba(239,68,68,0.4)',
                                    borderRadius: '8px', padding: '12px 14px',
                                    color: '#fca5a5', fontSize: '13px',
                                }}>{error}</div>
                            )}

                            {/* Email */}
                            <div>
                                <label style={labelStyle}>ADRESSE EMAIL</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail style={{
                                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                                        width: '18px', height: '18px',
                                        color: '#34d399',
                                    }} />
                                    <input
                                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="adirrin@ofppt ma" required
                                        style={inputStyle(focused === 'email')}
                                        onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label style={labelStyle}>MOT DE PASSE</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock style={{
                                        position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                                        width: '18px', height: '18px',
                                        color: '#94a3b8',
                                    }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••" required
                                        style={{ ...inputStyle(focused === 'pwd'), paddingRight: '44px' }}
                                        onFocus={() => setFocused('pwd')} onBlur={() => setFocused('')}
                                    />
                                    <button
                                        type="button" onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: '#94a3b8', padding: 0, display: 'flex',
                                            transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.target.style.color = '#334155'}
                                        onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                                    >
                                        {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me + Forgot */}
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', marginTop: '-4px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#ffffff', userSelect: 'none' }}>
                                    <div onClick={() => setRememberMe(!rememberMe)} style={{
                                        width: '18px', height: '18px', flexShrink: 0,
                                        borderRadius: '4px',
                                        background: rememberMe ? '#22c55e' : 'transparent',
                                        border: rememberMe ? 'none' : '2px solid rgba(255,255,255,0.4)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}>
                                        {rememberMe && (
                                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                    <span onClick={() => setRememberMe(!rememberMe)}>Se souvenir de moi</span>
                                </label>

                                <button
                                    type="button" onClick={() => setShowForgot(true)}
                                    style={{
                                        background: 'none', border: 'none',
                                        color: '#38bdf8', cursor: 'pointer',
                                        fontSize: '13px', padding: 0, marginLeft: '0px',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.target.style.color = '#7dd3fc'}
                                    onMouseLeave={(e) => e.target.style.color = '#38bdf8'}
                                >
                                    Mot de passe oublie ?
                                </button>
                            </div>

                            {/* Submit */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                <button type="submit" disabled={loading} style={{
                                    background: '#22c55e',
                                    border: 'none', borderRadius: '8px',
                                    padding: '12px 24px', color: 'white',
                                    fontSize: '15px', fontWeight: '600',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', gap: '8px',
                                    opacity: loading ? 0.8 : 1, transition: 'all 0.2s ease',
                                }}
                                    onMouseEnter={(e) => {
                                        if (!loading) e.target.style.background = '#16a34a';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#22c55e';
                                    }}>
                                    {loading
                                        ? <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                                        : <><LogIn style={{ width: '18px', height: '18px' }} /> Se connecter</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: #94a3b8; }
            `}</style>
        </>
    );
};

export default LoginPage;
