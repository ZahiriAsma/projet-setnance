import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Plus, ArrowRight } from 'lucide-react';
import './DailyMealModal.css';

/**
 * DailyMealModal – displayed from the technical sheet page.
 * Shows Breakfast, Lunch, Dinner sections with number‑of‑people inputs and a product table.
 * Colors follow the project's dark theme and green accent (#2f9e44).
 */
const DailyMealModal = ({ marche, onClose }) => {
  const [bordereauItems, setBordereauItems] = useState([]);
  const [entries, setEntries] = useState({ breakfast: [], lunch: [], dinner: [] });
  const [people, setPeople] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch products and any saved entries for the selected date (default today)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: items }, { data: saved }] = await Promise.all([
          api.get('/bordereau?items=true'),
          api.get(`/marches/${marche.id}/daily-meals`, { params: { date: new Date().toISOString().slice(0, 10) } })
        ]);
        setBordereauItems(items);
        // Initialise entries and people counts from saved data
        const init = { breakfast: [], lunch: [], dinner: [] };
        const ppl = { breakfast: 0, lunch: 0, dinner: 0 };
        saved.forEach(entry => {
          const meal = entry.meal_type;
          if (meal && init[meal]) {
            init[meal].push(entry);
            ppl[meal] = entry.people_count;
          }
        });
        setEntries(init);
        setPeople(ppl);
      } catch (e) {
        console.error('Failed to load daily meals', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [marche.id]);

  // Helper: calculate PUR +/- and amount for a product row
  const computeRow = (product, peopleCount) => {
    const maxQty = parseFloat(product.maximum_quantity) || 0;
    const maxPeople = parseFloat(product.max_people) || 1; // avoid division by 0
    const defaultQty = (maxQty / maxPeople) * peopleCount;
    const pu = parseFloat(product.unit_price_ht) || 0;
    const r = parseFloat(product.r) || 1; // avoid division by 0
    const pur = pu / r;
    const quantity = defaultQty; // can be overridden by user input later
    const amount = quantity * pur;
    return { quantity, pur, amount };
  };

  // Update a single entry (quantity may be edited by the user)
  const updateEntry = (meal, idx, field, value) => {
    setEntries(prev => {
      const updated = { ...prev };
      const row = { ...updated[meal][idx] };
      row[field] = value;
      // Re‑calculate amount if quantity changed
      if (field === 'quantity') {
        row.amount = parseFloat(value) * row.pur;
      }
      updated[meal][idx] = row;
      return updated;
    });
  };

  // Debounced auto‑save (800 ms)
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (loading) return;
      const payload = [];
      Object.entries(entries).forEach(([meal, rows]) => {
        rows.forEach(row => {
          payload.push({
            id: row.id,
            marche_id: marche.id,
            date: new Date().toISOString().slice(0, 10),
            meal_type: meal,
            people_count: people[meal] || 0,
            product_id: row.product_id,
            designation: row.designation,
            unit: row.unit,
            r: row.r,
            pu: row.pu,
            max_quantity: row.max_quantity,
            max_people: row.max_people,
            quantity: row.quantity,
            pur: row.pur,
            amount: row.amount,
          });
        });
      });
      try {
        await api.post(`/marches/${marche.id}/daily-meals`, payload);
      } catch (e) {
        console.error('Auto‑save failed', e);
      }
    }, 800);
    return () => clearTimeout(handler);
  }, [entries, people, loading, marche.id]);

  if (loading) {
    return (
      <div className="daily-meal-modal-overlay">
        <div className="daily-meal-modal-card">
          <p className="loading-text">Chargement…</p>
        </div>
      </div>
    );
  }

  const renderMealSection = (mealKey, label) => (
    <section className="meal-section" key={mealKey}>
      <header className="meal-header">
        <h3>{label}</h3>
        <div className="people-input">
          <label>Nb personnes</label>
          <input
            type="number"
            min="0"
            value={people[mealKey]}
            onChange={e => setPeople({ ...people, [mealKey]: parseInt(e.target.value) || 0 })}
          />
        </div>
      </header>
      <table className="meal-table">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Unité</th>
            <th>R</th>
            <th>PU</th>
            <th>PUR +/-</th>
            <th>Quantité</th>
            <th>Montant</th>
          </tr>
        </thead>
        <tbody>
          {entries[mealKey].map((row, idx) => (
            <tr key={row.id || idx}>
              <td>{row.designation}</td>
              <td>{row.unit}</td>
              <td>{row.r}</td>
              <td>{row.pu}</td>
              <td>{row.pur.toFixed(4)}</td>
              <td>
                <input
                  type="number"
                  min="0"
                  value={row.quantity}
                  onChange={e => updateEntry(mealKey, idx, 'quantity', parseFloat(e.target.value) || 0)}
                />
              </td>
              <td>{row.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );

  return (
    <div className="daily-meal-modal-overlay">
      <div className="daily-meal-modal-card">
        <button className="close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
        <h2 className="modal-title">Gestion des repas quotidiens</h2>
        {renderMealSection('breakfast', 'Breakfast / Ftour')}
        {renderMealSection('lunch', 'Lunch')}
        {renderMealSection('dinner', 'Dinner')}
        <div className="actions">
          <button className="save-btn" onClick={() => {/* manual save if needed */}}>
            <ArrowRight size={16} className="btn-icon" /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyMealModal;
