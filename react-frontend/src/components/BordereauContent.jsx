import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Search, ChevronLeft, ChevronRight, 
  ArrowUpDown, AlertCircle, CheckCircle, RefreshCw, HelpCircle
} from 'lucide-react';
import api from '../api/axios';
import { useDashboard } from '../context/DashboardContext';


const T = {
  fr: {
    title: "Importation & Gestion du Bordereau",
    uploadBtn: "Sélectionner un fichier",
    uploadDragDrop: "Glissez-déposez un fichier Excel (.xlsx ou .xls) ici ou cliquez pour parcourir",
    searchPlaceholder: "Rechercher par n° de prix ou désignation...",
    noData: "Aucune donnée de bordereau disponible",
    noDataDesc: "Veuillez importer un fichier Excel pour afficher et gérer le bordereau des prix.",
    loading: "Lecture et traitement du fichier Excel en cours...",
    success: "Importation réussie !",
    error: "Erreur lors de l'importation.",
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
    confirmNewImport: "L'importation d'un nouveau bordereau supprimera toutes les données précédentes de la base de données. Voulez-vous continuer ?",
    excelHeaderInfo: "Le système détecte automatiquement les colonnes basées sur les en-têtes du fichier (N° Prix, Désignation, Unité, P.U. HT, TVA, Qte Min/Max, etc.) ou se basera sur la disposition par défaut."
  },
  en: {
    title: "Bordereau Import & Management",
    uploadBtn: "Select File",
    uploadDragDrop: "Drag and drop an Excel file (.xlsx or .xls) here or click to browse",
    searchPlaceholder: "Search by price number or description...",
    noData: "No bordereau data available",
    noDataDesc: "Please import an Excel file to display and manage the price list.",
    loading: "Reading and processing Excel file...",
    success: "Import successful!",
    error: "Error during import.",
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
    confirmNewImport: "Importing a new bordereau will delete all previous data from the database. Do you want to proceed?",
    excelHeaderInfo: "The system dynamically identifies columns from headers (Price No, Description, Unit, Price HT, VAT, Min/Max Qty, etc.) or falls back to standard sequential order."
  },
  ar: {
    title: "استيراد وإدارة جدول الأسعار",
    uploadBtn: "اختر ملفاً",
    uploadDragDrop: "اسحب وأسقط ملف Excel (.xlsx أو .xls) هنا أو انقر لتصفح ملفاتك",
    searchPlaceholder: "ابحث برقم السعر أو البيان والمسمى...",
    noData: "لا توجد بيانات لجدول الأسعار حالياً",
    noDataDesc: "يرجى استيراد ملف Excel لعرض وإدارة بيانات جدول أسعار الخدمات.",
    loading: "جاري قراءة ومعالجة ملف Excel...",
    success: "تم استيراد جدول الأسعار بنجاح!",
    error: "حدث خطأ أثناء استيراد الملف.",
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
    confirmNewImport: "سيؤدي استيراد جدول أسعار جديد إلى حذف كافة البيانات السابقة نهائياً من قاعدة البيانات. هل تريد الاستمرار؟",
    excelHeaderInfo: "يتعرف النظام تلقائياً على الأعمدة من خلال العناوين المقروءة، أو يعتمد على الترتيب القياسي في حال تعذر ذلك."
  }
};

const BordereauContent = () => {
  const { sysConfig } = useDashboard();
  const lang = sysConfig?.language || 'fr';
  const isDark = sysConfig?.theme === 'dark';
  const isRtl = lang === 'ar';
  
  const text = T[lang] || T.fr;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Sort State
  const [sortConfig, setSortConfig] = useState({ key: 'price_number', direction: 'asc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fileInputRef = useRef(null);

  // Styling colors mapping
  const clr = {
    bg: isDark ? '#1e293b' : 'white',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    headerBg: isDark ? '#0f172a' : '#f8fafc',
    rowHover: isDark ? '#334155' : '#f8fafc',
  };

  useEffect(() => {
    fetchBordereau();
  }, []);

  const fetchBordereau = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bordereau');
      setItems(response.data);
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching bordereau data', error);
      setErrorMessage('Impossible de charger les données du bordereau. Vérifiez que la base de données est accessible.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Check extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'xlsx' && extension !== 'xls') {
      setErrorMessage(lang === 'ar' ? 'ملف غير صالح. يرجى اختيار ملف Excel فقط (.xlsx أو .xls)' : 'Fichier non valide. Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      setSuccessMessage('');
      return;
    }

    if (items.length > 0) {
      const confirm = window.confirm(text.confirmNewImport);
      if (!confirm) return;
    }

    setImporting(true);
    setSuccessMessage('');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/bordereau/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setItems(response.data.data);
      setSuccessMessage(response.data.message || text.success);
      setCurrentPage(1); // Reset to page 1
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Import error', error);
      setErrorMessage(error.response?.data?.error || text.error);
    } finally {
      setImporting(false);
      // Reset input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Sorting Handler
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtered & Sorted Items
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Search Query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        (item.price_number && item.price_number.toString().toLowerCase().includes(query)) ||
        (item.service_description && item.service_description.toLowerCase().includes(query)) ||
        (item.unit_of_measure && item.unit_of_measure.toLowerCase().includes(query))
      );
    }

    // 2. Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Convert numbers if numeric
        const numericKeys = [
          'unit_price_ht', 'vat_rate', 'minimum_quantity', 'maximum_quantity',
          'minimum_total_price_ht', 'minimum_vat_amount', 'minimum_total_price_ttc',
          'maximum_total_price_ht', 'maximum_vat_amount', 'maximum_total_price_ttc',
          'current_quantity', 'alert_threshold'
        ];

        if (sortConfig.key === 'price_number') {
          const numA = parseFloat(valA);
          const numB = parseFloat(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            valA = numA;
            valB = numB;
          } else {
            valA = valA ? valA.toString().toLowerCase() : '';
            valB = valB ? valB.toString().toLowerCase() : '';
          }
        } else if (numericKeys.includes(sortConfig.key)) {
          valA = parseFloat(valA) || 0;
          valB = parseFloat(valB) || 0;
        } else {
          valA = valA ? valA.toString().toLowerCase() : '';
          valB = valB ? valB.toString().toLowerCase() : '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, searchQuery, sortConfig]);

  // Pagination Slice
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedItems.slice(start, start + itemsPerPage);
  }, [processedItems, currentPage]);

  const totalPages = Math.ceil(processedItems.length / itemsPerPage) || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={13} style={{ opacity: 0.4 }} />;
    return <ArrowUpDown size={13} style={{ color: '#0f766e', opacity: 1, transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none' }} />;
  };



  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', fontFamily: isRtl ? "'Noto Sans Arabic', 'Segoe UI', sans-serif" : "'Inter', sans-serif" }}>
      <style>{`
        .table-container::-webkit-scrollbar {
          height: 8px;
        }
        .table-container::-webkit-scrollbar-track {
          background: ${isDark ? '#0f172a' : '#f1f5f9'};
        }
        .table-container::-webkit-scrollbar-thumb {
          background: ${isDark ? '#334155' : '#cbd5e1'};
          border-radius: 4px;
        }
        .table-container::-webkit-scrollbar-thumb:hover {
          background: #0f766e;
        }
        .upload-dropzone {
          border: 2px dashed ${importing ? '#0f766e' : clr.border};
          background-color: ${isDark ? '#0f172a' : '#f8fafc'};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .upload-dropzone:hover {
          border-color: #0f766e;
          background-color: ${isDark ? '#1e293b' : '#f0fdf4'};
          box-shadow: 0 4px 20px -2px rgba(15, 118, 110, 0.08);
          transform: translateY(-2px);
        }
        .btn-import {
          background: linear-gradient(135deg, #0f766e 0%, #10b981 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.2);
          transition: all 0.2s;
        }
        .btn-import:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(15, 118, 110, 0.3);
        }
        .btn-import:active {
          transform: translateY(1px);
        }
        .th-sortable {
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;
        }
        .th-sortable:hover {
          background-color: ${isDark ? '#1e293b' : '#f1f5f9'};
        }
        .pagination-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid ${clr.border};
          background-color: ${clr.bg};
          color: ${clr.text};
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          background-color: #0f766e;
          border-color: #0f766e;
          color: white;
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      {/* Header section */}
      <div style={{ display: 'flex', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: clr.text, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <FileSpreadsheet size={28} color="#0f766e" />
            {text.title}
          </h1>
          <p style={{ color: clr.textMuted, fontSize: '13px', margin: '4px 0 0 0', textAlign: isRtl ? 'right' : 'left' }}>
            {lang === 'ar' ? 'قم بإستيراد و تتبع أسعار المواد و الخدمات للمؤسسة' : 'Importez et suivez le bordereau des prix des denrées et prestations.'}
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', 
          backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', 
          border: '1px solid #10b981', borderRadius: '12px', marginBottom: '24px',
          color: isDark ? '#10b981' : '#15803d', fontSize: '14px', fontWeight: '500',
          flexDirection: isRtl ? 'row-reverse' : 'row'
        }}>
          <CheckCircle size={20} color="#10b981" />
          <span style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', 
          backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', 
          border: '1px solid #ef4444', borderRadius: '12px', marginBottom: '24px',
          color: isDark ? '#ef4444' : '#b91c1c', fontSize: '14px', fontWeight: '500',
          flexDirection: isRtl ? 'row-reverse' : 'row'
        }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ flex: 1, textAlign: isRtl ? 'right' : 'left' }}>{errorMessage}</span>
        </div>
      )}

      {/* Upload Dropzone Container */}
      <div 
        className="upload-dropzone"
        onDragOver={onDragOver}
        onDrop={onDrop}
        style={{
          borderRadius: '16px', padding: '36px', textAlign: 'center', 
          marginBottom: '28px', cursor: 'pointer', position: 'relative'
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={(e) => handleFileUpload(e.target.files?.[0])}
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'none' }}
          accept=".xlsx, .xls"
        />

        {importing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px' }}>
            <RefreshCw size={44} className="animate-spin" style={{ color: '#0f766e', animation: 'spin 1.5s linear infinite' }} />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: clr.text }}>{text.loading}</h3>
            <p style={{ margin: 0, fontSize: '12px', color: clr.textMuted }}>Veuillez patienter pendant que la base de données est mise à jour.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: isDark ? 'rgba(15, 118, 110, 0.15)' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={28} color="#0f766e" />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '700', color: clr.text }}>
                {text.uploadDragDrop}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: clr.textMuted, maxWidth: '500px', marginInline: 'auto' }}>
                Fichiers acceptés: Microsoft Excel (.xlsx, .xls).
              </p>
            </div>
            <button className="btn-import" style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
              {text.uploadBtn}
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize: '11px', color: clr.textMuted, backgroundColor: isDark ? '#0f172a' : '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: `1.5px solid ${clr.border}`, marginBottom: '28px', display: 'flex', gap: '8px', alignItems: 'flex-start', textAlign: isRtl ? 'right' : 'left', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <HelpCircle size={14} style={{ color: '#0f766e', flexShrink: 0, marginTop: '1px' }} />
        <span>{text.excelHeaderInfo}</span>
      </div>

      {/* Main Table Card */}
      {loading ? (
        <div style={{ backgroundColor: clr.bg, border: `1px solid ${clr.border}`, borderRadius: '16px', padding: '80px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <RefreshCw size={36} className="animate-spin" style={{ color: '#0f766e', animation: 'spin 1.5s linear infinite', margin: '0 auto 16px' }} />
          <h3 style={{ margin: 0, fontSize: '15px', color: clr.text }}>Chargement des données du bordereau...</h3>
        </div>
      ) : items.length === 0 ? (
        <div style={{ backgroundColor: clr.bg, border: `1px solid ${clr.border}`, borderRadius: '16px', padding: '64px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: isDark ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FileSpreadsheet size={32} color="#94a3b8" />
          </div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '700', color: clr.text }}>{text.noData}</h3>
          <p style={{ margin: '0 auto', fontSize: '13px', color: clr.textMuted, maxWidth: '420px', lineHeight: '1.5' }}>
            {text.noDataDesc}
          </p>
        </div>
      ) : (
        <div style={{ backgroundColor: clr.bg, border: `1px solid ${clr.border}`, borderRadius: '16px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.02)', overflow: 'hidden' }}>
          
          {/* Table Toolbar */}
          <div style={{ padding: '20px 24px', borderBottom: `1.5px solid ${clr.border}`, display: 'flex', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', width: '360px' }}>
              <Search size={16} style={{ position: 'absolute', [isRtl ? 'right' : 'left']: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="text" 
                placeholder={text.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: isRtl ? '10px 40px 10px 16px' : '10px 16px 10px 40px',
                  borderRadius: '10px',
                  border: `1.5px solid ${clr.border}`,
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  color: clr.text,
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ fontSize: '13px', fontWeight: '600', color: clr.textMuted, display: 'flex', gap: '6px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <span style={{ color: '#0f766e', fontSize: '15px', fontWeight: '800' }}>{processedItems.length}</span>
              <span>{text.results}</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1600px', fontSize: '13px', textAlign: isRtl ? 'right' : 'left' }}>
              <thead>
                <tr style={{ backgroundColor: clr.headerBg, borderBottom: `2px solid ${clr.border}`, color: clr.textMuted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th onClick={() => requestSort('price_number')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '100px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: isRtl ? 'flex-end' : 'flex-start' }}>
                      {text.priceNumber} {getSortIcon('price_number')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('service_description')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: isRtl ? 'flex-end' : 'flex-start' }}>
                      {text.description} {getSortIcon('service_description')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('unit_of_measure')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '80px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                      {text.unite} {getSortIcon('unit_of_measure')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('unit_price_ht')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '120px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.puHt} {getSortIcon('unit_price_ht')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('vat_rate')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '100px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.tva} {getSortIcon('vat_rate')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('minimum_quantity')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '100px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.minQty} {getSortIcon('minimum_quantity')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('maximum_quantity')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '100px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.maxQty} {getSortIcon('maximum_quantity')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('minimum_total_price_ht')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '130px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.minTotalHt} {getSortIcon('minimum_total_price_ht')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('minimum_vat_amount')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '110px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.minVat} {getSortIcon('minimum_vat_amount')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('minimum_total_price_ttc')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '130px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.minTotalTtc} {getSortIcon('minimum_total_price_ttc')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('maximum_total_price_ht')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '130px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.maxTotalHt} {getSortIcon('maximum_total_price_ht')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('maximum_vat_amount')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '110px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.maxVat} {getSortIcon('maximum_vat_amount')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('maximum_total_price_ttc')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '130px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.maxTotalTtc} {getSortIcon('maximum_total_price_ttc')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('current_quantity')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '110px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.currentQty} {getSortIcon('current_quantity')}
                    </div>
                  </th>
                  <th onClick={() => requestSort('alert_threshold')} className="th-sortable" style={{ padding: '16px 20px', fontWeight: '700', width: '110px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                      {text.alertThreshold} {getSortIcon('alert_threshold')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, index) => (
                  <tr 
                    key={item.id || index} 
                    style={{ 
                      borderBottom: `1px solid ${clr.border}`,
                      color: clr.text,
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = clr.rowHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: '700', color: '#0f766e' }}>{item.price_number}</td>
                    <td style={{ padding: '14px 20px', fontWeight: '500', lineHeight: '1.4' }}>{item.service_description}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'center', fontWeight: '600', color: clr.textMuted }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: isDark ? '#0f172a' : '#f1f5f9', fontSize: '11px' }}>
                        {item.unit_of_measure || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700' }}>
                      {parseFloat(item.unit_price_ht || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '600' }}>{item.vat_rate}%</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '600', color: clr.textMuted }}>
                      {parseFloat(item.minimum_quantity || 0).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '600', color: clr.textMuted }}>
                      {parseFloat(item.maximum_quantity || 0).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700' }}>
                      {parseFloat(item.minimum_total_price_ht || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '600', color: clr.textMuted }}>
                      {parseFloat(item.minimum_vat_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', color: '#0f766e' }}>
                      {parseFloat(item.minimum_total_price_ttc || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700' }}>
                      {parseFloat(item.maximum_total_price_ht || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '600', color: clr.textMuted }}>
                      {parseFloat(item.maximum_vat_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '800', color: '#10b981' }}>
                      {parseFloat(item.maximum_total_price_ttc || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', color: parseFloat(item.current_quantity) <= parseFloat(item.alert_threshold) ? '#ef4444' : clr.text }}>
                      {parseFloat(item.current_quantity || 0).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>
                      {parseFloat(item.alert_threshold || 0).toLocaleString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div style={{ 
            padding: '16px 24px', borderTop: `1.5px solid ${clr.border}`, 
            display: 'flex', flexDirection: isRtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: '16px'
          }}>
            <div style={{ fontSize: '13px', color: clr.textMuted, display: 'flex', gap: '6px', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <span>Page</span>
              <span style={{ fontWeight: '700', color: clr.text }}>{currentPage}</span>
              <span>{text.of}</span>
              <span style={{ fontWeight: '700', color: clr.text }}>{totalPages}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
                title="Page précédente"
              >
                {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
              
              {/* Show Page Numbers Dynamic */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;

                  return (
                    <React.Fragment key={p}>
                      {showEllipsis && <span style={{ color: clr.textMuted, margin: '0 4px' }}>...</span>}
                      <button 
                        onClick={() => handlePageChange(p)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1px solid ${currentPage === p ? '#0f766e' : clr.border}`,
                          backgroundColor: currentPage === p ? '#0f766e' : clr.bg,
                          color: currentPage === p ? 'white' : clr.text,
                          fontWeight: currentPage === p ? '700' : '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  );
                })
              }

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
                title="Page suivante"
              >
                {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>


        </div>
      )}
    </div>
  );
};

export default BordereauContent;
