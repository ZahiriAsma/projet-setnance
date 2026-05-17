import React, { useState, useEffect } from 'react';
import { Plus, Filter, Folder, Calendar, DollarSign, Archive, FolderOpen } from 'lucide-react';
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
                    <span style={{ fontWeight: '600', color: '#334155' }}>ID: {marche.id_fournisseur}</span>
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
                  <button style={{ 
                    flex: 1, padding: '8px', backgroundColor: '#0f766e', border: 'none', 
                    borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: '600', 
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer' 
                  }}>
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
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Cliquez pour créer</div>
        </div>

      </div>

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
