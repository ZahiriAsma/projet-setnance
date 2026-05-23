import React, { useState, useEffect, useCallback } from 'react';
import { FileText, X, Save, Plus, Trash2, Coffee, Utensils, Moon, Loader2 } from 'lucide-react';
import api from '../api/axios';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Petit-déjeuner', icon: Coffee, color: '#d97706', bg: '#fef3c7', border: '#fef3c7' },
  { id: 'lunch', label: 'Déjeuner', icon: Utensils, color: '#0284c7', bg: '#e0f2fe', border: '#e0f2fe' },
  { id: 'dinner', label: 'Dîner', icon: Moon, color: '#7c3aed', bg: '#f3e8ff', border: '#f3e8ff' }
];

const FicheTechniqueModal = ({ selectedMenu, onClose, date, dayText }) => {
  const [bordereauItems, setBordereauItems] = useState([]);
  const [sheets, setSheets] = useState({ breakfast: [], lunch: [], dinner: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerms, setSearchTerms] = useState({ breakfast: '', lunch: '', dinner: '' });

  const residents = selectedMenu?.residents || 450;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [bordereauRes, sheetsRes] = await Promise.all([
          api.get('/bordereau'),
          api.get(`/technical-sheets?date=${date}`)
        ]);
        setBordereauItems(bordereauRes.data);
        
        // Group existing sheets by meal
        const grouped = { breakfast: [], lunch: [], dinner: [] };
        sheetsRes.data.forEach(sheet => {
          if (grouped[sheet.meal_type]) {
            grouped[sheet.meal_type].push({
              ...sheet,
              item: sheet.bordereau
            });
          }
        });
        setSheets(grouped);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [date]);

  const addItemToMeal = (mealType, bordereauItem) => {
    const newItem = {
      id: `temp_${Date.now()}`,
      meal_type: mealType,
      bordereau_id: bordereauItem.id,
      item: bordereauItem,
      max_quantity: bordereauItem.maximum_quantity || 1,
      max_people: residents, // Default to current residents for calculation
      present_people: residents,
      calculated_quantity: 0,
      pu_r: bordereauItem.unit_price_ttc || bordereauItem.unit_price_ht || 0,
      amount: 0,
      isNew: true
    };
    
    // Calculate initial quantity
    newItem.calculated_quantity = (newItem.max_quantity / newItem.max_people) * newItem.present_people;
    newItem.amount = newItem.calculated_quantity * newItem.pu_r;

    setSheets(prev => ({
      ...prev,
      [mealType]: [...prev[mealType], newItem]
    }));
    setSearchTerms(prev => ({ ...prev, [mealType]: '' }));
  };

  const updateItem = (mealType, index, field, value) => {
    const newSheets = { ...sheets };
    const item = newSheets[mealType][index];
    item[field] = value;

    // Recalculate
    if (field === 'present_people' || field === 'max_people' || field === 'max_quantity' || field === 'pu_r') {
      const present = parseFloat(item.present_people) || 0;
      const maxP = parseFloat(item.max_people) || 1;
      const maxQ = parseFloat(item.max_quantity) || 0;
      const pur = parseFloat(item.pu_r) || 0;

      item.calculated_quantity = (maxQ / maxP) * present;
      item.amount = item.calculated_quantity * pur;
    }

    setSheets(newSheets);
  };

  const removeItem = async (mealType, index) => {
    const item = sheets[mealType][index];
    if (!item.isNew && item.id) {
      try {
        await api.delete(`/technical-sheets/${item.id}`);
      } catch (err) {
        console.error("Error deleting item:", err);
      }
    }
    const newSheets = { ...sheets };
    newSheets[mealType].splice(index, 1);
    setSheets(newSheets);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = [];
      ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
        sheets[mealType].forEach(sheet => {
          promises.push(api.post('/technical-sheets', {
            date: date,
            meal_type: mealType,
            bordereau_id: sheet.bordereau_id,
            max_quantity: sheet.max_quantity,
            max_people: sheet.max_people,
            present_people: sheet.present_people,
            calculated_quantity: sheet.calculated_quantity,
            pu_r: sheet.pu_r,
            amount: sheet.amount
          }));
        });
      });
      await Promise.all(promises);
      // Reload to get real IDs
      const res = await api.get(`/technical-sheets?date=${date}`);
      const grouped = { breakfast: [], lunch: [], dinner: [] };
      res.data.forEach(sheet => {
        if (grouped[sheet.meal_type]) {
          grouped[sheet.meal_type].push({
            ...sheet,
            item: sheet.bordereau
          });
        }
      });
      setSheets(grouped);
      alert("Fiche Technique sauvegardée avec succès!");
    } catch (err) {
      console.error("Error saving sheets:", err);
      alert("Erreur lors de la sauvegarde.");
    }
    setSaving(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)', padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#f8fafc', borderRadius: '20px', width: '100%',
        maxWidth: '1100px', maxHeight: '95vh', display: 'flex',
        flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <FileText size={22} color="white" />
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'white' }}>Fiche Technique Automatisée</h2>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
              {dayText} · {residents} résidents par défaut
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} color="white" />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px', backgroundColor: '#f8fafc' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="animate-spin" size={40} color="#4f46e5"/></div>
          ) : (
            MEAL_TYPES.map(meal => (
              <div key={meal.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', border: `1px solid ${meal.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  marginBottom: '16px', paddingBottom: '12px', borderBottom: `2px solid ${meal.bg}`
                }}>
                  <div style={{ backgroundColor: meal.bg, borderRadius: '10px', padding: '8px', display: 'flex' }}>
                    <meal.icon size={18} color={meal.color} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: meal.color }}>{meal.label}</h3>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: meal.color, fontWeight: '600', backgroundColor: meal.bg, padding: '4px 12px', borderRadius: '20px' }}>
                    {sheets[meal.id].length} produit(s)
                  </span>
                </div>

                {/* Add Item Form */}
                <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Rechercher un produit du bordereau..."
                    value={searchTerms[meal.id]}
                    onChange={(e) => setSearchTerms({ ...searchTerms, [meal.id]: e.target.value })}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                  {searchTerms[meal.id] && (
                    <div style={{ position: 'absolute', zIndex: 10, marginTop: '42px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', maxHeight: '200px', overflowY: 'auto', width: '300px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      {bordereauItems.filter(i => i.service_description.toLowerCase().includes(searchTerms[meal.id].toLowerCase())).slice(0, 10).map(item => (
                        <div key={item.id} onClick={() => addItemToMeal(meal.id, item)} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #f1f5f9' }}>
                          <strong>{item.price_number}</strong> - {item.service_description} ({item.unit_price_ttc || item.unit_price_ht} DH)
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Table */}
                {sheets[meal.id].length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: meal.bg }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: meal.color, fontSize: '11px', textTransform: 'uppercase', borderRadius: '8px 0 0 8px' }}>Réf & Produit</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: meal.color, fontSize: '11px', textTransform: 'uppercase' }}>Unité</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: meal.color, fontSize: '11px', textTransform: 'uppercase' }}>Qté Max / Pers Max</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: meal.color, fontSize: '11px', textTransform: 'uppercase' }}>Pers. Présentes</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: meal.color, fontSize: '11px', textTransform: 'uppercase' }}>Qté Calc.</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: meal.color, fontSize: '11px', textTransform: 'uppercase' }}>PU/R (+/-)</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: meal.color, fontSize: '11px', textTransform: 'uppercase' }}>Montant</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: meal.color, fontSize: '11px', textTransform: 'uppercase', borderRadius: '0 8px 8px 0' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheets[meal.id].map((row, idx) => (
                        <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>
                            <span style={{ color: '#64748b', fontSize: '11px', marginRight: '6px' }}>{row.item?.price_number}</span>
                            {row.item?.service_description}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>{row.item?.unit_of_measure}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input type="number" value={row.max_quantity} onChange={e => updateItem(meal.id, idx, 'max_quantity', e.target.value)} style={{ width: '60px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', marginRight: '4px' }} />
                            / 
                            <input type="number" value={row.max_people} onChange={e => updateItem(meal.id, idx, 'max_people', e.target.value)} style={{ width: '60px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', marginLeft: '4px' }} />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <input type="number" value={row.present_people} onChange={e => updateItem(meal.id, idx, 'present_people', e.target.value)} style={{ width: '80px', padding: '6px', border: '2px solid #4f46e5', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }} />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: '#0f172a' }}>{Number(row.calculated_quantity).toFixed(2)}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <input type="number" step="0.01" value={row.pu_r} onChange={e => updateItem(meal.id, idx, 'pu_r', e.target.value)} style={{ width: '70px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }} />
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: '#059669' }}>{Number(row.amount).toFixed(2)}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button onClick={() => removeItem(meal.id, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Aucun produit ajouté pour le {meal.label.toLowerCase()}.</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 28px', borderTop: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          backgroundColor: 'white'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px', border: '1px solid #cbd5e1',
              borderRadius: '10px', backgroundColor: 'white',
              color: '#334155', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white', fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default FicheTechniqueModal;
