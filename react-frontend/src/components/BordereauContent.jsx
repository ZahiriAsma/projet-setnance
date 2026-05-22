import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileSpreadsheet, Upload, Search, ChevronLeft, ChevronRight,
  ArrowUpDown, AlertCircle, CheckCircle, RefreshCw, HelpCircle,
  Eye, Trash2, ArrowLeft, Calendar
} from 'lucide-react';
import api from '../api/axios';
import { useDashboard } from '../context/DashboardContext';
import { NumberToLetter } from '../utils/numberToLetters';

const T = {
  fr: {
    title: "Importation & Gestion des Bordereaux",
    uploadBtn: "Sélectionner un fichier",
    uploadDragDrop: "Glissez-déposez un fichier Excel (.xlsx ou .xls) ici",
    searchPlaceholder: "Rechercher...",
    noData: "Aucune donnée de bordereau disponible",
    noDataDesc: "Veuillez importer un fichier Excel pour afficher et gérer le bordereau des prix.",
    loading: "Lecture et traitement du fichier Excel en cours...",
    success: "Opération réussie !",
    error: "Erreur lors de l'opération.",
    priceNumber: "N° Prix",
    description: "Désignation des prestations",
    unite: "Unité",
    puHt: "P.U. HT (MAD)",
    tva: "Taux TVA (%)",
    minQty: "Qte Min",
    maxQty: "Qte Max",
    minTotalHt: "Total HT Min",
    minVat: "TVA Min",
    minTotalTtc: "Total TTC Min",
    maxTotalHt: "Total HT Max",
    maxVat: "TVA Max",
    maxTotalTtc: "Total TTC Max",
    currentQty: "Qte Courante",
    alertThreshold: "Seuil Alerte",
    rowsPerPage: "Lignes par page",
    of: "sur",
    results: "lignes",
    confirmNewImport: "Si ce marché existe déjà, ses lignes seront mises à jour. Voulez-vous continuer ?",
    excelHeaderInfo: "Le système détecte automatiquement les colonnes basées sur les en-têtes du fichier Excel.",
    marketName: "Nom du Marché",
    importDate: "Date d'importation",
    actions: "Actions",
    backToList: "Retour à la liste"
  },
  en: {
    title: "Bordereau Import & Management",
    uploadBtn: "Select File",
    uploadDragDrop: "Drag and drop an Excel file (.xlsx or .xls) here",
    searchPlaceholder: "Search...",
    noData: "No bordereau data available",
    noDataDesc: "Please import an Excel file to display and manage the price list.",
    loading: "Reading and processing Excel file...",
    success: "Operation successful!",
    error: "Error during operation.",
    priceNumber: "Price No.",
    description: "Service Description",
    unite: "Unit",
    puHt: "U.P. HT (MAD)",
    tva: "VAT Rate (%)",
    minQty: "Min Qty",
    maxQty: "Max Qty",
    minTotalHt: "Min Total HT",
    minVat: "Min VAT",
    minTotalTtc: "Min Total TTC",
    maxTotalHt: "Max Total HT",
    maxVat: "Max VAT",
    maxTotalTtc: "Max Total TTC",
    currentQty: "Current Qty",
    alertThreshold: "Alert Thresh.",
    rowsPerPage: "Rows per page",
    of: "of",
    results: "rows",
    confirmNewImport: "If this market already exists, its rows will be updated. Do you want to proceed?",
    excelHeaderInfo: "The system dynamically identifies columns from headers.",
    marketName: "Market Name",
    importDate: "Import Date",
    actions: "Actions",
    backToList: "Back to list"
  },
  ar: {
    title: "استيراد وإدارة جداول الأسعار",
    uploadBtn: "اختر ملفاً",
    uploadDragDrop: "اسحب وأسقط ملف Excel (.xlsx أو .xls) هنا",
    searchPlaceholder: "ابحث...",
    noData: "لا توجد بيانات لجدول الأسعار حالياً",
    noDataDesc: "يرجى استيراد ملف Excel لعرض وإدارة بيانات جدول أسعار الخدمات.",
    loading: "جاري قراءة ومعالجة ملف Excel...",
    success: "تمت العملية بنجاح!",
    error: "حدث خطأ أثناء العملية.",
    priceNumber: "رقم السعر",
    description: "بيان الخدمات",
    unite: "الوحدة",
    puHt: "سعر الوحدة خ.ض",
    tva: "نسبة الضريبة (%)",
    minQty: "الكمية الأدنى",
    maxQty: "الكمية الأقصى",
    minTotalHt: "المجموع خ.ض الأدنى",
    minVat: "الضريبة الأدنى",
    minTotalTtc: "المجموع م.ر الأدنى",
    maxTotalHt: "المجموع خ.ض الأقصى",
    maxVat: "الضريبة الأقصى",
    maxTotalTtc: "المجموع م.ر الأقصى",
    currentQty: "الكمية الحالية",
    alertThreshold: "حد التنبيه",
    rowsPerPage: "الصفوف في الصفحة",
    of: "من",
    results: "صفوف",
    confirmNewImport: "إذا كان هذا السوق موجوداً بالفعل، فسيتم تحديث صفوفه. هل تريد الاستمرار؟",
    excelHeaderInfo: "يتعرف النظام تلقائياً على الأعمدة من خلال العناوين المقروءة.",
    marketName: "اسم السوق",
    importDate: "تاريخ الاستيراد",
    actions: "إجراءات",
    backToList: "العودة للقائمة"
  }
};

const BordereauContent = () => {
  const { sysConfig } = useDashboard();
  const lang = sysConfig?.language || 'fr';
  const isDark = sysConfig?.theme === 'dark';
  const isRtl = lang === 'ar';
  const text = T[lang] || T.fr;

  // View state: null = list view, number = detail view (header ID)
  const [selectedHeaderId, setSelectedHeaderId] = useState(null);

  // Data state
  const [headers, setHeaders] = useState([]);
  const [items, setItems] = useState([]);
  const [headerInfo, setHeaderInfo] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sort & Pagination
  const [sortConfig, setSortConfig] = useState({ key: 'price_number', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const fileInputRef = useRef(null);

  const clr = {
    bg: isDark ? '#1e293b' : 'white',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    headerBg: isDark ? '#0f172a' : '#f8fafc',
    rowHover: isDark ? '#334155' : '#f8fafc',
  };

  useEffect(() => {
    if (selectedHeaderId) {
      fetchBordereauDetails(selectedHeaderId);
    } else {
      fetchHeaders();
    }
  }, [selectedHeaderId]);

  const fetchHeaders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bordereau');
      setHeaders(res.data);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Impossible de charger la liste des bordereaux.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBordereauDetails = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/bordereau/${id}`);
      setItems(res.data.items);
      setHeaderInfo(res.data.header);
      setErrorMessage('');
      setCurrentPage(1);
    } catch (error) {
      setErrorMessage('Impossible de charger les détails du bordereau.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHeader = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce bordereau et toutes ses lignes ?")) return;
    try {
      await api.delete(`/bordereau/${id}`);
      setSuccessMessage("Bordereau supprimé avec succès.");
      fetchHeaders();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage("Erreur lors de la suppression.");
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      setErrorMessage(lang === 'ar' ? 'ملف غير صالح.' : 'Fichier non valide (.xlsx ou .xls)');
      return;
    }

    if (headers.length > 0) {
      if (!window.confirm(text.confirmNewImport)) return;
    }

    setImporting(true);
    setSuccessMessage('');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/bordereau/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccessMessage(response.data.message || text.success);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Refresh list or details depending on view
      if (selectedHeaderId) {
        fetchBordereauDetails(selectedHeaderId);
      } else {
        fetchHeaders();
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.error || text.error);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const calculatedTotals = useMemo(() => {
    let totalHtMin = 0;
    let totalHtMax = 0;
    let totalTtcMin = 0;
    let totalTtcMax = 0;
    const tvaGroups = {
      7: 0,
      10: 0,
      14: 0,
      20: 0
    };

    items.forEach(item => {
      totalHtMin += parseFloat(item.minimum_total_price_ht || 0);
      totalHtMax += parseFloat(item.maximum_total_price_ht || 0);
      totalTtcMin += parseFloat(item.minimum_total_price_ttc || 0);
      totalTtcMax += parseFloat(item.maximum_total_price_ttc || 0);

      let vatRate = parseFloat(item.vat_rate || 0);
      if (vatRate > 0 && vatRate <= 1) {
        vatRate = vatRate * 100;
      }
      if (vatRate > 0) {
        if (!tvaGroups[vatRate]) tvaGroups[vatRate] = 0;
        // As per requirement, sum the VAT amount. Using maximum_vat_amount as typical representation.
        tvaGroups[vatRate] += parseFloat(item.maximum_vat_amount || 0);
      }
    });

    return { totalHtMin, totalHtMax, totalTtcMin, totalTtcMax, tvaGroups };
  }, [items]);

  const processedItems = useMemo(() => {
    if (!selectedHeaderId) return headers; // If in list view, just return headers
    
    let result = [...items];
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        (item.price_number && item.price_number.toString().toLowerCase().includes(query)) ||
        (item.service_description && item.service_description.toLowerCase().includes(query)) ||
        (item.unit_of_measure && item.unit_of_measure.toLowerCase().includes(query))
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key] || '';
        let valB = b[sortConfig.key] || '';
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        if (!isNaN(numA) && !isNaN(numB)) {
          valA = numA; valB = numB;
        } else {
          valA = valA.toString().toLowerCase(); valB = valB.toString().toLowerCase();
        }
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [items, headers, searchQuery, sortConfig, selectedHeaderId]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedItems.slice(start, start + itemsPerPage);
  }, [processedItems, currentPage]);

  const totalPages = Math.ceil(processedItems.length / itemsPerPage) || 1;
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={13} style={{ opacity: 0.4 }} />;
    return <ArrowUpDown size={13} style={{ color: '#0f766e', opacity: 1, transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none' }} />;
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: isRtl ? "'Noto Sans Arabic', 'Segoe UI', sans-serif" : "'Inter', sans-serif" }}>
      <style>{`
        .table-container::-webkit-scrollbar { height: 8px; }
        .table-container::-webkit-scrollbar-track { background: ${isDark ? '#0f172a' : '#f1f5f9'}; }
        .table-container::-webkit-scrollbar-thumb { background: ${isDark ? '#334155' : '#cbd5e1'}; border-radius: 4px; }
        .table-container::-webkit-scrollbar-thumb:hover { background: #0f766e; }
        .upload-dropzone { border: 2px dashed ${importing ? '#0f766e' : clr.border}; background-color: ${isDark ? '#0f172a' : '#f8fafc'}; transition: all 0.3s; }
        .upload-dropzone:hover { border-color: #0f766e; background-color: ${isDark ? '#1e293b' : '#f0fdf4'}; transform: translateY(-2px); }
        .btn-import { background: linear-gradient(135deg, #0f766e 0%, #10b981 100%); color: white; border: none; transition: all 0.2s; }
        .btn-import:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15, 118, 110, 0.3); }
        .btn-action { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; transition: background 0.2s; }
        .btn-action:hover { background: ${isDark ? '#334155' : '#e2e8f0'}; }
        .th-sortable { cursor: pointer; user-select: none; transition: background-color 0.2s; }
        .th-sortable:hover { background-color: ${isDark ? '#1e293b' : '#f1f5f9'}; }
        .pagination-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid ${clr.border}; background-color: ${clr.bg}; color: ${clr.text}; cursor: pointer; transition: all 0.2s; }
        .pagination-btn:hover:not(:disabled) { background-color: #0f766e; border-color: #0f766e; color: white; }
        .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      {/* Header section */}
      <div style={{ display: 'flex', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: clr.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            {selectedHeaderId ? (
              <button onClick={() => setSelectedHeaderId(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#0f766e', display:'flex', alignItems:'center', padding:0 }}>
                <ArrowLeft size={24} />
              </button>
            ) : <FileSpreadsheet size={28} color="#0f766e" />}
            {selectedHeaderId ? (headerInfo?.market_name || text.title) : text.title}
          </h1>
          <p style={{ color: clr.textMuted, fontSize: '13px', margin: '4px 0 0 0', textAlign: isRtl ? 'right' : 'left' }}>
            {selectedHeaderId ? text.backToList : (lang === 'ar' ? 'قم بإستيراد و تتبع أسعار المواد و الخدمات للمؤسسة' : 'Importez et suivez le bordereau des prix des denrées et prestations.')}
          </p>
        </div>
      </div>

      {successMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', border: '1px solid #10b981', borderRadius: '12px', marginBottom: '24px', color: isDark ? '#10b981' : '#15803d', fontSize: '14px', fontWeight: '500', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <CheckCircle size={20} color="#10b981" />
          <span style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid #ef4444', borderRadius: '12px', marginBottom: '24px', color: isDark ? '#ef4444' : '#b91c1c', fontSize: '14px', fontWeight: '500', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>{errorMessage}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="upload-dropzone" onDragOver={onDragOver} onDrop={onDrop} onClick={() => fileInputRef.current?.click()} style={{ borderRadius: '16px', padding: '36px', textAlign: 'center', marginBottom: '28px', cursor: 'pointer', position: 'relative' }}>
        <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e.target.files?.[0])} onClick={(e) => e.stopPropagation()} style={{ display: 'none' }} accept=".xlsx, .xls" />
        {importing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px' }}>
            <RefreshCw size={44} className="animate-spin" style={{ color: '#0f766e', animation: 'spin 1.5s linear infinite' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: clr.text }}>{text.loading}</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(15, 118, 110, 0.15)' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={28} color="#0f766e" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: clr.text }}>{text.uploadDragDrop}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: clr.textMuted }}>Microsoft Excel (.xlsx, .xls).</p>
            </div>
            <button className="btn-import" style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>{text.uploadBtn}</button>
          </div>
        )}
      </div>

      {!selectedHeaderId ? (
        // --- LIST VIEW ---
        <div style={{ backgroundColor: clr.bg, border: `1px solid ${clr.border}`, borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.02)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <RefreshCw size={32} className="animate-spin" style={{ color: '#0f766e', margin: '0 auto 16px' }} />
            </div>
          ) : headers.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: clr.textMuted }}>
               <FileSpreadsheet size={32} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
               <h3 style={{ margin: 0, color: clr.text }}>{text.noData}</h3>
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: clr.headerBg, borderBottom: `2px solid ${clr.border}`, color: clr.textMuted }}>
                    <th style={{ padding: '16px 20px', fontWeight: '700' }}>ID</th>
                    <th style={{ padding: '16px 20px', fontWeight: '700' }}>{text.marketName}</th>
                    <th style={{ padding: '16px 20px', fontWeight: '700' }}>{text.importDate}</th>
                    <th style={{ padding: '16px 20px', fontWeight: '700', textAlign: 'right' }}>{text.minTotalTtc}</th>
                    <th style={{ padding: '16px 20px', fontWeight: '700', textAlign: 'right' }}>{text.maxTotalTtc}</th>
                    <th style={{ padding: '16px 20px', fontWeight: '700', textAlign: 'center' }}>{text.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h) => (
                    <tr key={h.id} style={{ borderBottom: `1px solid ${clr.border}`, color: clr.text, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = clr.rowHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 20px', fontWeight: '700', color: '#0f766e' }}>#{h.id}</td>
                      <td style={{ padding: '16px 20px', fontWeight: '600' }}>{h.market_name || 'Marché sans nom'}</td>
                      <td style={{ padding: '16px 20px', color: clr.textMuted, display:'flex', alignItems:'center', gap:'8px' }}>
                        <Calendar size={14} />
                        {new Date(h.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '700', color: '#0f766e' }}>
                        {parseFloat(h.bordereaux_sum_minimum_total_price_ttc ?? h.total_ttc_min ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>
                        {parseFloat(h.bordereaux_sum_maximum_total_price_ttc ?? h.total_ttc_max ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => { setSelectedHeaderId(h.id); setCurrentPage(1); }} className="btn-action" style={{ color: '#0f766e' }} title="Afficher les détails">
                            <Eye size={18} />
                          </button>
                          <button onClick={() => handleDeleteHeader(h.id)} className="btn-action" style={{ color: '#ef4444' }} title="Supprimer">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // --- DETAIL VIEW ---
        <>
          {headerInfo && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{ backgroundColor: clr.bg, border: `1px solid ${clr.border}`, borderRadius: '16px', padding: '22px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.02)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700', color: clr.text }}>Marché / Bordereau</h4>
                <p style={{ margin: 0, fontSize: '14px', color: clr.textMuted }}>{headerInfo.market_name || '-'}</p>
              </div>
            </div>
          )}

          <div style={{ backgroundColor: clr.bg, border: `1px solid ${clr.border}`, borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.02)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: `1.5px solid ${clr.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ position: 'relative', width: '360px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder={text.searchPlaceholder} value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '10px', border: `1.5px solid ${clr.border}`, backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: clr.text, fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: clr.textMuted, display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ color: '#0f766e', fontSize: '15px', fontWeight: '800' }}>{processedItems.length}</span>
                <span>{text.results}</span>
              </div>
            </div>

            <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1600px', fontSize: '13px', textAlign: isRtl ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: clr.headerBg, borderBottom: `2px solid ${clr.border}`, color: clr.textMuted, fontSize: '11px', textTransform: 'uppercase' }}>
                    <th onClick={() => requestSort('price_number')} className="th-sortable" style={{ padding: '16px 20px', width: '100px' }}>{text.priceNumber} {getSortIcon('price_number')}</th>
                    <th onClick={() => requestSort('service_description')} className="th-sortable" style={{ padding: '16px 20px', minWidth: '280px' }}>{text.description} {getSortIcon('service_description')}</th>
                    <th onClick={() => requestSort('unit_of_measure')} className="th-sortable" style={{ padding: '16px 20px', width: '80px', textAlign: 'center' }}>{text.unite} {getSortIcon('unit_of_measure')}</th>
                    <th onClick={() => requestSort('unit_price_ht')} className="th-sortable" style={{ padding: '16px 20px', width: '120px', textAlign: 'right' }}>{text.puHt} {getSortIcon('unit_price_ht')}</th>
                    <th onClick={() => requestSort('vat_rate')} className="th-sortable" style={{ padding: '16px 20px', width: '100px', textAlign: 'right' }}>{text.tva} {getSortIcon('vat_rate')}</th>
                    <th onClick={() => requestSort('minimum_quantity')} className="th-sortable" style={{ padding: '16px 20px', width: '100px', textAlign: 'right' }}>{text.minQty} {getSortIcon('minimum_quantity')}</th>
                    <th onClick={() => requestSort('maximum_quantity')} className="th-sortable" style={{ padding: '16px 20px', width: '100px', textAlign: 'right' }}>{text.maxQty} {getSortIcon('maximum_quantity')}</th>
                    <th onClick={() => requestSort('minimum_total_price_ht')} className="th-sortable" style={{ padding: '16px 20px', width: '130px', textAlign: 'right' }}>{text.minTotalHt} {getSortIcon('minimum_total_price_ht')}</th>
                    <th onClick={() => requestSort('minimum_vat_amount')} className="th-sortable" style={{ padding: '16px 20px', width: '110px', textAlign: 'right' }}>{text.minVat} {getSortIcon('minimum_vat_amount')}</th>
                    <th onClick={() => requestSort('minimum_total_price_ttc')} className="th-sortable" style={{ padding: '16px 20px', width: '130px', textAlign: 'right' }}>{text.minTotalTtc} {getSortIcon('minimum_total_price_ttc')}</th>
                    <th onClick={() => requestSort('maximum_total_price_ht')} className="th-sortable" style={{ padding: '16px 20px', width: '130px', textAlign: 'right' }}>{text.maxTotalHt} {getSortIcon('maximum_total_price_ht')}</th>
                    <th onClick={() => requestSort('maximum_vat_amount')} className="th-sortable" style={{ padding: '16px 20px', width: '110px', textAlign: 'right' }}>{text.maxVat} {getSortIcon('maximum_vat_amount')}</th>
                    <th onClick={() => requestSort('maximum_total_price_ttc')} className="th-sortable" style={{ padding: '16px 20px', width: '130px', textAlign: 'right' }}>{text.maxTotalTtc} {getSortIcon('maximum_total_price_ttc')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((item, index) => (
                    <tr key={item.id || index} style={{ borderBottom: `1px solid ${clr.border}`, color: clr.text, transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = clr.rowHover} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0f766e' }}>{item.price_number}</td>
                      <td style={{ padding: '14px 20px', fontWeight: '500' }}>{item.service_description}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>{item.unit_of_measure || '-'}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700' }}>{parseFloat(item.unit_price_ht || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>{(parseFloat(item.vat_rate || 0) > 0 && parseFloat(item.vat_rate || 0) <= 1) ? (parseFloat(item.vat_rate || 0) * 100) : item.vat_rate}%</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', color: clr.textMuted }}>{parseFloat(item.minimum_quantity || 0).toLocaleString('fr-FR')}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', color: clr.textMuted }}>{parseFloat(item.maximum_quantity || 0).toLocaleString('fr-FR')}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700' }}>{parseFloat(item.minimum_total_price_ht || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', color: clr.textMuted }}>{parseFloat(item.minimum_vat_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', color: '#0f766e' }}>{parseFloat(item.minimum_total_price_ttc || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700' }}>{parseFloat(item.maximum_total_price_ht || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', color: clr.textMuted }}>{parseFloat(item.maximum_vat_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>{parseFloat(item.maximum_total_price_ttc || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {headerInfo && (
              <div style={{ padding: '20px 24px', borderTop: `2px solid ${isDark ? '#0f766e' : '#10b981'}`, backgroundColor: isDark ? 'rgba(15, 118, 110, 0.05)' : '#f0fdf4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: clr.bg, borderRadius: '10px', border: `1px solid ${clr.border}` }}>
                    <span style={{ fontSize: '13px', color: clr.textMuted, fontWeight: '500' }}>Total HT Min</span>
                    <strong style={{ fontSize: '14px', color: clr.text }}>{calculatedTotals.totalHtMin.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: clr.bg, borderRadius: '10px', border: `1px solid ${clr.border}` }}>
                    <span style={{ fontSize: '13px', color: clr.textMuted, fontWeight: '500' }}>Total HT Max</span>
                    <strong style={{ fontSize: '14px', color: clr.text }}>{calculatedTotals.totalHtMax.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</strong>
                  </div>
                  {Object.entries(calculatedTotals.tvaGroups).sort(([a],[b]) => parseFloat(a) - parseFloat(b)).map(([rate, amount]) => (
                    <div key={`tva-${rate}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: clr.bg, borderRadius: '10px', border: `1px solid ${clr.border}` }}>
                      <span style={{ fontSize: '13px', color: clr.textMuted, fontWeight: '500' }}>TVA {rate}%</span>
                      <strong style={{ fontSize: '14px', color: clr.text }}>{amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</strong>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: clr.bg, borderRadius: '10px', border: `1px solid ${clr.border}` }}>
                    <span style={{ fontSize: '13px', color: clr.textMuted, fontWeight: '500' }}>Total TTC Min</span>
                    <strong style={{ fontSize: '14px', color: '#0f766e' }}>{calculatedTotals.totalTtcMin.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: clr.bg, borderRadius: '10px', border: `1px solid ${clr.border}` }}>
                    <span style={{ fontSize: '13px', color: clr.textMuted, fontWeight: '500' }}>Total TTC Max</span>
                    <strong style={{ fontSize: '14px', color: '#10b981' }}>{calculatedTotals.totalTtcMax.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</strong>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                  <div style={{ padding: '14px 18px', backgroundColor: clr.bg, borderRadius: '10px', border: `1px solid ${clr.border}`, borderLeft: `4px solid #0f766e` }}>
                    <span style={{ fontSize: '12px', color: clr.textMuted, fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>MINIMUM</span>
                    <p style={{ margin: 0, fontSize: '14px', color: clr.text, fontWeight: '600', fontStyle: 'italic' }}>
                      Arrêté le présent bordereau minimum à la somme de : {NumberToLetter(calculatedTotals.totalTtcMin)}
                    </p>
                  </div>
                  
                  <div style={{ padding: '14px 18px', backgroundColor: clr.bg, borderRadius: '10px', border: `1px solid ${clr.border}`, borderLeft: `4px solid #10b981` }}>
                    <span style={{ fontSize: '12px', color: clr.textMuted, fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>MAXIMUM</span>
                    <p style={{ margin: 0, fontSize: '14px', color: clr.text, fontWeight: '600', fontStyle: 'italic' }}>
                      Arrêté le présent bordereau maximum à la somme de : {NumberToLetter(calculatedTotals.totalTtcMax)}
                    </p>
                  </div>
                </div>

                {headerInfo.amount_in_letters && (
                  <div style={{ padding: '14px 18px', backgroundColor: clr.bg, borderRadius: '10px', border: `1px solid ${clr.border}`, borderLeft: `4px solid #64748b` }}>
                    <span style={{ fontSize: '12px', color: clr.textMuted, fontWeight: '600', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Montant en lettres (Original Excel)</span>
                    <p style={{ margin: 0, fontSize: '14px', color: clr.text, fontWeight: '600', fontStyle: 'italic' }}>{headerInfo.amount_in_letters}</p>
                  </div>
                )}
              </div>
            )}

            <div style={{ padding: '16px 24px', borderTop: `1.5px solid ${clr.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: clr.textMuted, display: 'flex', gap: '6px' }}>
                <span>Page</span><span style={{ fontWeight: '700', color: clr.text }}>{currentPage}</span><span>{text.of}</span><span style={{ fontWeight: '700', color: clr.text }}>{totalPages}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn"><ChevronLeft size={16} /></button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-btn"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BordereauContent;
