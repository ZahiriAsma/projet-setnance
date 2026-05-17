import React, { useState, useEffect } from 'react';
import { 
  Plus, Filter, Folder, Calendar, DollarSign, Archive, FolderOpen,
  ChevronLeft, FileText, Printer, Download, Edit2
} from 'lucide-react';
import api from '../api/axios';

const MarchesContent = () => {
  const [marches, setMarches] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    titulaire: '',
    id_fournisseur: '',
    date_debut: '',
    date_fin: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedMarche, setSelectedMarche] = useState(null);
  const [activeDocTab, setActiveDocTab] = useState('bc');

  useEffect(() => {
    fetchMarches();
    fetchFournisseurs();
  }, []);

  const fetchMarches = async () => {
    try {
      const response = await api.get('/marches');
      setMarches(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur de chargement', error.response || error);
      alert("Erreur de chargement des marchés: " + (error.response?.data?.message || error.message));
      setLoading(false);
    }
  };

  const fetchFournisseurs = async () => {
    try {
      const response = await api.get('/fournisseurs');
      setFournisseurs(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          id_fournisseur: response.data[0].id.toString()
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/marches', formData);
      setShowModal(false);
      setFormData({ titulaire: '', id_fournisseur: fournisseurs[0]?.id?.toString() || '', date_debut: '', date_fin: '' });
      fetchMarches(); // Refresh
    } catch (error) {
      console.error('Erreur lors de l\'ajout', error.response || error);
      alert("Erreur: " + (error.response?.data?.message || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  const renderDocumentContent = () => {
    const sName = fournisseurs.find(f => f.id === selectedMarche.id_fournisseur)?.raisonSociale || 'DISMA Maroc';
    const sICE = fournisseurs.find(f => f.id === selectedMarche.id_fournisseur)?.ice || '001234567000021';
    
    if (activeDocTab === 'bc') {
      return (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#0f766e" /> Bon de commande
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px',
                color: '#475569', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
              }}>
                <Printer size={14} />
              </button>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
                backgroundColor: '#0f766e', border: 'none', borderRadius: '8px',
                color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
              }}>
                <Plus size={14} /> Nouveau BC
              </button>
            </div>
          </div>

          {/* Invoice Document styled exactly as screenshot */}
          <div style={{
            border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            {/* Title Bar */}
            <div style={{ 
              backgroundColor: '#1e293b', padding: '14px 20px', display: 'flex', 
              justifyContent: 'space-between', alignItems: 'center', color: 'white' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.05em' }}>BC-2024-089-001</span>
                <span style={{ 
                  backgroundColor: '#10b981', color: 'white', padding: '2px 8px', 
                  borderRadius: '10px', fontSize: '10px', fontWeight: '700' 
                }}>Validé</span>
              </div>
              <button style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 0 }}>
                <Download size={16} />
              </button>
            </div>

            {/* Paper Body */}
            <div style={{ padding: '32px', fontFamily: "'Inter', sans-serif" }}>
              
              {/* Top header logos / refs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>OFPPT</h4>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Internat OFPPT Casablanca<br />Direction régionale</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Réf: <span style={{ fontWeight: '700', color: '#0f172a' }}>BC-2024-089-001</span></div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Date: <span style={{ fontWeight: '700', color: '#0f172a' }}>15/01/2024</span></div>
                </div>
              </div>

              <h3 style={{ textAlign: 'center', fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.1em', margin: '0 0 28px 0', borderBottom: '2px solid #0f172a', paddingBottom: '12px' }}>
                BON DE COMMANDE
              </h3>

              {/* Supplier & Delivery Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Fournisseur</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{sName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>ICE: {sICE}</div>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', backgroundColor: '#f8fafc' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '6px', textTransform: 'uppercase' }}>Livraison prévue</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>20/01/2024</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Internat OFPPT Casa</div>
                </div>
              </div>

              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '10px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '30px' }}>#</th>
                    <th style={{ padding: '10px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>DÉSIGNATION</th>
                    <th style={{ padding: '10px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '60px' }}>UNITÉ</th>
                    <th style={{ padding: '10px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '50px', textAlign: 'center' }}>QTÉ</th>
                    <th style={{ padding: '10px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '90px', textAlign: 'right' }}>PU (MAD)</th>
                    <th style={{ padding: '10px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '100px', textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: 1, label: 'Huile de table 5L', unit: 'Carton', qty: 40, price: 180 },
                    { id: 2, label: 'Sucre en poudre 50kg', unit: 'Sac', qty: 20, price: 350 },
                    { id: 3, label: 'Riz long grain 25kg', unit: 'Sac', qty: 30, price: 280 },
                    { id: 4, label: 'Semoule fine 25kg', unit: 'Sac', qty: 25, price: 210 }
                  ].map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: '#64748b' }}>{item.id}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{item.label}</td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: '#475569' }}>{item.unit}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', color: '#0f172a', textAlign: 'center', fontWeight: '600' }}>{item.qty}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                      <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>{(item.qty * item.price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculations */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <span>Sous-total:</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>27 650,00 MAD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                    <span>TVA (20%):</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>5 530,00 MAD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#0f766e', borderTop: '1px solid #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                    <span>Total TTC:</span>
                    <span>33 180,00 MAD</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      );
    }

    // Elegant fallback for other document tabs
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <FileText size={48} color="#94a3b8" style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontWeight: '700' }}>
          Document : {activeDocTab.toUpperCase()}
        </h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
          Le document lié au marché de {selectedMarche.titulaire} est en cours de traitement ou n'est pas encore disponible.
        </p>
      </div>
    );
  };

  const renderMarcheDetail = () => {
    const sName = fournisseurs.find(f => f.id === selectedMarche.id_fournisseur)?.raisonSociale || 'DISMA Maroc';
    
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        
        {/* Navigation sub-header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <button 
            onClick={() => setSelectedMarche(null)}
            style={{
              background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px',
              color: '#475569', fontWeight: '600', fontSize: '13px', cursor: 'pointer', padding: 0
            }}
          >
            <ChevronLeft size={16} /> Retour aux marchés
          </button>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
            M-2024-089 - {selectedMarche.titulaire}
          </span>
        </div>

        {/* Header summary panel */}
        <div style={{ 
          backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
          padding: '24px', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                  {selectedMarche.titulaire}
                </h2>
                <span style={{ 
                  backgroundColor: '#ecfdf5', color: '#10b981', padding: '4px 10px', 
                  borderRadius: '12px', fontSize: '12px', fontWeight: '700' 
                }}>
                  {selectedMarche.statut || 'Actif'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Marché N° M-2024-089 · {sName} · Ouvert le {new Date(selectedMarche.date_debut).toLocaleDateString('fr-FR')}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', 
                backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', 
                color: '#475569', fontSize: '13px', fontWeight: '600', cursor: 'pointer' 
              }}>
                <Printer size={15} /> Imprimer
              </button>
              <button style={{ 
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', 
                backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', 
                color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' 
              }}>
                Modifier
              </button>
            </div>
          </div>

          {/* Header details stats row */}
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px', 
            borderTop: '1px solid #f1f5f9', paddingTop: '20px' 
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Fournisseur</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{sName}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Budget Total</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{parseFloat(selectedMarche.budget || 128000).toLocaleString()} MAD</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Consommé</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#10b981' }}>{parseFloat(selectedMarche.budget * (selectedMarche.consomme || 74) / 100).toLocaleString()} MAD</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Restant</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#f59e0b' }}>{parseFloat(selectedMarche.budget - (selectedMarche.budget * (selectedMarche.consomme || 74) / 100)).toLocaleString()} MAD</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Avancement</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <div style={{ flex: 1, height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${selectedMarche.consomme || 74}%`, height: '100%', backgroundColor: '#0f766e', borderRadius: '3px' }}></div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{selectedMarche.consomme || 74}%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Main panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'stretch' }}>
          
          {/* Left panel */}
          <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
            padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Documents
            </h3>
            {[
              { id: 'bc', label: 'Bon de commande' },
              { id: 'bl', label: 'Bon de livraison' },
              { id: 'pv', label: 'PV de réception' },
              { id: 'facture', label: 'Facture' },
              { id: 'attachments', label: 'Attachements' },
              { id: 'technical', label: 'Fiche technique' },
              { id: 'stock', label: 'Mouvement stock' }
            ].map(tab => {
              const isActive = activeDocTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDocTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                    padding: '12px 16px', borderRadius: '10px', border: 'none',
                    backgroundColor: isActive ? 'rgba(15, 118, 110, 0.08)' : 'transparent',
                    color: isActive ? '#0f766e' : '#475569',
                    fontWeight: isActive ? '700' : '500', fontSize: '13px', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.2s'
                  }}
                >
                  <FileText size={15} style={{ opacity: isActive ? 1 : 0.7 }} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right panel */}
          <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
            padding: '32px'
          }}>
            {renderDocumentContent()}
          </div>

        </div>

      </div>
    );
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Actif': return { text: '#10b981', bg: 'rgba(16,185,129,0.1)' };
      case 'En cours': return { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
      case 'Retard': return { text: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
      case 'Préparation': return { text: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
      default: return { text: '#64748b', bg: 'rgba(100,116,139,0.1)' };
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .stat-card {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          cursor: pointer;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03) !important;
        }
        .stat-card::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 4px;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover::after {
          transform: scaleX(1);
        }
        .stat-card-blue::after {
          background: linear-gradient(90deg, #3b82f6, #60a5fa) !important;
        }
        .stat-card-green::after {
          background: linear-gradient(90deg, #10b981, #0f766e) !important;
        }
        .stat-card-orange::after {
          background: linear-gradient(90deg, #f59e0b, #eab308) !important;
        }
        .stat-card-dark::after {
          background: linear-gradient(90deg, #0f172a, #334155) !important;
        }
      `}</style>
      
      {selectedMarche ? (
        renderMarcheDetail()
      ) : (
        <>
          {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Marchés publics</h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Gérez vos marchés, commandes et documents associés</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
            backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', 
            color: '#475569', fontWeight: '600', fontSize: '13px', cursor: 'pointer' 
          }}>
            <Filter size={16} /> Filtres
          </button>
          <button 
            onClick={() => setShowModal(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', 
              backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', 
              color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer' 
            }}
          >
            <Plus size={16} /> Ajouter marché
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
        {[
          { label: 'Total marchés', value: marches.length || 0, color: '#0f172a' },
          { label: 'Actifs', value: marches.filter(m => m.statut === 'Actif').length || 0, color: '#10b981' },
          { label: 'En cours', value: marches.filter(m => m.statut === 'En cours').length || 0, color: '#f59e0b' },
          { label: 'Budget total (MAD)', value: (marches.reduce((sum, m) => sum + parseFloat(m.budget || 0), 0) / 1000).toFixed(0) + 'K', color: '#3b82f6' }
        ].map((stat, i) => {
          const classes = ['stat-card-dark', 'stat-card-green', 'stat-card-orange', 'stat-card-blue'];
          return (
            <div key={i} 
              className={`stat-card ${classes[i]}`}
              style={{ 
                flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', 
                border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' 
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color, marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Grid of Marches */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        
        {loading ? (
          <p>Chargement des marchés...</p>
        ) : (
          marches.map((marche) => {
            const statusStyle = getStatusColor(marche.statut);
            return (
              <div key={marche.id} style={{ 
                backgroundColor: 'white', borderRadius: '16px', padding: '20px', 
                border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>M-{new Date(marche.date_debut).getFullYear()}-00{marche.id}</span>
                  <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                    {marche.statut}
                  </span>
                </div>
                
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{marche.titulaire}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Folder size={14} /> Fournisseur</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>
                      {fournisseurs.find(f => f.id === marche.id_fournisseur)?.raisonSociale || 'DISMA Maroc'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14} /> Budget alloué</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{parseFloat(marche.budget).toLocaleString()} MAD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> Échéance</span>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{new Date(marche.date_fin).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
                    <span style={{ color: '#64748b' }}>Consommé</span>
                    <span style={{ color: '#0f766e' }}>{marche.consomme}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${marche.consomme}%`, height: '100%', backgroundColor: '#0f766e', borderRadius: '3px' }}></div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button style={{ 
                    flex: 1, padding: '8px', backgroundColor: 'white', border: '1px solid #e2e8f0', 
                    borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: '600', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer' 
                  }}>
                    <Archive size={14} /> Archive
                  </button>
                  <button 
                    onClick={() => setSelectedMarche(marche)}
                    style={{ 
                      flex: 1, padding: '8px', backgroundColor: '#0f766e', border: 'none', 
                      borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: '600', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer' 
                    }}
                  >
                    <FolderOpen size={14} /> Ouvrir
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Add New Card Button */}
        <div 
          onClick={() => setShowModal(true)}
          style={{ 
            borderRadius: '16px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', 
            alignItems: 'center', justifyContent: 'center', minHeight: '260px', cursor: 'pointer',
            backgroundColor: 'rgba(248,250,252,0.5)', transition: 'all 0.2s'
          }}
        >
          <div style={{ width: '48px', height: '48px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <Plus size={24} color="#64748b" />
          </div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Nouveau marché</div>
        </div>

      </div>

      </>
      )}

      {/* Modal Add Marche */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '500px', 
            padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#0f172a' }}>Ajouter un nouveau marché</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Titulaire du marché</label>
                <input 
                  type="text" name="titulaire" value={formData.titulaire} onChange={handleInputChange} required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  placeholder="Ex: Denrées alimentaires"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Fournisseur *</label>
                <select 
                  name="id_fournisseur" 
                  value={formData.id_fournisseur} 
                  onChange={handleInputChange} 
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px 12px', 
                    borderRadius: '8px', 
                    border: '1px solid #cbd5e1', 
                    outline: 'none', 
                    backgroundColor: 'white',
                    fontSize: '14px',
                    color: '#334155' 
                  }}
                >
                  <option value="" disabled>-- Sélectionner un fournisseur --</option>
                  {fournisseurs.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.raisonSociale}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Date de début</label>
                  <input 
                    type="date" name="date_debut" value={formData.date_debut} onChange={handleInputChange} required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Date de fin</label>
                  <input 
                    type="date" name="date_fin" value={formData.date_fin} onChange={handleInputChange} required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', backgroundColor: 'transparent', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" disabled={submitting}
                  style={{ padding: '10px 20px', backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {submitting ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarchesContent;
