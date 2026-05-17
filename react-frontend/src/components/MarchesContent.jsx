import React, { useState, useEffect } from 'react';
import { 
  Plus, Filter, Folder, Calendar, DollarSign, Archive, FolderOpen,
  ChevronLeft, FileText, Printer, Download, Edit2, Trash2, Eye
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

  // Dynamic state for Bons de commande documents (now loaded from database)
  const [bcs, setBcs] = useState([]);
  const [showBcModal, setShowBcModal] = useState(false);
  const [newBcData, setNewBcData] = useState({
    numeroBC: '',
    dateEmission: new Date().toISOString().split('T')[0],
    budget: 'Budget de Fonctionnement',
    exercice: new Date().getFullYear(),
    rubrique: '',
    referenceMarcheCadre: '',
    lieuLivraison: 'Internat OFPPT Casablanca',
    conditionsGenerales: 'Livraison sous 5 jours. Paiement à 60 jours.',
    conditionsParticulieres: '',
    montantHT: '',
    montantTVA: '',
    montantTTC: '',
    statut: 'En cours',
    fournisseur_id: ''
  });
  const [editingBc, setEditingBc] = useState(null);
  const [selectedBcForView, setSelectedBcForView] = useState(null);

  // Dynamic state for Bon de commande items (used when viewing a BC)
  const [bcItems, setBcItems] = useState([
    { id: 1, label: 'Huile de table 5L', unit: 'Carton', qty: 40, price: 180 },
    { id: 2, label: 'Sucre en poudre 50kg', unit: 'Sac', qty: 20, price: 350 },
    { id: 3, label: 'Riz long grain 25kg', unit: 'Sac', qty: 30, price: 280 },
    { id: 4, label: 'Semoule fine 25kg', unit: 'Sac', qty: 25, price: 210 }
  ]);

  useEffect(() => {
    fetchMarches();
    fetchFournisseurs();
    fetchBcs();
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

  const fetchBcs = async () => {
    try {
      const response = await api.get('/bon-commandes');
      setBcs(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des bons de commande', error);
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

  const handleSaveBc = async (e) => {
    e.preventDefault();
    if (!newBcData.numeroBC || !newBcData.dateEmission) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      const payload = {
        ...newBcData,
        fournisseur_id: newBcData.fournisseur_id || selectedMarche?.id_fournisseur || null
      };

      if (editingBc) {
        // Edit mode in database
        const response = await api.put(`/bon-commandes/${editingBc.id}`, payload);
        setBcs(bcs.map(bc => bc.id === editingBc.id ? response.data : bc));
        setEditingBc(null);
      } else {
        // Add mode in database
        const response = await api.post('/bon-commandes', payload);
        setBcs([...bcs, response.data]);
      }

      setNewBcData({
        numeroBC: '',
        dateEmission: new Date().toISOString().split('T')[0],
        budget: 'Budget de Fonctionnement',
        exercice: new Date().getFullYear(),
        rubrique: '',
        referenceMarcheCadre: '',
        lieuLivraison: 'Internat OFPPT Casablanca',
        conditionsGenerales: 'Livraison sous 5 jours. Paiement à 60 jours.',
        conditionsParticulieres: '',
        montantHT: '',
        montantTVA: '',
        montantTTC: '',
        statut: 'En cours',
        fournisseur_id: ''
      });
      setShowBcModal(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du bon de commande", error.response || error);
      alert("Erreur: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteBc = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bon de commande ?")) {
      try {
        await api.delete(`/bon-commandes/${id}`);
        setBcs(bcs.filter(bc => bc.id !== id));
      } catch (error) {
        console.error("Erreur lors de la suppression du bon de commande", error.response || error);
        alert("Erreur: " + (error.response?.data?.message || error.message));
      }
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
              <FileText size={20} color="#0f766e" /> Bons de commande
            </h3>
            <button 
              onClick={() => {
                setEditingBc(null);
                setNewBcData({
                  numeroBC: `BC-${new Date().getFullYear()}-089-00${bcs.length + 1}`,
                  dateEmission: new Date().toISOString().split('T')[0],
                  budget: 'Budget de Fonctionnement',
                  exercice: new Date().getFullYear(),
                  rubrique: 'Alimentation générale',
                  referenceMarcheCadre: selectedMarche ? `MC-MARCHE-${selectedMarche.id}` : '',
                  lieuLivraison: 'Internat OFPPT Casablanca',
                  conditionsGenerales: 'Livraison sous 5 jours. Paiement à 60 jours.',
                  conditionsParticulieres: 'Produits frais uniquement.',
                  montantHT: '27650.00',
                  montantTVA: '5530.00',
                  montantTTC: '33180.00',
                  statut: 'En cours',
                  fournisseur_id: selectedMarche ? selectedMarche.id_fournisseur.toString() : ''
                });
                setShowBcModal(true);
              }} 
              className="btn-primary" 
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={15} /> Nouveau BC
            </button>
          </div>

          {/* Simple Beautiful Table */}
          <div style={{
            border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
          }}>
            <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif" }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '40px' }}>#</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>RUBRIQUE / NOM</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '140px' }}>N° DE BC</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '120px' }}>DATE D'ÉMISSION</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '130px', textAlign: 'right' }}>MONTANT TTC</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '110px', textAlign: 'center' }}>STATUT</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '220px', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {bcs.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Aucun bon de commande trouvé. Cliquez sur "Nouveau BC" pour en ajouter un.
                      </td>
                    </tr>
                  ) : (
                    bcs.map((bc, idx) => (
                      <tr key={bc.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 8px', fontSize: '12px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                          <div>{bc.rubrique || 'N/A'}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>{bc.budget || 'Budget de Fonctionnement'}</div>
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '12px', fontWeight: '700', color: '#0f766e' }}>
                          <span style={{ backgroundColor: '#ecfdf5', color: '#0f766e', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                            {bc.numeroBC}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '12px', color: '#475569' }}>
                          {new Date(bc.dateEmission).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>
                          {bc.montantTTC ? parseFloat(bc.montantTTC).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '0.00'} MAD
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          <span style={{ 
                            backgroundColor: bc.statut === 'Validé' || bc.statut === 'Livré' ? '#ecfdf5' : '#fef3c7', 
                            color: bc.statut === 'Validé' || bc.statut === 'Livré' ? '#0f766e' : '#d97706', 
                            padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' 
                          }}>
                            {bc.statut || 'En cours'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => setSelectedBcForView(bc)} 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                          >
                            <Eye size={12} /> Voir
                          </button>
                          <button 
                            onClick={() => {
                              setEditingBc(bc);
                              setNewBcData({
                                numeroBC: bc.numeroBC,
                                dateEmission: bc.dateEmission,
                                budget: bc.budget || '',
                                exercice: bc.exercice || '',
                                rubrique: bc.rubrique || '',
                                referenceMarcheCadre: bc.referenceMarcheCadre || '',
                                lieuLivraison: bc.lieuLivraison || '',
                                conditionsGenerales: bc.conditionsGenerales || '',
                                conditionsParticulieres: bc.conditionsParticulieres || '',
                                montantHT: bc.montantHT || '',
                                montantTVA: bc.montantTVA || '',
                                montantTTC: bc.montantTTC || '',
                                statut: bc.statut || 'En cours',
                                fournisseur_id: bc.fournisseur_id ? bc.fournisseur_id.toString() : ''
                              });
                              setShowBcModal(true);
                            }} 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#3b82f6', borderColor: 'rgba(59,130,246,0.2)' }}
                          >
                            Modifier
                          </button>
                          <button 
                            onClick={() => handleDeleteBc(bc.id)} 
                            className="btn-secondary" 
                            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
            className="btn-back"
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
              <button className="btn-secondary">
                <Printer size={15} /> Imprimer
              </button>
              <button className="btn-primary">
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
                  className={`doc-tab-button ${isActive ? 'doc-tab-button-active' : 'doc-tab-button-inactive'}`}
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

        /* Interactive Document Tab Button Styles */
        .doc-tab-button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .doc-tab-button-inactive {
          background-color: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
          font-weight: 500;
        }
        .doc-tab-button-inactive:hover {
          background-color: #f1f5f9;
          color: #0f766e;
          border-color: #cbd5e1;
          transform: translateX(4px);
        }
        .doc-tab-button-inactive:active {
          background-color: #e2e8f0;
          transform: scale(0.98);
        }
        .doc-tab-button-active {
          background-color: #0f766e;
          color: #ffffff;
          border: 1px solid #0f766e;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25);
        }
        .doc-tab-button-active:active {
          transform: scale(0.98);
        }

        /* Generic Action Buttons */
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #0f766e;
          border: 1px solid #0f766e;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-primary:hover {
          background-color: #0d5c56;
          border-color: #0d5c56;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.3);
          transform: translateY(-1px);
        }
        .btn-primary:active {
          background-color: #0b4a45;
          border-color: #0b4a45;
          transform: translateY(1px);
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: white;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          color: #475569;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-secondary:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
          color: #0f766e;
          transform: translateY(-1px);
        }
        .btn-secondary:active {
          background-color: #f1f5f9;
          transform: translateY(1px);
        }

        .btn-back {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          gap: 4px;
          color: #475569;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-back:hover {
          color: #0f766e;
          transform: translateX(-3px);
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
          <button className="btn-secondary">
            <Filter size={16} /> Filtres
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary"
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
                  <button className="btn-secondary" style={{ flex: 1, padding: '8px', justifyContent: 'center' }}>
                    <Archive size={14} /> Archive
                  </button>
                  <button 
                    onClick={() => setSelectedMarche(marche)}
                    className="btn-primary"
                    style={{ flex: 1, padding: '8px', justifyContent: 'center' }}
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
                  className="btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" disabled={submitting}
                  className="btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  {submitting ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Add/Edit BC */}
      {showBcModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', 
            padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
              {editingBc ? 'Modifier le Bon de commande' : 'Ajouter un Bon de commande'}
            </h2>
            
            <form onSubmit={handleSaveBc} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Numéro du BC *</label>
                  <input 
                    type="text" 
                    value={newBcData.numeroBC} 
                    onChange={(e) => setNewBcData({ ...newBcData, numeroBC: e.target.value })} 
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="Ex: BC-2024-089-001"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Date d'émission *</label>
                  <input 
                    type="date" 
                    value={newBcData.dateEmission} 
                    onChange={(e) => setNewBcData({ ...newBcData, dateEmission: e.target.value })} 
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Rubrique / Nom *</label>
                  <input 
                    type="text" 
                    value={newBcData.rubrique} 
                    onChange={(e) => setNewBcData({ ...newBcData, rubrique: e.target.value })} 
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="Alimentation générale"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Exercice *</label>
                  <input 
                    type="number" 
                    value={newBcData.exercice} 
                    onChange={(e) => setNewBcData({ ...newBcData, exercice: e.target.value })} 
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Budget *</label>
                  <select 
                    value={newBcData.budget} 
                    onChange={(e) => setNewBcData({ ...newBcData, budget: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'white' }}
                  >
                    <option value="Budget de Fonctionnement">Fonctionnement</option>
                    <option value="Budget d'Investissement">Investissement</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Réf. Marché Cadre</label>
                  <input 
                    type="text" 
                    value={newBcData.referenceMarcheCadre} 
                    onChange={(e) => setNewBcData({ ...newBcData, referenceMarcheCadre: e.target.value })} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="MC-2023-01"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Lieu de Livraison</label>
                  <input 
                    type="text" 
                    value={newBcData.lieuLivraison} 
                    onChange={(e) => setNewBcData({ ...newBcData, lieuLivraison: e.target.value })} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Fournisseur *</label>
                  <select 
                    value={newBcData.fournisseur_id} 
                    onChange={(e) => setNewBcData({ ...newBcData, fournisseur_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'white' }}
                  >
                    <option value="">-- Choisir un fournisseur --</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>{f.raisonSociale}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Statut *</label>
                  <select 
                    value={newBcData.statut} 
                    onChange={(e) => setNewBcData({ ...newBcData, statut: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'white' }}
                  >
                    <option value="En cours">En cours</option>
                    <option value="Validé">Validé</option>
                    <option value="Livré">Livré</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Montant HT (MAD) *</label>
                  <input 
                    type="number" step="0.01"
                    value={newBcData.montantHT} 
                    onChange={(e) => {
                      const ht = parseFloat(e.target.value) || 0;
                      const tva = ht * 0.20;
                      const ttc = ht + tva;
                      setNewBcData({ 
                        ...newBcData, 
                        montantHT: e.target.value,
                        montantTVA: tva.toFixed(2),
                        montantTTC: ttc.toFixed(2)
                      });
                    }} 
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Montant TVA (20%)</label>
                  <input 
                    type="number" step="0.01" readOnly disabled
                    value={newBcData.montantTVA} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#94a3b8', backgroundColor: '#f8fafc' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Montant TTC</label>
                  <input 
                    type="number" step="0.01" readOnly disabled
                    value={newBcData.montantTTC} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#0f766e', backgroundColor: '#f0fdf4', fontWeight: '700' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Conditions Générales</label>
                <textarea 
                  value={newBcData.conditionsGenerales} 
                  onChange={(e) => setNewBcData({ ...newBcData, conditionsGenerales: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', minHeight: '60px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Conditions Particulières</label>
                <textarea 
                  value={newBcData.conditionsParticulieres} 
                  onChange={(e) => setNewBcData({ ...newBcData, conditionsParticulieres: e.target.value })} 
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', minHeight: '60px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowBcModal(false)}
                  className="btn-secondary"
                  style={{ padding: '10px 20px' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '10px 20px', backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600' }}
                >
                  {editingBc ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal View BC details */}
      {selectedBcForView && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px', 
            padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <span style={{ backgroundColor: '#ecfdf5', color: '#0f766e', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', marginRight: '8px' }}>
                  {selectedBcForView.numeroBC}
                </span>
                <h2 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                  {selectedBcForView.rubrique || 'Bon de Commande'}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedBcForView(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Date d'émission</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  {new Date(selectedBcForView.dateEmission).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Fournisseur</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  {selectedBcForView.fournisseur?.raisonSociale || fournisseurs.find(f => f.id === selectedBcForView.fournisseur_id)?.raisonSociale || 'Non spécifié'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Exercice</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{selectedBcForView.exercice || '2024'}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Réf. Marché Cadre</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{selectedBcForView.referenceMarcheCadre || 'Non spécifié'}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Lieu de Livraison</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{selectedBcForView.lieuLivraison || 'Internat Casablanca'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Conditions Générales</div>
                <div style={{ fontSize: '13px', color: '#475569', backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  {selectedBcForView.conditionsGenerales || 'Aucune condition spécifique.'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Conditions Particulières</div>
                <div style={{ fontSize: '13px', color: '#475569', backgroundColor: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                  {selectedBcForView.conditionsParticulieres || 'Aucune condition particulière.'}
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Liste des articles</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '40px' }}>#</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>DÉSIGNATION</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '80px' }}>UNITÉ</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '70px', textAlign: 'center' }}>QTÉ</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '110px', textAlign: 'right' }}>PU (MAD)</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '120px', textAlign: 'right' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {bcItems.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontSize: '12px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{item.label}</td>
                    <td style={{ padding: '10px 8px', fontSize: '12px', color: '#475569' }}>{item.unit}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#0f172a', textAlign: 'center', fontWeight: '600' }}>{item.qty}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{parseFloat(item.price).toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>{(item.qty * item.price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
              <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Montant HT:</span>
                  <span style={{ fontWeight: '600', color: '#334155' }}>
                    {parseFloat(selectedBcForView.montantHT || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Montant TVA (20%):</span>
                  <span style={{ fontWeight: '600', color: '#334155' }}>
                    {parseFloat(selectedBcForView.montantTVA || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#0f766e', borderTop: '1px double #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Montant TTC:</span>
                  <span>
                    {parseFloat(selectedBcForView.montantTTC || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => setSelectedBcForView(null)}
                className="btn-primary"
                style={{ padding: '10px 20px', backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarchesContent;
