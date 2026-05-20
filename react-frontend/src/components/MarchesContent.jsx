import React, { useState, useEffect } from 'react';
import {
  Plus, Filter, Folder, Calendar, DollarSign, Archive, FolderOpen,
  ChevronLeft, FileText, Printer, Download, Edit2, Trash2, Eye, Search, X, Check, ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api/axios';

const calculateVatBreakdown = (items) => {
  let totalHt = 0;
  let baseHt9 = 0;
  let baseHt10 = 0;
  let baseHt20 = 0;

  (items || []).forEach(item => {
    const qty = parseFloat(item.qty ?? (item.quantity ?? 0));
    const pu = parseFloat(item.unit_price_ht ?? (item.price ?? (item.pu ?? (item.unit_price ?? 0))));
    const lineHt = qty * pu;
    const vatRate = parseFloat(item.vat_rate !== undefined ? item.vat_rate : 20);

    totalHt += lineHt;
    if (vatRate === 9) {
      baseHt9 += lineHt;
    } else if (vatRate === 10) {
      baseHt10 += lineHt;
    } else if (vatRate === 20) {
      baseHt20 += lineHt;
    } else {
      // Default to 20% or group other rates
      baseHt20 += lineHt;
    }
  });

  const tva9 = baseHt9 * 0.09;
  const tva10 = baseHt10 * 0.10;
  const tva20 = baseHt20 * 0.20;
  const totalTva = tva9 + tva10 + tva20;
  const totalTtc = totalHt + totalTva;

  return {
    totalHt,
    baseHt9,
    baseHt10,
    baseHt20,
    tva9,
    tva10,
    tva20,
    totalTva,
    totalTtc
  };
};

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
    rubrique: 'ACHAT PRODUITS ALIMENTAIRES',
    referenceMarcheCadre: '',
    lieuLivraison: 'Internat OFPPT Casablanca',
    conditionsGenerales: 'Nous vous prions de bien vouloir exécuter la présente commande aux conditions ci-après.',
    conditionsParticulieres: '',
    montantHT: '0.00',
    montantTVA: '0.00',
    montantTTC: '0.00',
    statut: 'En cours',
    fournisseur_id: '',
    items: []
  });
  const [editingBc, setEditingBc] = useState(null);
  const [selectedBcForView, setSelectedBcForView] = useState(null);
  const [bordereauItems, setBordereauItems] = useState([]);

  // Dynamic state for Bons de livraison documents
  const [bls, setBls] = useState([]);
  const [showBlModal, setShowBlModal] = useState(false);
  const [newBlData, setNewBlData] = useState({
    numeroBL: '',
    dateLivraison: new Date().toISOString().split('T')[0],
    exercice: new Date().getFullYear(),
    rubrique: 'ACHAT PRODUITS ALIMENTAIRES',
    referenceBCs: [],
    lieuLivraison: 'Internat OFPPT Casablanca',
    conditionsGenerales: 'Livraison sous 5 jours. Paiement à 60 jours.',
    conditionsParticulieres: '',
    montantHT: '0.00',
    montantTVA: '0.00',
    montantTTC: '0.00',
    statut: 'En cours',
    fournisseur_id: '',
    items: []
  });
  const [editingBl, setEditingBl] = useState(null);
  const [selectedBlForView, setSelectedBlForView] = useState(null);
  const [blDropdownOpen, setBlDropdownOpen] = useState(false);

  const normalizeBlItems = (items) => {
    let itemsArray = [];
    if (items) {
      if (Array.isArray(items)) {
        itemsArray = items;
      } else if (typeof items === 'string') {
        try {
          let parsed = JSON.parse(items);
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          if (Array.isArray(parsed)) {
            itemsArray = parsed;
          }
        } catch (e) {
          console.error("Failed to parse BL items:", e);
        }
      }
    }
    return itemsArray.map(item => {
      const price = parseFloat(item.unit_price_ht ?? (item.price ?? (item.pu ?? (item.unit_price ?? 0))));
      return {
        ...item,
        unit_price_ht: price,
        price: price,
        pu: price,
        unit_price: price,
        qty: parseFloat(item.qty ?? (item.quantity ?? 0)),
        quantity: parseFloat(item.qty ?? (item.quantity ?? 0))
      };
    });
  };

  // Mappers back-and-forth for unified backend <-> frontend integration
  const mapBlFromApi = (bl) => ({
    id: bl.id,
    numeroBL: bl.numero_bl,
    dateLivraison: bl.date_bl,
    rubrique: bl.items?.[0]?.rubrique || 'ACHAT PRODUITS ALIMENTAIRES',
    exercice: new Date(bl.date_bl).getFullYear(),
    referenceBCs: bl.reference_bc ? bl.reference_bc.split(', ') : [],
    lieuLivraison: bl.client || 'Internat OFPPT Casablanca',
    fournisseur_id: bl.fournisseur_id?.toString() || '',
    items: normalizeBlItems(bl.items),
    montantHT: bl.total_ht,
    montantTVA: bl.total_tva,
    montantTTC: bl.total_ttc,
    statut: bl.statut
  });


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
    fetchBordereauItems();
    fetchBls();
  }, []);

  const fetchBls = async () => {
    try {
      const response = await api.get('/bons-livraison');
      const mapped = response.data.map(mapBlFromApi);
      setBls(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des bons de livraison', error);
    }
  };

  const fetchBordereauItems = async () => {
    try {
      const response = await api.get('/bordereau');
      setBordereauItems(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du bordereau', error);
    }
  };

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

  const normalizeBc = (bc) => {
    let itemsArray = [];
    if (bc && bc.items) {
      if (Array.isArray(bc.items)) {
        itemsArray = bc.items;
      } else if (typeof bc.items === 'string') {
        try {
          let parsed = JSON.parse(bc.items);
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          if (Array.isArray(parsed)) {
            itemsArray = parsed;
          }
        } catch (e) {
          console.error("Failed to parse items for BC ID:", bc.id, e);
        }
      }
    }
    const normalizedItems = itemsArray.map(item => {
      const price = parseFloat(item.unit_price_ht ?? (item.price ?? (item.pu ?? (item.unit_price ?? 0))));
      return {
        ...item,
        unit_price_ht: price,
        price: price,
        pu: price,
        unit_price: price,
        qty: parseFloat(item.qty ?? (item.quantity ?? 0)),
        quantity: parseFloat(item.qty ?? (item.quantity ?? 0))
      };
    });
    return {
      ...bc,
      items: normalizedItems
    };
  };


  const fetchBcs = async () => {
    try {
      const response = await api.get('/bon-commandes');
      setBcs(response.data.map(normalizeBc));
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

  const [productSearch, setProductSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBordereauItem, setSelectedBordereauItem] = useState(null);
  const [tempQty, setTempQty] = useState(1);
  const [tempPrice, setTempPrice] = useState('');
  const [tempVat, setTempVat] = useState(20);

  const recalculateBcTotals = (itemsList) => {
    let ht = 0;
    let tva = 0;
    itemsList.forEach(item => {
      const itemHt = (parseFloat(item.qty) || 0) * (parseFloat(item.unit_price_ht) || 0);
      const itemTva = itemHt * ((parseFloat(item.vat_rate) || 0) / 100);
      ht += itemHt;
      tva += itemTva;
    });
    const ttc = ht + tva;
    setNewBcData(prev => ({
      ...prev,
      items: itemsList,
      montantHT: ht.toFixed(2),
      montantTVA: tva.toFixed(2),
      montantTTC: ttc.toFixed(2)
    }));
  };

  const handleAddProductToBc = () => {
    if (!selectedBordereauItem) {
      alert("Veuillez sélectionner un produit du bordereau.");
      return;
    }
    const qty = parseFloat(tempQty) || 0;
    if (qty <= 0) {
      alert("La quantité doit être supérieure à 0.");
      return;
    }
    const price = parseFloat(tempPrice) || 0;

    // Check if product already added
    const existingItems = newBcData.items || [];
    const isAlreadyAdded = existingItems.some(
      item => item.price_number === selectedBordereauItem.price_number
    );
    if (isAlreadyAdded) {
      alert("Ce produit est déjà ajouté au bon de commande.");
      return;
    }

    const newItem = {
      price_number: selectedBordereauItem.price_number,
      service_description: selectedBordereauItem.service_description,
      unit_of_measure: selectedBordereauItem.unit_of_measure,
      qty: qty,
      quantity: qty,
      unit_price_ht: price,
      price: price,
      pu: price,
      unit_price: price,
      vat_rate: parseFloat(tempVat) || 20
    };

    const updatedItems = [...existingItems, newItem];
    recalculateBcTotals(updatedItems);

    // Reset inputs
    setProductSearch('');
    setSelectedBordereauItem(null);
    setTempQty(1);
    setTempPrice('');
    setTempVat(20);
  };

  const handleRemoveProductFromBc = (index) => {
    const updatedItems = [...(newBcData.items || [])];
    updatedItems.splice(index, 1);
    recalculateBcTotals(updatedItems);
  };

  const handleDirectProductAdd = (item) => {
    const existingItems = newBcData.items || [];
    const isAlreadyAdded = existingItems.some(
      existingItem => existingItem.price_number === item.price_number
    );
    if (isAlreadyAdded) {
      alert("Ce produit est déjà ajouté au bon de commande.");
      setProductSearch('');
      setShowSuggestions(false);
      return;
    }

    const price = parseFloat(item.unit_price_ht) || 0;
    const newItem = {
      price_number: item.price_number,
      service_description: item.service_description,
      unit_of_measure: item.unit_of_measure,
      qty: 1,
      quantity: 1,
      unit_price_ht: price,
      price: price,
      pu: price,
      unit_price: price,
      vat_rate: parseFloat(item.vat_rate) || 20
    };

    const updatedItems = [...existingItems, newItem];
    recalculateBcTotals(updatedItems);
    setProductSearch('');
    setShowSuggestions(false);
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...(newBcData.items || [])];
    const parsedVal = parseFloat(value) || 0;
    const updatedItem = { ...updatedItems[index], [field]: parsedVal };

    if (field === 'qty' || field === 'quantity') {
      updatedItem.qty = parsedVal;
      updatedItem.quantity = parsedVal;
    } else if (field === 'unit_price_ht' || field === 'price' || field === 'pu' || field === 'unit_price') {
      updatedItem.unit_price_ht = parsedVal;
      updatedItem.price = parsedVal;
      updatedItem.pu = parsedVal;
      updatedItem.unit_price = parsedVal;
    }

    updatedItems[index] = updatedItem;
    recalculateBcTotals(updatedItems);
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
        setBcs(bcs.map(bc => bc.id === editingBc.id ? normalizeBc(response.data) : bc));
        setEditingBc(null);
      } else {
        // Add mode in database
        const response = await api.post('/bon-commandes', payload);
        setBcs([...bcs, normalizeBc(response.data)]);
      }

      setNewBcData({
        numeroBC: '',
        dateEmission: new Date().toISOString().split('T')[0],
        budget: 'Budget de Fonctionnement',
        exercice: new Date().getFullYear(),
        rubrique: 'ACHAT PRODUITS ALIMENTAIRES',
        referenceMarcheCadre: '',
        lieuLivraison: 'Internat OFPPT Casablanca',
        conditionsGenerales: 'Nous vous prions de bien vouloir exécuter la présente commande aux conditions ci-après.',
        conditionsParticulieres: '',
        montantHT: '0.00',
        montantTVA: '0.00',
        montantTTC: '0.00',
        statut: 'En cours',
        fournisseur_id: '',
        items: []
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

  const handleExportBcToExcel = async (bc) => {
    if (!bc || !bc.id) {
      alert("Impossible d'exporter un bon de commande sans identifiant.");
      return;
    }
    try {
      const response = await api.get(`/bon-commandes/${bc.id}/export`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Clean filename
      const cleanNum = bc.numeroBC ? bc.numeroBC.replace(/[\/\s]/g, '_') : bc.id;
      link.setAttribute('download', `Bon_de_Commande_${cleanNum}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'exportation Excel :", error);
      if (error.response && error.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errData = JSON.parse(reader.result);
            alert("Erreur lors de l'exportation : " + (errData.message || "Erreur serveur."));
          } catch (e) {
            alert("Une erreur est survenue lors de l'exportation Excel depuis le serveur.");
          }
        };
        reader.readAsText(error.response.data);
      } else {
        alert("Une erreur est survenue lors de l'exportation Excel depuis le serveur. " + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleExportAllBcsToExcel = () => {
    const providerBcs = bcs.filter(bc => bc.fournisseur_id?.toString() === selectedMarche?.id_fournisseur?.toString());
    const filename = `Bons_de_commande_${selectedMarche.titulaire}.xls`;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; font-family: Arial, sans-serif; font-size: 13px; }
          th { background-color: #0f766e; color: white; font-weight: bold; }
          .title { font-size: 18px; font-weight: bold; color: #0f766e; text-align: center; padding-bottom: 20px; }
          .right { text-align: right; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="title">Bons de commande - Marché : ${selectedMarche.titulaire}</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>N° Bon de commande</th>
              <th>Date d'émission</th>
              <th>Lieu de livraison</th>
              <th class="right">Montant HT (MAD)</th>
              <th class="right">Montant TVA (MAD)</th>
              <th class="right">Montant TTC (MAD)</th>
              <th class="center">Statut</th>
            </tr>
          </thead>
          <tbody>
    `;

    providerBcs.forEach((bc, idx) => {
      html += `
        <tr>
          <td class="center">${idx + 1}</td>
          <td class="bold">${bc.numeroBC}</td>
          <td class="center">${bc.dateEmission}</td>
          <td>${bc.lieuLivraison || '—'}</td>
          <td class="right">${parseFloat(bc.montantHT || 0).toFixed(2)}</td>
          <td class="right">${parseFloat(bc.montantTVA || 0).toFixed(2)}</td>
          <td class="right bold">${parseFloat(bc.montantTTC || 0).toFixed(2)}</td>
          <td class="center">${bc.statut || 'En cours'}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportBlToExcel = async (bl) => {
    if (!bl || !bl.id) {
      alert("Impossible d'exporter un bon de livraison sans identifiant.");
      return;
    }
    try {
      const response = await api.get(`/bons-livraison/${bl.id}/export`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Clean filename
      const cleanNum = bl.numeroBL ? bl.numeroBL.replace(/[\/\s]/g, '_') : bl.id;
      link.setAttribute('download', `Bon_de_Livraison_${cleanNum}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors de l'exportation Excel :", error);
      if (error.response && error.response.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errData = JSON.parse(reader.result);
            alert("Erreur lors de l'exportation : " + (errData.message || "Erreur serveur."));
          } catch (e) {
            alert("Une erreur est survenue lors de l'exportation Excel depuis le serveur.");
          }
        };
        reader.readAsText(error.response.data);
      } else {
        alert("Une erreur est survenue lors de l'exportation Excel depuis le serveur. " + (error.response?.data?.message || error.message));
      }
    }
  };

  // --- BL Consolidator ---
  useEffect(() => {
    if (!showBlModal) return;
    const selectedBCs = bcs.filter(bc => newBlData.referenceBCs.includes(bc.numeroBC));
    console.log("Moteur de consolidation déclenché. BCs sélectionnés :", selectedBCs);

    // Merge all items from selected BCs, summing quantities for matching price numbers
    const mergedMap = {};
    selectedBCs.forEach(bc => {
      let bcItems = [];
      if (bc && bc.items) {
        if (Array.isArray(bc.items)) {
          bcItems = bc.items;
        } else if (typeof bc.items === 'string') {
          try {
            let parsed = JSON.parse(bc.items);
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            if (Array.isArray(parsed)) {
              bcItems = parsed;
            }
          } catch (e) {
            console.error("Erreur de décodage JSON pour les articles du BC:", bc.numeroBC, e);
          }
        }
      }

      console.log(`Le BC ${bc.numeroBC} contient ${bcItems.length} article(s):`, bcItems);

      bcItems.forEach(item => {
        const key = item.price_number || item.service_description || item.designation || '';
        if (!key) return;

        const qty = parseFloat(item.qty ?? (item.quantity ?? 0));
        const pu = parseFloat(item.unit_price_ht ?? (item.price ?? (item.pu ?? (item.unit_price ?? 0))));
        const vatRate = parseFloat(item.vat_rate !== undefined ? item.vat_rate : 20);

        if (mergedMap[key]) {
          mergedMap[key].qty += qty;
          mergedMap[key].quantity += qty;
          if (!mergedMap[key]._bcRefs.includes(bc.numeroBC)) {
            mergedMap[key]._bcRefs.push(bc.numeroBC);
          }
        } else {
          mergedMap[key] = {
            ...item,
            qty: qty,
            quantity: qty,
            unit_price_ht: pu,
            price: pu,
            pu: pu,
            unit_price: pu,
            vat_rate: vatRate,
            _bcRefs: [bc.numeroBC],
          };
        }
      });
    });

    const merged = Object.values(mergedMap).map(item => {
      const price = parseFloat(item.unit_price_ht ?? (item.price ?? (item.pu ?? (item.unit_price ?? 0))));
      const q = parseFloat(item.qty ?? (item.quantity ?? 0));
      return {
        ...item,
        unit_price_ht: price,
        price: price,
        pu: price,
        unit_price: price,
        qty: q,
        quantity: q,
        _bcRef: item._bcRefs.join(', ')
      };
    });
    console.log("Articles consolidés après fusion :", merged);

    const breakdown = calculateVatBreakdown(merged);

    setNewBlData(prev => ({
      ...prev,
      items: merged,
      montantHT: breakdown.totalHt.toFixed(2),
      montantTVA: breakdown.totalTva.toFixed(2),
      montantTTC: breakdown.totalTtc.toFixed(2)
    }));
  }, [newBlData.referenceBCs, showBlModal, bcs]);


  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (blDropdownOpen && !e.target.closest('.bl-dropdown-container')) {
        setBlDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [blDropdownOpen]);

  const handleSaveBl = async (e) => {
    e.preventDefault();
    if (!newBlData.numeroBL || !newBlData.dateLivraison) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      const payload = {
        numero_bl: newBlData.numeroBL,
        date_bl: newBlData.dateLivraison,
        fournisseur: fournisseurs.find(f => f.id.toString() === selectedMarche?.id_fournisseur?.toString())?.raisonSociale || '',
        fournisseur_id: selectedMarche?.id_fournisseur || null,
        reference_bc: Array.isArray(newBlData.referenceBCs) ? newBlData.referenceBCs.join(', ') : '',
        client: newBlData.lieuLivraison,
        total_ht: parseFloat(newBlData.montantHT),
        total_tva: parseFloat(newBlData.montantTVA),
        total_ttc: parseFloat(newBlData.montantTTC),
        items: newBlData.items,
        statut: newBlData.statut
      };

      if (editingBl) {
        const response = await api.put(`/bons-livraison/${editingBl.id}`, payload);
        const mapped = mapBlFromApi(response.data);
        setBls(bls.map(bl => bl.id === editingBl.id ? mapped : bl));
        setEditingBl(null);
      } else {
        const response = await api.post('/bons-livraison', payload);
        const mapped = mapBlFromApi(response.data);
        setBls([...bls, mapped]);
      }
      setShowBlModal(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du bon de livraison", error.response || error);
      alert("Erreur: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteBl = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bon de livraison ?")) {
      try {
        await api.delete(`/bons-livraison/${id}`);
        setBls(bls.filter(bl => bl.id !== id));
      } catch (error) {
        console.error("Erreur lors de la suppression du bon de livraison", error);
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  setEditingBc(null);
                  let nextNum = 1;
                  if (bcs.length > 0) {
                    let maxNum = 0;
                    bcs.forEach(bc => {
                      if (bc && bc.numeroBC) {
                        const match = bc.numeroBC.match(/PA\s+(\d+)\//i);
                        if (match && match[1]) {
                          const num = parseInt(match[1]);
                          if (num > maxNum) maxNum = num;
                        } else {
                          const fallbackMatch = bc.numeroBC.match(/-00(\d+)$/);
                          if (fallbackMatch && fallbackMatch[1]) {
                            const num = parseInt(fallbackMatch[1]);
                            if (num > maxNum) maxNum = num;
                          }
                        }
                      }
                    });
                    if (maxNum > 0) {
                      nextNum = maxNum + 1;
                    } else {
                      nextNum = bcs.length + 1;
                    }
                  }

                  setNewBcData({
                    numeroBC: `B.C PA ${nextNum}/${new Date().getFullYear()}`,
                    dateEmission: new Date().toISOString().split('T')[0],
                    budget: 'BF',
                    exercice: new Date().getFullYear(),
                    rubrique: 'ACHAT PRODUITS ALIMENTAIRES',
                    referenceMarcheCadre: selectedMarche ? `N° 07 E/${new Date().getFullYear()}` : '',
                    lieuLivraison: 'Ouarzazate',
                    conditionsGenerales: 'Nous vous prions de bien vouloir exécuter la présente commande aux conditions ci-après.',
                    conditionsParticulieres: '',
                    montantHT: '0.00',
                    montantTVA: '0.00',
                    montantTTC: '0.00',
                    statut: 'En cours',
                    fournisseur_id: selectedMarche ? selectedMarche.id_fournisseur.toString() : '',
                    items: []
                  });
                  setShowBcModal(true);
                }}
                className="btn-primary"
                style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={15} /> Nouveau BC
              </button>
            </div>
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
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '340px', textAlign: 'center' }}>ACTIONS</th>
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
                        <td style={{ padding: '14px 8px', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedBcForView(bc)}
                            title="Voir"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingBc(bc);
                              setNewBcData({
                                numeroBC: bc.numeroBC,
                                dateEmission: bc.dateEmission,
                                budget: bc.budget || 'Budget de Fonctionnement',
                                exercice: bc.exercice || new Date().getFullYear(),
                                rubrique: bc.rubrique || 'ACHAT PRODUITS ALIMENTAIRES',
                                referenceMarcheCadre: bc.referenceMarcheCadre || '',
                                lieuLivraison: bc.lieuLivraison || 'Internat OFPPT Casablanca',
                                conditionsGenerales: bc.conditionsGenerales || 'Nous vous prions de bien vouloir exécuter la présente commande aux conditions ci-après.',
                                conditionsParticulieres: bc.conditionsParticulieres || '',
                                montantHT: bc.montantHT || '0.00',
                                montantTVA: bc.montantTVA || '0.00',
                                montantTTC: bc.montantTTC || '0.00',
                                statut: bc.statut || 'En cours',
                                fournisseur_id: bc.fournisseur_id ? bc.fournisseur_id.toString() : '',
                                items: Array.isArray(bc.items) ? bc.items : []
                              });
                              setShowBcModal(true);
                            }}
                            title="Modifier"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(59,130,246,0.2)',
                              backgroundColor: '#eff6ff', color: '#3b82f6', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteBc(bc.id)}
                            title="Supprimer"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)',
                              backgroundColor: '#fef2f2', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => handleExportBcToExcel(bc)}
                            title="Exporter Excel"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)',
                              backgroundColor: '#f0fdf4', color: '#10b981', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                          >
                            <Download size={14} />
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

    if (activeDocTab === 'bl') {
      const filteredBls = bls.filter(bl => bl.fournisseur_id?.toString() === selectedMarche.id_fournisseur?.toString());
      return (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#0f766e" /> Bons de livraison
            </h3>
            <button
              onClick={() => {
                setEditingBl(null);
                setNewBlData({
                  numeroBL: `BL-${new Date().getFullYear()}-00${bls.length + 1}`,
                  dateLivraison: new Date().toISOString().split('T')[0],
                  exercice: new Date().getFullYear(),
                  rubrique: 'Alimentation générale',
                  referenceBCs: [],
                  lieuLivraison: 'Internat OFPPT Casablanca',
                  conditionsGenerales: 'Livraison sous 5 jours. Paiement à 60 jours.',
                  conditionsParticulieres: '',
                  montantHT: '0.00',
                  montantTVA: '0.00',
                  montantTTC: '0.00',
                  statut: 'En cours',
                  fournisseur_id: selectedMarche ? selectedMarche.id_fournisseur.toString() : '',
                  items: []
                });
                setShowBlModal(true);
              }}
              className="btn-primary"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={15} /> Nouveau BL
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
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '140px' }}>N° DE BL</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '120px' }}>DATE DE LIVRAISON</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '130px', textAlign: 'right' }}>MONTANT TTC</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '110px', textAlign: 'center' }}>STATUT</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '130px', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBls.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Aucun bon de livraison trouvé. Cliquez sur "Nouveau BL" pour en ajouter un.
                      </td>
                    </tr>
                  ) : (
                    filteredBls.map((bl, idx) => (
                      <tr key={bl.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 8px', fontSize: '12px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                          <div>{bl.rubrique || 'N/A'}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>BCs: {bl.referenceBCs?.join(', ') || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '12px', fontWeight: '700', color: '#0f766e' }}>
                          <span style={{ backgroundColor: '#ecfdf5', color: '#0f766e', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                            {bl.numeroBL}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '12px', color: '#475569' }}>
                          {new Date(bl.dateLivraison).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>
                          {parseFloat(bl.montantTTC || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          <span style={{
                            backgroundColor: bl.statut === 'Validé' ? '#ecfdf5' : '#fef3c7',
                            color: bl.statut === 'Validé' ? '#0f766e' : '#d97706',
                            padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700'
                          }}>
                            {bl.statut || 'En cours'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedBlForView(bl)}
                            title="Voir"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingBl(bl);
                              setNewBlData({
                                numeroBL: bl.numeroBL,
                                dateLivraison: bl.dateLivraison,
                                exercice: bl.exercice || new Date().getFullYear(),
                                rubrique: bl.rubrique || 'ACHAT PRODUITS ALIMENTAIRES',
                                referenceBCs: bl.referenceBCs || [],
                                lieuLivraison: bl.lieuLivraison || 'Internat OFPPT Casablanca',
                                conditionsGenerales: bl.conditionsGenerales || 'Livraison sous 5 jours. Paiement à 60 jours.',
                                conditionsParticulieres: bl.conditionsParticulieres || '',
                                montantHT: bl.montantHT || '0.00',
                                montantTVA: bl.montantTVA || '0.00',
                                montantTTC: bl.montantTTC || '0.00',
                                statut: bl.statut || 'En cours',
                                fournisseur_id: bl.fournisseur_id || '',
                                items: bl.items || []
                              });
                              setShowBlModal(true);
                            }}
                            title="Modifier"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteBl(bl.id)}
                            title="Supprimer"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                          <button
                            onClick={() => handleExportBlToExcel(bl)}
                            title="Télécharger Excel"
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)',
                              backgroundColor: '#f0fdf4', color: '#10b981', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
                          >
                            <Download size={14} />
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
    switch (status) {
      case 'Actif': return { text: '#10b981', bg: 'rgba(16,185,129,0.1)' };
      case 'En cours': return { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
      case 'Retard': return { text: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
      case 'Préparation': return { text: '#3b82f6', bg: 'rgba(59,130,246,0.1)' };
      default: return { text: '#64748b', bg: 'rgba(100,116,139,0.1)' };
    }
  };

  const filteredSuggestions = productSearch.trim() === '' ? [] : bordereauItems.filter(item => {
    const q = productSearch.toLowerCase();
    return (item.price_number && item.price_number.toString().toLowerCase().includes(q)) ||
      (item.service_description && item.service_description.toLowerCase().includes(q));
  });

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
      {showBcModal && (
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
                {editingBc ? 'Modifier le Bon de commande' : 'Ajouter un Bon de commande'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowBcModal(false);
                  setEditingBc(null);
                }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBc} style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1, paddingRight: '12px' }}>
              {/* General Information Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Numéro du BC *</label>
                  <input
                    type="text"
                    value={newBcData.numeroBC}
                    onChange={(e) => setNewBcData({ ...newBcData, numeroBC: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="Ex: BC-2024-089-001"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Date d'émission *</label>
                  <input
                    type="date"
                    value={newBcData.dateEmission}
                    onChange={(e) => setNewBcData({ ...newBcData, dateEmission: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Rubrique / Nom *</label>
                  <input
                    type="text"
                    value={newBcData.rubrique}
                    onChange={(e) => setNewBcData({ ...newBcData, rubrique: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="Alimentation générale"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Exercice *</label>
                  <input
                    type="number"
                    value={newBcData.exercice}
                    onChange={(e) => setNewBcData({ ...newBcData, exercice: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Budget *</label>
                  <select
                    value={newBcData.budget}
                    onChange={(e) => setNewBcData({ ...newBcData, budget: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'white' }}
                  >
                    <option value="Budget de Fonctionnement">Fonctionnement</option>
                    <option value="Budget d'Investissement">Investissement</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Réf. Marché Cadre</label>
                  <input
                    type="text"
                    value={newBcData.referenceMarcheCadre}
                    onChange={(e) => setNewBcData({ ...newBcData, referenceMarcheCadre: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="MC-2023-01"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Lieu de Livraison</label>
                  <input
                    type="text"
                    value={newBcData.lieuLivraison}
                    onChange={(e) => setNewBcData({ ...newBcData, lieuLivraison: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Fournisseur *</label>
                  <select
                    value={newBcData.fournisseur_id}
                    onChange={(e) => setNewBcData({ ...newBcData, fournisseur_id: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'white' }}
                  >
                    <option value="">-- Choisir un fournisseur --</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>{f.raisonSociale}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Statut *</label>
                  <select
                    value={newBcData.statut}
                    onChange={(e) => setNewBcData({ ...newBcData, statut: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', backgroundColor: 'white' }}
                  >
                    <option value="En cours">En cours</option>
                    <option value="Validé">Validé</option>
                    <option value="Livré">Livré</option>
                  </select>
                </div>
              </div>

              {/* Added Products Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                  Articles du Bon de commande ({newBcData.items?.length || 0})
                </label>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', paddingBottom: '120px' }}>
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
                      {(!newBcData.items || newBcData.items.length === 0) ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                            Aucun produit ajout&eacute; pour le moment.
                          </td>
                        </tr>
                      ) : (
                        newBcData.items.map((item, index) => {
                          const totalLineHt = (parseFloat(item.qty) || 0) * (parseFloat(item.unit_price_ht) || 0);
                          return (
                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f766e' }}>{item.price_number}</td>
                              <td style={{ padding: '10px 12px', color: '#334155' }}>
                                <div style={{ fontWeight: '600' }}>{item.service_description}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Unit&eacute;: {item.unit_of_measure}</div>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <input
                                  type="number" min="1"
                                  value={item.qty}
                                  onChange={(e) => handleUpdateItem(index, 'qty', e.target.value)}
                                  style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                                />
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <input
                                  type="number" step="0.01"
                                  value={item.unit_price_ht}
                                  onChange={(e) => handleUpdateItem(index, 'unit_price_ht', e.target.value)}
                                  style={{ width: '80px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }}
                                />
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <select
                                  value={item.vat_rate}
                                  onChange={(e) => handleUpdateItem(index, 'vat_rate', e.target.value)}
                                  style={{ width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' }}
                                >
                                  <option value={0}>0%</option>
                                  <option value={9}>9%</option>
                                  <option value={10}>10%</option>
                                  <option value={20}>20%</option>
                                </select>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: '#334155' }}>{totalLineHt.toFixed(2)}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductFromBc(index)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td colSpan="7" style={{ padding: '12px' }}>
                          <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input
                              type="text"
                              value={productSearch}
                              onChange={(e) => {
                                setProductSearch(e.target.value);
                                setShowSuggestions(true);
                              }}
                              onFocus={() => setShowSuggestions(true)}
                              placeholder="Ajouter un article : Saisissez le N° ou la désignation du produit..."
                              style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                            />
                            {showSuggestions && filteredSuggestions.length > 0 && (
                              <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: '220px', overflowY: 'auto',
                                marginTop: '4px'
                              }}>
                                {filteredSuggestions.map((item) => (
                                  <div
                                    key={item.id}
                                    onClick={() => handleDirectProductAdd(item)}
                                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px', display: 'flex', justifyContent: 'space-between', transition: 'background-color 0.2s' }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  >
                                    <span style={{ fontWeight: '700', color: '#0f766e', minWidth: '80px' }}>N&deg; {item.price_number}</span>
                                    <span style={{ flex: 1, marginLeft: '12px', color: '#334155' }}>{item.service_description}</span>
                                    <span style={{ color: '#64748b', fontSize: '12px', minWidth: '150px', textAlign: 'right' }}>
                                      {item.unit_of_measure} | {parseFloat(item.unit_price_ht ?? (item.price ?? (item.pu ?? (item.unit_price ?? 0)))).toFixed(2)} MAD
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Montant HT</label>
                  <input
                    type="text" readOnly disabled
                    value={`${newBcData.montantHT} MAD`}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#64748b', backgroundColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Montant TVA</label>
                  <input
                    type="text" readOnly disabled
                    value={`${newBcData.montantTVA} MAD`}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#64748b', backgroundColor: '#e2e8f0' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Montant TTC</label>
                  <input
                    type="text" readOnly disabled
                    value={`${newBcData.montantTTC} MAD`}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#0f766e', backgroundColor: '#ecfdf5', fontWeight: '800' }}
                  />
                </div>
              </div>

              {/* Conditions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Conditions Générales</label>
                  <textarea
                    value={newBcData.conditionsGenerales}
                    onChange={(e) => setNewBcData({ ...newBcData, conditionsGenerales: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', minHeight: '60px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Conditions Particulières</label>
                  <textarea
                    value={newBcData.conditionsParticulieres}
                    onChange={(e) => setNewBcData({ ...newBcData, conditionsParticulieres: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', minHeight: '60px' }}
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowBcModal(false);
                    setEditingBc(null);
                  }}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#0f766e', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  {editingBc ? 'Enregistrer les modifications' : 'Ajouter le Bon de commande'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit BL */}
      {showBlModal && (
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
                {editingBl ? 'Modifier le Bon de livraison (BL)' : 'Créer un Bon de livraison (BL)'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowBlModal(false);
                  setEditingBl(null);
                }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBl} style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', flex: 1, paddingRight: '12px' }}>
              
              {/* Form Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Numéro du BL *</label>
                  <input
                    type="text"
                    value={newBlData.numeroBL}
                    onChange={(e) => setNewBlData({ ...newBlData, numeroBL: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                    placeholder="Ex: BL-2024-001"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Date de Livraison *</label>
                  <input
                    type="date"
                    value={newBlData.dateLivraison}
                    onChange={(e) => setNewBlData({ ...newBlData, dateLivraison: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Fournisseur</label>
                  <input
                    type="text"
                    value={fournisseurs.find(f => f.id.toString() === selectedMarche?.id_fournisseur?.toString())?.raisonSociale || 'Chargement...'}
                    disabled
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', outline: 'none', fontSize: '13px', color: '#64748b' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Client / Établissement</label>
                  <input
                    type="text"
                    value={newBlData.lieuLivraison}
                    onChange={(e) => setNewBlData({ ...newBlData, lieuLivraison: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
                  />
                </div>
              </div>

              {/* BC Selection - Multi-select drop-down with live search */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }} className="bl-dropdown-container">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569' }}>Réf. Bon de Commande (BC) *</label>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setBlDropdownOpen(!blDropdownOpen)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '6px',
                      border: '1px solid #cbd5e1', background: 'white', color: newBlData.referenceBCs.length ? '#334155' : '#94a3b8',
                      fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', outline: 'none', textAlign: 'left'
                    }}
                  >
                    <span>
                      {newBlData.referenceBCs.length === 0
                        ? 'Sélectionner un ou plusieurs Bons de Commande...'
                        : `${newBlData.referenceBCs.length} BC sélectionné(s) : ${newBlData.referenceBCs.join(', ')}`}
                    </span>
                    <ChevronDown size={16} />
                  </button>

                  {blDropdownOpen && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', marginTop: '4px',
                      maxHeight: '260px', overflowY: 'auto'
                    }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                        <input
                          type="text"
                          placeholder="Rechercher par numéro de BC..."
                          onChange={(e) => {
                            const filterVal = e.target.value.toLowerCase();
                            const items = document.querySelectorAll('.bc-item-option');
                            items.forEach(el => {
                              const text = el.getAttribute('data-bc-num').toLowerCase();
                              if (text.includes(filterVal)) {
                                el.style.display = 'flex';
                              } else {
                                el.style.display = 'none';
                              }
                            });
                          }}
                          style={{ width: '100%', padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '12px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {bcs.filter(bc => bc.fournisseur_id?.toString() === selectedMarche?.id_fournisseur?.toString()).length === 0 ? (
                          <div style={{ padding: '12px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
                            Aucun Bon de Commande disponible pour ce fournisseur.
                          </div>
                        ) : (
                          bcs.filter(bc => bc.fournisseur_id?.toString() === selectedMarche?.id_fournisseur?.toString()).map(bc => {
                            const isSelected = newBlData.referenceBCs.includes(bc.numeroBC);
                            return (
                              <div
                                key={bc.id}
                                className="bc-item-option"
                                data-bc-num={bc.numeroBC}
                                onClick={() => {
                                  const alreadySelected = newBlData.referenceBCs.includes(bc.numeroBC);
                                  const updatedBCs = alreadySelected
                                    ? newBlData.referenceBCs.filter(x => x !== bc.numeroBC)
                                    : [...newBlData.referenceBCs, bc.numeroBC];
                                  setNewBlData({ ...newBlData, referenceBCs: updatedBCs });
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
                                  backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                                  transition: 'background 0.15s'
                                }}
                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                              >
                                <div>
                                  <span style={{ fontWeight: '600', color: isSelected ? '#0f766e' : '#334155' }}>{bc.numeroBC}</span>
                                  <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>
                                    {new Date(bc.dateEmission).toLocaleDateString('fr-FR')}
                                  </span>
                                  <span style={{
                                    fontSize: '10px',
                                    backgroundColor: (bc.items?.length || 0) > 0 ? '#e0f2fe' : '#fee2e2',
                                    color: (bc.items?.length || 0) > 0 ? '#0369a1' : '#b91c1c',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    marginLeft: '8px',
                                    fontWeight: '600'
                                  }}>
                                    {(bc.items?.length || 0)} article(s)
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                    {parseFloat(bc.montantTTC || 0).toLocaleString('fr-FR')} MAD
                                  </span>
                                  <div style={{
                                    width: '16px', height: '16px', borderRadius: '4px',
                                    border: `1.5px solid ${isSelected ? '#10b981' : '#cbd5e1'}`,
                                    backgroundColor: isSelected ? '#10b981' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                  }}>
                                    {isSelected && <Check size={10} color="white" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Consolidated Products Table */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Articles consolidés des BC sélectionnés
                  <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>(Fusion automatique des doublons)</span>
                </h3>

                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Réf. BC</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>N° Prix</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569' }}>Désignation</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', textAlign: 'center' }}>Unité</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Quantité</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>PU (MAD)</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>TVA (%)</th>
                        <th style={{ padding: '10px 12px', fontWeight: '700', color: '#475569', textAlign: 'right' }}>Total HT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newBlData.items.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                            Aucun produit chargé. Veuillez sélectionner un ou plusieurs bons de commande.
                          </td>
                        </tr>
                      ) : (
                        newBlData.items.map((item, idx) => {
                          const qty = parseFloat(item.qty || 0);
                          const pu = parseFloat(item.unit_price_ht ?? (item.price ?? (item.pu ?? (item.unit_price ?? 0))));
                          const vat = parseFloat(item.vat_rate !== undefined ? item.vat_rate : 20);
                          const lineHt = qty * pu;
                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>
                                  {item._bcRef || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: '600', color: '#0f766e' }}>{item.price_number || '—'}</td>
                              <td style={{ padding: '8px 12px', color: '#334155', fontWeight: '500' }}>{item.service_description || item.designation || '—'}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', color: '#64748b' }}>{item.unit_of_measure || '—'}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: '#0f172a' }}>{qty}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right' }}>{pu.toFixed(2)}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>{vat}%</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600' }}>{lineHt.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Section */}
              {(() => {
                const breakdown = calculateVatBreakdown(newBlData.items);
                return (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                        <span>Total HT :</span>
                        <span style={{ fontWeight: '600', color: '#334155' }}>
                          {breakdown.totalHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingLeft: '8px', borderLeft: '2px solid #cbd5e1' }}>
                        <span>TVA 9% (Base HT: {breakdown.baseHt9.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD) :</span>
                        <span style={{ fontWeight: '500', color: '#475569' }}>
                          {breakdown.tva9.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingLeft: '8px', borderLeft: '2px solid #cbd5e1' }}>
                        <span>TVA 10% (Base HT: {breakdown.baseHt10.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD) :</span>
                        <span style={{ fontWeight: '500', color: '#475569' }}>
                          {breakdown.tva10.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingLeft: '8px', borderLeft: '2px solid #cbd5e1' }}>
                        <span>TVA 20% (Base HT: {breakdown.baseHt20.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD) :</span>
                        <span style={{ fontWeight: '500', color: '#475569' }}>
                          {breakdown.tva20.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </span>
                      </div>

                      <div style={{
                        display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800',
                        color: '#0f766e', backgroundColor: '#ecfdf5', padding: '10px 14px', borderRadius: '8px',
                        border: '1px solid rgba(16,185,129,0.2)', marginTop: '4px'
                      }}>
                        <span>Total TTC :</span>
                        <span>
                          {breakdown.totalTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setNewBlData({
                      ...newBlData,
                      numeroBL: `BL-${new Date().getFullYear()}-00${bls.length + 1}`,
                      dateLivraison: new Date().toISOString().split('T')[0],
                      referenceBCs: [],
                      montantHT: '0.00',
                      montantTVA: '0.00',
                      montantTTC: '0.00',
                      items: []
                    });
                    setBlDropdownOpen(false);
                  }}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: 'white', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlModal(false);
                    setEditingBl(null);
                  }}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={newBlData.referenceBCs.length === 0}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none',
                    backgroundColor: newBlData.referenceBCs.length === 0 ? '#94a3b8' : '#0f766e',
                    color: 'white', fontWeight: '600', cursor: newBlData.referenceBCs.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px'
                  }}
                >
                  {editingBl ? 'Enregistrer les modifications' : 'Créer le Bon de livraison'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal View BL details */}
      {selectedBlForView && (
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
                  {selectedBlForView.numeroBL}
                </span>
                <h2 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                  {selectedBlForView.rubrique || 'Bon de Livraison'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedBlForView(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Date de Livraison</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  {new Date(selectedBlForView.dateLivraison).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Fournisseur</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  {fournisseurs.find(f => f.id.toString() === selectedBlForView.fournisseur_id?.toString())?.raisonSociale || 'DISMA Maroc'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Exercice</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{selectedBlForView.exercice || '2024'}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Bons de Commande</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f766e' }}>{selectedBlForView.referenceBCs?.join(', ') || 'Non spécifié'}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Lieu de Livraison</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{selectedBlForView.lieuLivraison || 'Casablanca'}</div>
              </div>
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Liste des articles livrés</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '40px' }}>#</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>DÉSIGNATION</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '80px' }}>UNITÉ</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '70px', textAlign: 'center' }}>QTÉ</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '100px', textAlign: 'right' }}>PU (MAD)</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#475569', width: '110px', textAlign: 'right' }}>TOTAL HT</th>
                </tr>
              </thead>
              <tbody>
                {(selectedBlForView.items || []).map((item, idx) => {
                  const unitPrice = parseFloat(item.unit_price_ht ?? (item.price ?? (item.pu ?? (item.unit_price ?? 0))));
                  const qty = parseFloat(item.qty || 0);
                  const totalLineHt = qty * unitPrice;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{item.service_description || item.designation}</td>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#475569' }}>{item.unit_of_measure || '—'}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', color: '#0f172a', textAlign: 'center', fontWeight: '600' }}>{qty}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '700', color: '#334155', textAlign: 'right' }}>{totalLineHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Calculations */}
            {(() => {
              const viewBreakdown = calculateVatBreakdown(selectedBlForView.items);
              return (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                  <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                      <span>Montant HT :</span>
                      <span style={{ fontWeight: '600', color: '#334155' }}>
                        {viewBreakdown.totalHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingLeft: '8px', borderLeft: '2px solid #cbd5e1' }}>
                      <span>TVA 9% (Base HT: {viewBreakdown.baseHt9.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD) :</span>
                      <span style={{ fontWeight: '500', color: '#475569' }}>
                        {viewBreakdown.tva9.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingLeft: '8px', borderLeft: '2px solid #cbd5e1' }}>
                      <span>TVA 10% (Base HT: {viewBreakdown.baseHt10.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD) :</span>
                      <span style={{ fontWeight: '500', color: '#475569' }}>
                        {viewBreakdown.tva10.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', paddingLeft: '8px', borderLeft: '2px solid #cbd5e1' }}>
                      <span>TVA 20% (Base HT: {viewBreakdown.baseHt20.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD) :</span>
                      <span style={{ fontWeight: '500', color: '#475569' }}>
                        {viewBreakdown.tva20.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </span>
                    </div>

                    <div style={{
                      display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800',
                      color: '#0f766e', borderTop: '1px double #cbd5e1', paddingTop: '8px', marginTop: '4px'
                    }}>
                      <span>Montant TTC :</span>
                      <span>
                        {viewBreakdown.totalTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => handleExportBlToExcel(selectedBlForView)}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
              >
                <Download size={16} /> Exporter Excel
              </button>
              <button
                type="button"
                onClick={() => setSelectedBlForView(null)}
                className="btn-primary"
                style={{ padding: '10px 20px', backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer' }}
              >
                Fermer
              </button>
            </div>
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
                {(selectedBcForView.items || []).map((item, idx) => {
                  const unitPrice = parseFloat(item.unit_price_ht ?? (item.price ?? (item.pu ?? (item.unit_price ?? 0))));
                  const qty = parseFloat(item.qty || 0);
                  const totalLineHt = qty * unitPrice;
                  return (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#64748b' }}>{item.price_number || (idx + 1)}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{item.service_description}</td>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#475569' }}>{item.unit_of_measure || '—'}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', color: '#0f172a', textAlign: 'center', fontWeight: '600' }}>{qty}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>{totalLineHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                    </tr>
                  );
                })}
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
                onClick={() => handleExportBcToExcel(selectedBcForView)}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dcfce7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0fdf4'; }}
              >
                <Download size={16} /> Exporter Excel
              </button>
              <button
                type="button"
                onClick={() => setSelectedBcForView(null)}
                className="btn-primary"
                style={{ padding: '10px 20px', backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer' }}
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
