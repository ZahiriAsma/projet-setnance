import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText, ChevronDown, X, Check, RefreshCw, AlertCircle,
  CheckCircle, Printer, Plus, Trash2, Search
} from 'lucide-react';
import api from '../api/axios';
import { useDashboard } from '../context/DashboardContext';

const FactureContent = () => {
  const { sysConfig } = useDashboard();
  const isDark = sysConfig?.theme === 'dark';
  const lang = sysConfig?.language || 'fr';
  const isRtl = lang === 'ar';

  const clr = {
    bg: isDark ? '#1e293b' : 'white',
    pageBg: isDark ? '#0f172a' : '#f8fafc',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    headerBg: isDark ? '#0f172a' : '#f8fafc',
    rowHover: isDark ? '#334155' : '#f8fafc',
    inputBg: isDark ? '#0f172a' : '#f8fafc',
  };

  // BonCommande list (used as BL references)
  const [bonCommandes, setBonCommandes] = useState([]);
  const [loadingBC, setLoadingBC] = useState(true);
  const [bcError, setBcError] = useState('');

  // Selected BCs
  const [selectedBcIds, setSelectedBcIds] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bcSearch, setBcSearch] = useState('');
  const dropdownRef = useRef(null);

  // Facture metadata
  const [numeroFacture, setNumeroFacture] = useState('');
  const [dateFacture, setDateFacture] = useState(new Date().toISOString().split('T')[0]);
  const [fournisseurNom, setFournisseurNom] = useState('');

  // Merged items from selected BCs
  const [items, setItems] = useState([]);

  // Messages
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch all BonCommandes
  useEffect(() => {
    const fetchBC = async () => {
      setLoadingBC(true);
      try {
        const res = await api.get('/bon-commandes');
        setBonCommandes(res.data || []);
      } catch (e) {
        setBcError('Impossible de charger les bons de commande.');
      } finally {
        setLoadingBC(false);
      }
    };
    fetchBC();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Merge items whenever selectedBcIds changes
  useEffect(() => {
    const selectedBCs = bonCommandes.filter(bc => selectedBcIds.includes(bc.id));
    // Set fournisseur from first selected BC
    if (selectedBCs.length > 0 && selectedBCs[0].fournisseur) {
      setFournisseurNom(selectedBCs[0].fournisseur.raisonSociale || '');
    } else if (selectedBCs.length === 0) {
      setFournisseurNom('');
    }

    // Merge all items from selected BCs
    const merged = [];
    selectedBCs.forEach(bc => {
      const bcItems = Array.isArray(bc.items) ? bc.items : [];
      bcItems.forEach(item => {
        merged.push({
          ...item,
          _bcRef: bc.numeroBC,
        });
      });
    });
    setItems(merged);
  }, [selectedBcIds, bonCommandes]);

  // Toggle BC selection
  const toggleBC = (id) => {
    setSelectedBcIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Remove a single BC
  const removeBC = (id) => {
    setSelectedBcIds(prev => prev.filter(x => x !== id));
  };

  // Filtered BC list in dropdown
  const filteredBC = useMemo(() => {
    if (!bcSearch.trim()) return bonCommandes;
    const q = bcSearch.toLowerCase();
    return bonCommandes.filter(bc =>
      (bc.numeroBC || '').toLowerCase().includes(q) ||
      (bc.fournisseur?.raisonSociale || '').toLowerCase().includes(q)
    );
  }, [bonCommandes, bcSearch]);

  // Totals
  const totals = useMemo(() => {
    let ht = 0, tva = 0;
    items.forEach(item => {
      const qty = parseFloat(item.qty || item.quantity || 0);
      const pu = parseFloat(item.unit_price_ht || 0);
      const vatRate = parseFloat(item.vat_rate || 0);
      const lineHt = qty * pu;
      const lineTva = lineHt * (vatRate / 100);
      ht += lineHt;
      tva += lineTva;
    });
    return { ht, tva, ttc: ht + tva };
  }, [items]);

  const fmt = (n) => parseFloat(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const selectedBCs = bonCommandes.filter(bc => selectedBcIds.includes(bc.id));

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: isRtl ? "'Noto Sans Arabic','Segoe UI',sans-serif" : "'Inter',sans-serif" }}>
      <style>{`
        .facture-input {
          width: 100%; padding: 10px 14px; border-radius: 10px;
          border: 1.5px solid ${clr.border}; background: ${clr.inputBg};
          color: ${clr.text}; font-size: 13px; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box;
        }
        .facture-input:focus { border-color: #0f766e; box-shadow: 0 0 0 3px rgba(15,118,110,0.12); }
        .bc-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 20px;
          background: rgba(15,118,110,0.12); color: #0f766e;
          font-size: 12px; font-weight: 600; border: 1px solid rgba(15,118,110,0.25);
        }
        .bc-tag button { background: none; border: none; cursor: pointer; color: #0f766e; display: flex; align-items: center; padding: 0; }
        .bc-option { padding: 10px 14px; cursor: pointer; display: flex; align-items: center; gap: 10px; font-size: 13px; transition: background 0.15s; }
        .bc-option:hover { background: ${isDark ? '#1e293b' : '#f0fdf4'}; }
        .btn-primary { background: linear-gradient(135deg, #0f766e, #10b981); color: white; border: none; border-radius: 10px; padding: 11px 24px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,118,110,0.3); }
        .section-card { background: ${clr.bg}; border: 1.5px solid ${clr.border}; border-radius: 16px; padding: 24px; margin-bottom: 24px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: clr.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={28} color="#0f766e" />
            Gestion des Factures
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: clr.textMuted }}>
            Sélectionnez un ou plusieurs bons de commande pour générer une facture automatiquement.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => window.print()}
        >
          <Printer size={16} /> Imprimer
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', border: '1px solid #10b981', borderRadius: '12px', color: '#15803d', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
          <CheckCircle size={18} color="#10b981" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid #ef4444', borderRadius: '12px', color: '#b91c1c', marginBottom: '20px', fontSize: '13px', fontWeight: '500' }}>
          <AlertCircle size={18} color="#ef4444" /> {errorMsg}
        </div>
      )}

      {/* Section 1: Facture Info */}
      <div className="section-card">
        <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: '700', color: clr.text }}>Informations de la facture</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: clr.textMuted, marginBottom: '6px' }}>N° Facture</label>
            <input className="facture-input" value={numeroFacture} onChange={e => setNumeroFacture(e.target.value)} placeholder="FAC-2026-001" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: clr.textMuted, marginBottom: '6px' }}>Date</label>
            <input className="facture-input" type="date" value={dateFacture} onChange={e => setDateFacture(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: clr.textMuted, marginBottom: '6px' }}>Fournisseur</label>
            <input className="facture-input" value={fournisseurNom} onChange={e => setFournisseurNom(e.target.value)} placeholder="Nom du fournisseur" />
          </div>
        </div>
      </div>

      {/* Section 2: BC Selection */}
      <div className="section-card">
        <h2 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: clr.text }}>Réf. BC Cadre</h2>
        <p style={{ margin: '0 0 16px', fontSize: '12px', color: clr.textMuted }}>
          Sélectionnez un ou plusieurs bons de commande. Les produits seront ajoutés automatiquement.
        </p>

        {loadingBC ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: clr.textMuted, fontSize: '13px' }}>
            <RefreshCw size={16} style={{ animation: 'spin 1.2s linear infinite' }} /> Chargement des bons de commande...
          </div>
        ) : bcError ? (
          <div style={{ color: '#ef4444', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {bcError}
          </div>
        ) : (
          <>
            {/* Selected tags */}
            {selectedBCs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {selectedBCs.map(bc => (
                  <span key={bc.id} className="bc-tag">
                    {bc.numeroBC}
                    {bc.fournisseur && <span style={{ fontWeight: 400, opacity: 0.75 }}> — {bc.fournisseur.raisonSociale}</span>}
                    <button onClick={() => removeBC(bc.id)}><X size={12} /></button>
                  </span>
                ))}
                <button
                  onClick={() => setSelectedBcIds([])}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#ef4444', fontWeight: '600', padding: '4px 8px' }}
                >
                  Tout effacer
                </button>
              </div>
            )}

            {/* Dropdown trigger */}
            <div ref={dropdownRef} style={{ position: 'relative', maxWidth: '480px' }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '10px',
                  border: `1.5px solid ${dropdownOpen ? '#0f766e' : clr.border}`,
                  background: clr.inputBg, color: selectedBcIds.length ? clr.text : clr.textMuted,
                  fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', outline: 'none',
                  boxShadow: dropdownOpen ? '0 0 0 3px rgba(15,118,110,0.12)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                <span>
                  {selectedBcIds.length === 0
                    ? 'Sélectionner des bons de commande...'
                    : `${selectedBcIds.length} BC sélectionné(s)`}
                </span>
                <ChevronDown size={16} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
                  background: clr.bg, border: `1.5px solid ${clr.border}`, borderRadius: '12px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.12)', animation: 'fadeIn 0.15s ease',
                  overflow: 'hidden'
                }}>
                  {/* Search inside dropdown */}
                  <div style={{ padding: '10px', borderBottom: `1px solid ${clr.border}`, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      className="facture-input"
                      style={{ paddingLeft: '32px' }}
                      placeholder="Rechercher un BC..."
                      value={bcSearch}
                      onChange={e => setBcSearch(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {filteredBC.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: clr.textMuted, fontSize: '13px' }}>
                        Aucun bon de commande trouvé.
                      </div>
                    ) : filteredBC.map(bc => {
                      const isSelected = selectedBcIds.includes(bc.id);
                      const itemCount = Array.isArray(bc.items) ? bc.items.length : 0;
                      return (
                        <div
                          key={bc.id}
                          className="bc-option"
                          onClick={() => toggleBC(bc.id)}
                          style={{ background: isSelected ? (isDark ? 'rgba(15,118,110,0.15)' : '#f0fdf4') : 'transparent' }}
                        >
                          <div style={{
                            width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                            border: `2px solid ${isSelected ? '#0f766e' : clr.border}`,
                            background: isSelected ? '#0f766e' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
                          }}>
                            {isSelected && <Check size={11} color="white" />}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', color: clr.text }}>{bc.numeroBC}</div>
                            <div style={{ fontSize: '11px', color: clr.textMuted }}>
                              {bc.fournisseur?.raisonSociale || 'Fournisseur inconnu'} · {itemCount} produit{itemCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', color: isSelected ? '#0f766e' : clr.textMuted, fontWeight: '600' }}>
                            {bc.montantTTC ? `${parseFloat(bc.montantTTC).toLocaleString('fr-FR')} MAD` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Section 3: Products Table */}
      <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1.5px solid ${clr.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: clr.text }}>
            Produits de la facture
          </h2>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f766e' }}>{items.length} ligne{items.length !== 1 ? 's' : ''}</span>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: isDark ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <FileText size={28} color="#94a3b8" />
            </div>
            <p style={{ margin: 0, color: clr.textMuted, fontSize: '14px', fontWeight: '500' }}>
              Sélectionnez des bons de commande pour voir les produits ici.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
              <thead>
                <tr style={{ background: clr.headerBg, borderBottom: `2px solid ${clr.border}`, color: clr.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'left' }}>Réf. BC</th>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'left' }}>N° Prix</th>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'left', minWidth: '200px' }}>Désignation</th>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'center' }}>Unité</th>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'right' }}>Qté</th>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'right' }}>P.U HT</th>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'right' }}>TVA %</th>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'right' }}>Total HT</th>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'right' }}>TVA</th>
                  <th style={{ padding: '14px 20px', fontWeight: '700', textAlign: 'right', color: '#0f766e' }}>Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const qty = parseFloat(item.qty || item.quantity || 0);
                  const pu = parseFloat(item.unit_price_ht || 0);
                  const vatRate = parseFloat(item.vat_rate || 0);
                  const lineHt = qty * pu;
                  const lineTva = lineHt * (vatRate / 100);
                  const lineTtc = lineHt + lineTva;
                  return (
                    <tr
                      key={idx}
                      style={{ borderBottom: `1px solid ${clr.border}`, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = clr.rowHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ background: 'rgba(15,118,110,0.1)', color: '#0f766e', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                          {item._bcRef}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', fontWeight: '700', color: '#0f766e' }}>{item.price_number || '—'}</td>
                      <td style={{ padding: '12px 20px', color: clr.text, fontWeight: '500' }}>{item.service_description || item.designation || '—'}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'center', color: clr.textMuted }}>
                        <span style={{ background: isDark ? '#1e293b' : '#f1f5f9', padding: '2px 8px', borderRadius: '5px', fontSize: '11px' }}>
                          {item.unit_of_measure || item.unite || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '600', color: clr.text }}>{qty}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '700', color: clr.text }}>{fmt(pu)}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', color: clr.textMuted }}>{vatRate}%</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '700', color: clr.text }}>{fmt(lineHt)}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', color: clr.textMuted }}>{fmt(lineTva)}</td>
                      <td style={{ padding: '12px 20px', textAlign: 'right', fontWeight: '800', color: '#0f766e' }}>{fmt(lineTtc)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: `2px solid ${clr.border}`, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: clr.textMuted }}>
                <span>Total HT</span>
                <span style={{ fontWeight: '700', color: clr.text }}>{fmt(totals.ht)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: clr.textMuted }}>
                <span>Total TVA</span>
                <span style={{ fontWeight: '700', color: clr.text }}>{fmt(totals.tva)} MAD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: isDark ? 'rgba(15,118,110,0.15)' : '#f0fdf4', borderRadius: '12px', border: '1px solid rgba(15,118,110,0.25)' }}>
                <span style={{ fontWeight: '800', fontSize: '15px', color: '#0f766e' }}>Total TTC</span>
                <span style={{ fontWeight: '800', fontSize: '17px', color: '#0f766e' }}>{fmt(totals.ttc)} MAD</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactureContent;
