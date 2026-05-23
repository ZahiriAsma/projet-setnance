import React, { useState, useEffect } from 'react';
import { 
  Coffee, Utensils, Moon, FileText, AlertTriangle, CheckCircle2, 
  Printer, Plus, X, Save, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import api from '../api/axios';
import { useDashboard } from '../context/DashboardContext';
import { analyzeMenuBudget, MENU_PRICE_LIMIT_DH } from '../utils/menuPrices';

const formatDateISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getMondayOfWeek = (refDate = new Date()) => {
  const monday = new Date(refDate);
  const day = monday.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getWeekDays = (weekMonday) => {
  const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  const fullDayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  return Array.from({ length: 7 }, (_, idx) => {
    const dayDate = new Date(weekMonday);
    dayDate.setDate(weekMonday.getDate() + idx);
    return {
      name: dayNames[idx],
      date: dayDate.getDate().toString(),
      full: fullDayNames[idx],
      dateObj: dayDate,
      iso: formatDateISO(dayDate),
    };
  });
};

/** Parse une ligne du menu (format base de données) en { name, qty } */
const parseMealLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const colonMatch = trimmed.match(/^(.+?):\s*(.+)$/);
  if (colonMatch) {
    return { name: colonMatch[1].trim(), qty: colonMatch[2].trim() };
  }

  const leadingQty = trimmed.match(/^(\d+\/\d+|\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (leadingQty) {
    return { name: leadingQty[2].trim(), qty: leadingQty[1].replace(',', '.') };
  }

  const unitQty = trimmed.match(/^(\d+(?:[.,]\d+)?\s*(?:ml|cl|L|kg|g))\s+(.+)$/i);
  if (unitQty) {
    return { name: unitQty[2].trim(), qty: unitQty[1].replace(',', '.') };
  }

  return { name: trimmed, qty: 'par pers.' };
};

const mealTextToItems = (mealText) => {
  if (!mealText) return [];
  return mealText
    .split('\n')
    .map(parseMealLine)
    .filter(Boolean);
};

/** Stocks indicatifs pour le tableau « Besoin total » (en attendant module inventaire) */
const STOCK_INDICATIF = [
  { keys: ['pain'], stock: 2200, unit: 'pcs' },
  { keys: ['beurre'], stock: 15, unit: 'kg' },
  { keys: ['fromage', 'kiri'], stock: 900, unit: 'portions' },
  { keys: ['confiture'], stock: 20, unit: 'kg' },
  { keys: ['lait', 'café au lait', 'petit lait'], stock: 96, unit: 'L' },
  { keys: ['thé', 'tkhalte'], stock: 8, unit: 'kg' },
  { keys: ['salade'], stock: 50, unit: 'kg' },
  { keys: ['viande', 'bœuf', 'boeuf', 'boulette', 'viande hachée'], stock: 75, unit: 'kg' },
  { keys: ['poulet', 'dinde', 'osso'], stock: 120, unit: 'kg' },
  { keys: ['poisson', 'maquereau', 'thon'], stock: 65, unit: 'kg' },
  { keys: ['riz'], stock: 100, unit: 'kg' },
  { keys: ['lentille', 'haricot', 'semoule', 'couscous'], stock: 80, unit: 'kg' },
  { keys: ['harira', 'soupe'], stock: 150, unit: 'L' },
  { keys: ['fruit', 'orange', 'citron'], stock: 500, unit: 'pcs' },
  { keys: ['œuf', 'oeuf'], stock: 800, unit: 'pcs' },
  { keys: ['yaourt'], stock: 400, unit: 'pots' },
  { keys: ['pâte', 'pate', 'spaghetti'], stock: 60, unit: 'kg' },
  { keys: ['pois chiche', 'olive'], stock: 40, unit: 'kg' },
  { keys: ['jus'], stock: 200, unit: 'L' },
];

const findStockForItem = (nameLower) => {
  const entry = STOCK_INDICATIF.find(({ keys }) =>
    keys.some((k) => nameLower.includes(k))
  );
  return entry || { stock: 500, unit: 'portions' };
};

const parseQtyValue = (qtyStr) => {
  const s = qtyStr.toLowerCase().trim();
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    return b ? a / b : 1;
  }
  const num = parseFloat(s.replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(num) && num > 0 ? num : 1;
};

const MenusContent = () => {
  const { checkMenuPrices, setShowNotifications, addNotification } = useDashboard();
  const today = new Date();
  const todayIso = formatDateISO(today);

  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(today));
  const daysInfo = getWeekDays(weekStart);

  const todayIndexInWeek = daysInfo.findIndex((d) => d.iso === todayIso);
  const defaultDayIndex = todayIndexInWeek >= 0 ? todayIndexInWeek : 0;

  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(defaultDayIndex);
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
  const [showFicheTechnique, setShowFicheTechnique] = useState(false);

  useEffect(() => {
    fetchMenus(weekStart);
  }, [weekStart]);

  useEffect(() => {
    const idx = daysInfo.findIndex((d) => d.iso === todayIso);
    if (formatDateISO(weekStart) === formatDateISO(getMondayOfWeek(today)) && idx >= 0) {
      setSelectedDayIndex(idx);
    } else {
      setSelectedDayIndex(0);
    }
  }, [weekStart]);

  const fetchMenus = async (monday) => {
    try {
      setLoading(true);
      const res = await api.get('/menus', {
        params: { week_start: formatDateISO(monday) },
      });
      const fetchedMenus = res.data;
      setMenus(fetchedMenus);

      // Perform automatic background scan of the fetched week menus
      fetchedMenus.forEach((menu) => {
        const dateObj = new Date(menu.date);
        const monthsFr = [
          'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
          'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
        ];
        const daysFr = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const dayLabel = `${daysFr[dateObj.getDay()]} ${dateObj.getDate()} ${monthsFr[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        
        // 1. Budget check (> 25 DH)
        const budget = analyzeMenuBudget(menu);
        if (budget.exceeds) {
          let message;
          if (budget.overItems.length > 0 && budget.total > MENU_PRICE_LIMIT_DH) {
            message = `Le menu du ${dayLabel} : ${budget.overItems.length} article(s) > ${MENU_PRICE_LIMIT_DH} DH et total ${budget.total.toFixed(2)} DH/résident.`;
          } else if (budget.overItems.length > 0) {
            message = `Le menu du ${dayLabel} contient ${budget.overItems.length} article(s) au-delà de ${MENU_PRICE_LIMIT_DH} DH (${budget.overItems.map((i) => i.label).join(', ')}).`;
          } else {
            message = `Le menu du ${dayLabel} totalise ${budget.total.toFixed(2)} DH/résident (seuil : ${MENU_PRICE_LIMIT_DH} DH).`;
          }
          addNotification({
            type: 'alert',
            title: 'Dépassement budget',
            message,
            tab: 'menus',
          });
        }

        // 2. Stock check
        const residents = menu.residents || 450;
        const allItems = [
          ...mealTextToItems(menu.petit_dejeuner),
          ...mealTextToItems(menu.dejeuner),
          ...mealTextToItems(menu.diner),
        ];

        const shortages = [];
        const aggregated = new Map();
        
        allItems.forEach((item) => {
          const key = item.name.toLowerCase();
          const perPerson = parseQtyValue(item.qty);
          if (aggregated.has(key)) {
            const prev = aggregated.get(key);
            aggregated.set(key, { ...prev, perPerson: prev.perPerson + perPerson });
          } else {
            aggregated.set(key, { name: item.name, perPerson });
          }
        });

        Array.from(aggregated.values()).forEach(({ name, perPerson }) => {
          const nameLower = name.toLowerCase();
          const { stock: stockDispo, unit: stockUnit } = findStockForItem(nameLower);
          const totalNeeded = Math.round(perPerson * residents);

          let neededCompare = totalNeeded;
          if (stockUnit === 'kg') {
            neededCompare = totalNeeded / 100;
          } else if (stockUnit === 'L') {
            neededCompare = totalNeeded / 50;
          }

          if (neededCompare > stockDispo) {
            const formatNeeded = stockUnit === 'kg' ? `${neededCompare.toFixed(1)} kg` : (stockUnit === 'L' ? `${neededCompare.toFixed(1)} L` : `${totalNeeded} pcs`);
            const formatStock = `${stockDispo} ${stockUnit}`;
            shortages.push(`${name} (Besoin: ${formatNeeded}, Stock: ${formatStock})`);
          }
        });

        if (shortages.length > 0) {
          addNotification({
            type: 'warning',
            title: 'Alerte Stock Insuffisant',
            message: `Le menu du ${dayLabel} nécessite plus de stock que disponible pour : ${shortages.join(', ')}.`,
            tab: 'menus'
          });
        }
      });

    } catch (err) {
      console.error('Erreur lors de la récupération des menus:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedDay = daysInfo[selectedDayIndex];
  const selectedMenu = menus.find((m) => {
    const menuDate = typeof m.date === 'string' ? m.date.slice(0, 10) : formatDateISO(new Date(m.date));
    return menuDate === selectedDay?.iso;
  }) || null;

  const changeWeek = (delta) => {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + delta * 7);
    setWeekStart(next);
  };

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

  const menuBudget = analyzeMenuBudget(editFormData);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMenu) return;
    try {
      setSaving(true);
      const res = await api.put(`/menus/${selectedMenu.id}`, editFormData);

      setMenus((prev) => prev.map((m) => (m.id === selectedMenu.id ? res.data.menu : m)));

      if (checkMenuPrices(editFormData, getSelectedDayFullText())) {
        setShowNotifications(true);
      }

      // Check stock shortages for the newly submitted menu ingredients
      const residents = editFormData.residents || 450;
      const allItems = [
        ...mealTextToItems(editFormData.petit_dejeuner),
        ...mealTextToItems(editFormData.dejeuner),
        ...mealTextToItems(editFormData.diner),
      ];

      const shortages = [];
      const aggregated = new Map();
      
      allItems.forEach((item) => {
        const key = item.name.toLowerCase();
        const perPerson = parseQtyValue(item.qty);
        if (aggregated.has(key)) {
          const prev = aggregated.get(key);
          aggregated.set(key, { ...prev, perPerson: prev.perPerson + perPerson });
        } else {
          aggregated.set(key, { name: item.name, perPerson });
        }
      });

      Array.from(aggregated.values()).forEach(({ name, perPerson }) => {
        const nameLower = name.toLowerCase();
        const { stock: stockDispo, unit: stockUnit } = findStockForItem(nameLower);
        const totalNeeded = Math.round(perPerson * residents);

        let neededCompare = totalNeeded;
        if (stockUnit === 'kg') {
          neededCompare = totalNeeded / 100;
        } else if (stockUnit === 'L') {
          neededCompare = totalNeeded / 50;
        }

        if (neededCompare > stockDispo) {
          const formatNeeded = stockUnit === 'kg' ? `${neededCompare.toFixed(1)} kg` : (stockUnit === 'L' ? `${neededCompare.toFixed(1)} L` : `${totalNeeded} pcs`);
          const formatStock = `${stockDispo} ${stockUnit}`;
          shortages.push(`${name} (Besoin: ${formatNeeded}, Stock: ${formatStock})`);
        }
      });

      if (shortages.length > 0) {
        addNotification({
          type: 'warning',
          title: 'Alerte Stock Insuffisant',
          message: `Le menu du ${getSelectedDayFullText()} nécessite plus de stock que disponible pour : ${shortages.join(', ')}.`,
          tab: 'menus'
        });
        setShowNotifications(true);
      }

      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du menu:', err);
      alert('Erreur de mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const getMealItems = (mealText) => mealTextToItems(mealText);

  const getIngredientNeeds = () => {
    if (!selectedMenu) return [];
    const residents = selectedMenu.residents || 450;

    const allItems = [
      ...mealTextToItems(selectedMenu.petit_dejeuner),
      ...mealTextToItems(selectedMenu.dejeuner),
      ...mealTextToItems(selectedMenu.diner),
    ];

    const aggregated = new Map();
    allItems.forEach((item) => {
      const key = item.name.toLowerCase();
      const perPerson = parseQtyValue(item.qty);
      if (aggregated.has(key)) {
        const prev = aggregated.get(key);
        aggregated.set(key, { ...prev, perPerson: prev.perPerson + perPerson });
      } else {
        aggregated.set(key, { name: item.name, perPerson });
      }
    });

    return Array.from(aggregated.values()).map(({ name, perPerson }) => {
      const nameLower = name.toLowerCase();
      const { stock: stockDispo, unit: stockUnit } = findStockForItem(nameLower);
      const totalNeeded = Math.round(perPerson * residents);

      let displayRaw = `${totalNeeded.toLocaleString('fr-FR')} ${stockUnit}`;
      let displayStock = `${stockDispo.toLocaleString('fr-FR')} ${stockUnit}`;
      let neededCompare = totalNeeded;
      let stockCompare = stockDispo;

      if (stockUnit === 'kg') {
        displayRaw = `${(totalNeeded / 100).toFixed(1)} kg`;
        neededCompare = totalNeeded / 100;
      } else if (stockUnit === 'L') {
        displayRaw = `${(totalNeeded / 50).toFixed(1)} L`;
        neededCompare = totalNeeded / 50;
      }

      const isShortage = neededCompare > stockCompare;
      return {
        name,
        raw: displayRaw,
        stock: displayStock,
        order: isShortage
          ? `${Math.ceil(neededCompare - stockCompare).toLocaleString('fr-FR')} ${stockUnit}`
          : '—',
        status: isShortage ? 'Manque' : 'OK',
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

  const getMenuForIso = (iso) =>
    menus.find((m) => {
      const menuDate = typeof m.date === 'string' ? m.date.slice(0, 10) : formatDateISO(new Date(m.date));
      return menuDate === iso;
    }) || null;

  const formatDayFullLabel = (day) => {
    const monthsFr = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
    ];
    const d = day.dateObj;
    return `${day.full} ${d.getDate()} ${monthsFr[d.getMonth()]} ${d.getFullYear()}`;
  };

  const renderPrintMealList = (mealText) => {
    const items = mealTextToItems(mealText);
    if (items.length === 0) return <li>—</li>;
    return items.map((item, i) => (
      <li key={i}>
        {item.name}
        {item.qty !== 'par pers.' ? ` (${item.qty})` : ''}
      </li>
    ));
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
    <div className="menus-page" style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
    <div className="menus-print-area">

      {/* ── Header (écran) ── */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>Menus journaliers</h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
            {getWeekRangeText()} · Année 2025-2026
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

      {/* ── Navigation semaine (écran) ── */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }} role="navigation" aria-label="Navigation par semaine">
        <button
          type="button"
          onClick={() => changeWeek(-1)}
          aria-label="Semaine précédente"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', border: '1px solid #e2e8f0',
            borderRadius: '10px', backgroundColor: 'white', color: '#475569',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', minWidth: '220px', textAlign: 'center' }}>
          {getWeekRangeText()}
        </span>
        <button
          type="button"
          onClick={() => changeWeek(1)}
          aria-label="Semaine suivante"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', border: '1px solid #e2e8f0',
            borderRadius: '10px', backgroundColor: 'white', color: '#475569',
            cursor: 'pointer',
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Week Calendar Bar (écran) ── */}
      <div className="no-print" style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '12px', marginBottom: '24px'
      }}>
        {daysInfo.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          const isToday = day.iso === todayIso;
          return (
            <button
              key={day.iso}
              onClick={() => setSelectedDayIndex(idx)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                padding: '16px 12px', border: isSelected ? 'none' : '1px solid #e2e8f0', 
                borderRadius: '12px', 
                background: isSelected ? 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)' : 'white',
                color: isSelected ? 'white' : '#64748b', 
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: isSelected ? '0 10px 15px -3px rgba(15, 118, 110, 0.3)' : '0 1px 2px rgba(0,0,0,0.02)'
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', opacity: isSelected ? 0.9 : 0.6, marginBottom: '6px' }}>
                {day.name}
              </span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: isSelected ? 'white' : '#1e293b' }}>
                {day.date}
              </span>
              {isToday && !isSelected && (
                <span style={{ fontSize: '9px', fontWeight: '700', color: '#0f766e', marginTop: '4px' }}>
                  Aujourd&apos;hui
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Vue écran : jour sélectionné ── */}
      <div className="no-print">
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
                {getMealItems(selectedMenu.petit_dejeuner).map((item, i) => (
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
                {getMealItems(selectedMenu.dejeuner).map((item, i) => (
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
                {getMealItems(selectedMenu.diner).map((item, i) => (
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
          Aucun menu planifié pour le {getSelectedDayFullText()}.
        </div>
      )}

      </div>

      {/* ── Bouton Fiche Technique ── */}
      {selectedMenu && (
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <button
            onClick={() => setShowFicheTechnique(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 28px', border: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              color: 'white', fontSize: '14px', fontWeight: '700',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 8px 20px -4px rgba(124, 58, 237, 0.4)',
              letterSpacing: '0.02em'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <FileText size={17} />
            Fiche Technique
          </button>
        </div>
      )}

      <div className="menus-print-only">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 6px', color: '#0f172a' }}>
            Menu hebdomadaire – Internat ISTA Ouarzazate
          </h1>
          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: '#0f766e' }}>
            {getWeekRangeText()} · Année 2025-2026
          </p>
          <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>
            NB : des modifications peuvent être apportées pour circonstances exceptionnelles ou disponibilité des articles.
          </p>
        </div>

        {daysInfo.map((day) => {
          const menu = getMenuForIso(day.iso);
          return (
            <div key={day.iso} className="print-day-block">
              <h3>{formatDayFullLabel(day)}</h3>
              {menu ? (
                <>
                  <p className="print-meal-title">Petit-déjeuner ({menu.time_pd})</p>
                  <ul className="print-meal-list">{renderPrintMealList(menu.petit_dejeuner)}</ul>
                  <p className="print-meal-title">Déjeuner ({menu.time_dej})</p>
                  <ul className="print-meal-list">{renderPrintMealList(menu.dejeuner)}</ul>
                  <p className="print-meal-title">Dîner ({menu.time_din})</p>
                  <ul className="print-meal-list">{renderPrintMealList(menu.diner)}</ul>
                  <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#64748b' }}>
                    Résidents : {menu.residents} · Kcal : ~{menu.kcal_pd} / ~{menu.kcal_dej} / ~{menu.kcal_din}
                  </p>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Aucun menu planifié.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Besoin total (écran uniquement) ── */}
      <div className="no-print" style={{ 
        backgroundColor: 'white', borderRadius: '16px', 
        padding: '24px', border: '1px solid #e2e8f0', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <FileText size={20} color="#0f766e" />
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

    </div>

      {/* ── Edit Menu Modal (Planifier menu) ── */}
      {isEditModalOpen && (
        <div className="no-print" style={{
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
                  Modifier le menu du {getSelectedDayFullText()}
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

              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                Indiquez le prix en fin de ligne : <strong>Pain | 8 dh</strong> ou <strong>Harira 12 dh</strong>.
                Alerte si un article ou le total dépasse {MENU_PRICE_LIMIT_DH} DH/résident.
              </p>

              {menuBudget.exceeds && (
                <div style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px',
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
                }}>
                  <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#b91c1c' }}>
                      Dépassement du seuil de {MENU_PRICE_LIMIT_DH} DH
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#991b1b' }}>
                      Total estimé : {menuBudget.total.toFixed(2)} DH/résident
                      {menuBudget.overItems.length > 0 && (
                        <> · Articles : {menuBudget.overItems.map((i) => i.label).join(', ')}</>
                      )}
                    </p>
                  </div>
                </div>
              )}

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


      {/* ── Modale Fiche Technique ── */}
      {showFicheTechnique && selectedMenu && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(4px)', padding: '24px'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '20px', width: '100%',
            maxWidth: '860px', maxHeight: '90vh', display: 'flex',
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
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'white' }}>Fiche Technique</h2>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                  {getSelectedDayFullText()} · {selectedMenu.residents} résidents
                </p>
              </div>
              <button onClick={() => setShowFicheTechnique(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={20} color="white" />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

              {/* Petit-déjeuner */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px solid #fef3c7'
                }}>
                  <div style={{ backgroundColor: '#fef3c7', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                    <Coffee size={18} color="#d97706" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#b45309' }}>Petit-déjeuner</h3>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#b45309', fontWeight: '600', backgroundColor: '#fef3c7', padding: '3px 10px', borderRadius: '20px' }}>
                    {getMealItems(selectedMenu.petit_dejeuner).length} produit(s)
                  </span>
                </div>
                {getMealItems(selectedMenu.petit_dejeuner).length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fffbeb' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#92400e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '8px 0 0 8px' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#92400e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produit</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#92400e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qté / personne</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#92400e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '0 8px 8px 0' }}>Qté totale ({selectedMenu.residents} rés.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getMealItems(selectedMenu.petit_dejeuner).map((item, i) => {
                        const perPerson = parseQtyValue(item.qty);
                        const total = Math.round(perPerson * (selectedMenu.residents || 450));
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #fef3c7' }}>
                            <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>{i + 1}</td>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>{item.name}</td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#d97706', fontWeight: '700' }}>{item.qty}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>{total.toLocaleString('fr-FR')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Aucun produit enregistré.</p>
                )}
              </div>

              {/* Déjeuner */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px solid #e0f2fe'
                }}>
                  <div style={{ backgroundColor: '#e0f2fe', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                    <Utensils size={18} color="#0284c7" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0369a1' }}>Déjeuner</h3>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#0369a1', fontWeight: '600', backgroundColor: '#e0f2fe', padding: '3px 10px', borderRadius: '20px' }}>
                    {getMealItems(selectedMenu.dejeuner).length} produit(s)
                  </span>
                </div>
                {getMealItems(selectedMenu.dejeuner).length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0f9ff' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#0c4a6e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#0c4a6e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produit</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#0c4a6e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qté / personne</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#0c4a6e', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qté totale ({selectedMenu.residents} rés.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getMealItems(selectedMenu.dejeuner).map((item, i) => {
                        const perPerson = parseQtyValue(item.qty);
                        const total = Math.round(perPerson * (selectedMenu.residents || 450));
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #e0f2fe' }}>
                            <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>{i + 1}</td>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>{item.name}</td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#0284c7', fontWeight: '700' }}>{item.qty}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>{total.toLocaleString('fr-FR')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Aucun produit enregistré.</p>
                )}
              </div>

              {/* Dîner */}
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  marginBottom: '14px', paddingBottom: '10px', borderBottom: '2px solid #f3e8ff'
                }}>
                  <div style={{ backgroundColor: '#f3e8ff', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                    <Moon size={18} color="#7c3aed" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#6d28d9' }}>Dîner</h3>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6d28d9', fontWeight: '600', backgroundColor: '#f3e8ff', padding: '3px 10px', borderRadius: '20px' }}>
                    {getMealItems(selectedMenu.diner).length} produit(s)
                  </span>
                </div>
                {getMealItems(selectedMenu.diner).length > 0 ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#faf5ff' }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#4c1d95', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', color: '#4c1d95', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produit</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700', color: '#4c1d95', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qté / personne</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#4c1d95', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qté totale ({selectedMenu.residents} rés.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getMealItems(selectedMenu.diner).map((item, i) => {
                        const perPerson = parseQtyValue(item.qty);
                        const total = Math.round(perPerson * (selectedMenu.residents || 450));
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid #f3e8ff' }}>
                            <td style={{ padding: '12px', color: '#94a3b8', fontSize: '12px' }}>{i + 1}</td>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#1e293b' }}>{item.name}</td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#7c3aed', fontWeight: '700' }}>{item.qty}</td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>{total.toLocaleString('fr-FR')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>Aucun produit enregistré.</p>
                )}
              </div>

            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 28px', borderTop: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'flex-end', gap: '12px',
              backgroundColor: '#f8fafc'
            }}>
              <button
                onClick={() => window.print()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', border: '1px solid #cbd5e1',
                  borderRadius: '10px', backgroundColor: 'white',
                  color: '#334155', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} /> Imprimer
              </button>
              <button
                onClick={() => setShowFicheTechnique(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', border: 'none',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                  color: 'white', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <X size={15} /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}

  </div>
  );
};

export default MenusContent;
