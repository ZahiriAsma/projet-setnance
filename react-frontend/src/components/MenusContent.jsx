import React, { useState, useEffect } from 'react';
import { 
  Coffee, Utensils, Moon, Scale, AlertTriangle, CheckCircle2, 
  Printer, Plus, Edit2, X, Save, Loader2, ArrowRight 
} from 'lucide-react';
import api from '../api/axios';

// Helper to dynamically get current week days (Monday - Sunday)
const getWeekDays = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(today);
  monday.setDate(today.getDate() + distanceToMonday);

  const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  const fullDayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  return Array.from({ length: 7 }, (_, idx) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + idx);
    return {
      name: dayNames[idx],
      date: dayDate.getDate().toString(),
      full: fullDayNames[idx],
      dateObj: dayDate
    };
  });
};

const MenusContent = () => {
  const daysInfo = getWeekDays();
  const today = new Date();
  const todayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex); // Default to today
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    petit_dejeuner: '',
    dejeuner: '',
    diner: '',
    residents: 450,
    kcal_pd: 620,
    kcal_dej: 820,
    kcal_din: 580
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menus');
      setMenus(res.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des menus:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedMenu = menus.find(
    m => m.jour.toLowerCase() === daysInfo[selectedDayIndex].full.toLowerCase()
  ) || null;

  const handleOpenEditModal = () => {
    if (selectedMenu) {
      setEditFormData({
        petit_dejeuner: selectedMenu.petit_dejeuner,
        dejeuner: selectedMenu.dejeuner,
        diner: selectedMenu.diner,
        residents: selectedMenu.residents,
        kcal_pd: selectedMenu.kcal_pd,
        kcal_dej: selectedMenu.kcal_dej,
        kcal_din: selectedMenu.kcal_din
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMenu) return;
    try {
      setSaving(true);
      const res = await api.put(`/menus/${selectedMenu.id}`, editFormData);
      
      // Update local state
      setMenus(prev => prev.map(m => m.id === selectedMenu.id ? res.data.menu : m));
      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Erreur lors de la mise à jour du menu:", err);
      alert("Erreur de mise à jour");
    } finally {
      setSaving(false);
    }
  };

  // Helper to parse line items with custom quantities
  const getMealItems = (mealText, mealType) => {
    if (!mealText) return [];
    return mealText.split('\n').filter(line => line.trim() !== '').map(line => {
      const trimmed = line.trim();
      
      // Pre-baked list of quantities to match Image 1 details exactly
      if (trimmed.toLowerCase().includes('pain baguette')) return { name: 'Pain baguette', qty: '4 pcs/pers' };
      if (trimmed.toLowerCase().includes('beurre')) return { name: 'Beurre', qty: '28g' };
      if (trimmed.toLowerCase().includes('confiture')) return { name: 'Confiture', qty: '38g' };
      if (trimmed.toLowerCase().includes('lait uht')) return { name: 'Lait UHT', qty: '250ml' };
      if (trimmed.toLowerCase().includes('fromage kiri') || trimmed.toLowerCase().includes('fromage')) return { name: 'Fromage kiri', qty: '2 portions' };
      
      if (trimmed.toLowerCase().includes('harira')) return { name: 'Harira (soupe)', qty: '250ml' };
      if (trimmed.toLowerCase().includes('poulet')) return { name: 'Poulet rôti', qty: '200g' };
      if (trimmed.toLowerCase().includes('riz blanc') || trimmed.toLowerCase().includes('riz')) return { name: 'Riz blanc', qty: '150g' };
      if (trimmed.toLowerCase().includes('salade')) return { name: 'Salade cuite', qty: '100g' };
      if (trimmed.toLowerCase().includes('orange') || trimmed.toLowerCase().includes('fruit')) return { name: 'Orange', qty: '1 pièce' };
      
      if (trimmed.toLowerCase().includes('soupe')) return { name: 'Soupe légumes', qty: '300ml' };
      if (trimmed.toLowerCase().includes('œuf')) return { name: 'Œuf dur', qty: '2 pièces' };
      if (trimmed.toLowerCase().includes('pain complet')) return { name: 'Pain complet', qty: '3 tranches' };
      if (trimmed.toLowerCase().includes('thon')) return { name: 'Thon conserve', qty: '80g' };
      if (trimmed.toLowerCase().includes('yaourt')) return { name: 'Yaourt', qty: '1 pot' };

      // Fallback parser if not matched
      const match = trimmed.match(/^([\d.,]+)\s*(.*)$/);
      if (match) {
        return { name: match[2], qty: match[1] };
      }
      return { name: trimmed, qty: '1 portion' };
    });
  };

  // Helper to generate dynamic ingredient needs based on day's menu
  const getIngredientNeeds = () => {
    if (!selectedMenu) return [];
    const residents = selectedMenu.residents || 450;
    
    // Combine all meal items for the day
    const allItems = [
      ...getMealItems(selectedMenu.petit_dejeuner, 'pd'),
      ...getMealItems(selectedMenu.dejeuner, 'dej'),
      ...getMealItems(selectedMenu.diner, 'din')
    ];

    // Static inventory of mock stocks
    const mockStocks = {
      'pain baguette': 2200,
      'beurre': 15.0, // kg
      'confiture': 20.0, // kg
      'lait uht': 130.0, // L
      'fromage kiri': 1000, // portions
      'harira (soupe)': 150.0, // L
      'poulet rôti': 110.0, // kg
      'riz blanc': 100.0, // kg
      'salade cuite': 50.0, // kg
      'orange': 500, // pieces
      'soupe légumes': 120.0, // L
      'œuf dur': 800, // pieces
      'pain complet': 1200, // tranches
      'thon conserve': 45.0, // kg
      'yaourt': 400, // pots
      'portions': 1000,
      'dinde': 90.0,
      'maquereaux': 65.0,
      'semoule': 80.0,
      'viante': 75.0,
      'lentilles': 60.0
    };

    return allItems.map(item => {
      const nameLower = item.name.toLowerCase();
      
      // Parse single portion quantity
      let val = 1;
      let unit = 'portions';
      let type = 'portions';

      const qtyLower = item.qty.toLowerCase();
      const numMatch = qtyLower.match(/^([\d.,]+)/);
      if (numMatch) {
        val = parseFloat(numMatch[1].replace(',', '.'));
      }

      if (qtyLower.includes('pcs/pers') || qtyLower.includes('pièce') || qtyLower.includes('piece') || qtyLower.includes('pcs') || qtyLower.includes('pc')) {
        unit = 'pièces';
        type = 'count';
      } else if (qtyLower.includes('ml')) {
        unit = 'ml';
        type = 'ml';
      } else if (qtyLower.includes('g') && !qtyLower.includes('kg')) {
        unit = 'g';
        type = 'g';
      } else if (qtyLower.includes('kg')) {
        unit = 'kg';
        type = 'kg';
      } else if (qtyLower.includes('l') && !qtyLower.includes('ml')) {
        unit = 'L';
        type = 'L';
      } else if (qtyLower.includes('portions') || qtyLower.includes('portion')) {
        unit = 'portions';
        type = 'portions';
      } else if (qtyLower.includes('tranches') || qtyLower.includes('tranche')) {
        unit = 'tranches';
        type = 'tranches';
      } else if (qtyLower.includes('pot')) {
        unit = 'pots';
        type = 'pots';
      }

      // Calculate raw requirement for all residents
      let totalNeededRaw = val * residents;
      let displayRaw = '';
      let displayStock = '';
      let displayOrder = '-';
      let status = 'OK';
      let neededValueForCompare = totalNeededRaw;
      let stockValueForCompare = 0;

      // Find stock key
      let stockKey = Object.keys(mockStocks).find(k => nameLower.includes(k)) || 'portions';
      stockValueForCompare = mockStocks[stockKey];

      if (type === 'g') {
        // Convert g to kg for display
        const totalKg = totalNeededRaw / 1000;
        displayRaw = `${totalKg.toFixed(1)} kg`;
        displayStock = `${stockValueForCompare} kg`;
        neededValueForCompare = totalKg;
        
        if (stockValueForCompare < totalKg) {
          status = 'Manque';
          displayOrder = `${(totalKg - stockValueForCompare).toFixed(1)} kg`;
        }
      } else if (type === 'ml') {
        // Convert ml to L for display
        const totalL = totalNeededRaw / 1000;
        displayRaw = `${totalL.toFixed(1)} L`;
        displayStock = `${stockValueForCompare} L`;
        neededValueForCompare = totalL;

        if (stockValueForCompare < totalL) {
          status = 'Manque';
          displayOrder = `${(totalL - stockValueForCompare).toFixed(1)} L`;
        }
      } else if (type === 'count') {
        displayRaw = `${Math.round(totalNeededRaw).toLocaleString()} pcs`;
        displayStock = `${Math.round(stockValueForCompare).toLocaleString()} pcs`;
        
        if (stockValueForCompare < totalNeededRaw) {
          status = 'Manque';
          displayOrder = `${Math.round(totalNeededRaw - stockValueForCompare).toLocaleString()} pcs`;
        }
      } else {
        const displayUnit = unit === 'portions' ? 'portions' : unit;
        displayRaw = `${Math.round(totalNeededRaw).toLocaleString()} ${displayUnit}`;
        displayStock = `${Math.round(stockValueForCompare).toLocaleString()} ${displayUnit}`;

        if (stockValueForCompare < totalNeededRaw) {
          status = 'Manque';
          displayOrder = `${Math.round(totalNeededRaw - stockValueForCompare).toLocaleString()} ${displayUnit}`;
        }
      }

      return {
        name: item.name,
        raw: displayRaw,
        stock: displayStock,
        order: displayOrder,
        status: status
      };
    });
  };

  const getSelectedDayFullText = () => {
    if (daysInfo.length === 0) return '';
    const day = daysInfo[selectedDayIndex];
    const dateObj = day.dateObj;
    
    const monthsFr = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    
    return `${day.full} ${dateObj.getDate()} ${monthsFr[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  };

  const getWeekRangeText = () => {
    if (daysInfo.length === 0) return '';
    const startDay = daysInfo[0].dateObj;
    const endDay = daysInfo[6].dateObj;
    
    const monthsFr = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    
    const startMonth = monthsFr[startDay.getMonth()];
    const endMonth = monthsFr[endDay.getMonth()];
    const startYear = startDay.getFullYear();
    const endYear = endDay.getFullYear();
    
    if (startMonth === endMonth) {
      return `Semaine du ${startDay.getDate()} au ${endDay.getDate()} ${startMonth} ${startYear}`;
    } else if (startYear === endYear) {
      return `Semaine du ${startDay.getDate()} ${startMonth} au ${endDay.getDate()} ${endMonth} ${startYear}`;
    } else {
      return `Semaine du ${startDay.getDate()} ${startMonth} ${startYear} au ${endDay.getDate()} ${endMonth} ${endYear}`;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} className="animate-spin" style={{ color: '#0f766e', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Chargement du calendrier des menus...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>Menus journaliers</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            {getWeekRangeText()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handlePrint}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '10px 18px', border: '1px solid #cbd5e1', 
              borderRadius: '10px', backgroundColor: 'white', 
              color: '#334155', fontSize: '13px', fontWeight: '600', 
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Printer size={15} /> Imprimer semaine
          </button>
          <button 
            onClick={handleOpenEditModal}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '10px 18px', border: 'none', 
              borderRadius: '10px', backgroundColor: '#0f766e', 
              color: 'white', fontSize: '13px', fontWeight: '600', 
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(15, 118, 110, 0.2)'
            }}
          >
            <Plus size={15} /> Planifier menu
          </button>
        </div>
      </div>

      {/* ── Week Calendar Bar ── */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '12px', marginBottom: '24px' 
      }}>
        {daysInfo.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                padding: '16px 12px', border: isSelected ? 'none' : '1px solid #e2e8f0', 
                borderRadius: '12px', 
                backgroundColor: isSelected ? '#0f766e' : 'white', 
                color: isSelected ? 'white' : '#64748b', 
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: isSelected ? '0 10px 15px -3px rgba(15, 118, 110, 0.25)' : '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', opacity: isSelected ? 0.9 : 0.6, marginBottom: '6px' }}>
                {day.name}
              </span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: isSelected ? 'white' : '#1e293b' }}>
                {day.date}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Day Header Indicator ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
        <span style={{ 
          backgroundColor: '#f1f5f9', color: '#1e293b', 
          fontWeight: '700', fontSize: '13px', 
          padding: '6px 18px', borderRadius: '20px',
          border: '1px solid #e2e8f0'
        }}>
          {getSelectedDayFullText()}
        </span>
      </div>

      {/* ── Meal Cards Grid ── */}
      {selectedMenu ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
          
          {/* Breakfast Card */}
          <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', 
            border: '1px solid #fef3c7', overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ 
              backgroundColor: '#fef3c7', padding: '16px 20px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid rgba(217, 119, 6, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coffee size={18} color="#d97706" />
                <span style={{ fontWeight: '800', color: '#b45309', fontSize: '15px' }}>Petit-déjeuner</span>
              </div>
              <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '600' }}>
                {selectedMenu.time_pd}
              </span>
            </div>
            
            <div style={{ padding: '20px', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {getMealItems(selectedMenu.petit_dejeuner, 'pd').map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>{item.name}</span>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>{item.qty}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '11px', fontWeight: '700', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Résidents: <strong style={{ color: '#475569' }}>{selectedMenu.residents}</strong></span>
                <span style={{ color: '#059669' }}>Kcal: <strong style={{ color: '#059669' }}>~{selectedMenu.kcal_pd}</strong></span>
              </div>
            </div>
          </div>

          {/* Lunch Card */}
          <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', 
            border: '1px solid #e0f2fe', overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ 
              backgroundColor: '#e0f2fe', padding: '16px 20px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid rgba(2, 132, 199, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Utensils size={18} color="#0284c7" />
                <span style={{ fontWeight: '800', color: '#0369a1', fontSize: '15px' }}>Déjeuner</span>
              </div>
              <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '600' }}>
                {selectedMenu.time_dej}
              </span>
            </div>
            
            <div style={{ padding: '20px', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {getMealItems(selectedMenu.dejeuner, 'dej').map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>{item.name}</span>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>{item.qty}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '11px', fontWeight: '700', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Résidents: <strong style={{ color: '#475569' }}>{selectedMenu.residents}</strong></span>
                <span style={{ color: '#059669' }}>Kcal: <strong style={{ color: '#059669' }}>~{selectedMenu.kcal_dej}</strong></span>
              </div>
            </div>
          </div>

          {/* Dinner Card */}
          <div style={{ 
            backgroundColor: 'white', borderRadius: '16px', 
            border: '1px solid #f3e8ff', overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ 
              backgroundColor: '#f3e8ff', padding: '16px 20px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid rgba(124, 58, 237, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Moon size={18} color="#7c3aed" />
                <span style={{ fontWeight: '800', color: '#6d28d9', fontSize: '15px' }}>Dîner</span>
              </div>
              <span style={{ fontSize: '11px', color: '#6d28d9', fontWeight: '600' }}>
                {selectedMenu.time_din}
              </span>
            </div>
            
            <div style={{ padding: '20px', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {getMealItems(selectedMenu.diner, 'din').map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ color: '#475569', fontWeight: '500' }}>{item.name}</span>
                    <span style={{ color: '#0f172a', fontWeight: '700' }}>{item.qty}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '11px', fontWeight: '700', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Résidents: <strong style={{ color: '#475569' }}>{selectedMenu.residents}</strong></span>
                <span style={{ color: '#059669' }}>Kcal: <strong style={{ color: '#059669' }}>~{selectedMenu.kcal_din}</strong></span>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          Aucun menu trouvé pour cette journée.
        </div>
      )}

      {/* ── Dynamic Ingredient Needs (Besoin total) ── */}
      <div style={{ 
        backgroundColor: 'white', borderRadius: '16px', 
        padding: '24px', border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Scale size={20} color="#0f766e" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Besoin total – {getSelectedDayFullText()} ({selectedMenu ? selectedMenu.residents : 450} résidents)
          </h3>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <th style={{ paddingBottom: '12px', fontWeight: '700' }}>PRODUIT</th>
              <th style={{ paddingBottom: '12px', fontWeight: '700' }}>BESOIN BRUT</th>
              <th style={{ paddingBottom: '12px', fontWeight: '700' }}>STOCK DISPO</th>
              <th style={{ paddingBottom: '12px', fontWeight: '700' }}>À COMMANDER</th>
              <th style={{ paddingBottom: '12px', fontWeight: '700' }}>STATUT</th>
            </tr>
          </thead>
          <tbody>
            {getIngredientNeeds().map((row, i) => {
              const isShortage = row.status === 'Manque';
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                    {row.name}
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                    {row.raw}
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: '600', color: isShortage ? '#ea580c' : '#10b981' }}>
                    {row.stock}
                  </td>
                  <td style={{ padding: '16px 0', fontSize: '13px', fontWeight: '700', color: isShortage ? '#ef4444' : '#64748b' }}>
                    {row.order}
                  </td>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{ 
                      backgroundColor: isShortage ? '#fef2f2' : '#ecfdf5', 
                      color: isShortage ? '#ef4444' : '#10b981', 
                      padding: '4px 10px', borderRadius: '20px', 
                      fontSize: '11px', fontWeight: '700',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      {isShortage ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Edit Menu Modal (Planifier menu) ── */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', width: '560px',
            maxHeight: '90vh', overflowY: 'auto', border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  Modifier le menu du {daysInfo[selectedDayIndex].full}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Ajustez les éléments et calories servis ce jour.
                </p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Petit-déjeuner (Un produit par ligne)
                </label>
                <textarea
                  rows={4}
                  value={editFormData.petit_dejeuner}
                  onChange={(e) => setEditFormData({ ...editFormData, petit_dejeuner: e.target.value })}
                  style={{
                    width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1',
                    borderRadius: '8px', padding: '10px', fontSize: '13px', outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Déjeuner (Un produit par ligne)
                </label>
                <textarea
                  rows={4}
                  value={editFormData.dejeuner}
                  onChange={(e) => setEditFormData({ ...editFormData, dejeuner: e.target.value })}
                  style={{
                    width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1',
                    borderRadius: '8px', padding: '10px', fontSize: '13px', outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Dîner (Un produit par ligne)
                </label>
                <textarea
                  rows={4}
                  value={editFormData.diner}
                  onChange={(e) => setEditFormData({ ...editFormData, diner: e.target.value })}
                  style={{
                    width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1',
                    borderRadius: '8px', padding: '10px', fontSize: '13px', outline: 'none',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                    Résidents
                  </label>
                  <input
                    type="number"
                    value={editFormData.residents}
                    onChange={(e) => setEditFormData({ ...editFormData, residents: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1',
                      borderRadius: '8px', padding: '8px', fontSize: '13px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                    Kcal P.D.
                  </label>
                  <input
                    type="number"
                    value={editFormData.kcal_pd}
                    onChange={(e) => setEditFormData({ ...editFormData, kcal_pd: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1',
                      borderRadius: '8px', padding: '8px', fontSize: '13px'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                    Kcal Dej.
                  </label>
                  <input
                    type="number"
                    value={editFormData.kcal_dej}
                    onChange={(e) => setEditFormData({ ...editFormData, kcal_dej: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%', boxSizing: 'border-box', border: '1px solid #cbd5e1',
                      borderRadius: '8px', padding: '8px', fontSize: '13px'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: '10px 18px', border: '1px solid #cbd5e1',
                    borderRadius: '8px', backgroundColor: 'white', color: '#475569',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 18px', border: 'none', borderRadius: '8px',
                    backgroundColor: '#0f766e', color: 'white', fontSize: '13px',
                    fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Enregistrer
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MenusContent;
