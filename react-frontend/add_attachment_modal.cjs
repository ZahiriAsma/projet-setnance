const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'MarchesContent.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const modalInjection = `
      {/* Modal Add/Edit Attachment */}
      {showAttachmentModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '900px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                {editingAttachmentGroup ? 'Modifier l\\'Attachement' : 'Créer un Attachement'}
              </h2>
              <button onClick={() => setShowAttachmentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#64748b" /></button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Bon de Livraison *</label>
                  <select
                    value={newAttachmentData.bon_livraison_id}
                    onChange={(e) => setNewAttachmentData({ ...newAttachmentData, bon_livraison_id: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  >
                    {bls.filter(bl => bl.fournisseur_id?.toString() === selectedMarche?.id_fournisseur?.toString()).map(bl => (
                        <option key={bl.id} value={bl.id}>{bl.numeroBL}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>N° Attachement *</label>
                  <input
                    type="number"
                    value={newAttachmentData.numero_attachment}
                    onChange={(e) => setNewAttachmentData({ ...newAttachmentData, numero_attachment: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Budget</label>
                  <input
                    type="text"
                    value={newAttachmentData.budget}
                    onChange={(e) => setNewAttachmentData({ ...newAttachmentData, budget: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Exercice</label>
                  <input
                    type="number"
                    value={newAttachmentData.exercice}
                    onChange={(e) => setNewAttachmentData({ ...newAttachmentData, exercice: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Rubrique</label>
                  <input
                    type="text"
                    value={newAttachmentData.rubrique}
                    onChange={(e) => setNewAttachmentData({ ...newAttachmentData, rubrique: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Lieu Livraison</label>
                  <input
                    type="text"
                    value={newAttachmentData.lieu_livraison}
                    onChange={(e) => setNewAttachmentData({ ...newAttachmentData, lieu_livraison: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Articles</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const items = [...newAttachmentData.items, { numero_article: newAttachmentData.items.length + 1, designation: '', unite: 'U', quantite: 1, taux_tva: 0 }];
                      setNewAttachmentData({ ...newAttachmentData, items });
                    }}
                    className="btn-secondary"
                  >
                    <Plus size={14} /> Ajouter une ligne
                  </button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                      <th style={{ padding: '8px', textAlign: 'left', width: '50px' }}>N°</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Désignation</th>
                      <th style={{ padding: '8px', textAlign: 'left', width: '80px' }}>Unité</th>
                      <th style={{ padding: '8px', textAlign: 'left', width: '80px' }}>Qté</th>
                      <th style={{ padding: '8px', textAlign: 'left', width: '80px' }}>TVA %</th>
                      <th style={{ padding: '8px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {newAttachmentData.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>
                          <input type="number" value={item.numero_article} onChange={(e) => {
                            const newItems = [...newAttachmentData.items];
                            newItems[idx].numero_article = e.target.value;
                            setNewAttachmentData({ ...newAttachmentData, items: newItems });
                          }} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="text" value={item.designation} onChange={(e) => {
                            const newItems = [...newAttachmentData.items];
                            newItems[idx].designation = e.target.value;
                            setNewAttachmentData({ ...newAttachmentData, items: newItems });
                          }} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="text" value={item.unite} onChange={(e) => {
                            const newItems = [...newAttachmentData.items];
                            newItems[idx].unite = e.target.value;
                            setNewAttachmentData({ ...newAttachmentData, items: newItems });
                          }} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" value={item.quantite} onChange={(e) => {
                            const newItems = [...newAttachmentData.items];
                            newItems[idx].quantite = e.target.value;
                            setNewAttachmentData({ ...newAttachmentData, items: newItems });
                          }} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        </td>
                        <td style={{ padding: '8px' }}>
                          <input type="number" value={item.taux_tva} onChange={(e) => {
                            const newItems = [...newAttachmentData.items];
                            newItems[idx].taux_tva = e.target.value;
                            setNewAttachmentData({ ...newAttachmentData, items: newItems });
                          }} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <button onClick={() => {
                            const newItems = newAttachmentData.items.filter((_, i) => i !== idx);
                            setNewAttachmentData({ ...newAttachmentData, items: newItems });
                          }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#f8fafc' }}>
              <button type="button" onClick={() => setShowAttachmentModal(false)} className="btn-secondary" style={{ padding: '10px 20px' }}>Annuler</button>
              <button
                onClick={async () => {
                  try {
                    setSubmitting(true);
                    await api.post('/attachments-bc', newAttachmentData);
                    await fetchAttachments();
                    setShowAttachmentModal(false);
                  } catch (error) {
                    console.error("Erreur save attachment", error.response || error);
                    alert("Erreur lors de la sauvegarde: " + (error.response?.data?.message || error.message));
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                className="btn-primary"
                style={{ padding: '10px 20px' }}
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('showAttachmentModal &&')) {
    content = content.replace('{showFactureModal && (', modalInjection + '\n      {showFactureModal && (');
    fs.writeFileSync(filePath, content);
    console.log('Modal added');
}
