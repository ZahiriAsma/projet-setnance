const fs = require('fs');
const path = 'src/components/MarchesContent.jsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /referenceBC:\s*'',/g,
  `referenceBCs: [],`
);

content = content.replace(
  /referenceBC:\s*bl\.referenceBC\s*\|\|\s*'',/g,
  `referenceBCs: bl.referenceBCs || [],`
);

const oldInputHtml = `                <div>
                  <label className="form-label">Réf. BC Cadre</label>
                  <input 
                    type="text" 
                    value={newBlData.referenceBC} 
                    onChange={(e) => setNewBlData({ ...newBlData, referenceBC: e.target.value })} 
                    className="form-input"
                    placeholder="MC-2023-01"
                  />
                </div>`;

const newInputHtml = `                <div>
                  <label className="form-label">Sélectionner des BCs</label>
                  <select 
                    onChange={(e) => {
                      const selectedNumeroBC = e.target.value;
                      if (!selectedNumeroBC) return;
                      if (newBlData.referenceBCs && newBlData.referenceBCs.includes(selectedNumeroBC)) return;
                      const selectedBc = bcs.find(bc => bc.numeroBC === selectedNumeroBC);
                      if (!selectedBc) return;
                      const itemsToAdd = (selectedBc.items || []).map(item => ({
                        ...item,
                        id: Date.now() + Math.random()
                      }));
                      const updatedItems = [...(newBlData.items || []), ...itemsToAdd];
                      updateBlItems(updatedItems);
                      setNewBlData(prev => ({
                        ...prev,
                        referenceBCs: [...(prev.referenceBCs || []), selectedNumeroBC]
                      }));
                      e.target.value = ""; // reset
                    }} 
                    className="form-input"
                  >
                    <option value="">-- Choisir un ou plusieurs BC --</option>
                    {bcs.map(bc => (
                      <option key={bc.id} value={bc.numeroBC}>{bc.numeroBC} - {bc.rubrique}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {(newBlData.referenceBCs || []).map(ref => (
                      <div key={ref} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {ref}
                        <button type="button" onClick={() => setNewBlData(prev => ({ ...prev, referenceBCs: prev.referenceBCs.filter(r => r !== ref) }))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>`;

content = content.replace(oldInputHtml, newInputHtml);

const oldViewHtml = `<div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{selectedBlForView.referenceBC || 'Non spécifié'}</div>`;
const newViewHtml = `<div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{(selectedBlForView.referenceBCs || []).join(', ') || 'Non spécifié'}</div>`;

content = content.replace(oldViewHtml, newViewHtml);

fs.writeFileSync(path, content, 'utf8');
console.log('Script updated MarchesContent successfully!');
