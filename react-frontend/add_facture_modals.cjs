const fs = require('fs');

const path = 'c:/Users/Kival/Desktop/P_F_E/projet-setnance/react-frontend/src/components/MarchesContent.jsx';
let content = fs.readFileSync(path, 'utf8');

const modalsCode = `
      {/* FACTURE MODALS ADDED HERE */}
      {showFactureModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', width: '95%', maxWidth: '1000px',
            padding: '24px 32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                {editingFacture ? 'Modifier la Facture' : 'Ajouter une Facture'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowFactureModal(false);
                  setEditingFacture(null);
                }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFacture} style={{ display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto', overflowX: 'hidden', flex: 1, paddingRight: '12px' }}>
              {/* General Information Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>N° de Facture *</label>
                  <input
                    type="text"
                    value={newFactureData.numero_facture}
                    onChange={(e) => setNewFactureData({ ...newFactureData, numero_facture: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Date Facture *</label>
                  <input
                    type="date"
                    value={newFactureData.date_facture}
                    onChange={(e) => setNewFactureData({ ...newFactureData, date_facture: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Client</label>
                  <input
                    type="text"
                    value={newFactureData.client}
                    onChange={(e) => setNewFactureData({ ...newFactureData, client: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Réf. Bon de Livraison</label>
                  <input
                    type="text"
                    value={newFactureData.reference_bl}
                    onChange={(e) => setNewFactureData({ ...newFactureData, reference_bl: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Added Products Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    Articles de la Facture ({newFactureData.items?.length || 0})
                  </label>
                  
                  {/* Quick Add Product */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                     <div style={{ position: 'relative' }}>
                       <input
                         type="text"
                         placeholder="Chercher produit..."
                         value={productSearch}
                         onChange={(e) => {
                           setProductSearch(e.target.value);
                           setShowSuggestions(true);
                           if (e.target.value === '') setSelectedBordereauItem(null);
                         }}
                         style={{ width: '180px', padding: '6px 10px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                       />
                       {showSuggestions && productSearch && (
                         <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '150px', overflowY: 'auto', zIndex: 10, marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                           {filteredSuggestions.length > 0 ? (
                             filteredSuggestions.map((item, idx) => (
                               <div
                                 key={idx}
                                 onClick={() => {
                                   setSelectedBordereauItem(item);
                                   setProductSearch(item.service_description || '');
                                   setTempPrice(item.price || '');
                                   setShowSuggestions(false);
                                 }}
                                 style={{ padding: '8px 10px', fontSize: '11px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                               >
                                 <div style={{ fontWeight: '600', color: '#0f172a' }}>{item.service_description}</div>
                                 <div style={{ color: '#64748b' }}>Prix ref: {item.price} MAD</div>
                               </div>
                             ))
                           ) : (
                             <div style={{ padding: '8px 10px', fontSize: '11px', color: '#94a3b8' }}>Aucun résultat</div>
                           )}
                         </div>
                       )}
                     </div>
                     <input type="number" min="1" placeholder="Qté" value={tempQty} onChange={(e) => setTempQty(e.target.value)} style={{ width: '60px', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }} />
                     <input type="number" step="0.01" placeholder="P.U HT" value={tempPrice} onChange={(e) => setTempPrice(e.target.value)} style={{ width: '80px', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }} />
                     <select value={tempVat} onChange={(e) => setTempVat(e.target.value)} style={{ width: '70px', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                       <option value={0}>0%</option><option value={9}>9%</option><option value={10}>10%</option><option value={20}>20%</option>
                     </select>
                     <button type="button" onClick={handleAddProductToFacture} style={{ padding: '6px 12px', backgroundColor: '#0f766e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>Ajouter</button>
                  </div>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b' }}>N&deg;</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b' }}>D&eacute;signation</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b', textAlign: 'center', width: '80px' }}>Qt&eacute;</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b', textAlign: 'center', width: '100px' }}>P.U HT</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b', textAlign: 'center', width: '80px' }}>TVA (%)</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#64748b', textAlign: 'right', width: '100px' }}>Total HT</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!newFactureData.items || newFactureData.items.length === 0) ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                            Aucun produit ajouté à la facture.
                          </td>
                        </tr>
                      ) : (
                        newFactureData.items.map((item, index) => {
                          const totalLineHt = (parseFloat(item.qty) || 0) * (parseFloat(item.pu_ht) || 0);
                          return (
                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f766e' }}>{item.num_article}</td>
                              <td style={{ padding: '10px 12px', color: '#334155' }}>
                                <div style={{ fontWeight: '600' }}>{item.designation}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Unit&eacute;: {item.unite}</div>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <input type="number" min="1" value={item.qty} onChange={(e) => handleUpdateItemFacture(index, 'qty', e.target.value)} style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }} />
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <input type="number" step="0.01" value={item.pu_ht} onChange={(e) => handleUpdateItemFacture(index, 'pu_ht', e.target.value)} style={{ width: '80px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }} />
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <select value={item.taux_tva} onChange={(e) => handleUpdateItemFacture(index, 'taux_tva', e.target.value)} style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}>
                                  <option value={0}>0%</option><option value={9}>9%</option><option value={10}>10%</option><option value={20}>20%</option>
                                </select>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#334155' }}>{totalLineHt.toFixed(2)}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <button type="button" onClick={() => handleRemoveProductFromFacture(index)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Total HT:</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{newFactureData.montantHT} MAD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>TVA:</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{newFactureData.montantTVA} MAD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '2px solid #e2e8f0' }}>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f766e' }}>Total TTC:</span>
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f766e' }}>{newFactureData.montantTTC} MAD</span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button type="button" onClick={() => { setShowFactureModal(false); setEditingFacture(null); }} style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Annuler</button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#0f766e', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                  {editingFacture ? 'Enregistrer les modifications' : 'Créer la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

`;

content = content.replace('    </div>\\n  );\\n};\\n\\nexport default MarchesContent;', modalsCode + '\\n    </div>\\n  );\\n};\\n\\nexport default MarchesContent;');
fs.writeFileSync(path, content);
console.log('Facture Modals injected!');
