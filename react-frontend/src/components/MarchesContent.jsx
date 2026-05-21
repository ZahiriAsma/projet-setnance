import React, { useState, useEffect } from 'react';
import {
  Plus, Filter, Folder, Calendar, DollarSign, Archive, FolderOpen,
  ChevronLeft, FileText, Printer, Download, Edit2, Trash2, Eye, Search, X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../api/axios';

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

  const [bls, setBls] = useState([
    {
      id: 101,
      numeroBL: 'BL-2024-001',
      dateLivraison: '2024-05-10',
      rubrique: 'ACHAT PRODUITS ALIMENTAIRES',
      exercice: 2024,
      referenceBCs: ['BC-2024-089-001'],
      lieuLivraison: 'Casablanca',
      fournisseur_id: '1',
      items: [
        { price_number: '1', service_description: 'Huile de table 5L', unit_of_measure: 'Carton', qty: 10, unit_price_ht: 180, vat_rate: 20 },
        { price_number: '2', service_description: 'Sucre en poudre 50kg', unit_of_measure: 'Sac', qty: 5, unit_price_ht: 350, vat_rate: 20 }
      ],
      montantHT: '3550.00',
      montantTVA: '710.00',
      montantTTC: '4260.00',
      statut: 'Validé'
    },
    {
      id: 102,
      numeroBL: 'BL-2024-002',
      dateLivraison: '2024-05-12',
      rubrique: 'ACHAT PRODUITS ALIMENTAIRES',
      exercice: 2024,
      referenceBCs: ['BC-2024-089-002'],
      lieuLivraison: 'Casablanca',
      fournisseur_id: '1',
      items: [
        { price_number: '3', service_description: 'Riz long grain 25kg', unit_of_measure: 'Sac', qty: 8, unit_price_ht: 280, vat_rate: 20 },
        { price_number: '1', service_description: 'Huile de table 5L', unit_of_measure: 'Carton', qty: 15, unit_price_ht: 180, vat_rate: 20 }
      ],
      montantHT: '4940.00',
      montantTVA: '988.00',
      montantTTC: '5928.00',
      statut: 'Validé'
    }
  ]);
  const [showBlModal, setShowBlModal] = useState(false);
  const [newBlData, setNewBlData] = useState({
    numeroBL: '',
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
    fournisseur_id: '',
    items: []
  });
  const [editingBl, setEditingBl] = useState(null);
  const [selectedBlForView, setSelectedBlForView] = useState(null);
  const [blDropdownOpen, setBlDropdownOpen] = useState(false);

  // --- Factures State ---
  const [factures, setFactures] = useState([]);
  const [showFactureModal, setShowFactureModal] = useState(false);
  const [newFactureData, setNewFactureData] = useState({
    numero_facture: '',
    date_facture: new Date().toISOString().split('T')[0],
    client: 'OFPPT / ISTA Ouarzazate',
    reference_bl: '',
    conditions_generales: 'Paiement à réception de la facture.',
    conditions_particulieres: '',
    montantHT: '0.00',
    montantTVA: '0.00',
    montantTTC: '0.00',
    statut: 'En cours',
    items: []
  });
  const [editingFacture, setEditingFacture] = useState(null);
  const [selectedFactureForView, setSelectedFactureForView] = useState(null);


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
    fetchFactures();
    fetchBordereauItems();
  }, []);

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

  const fetchBcs = async () => {
    try {
      const response = await api.get('/bon-commandes');
      setBcs(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des bons de commande', error);
    }
  };

  const fetchFactures = async () => {
    try {
      const response = await api.get('/factures');
      setFactures(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des factures', error);
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
      unit_price_ht: price,
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

    const newItem = {
      price_number: item.price_number,
      service_description: item.service_description,
      unit_of_measure: item.unit_of_measure,
      qty: 1,
      unit_price_ht: parseFloat(item.unit_price_ht) || 0,
      vat_rate: parseFloat(item.vat_rate) || 20
    };

    const updatedItems = [...existingItems, newItem];
    recalculateBcTotals(updatedItems);
    setProductSearch('');
    setShowSuggestions(false);
  };

  const handleUpdateItem = (index, field, value) => {
    const updatedItems = [...(newBcData.items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: parseFloat(value) || 0 };
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
        setBcs(bcs.map(bc => bc.id === editingBc.id ? response.data : bc));
        setEditingBc(null);
      } else {
        // Add mode in database
        const response = await api.post('/bon-commandes', payload);
        setBcs([...bcs, response.data]);
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

  const handleExportBcToExcel = (bc) => {
    const filename = `Bon_de_Commande_${bc.numeroBC || 'Nouveau'}.xls`;
    const supplier = fournisseurs.find(f => f.id.toString() === bc.fournisseur_id?.toString()) || {};

    const items = Array.isArray(bc.items) ? bc.items : [];

    let tva9 = 0; let tva10 = 0; let tva20 = 0;

    items.forEach(item => {
      const qty = parseFloat(item.qty || item.quantity || 0);
      const price = parseFloat(item.unit_price_ht || item.price || 0);
      const rate = parseFloat(item.vat_rate || item.tva || 20);
      const totalHt = qty * price;
      const tvaAmount = totalHt * (rate / 100);
      if (rate === 9) tva9 += tvaAmount;
      else if (rate === 10) tva10 += tvaAmount;
      else if (rate === 20) tva20 += tvaAmount;
    });

    const mHT = parseFloat(bc.montantHT || 0);
    const mTTC = parseFloat(bc.montantTTC || 0);

    // Build a single table with 8 columns to ensure perfect Excel alignment
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; }
          table { border-collapse: collapse; width: 100%; }
          td, th { padding: 5px; vertical-align: top; font-size: 11px; }
          .border-all { border: 1px solid #000; }
          .bg-grey { background-color: #f0f0f0; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .bold { font-weight: bold; }
          .title-text { font-size: 16px; font-weight: bold; border: 2px solid #000; padding: 10px; display: inline-block; letter-spacing: 2px; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <!-- Set column widths roughly -->
          <colgroup>
            <col width="40">
            <col width="300">
            <col width="60">
            <col width="60">
            <col width="80">
            <col width="60">
            <col width="80">
            <col width="100">
          </colgroup>

          <!-- Row 1: Header -->
          <tr>
            <td colspan="2" class="bold" style="font-size: 10px;">
              OFFICE DE LA FORMATION<br>
              PROFESSIONNELLE<br>
              ET DE LA PROMOTION DU<br>
              TRAVAIL<br>
              <span style="font-weight: normal; text-transform: none;">
              Direction Régionale Drâa Tafilalet<br>
              ISBTP QUARTIER EL MATAR<br>
              ERRACHIDIA<br>
              Tél : 0535572740
              </span>
            </td>
            <td colspan="4" class="text-center">
              <span class="title-text">BON DE COMMANDE</span><br><br>
              <span class="bold">B.C PA &nbsp;&nbsp; ${bc.numeroBC || '—'}</span>
            </td>
            <td colspan="2" class="text-right" style="font-size: 10px;">
              <span class="bold">Références du Fournisseur</span><br>
              Sté ${supplier.raisonSociale || '—'}<br>
              ${supplier.adresse || '—'}<br>
              ERRACHIDIA<br>
              PATENTE N° : ${supplier.patente || '—'} &nbsp;&nbsp; RC : ${supplier.rc || '—'}<br>
              Errachidia<br>
              IF : ${supplier.if || '—'} &nbsp;&nbsp; ICE : ${supplier.ice || '—'}<br>
              RIB : ${supplier.rib || '—'}
            </td>
          </tr>
          
          <!-- Spacer -->
          <tr><td colspan="8"></td></tr>

          <!-- Row: Info 1 -->
          <tr>
            <td class="border-all bg-grey bold">Budget</td>
            <td colspan="3" class="border-all">${bc.budget || 'BF'}</td>
            <td colspan="2" class="border-all bg-grey bold">Réf. Marché Cadre</td>
            <td colspan="2" class="border-all">${bc.referenceMarcheCadre || 'N° 07-E/2024'}</td>
          </tr>
          <!-- Row: Info 2 -->
          <tr>
            <td class="border-all bg-grey bold">Exercice</td>
            <td colspan="3" class="border-all">${bc.exercice || new Date().getFullYear()}</td>
            <td colspan="2" class="border-all bg-grey bold">Lieu de livraison</td>
            <td colspan="2" class="border-all">${bc.lieuLivraison || 'Ouarzazate'}</td>
          </tr>
          <!-- Row: Info 3 -->
          <tr>
            <td class="border-all bg-grey bold">Rubrique</td>
            <td colspan="3" class="border-all">${bc.rubrique || 'ACHAT PRODUITS ALIMENTAIRES'}</td>
            <td colspan="2" class="border-all bg-grey bold">Date de livraison</td>
            <td colspan="2" class="border-all">${bc.dateEmission || ''}</td>
          </tr>

          <!-- Spacer -->
          <tr><td colspan="8"></td></tr>

          <!-- Items Header -->
          <tr>
            <td class="border-all bg-grey bold text-center">N°</td>
            <td class="border-all bg-grey bold text-left">Désignations et références</td>
            <td class="border-all bg-grey bold text-center">Unité</td>
            <td class="border-all bg-grey bold text-center">Qté</td>
            <td class="border-all bg-grey bold text-center">P.U HT</td>
            <td class="border-all bg-grey bold text-center">Taux TVA</td>
            <td class="border-all bg-grey bold text-center">TVA</td>
            <td class="border-all bg-grey bold text-center">Total HT</td>
          </tr>
    `;

    items.forEach((item, idx) => {
      const priceNum = item.price_number || (idx + 1);
      const designation = item.service_description || item.designation || item.label || '—';
      const unit = item.unit_of_measure || item.unit || '—';
      const qty = parseFloat(item.qty || item.quantity || 0);
      const price = parseFloat(item.unit_price_ht || item.price || 0);
      const rate = parseFloat(item.vat_rate || item.tva || 20);
      const totalHt = qty * price;
      const tvaVal = totalHt * (rate / 100);

      html += `
          <tr>
            <td class="border-all text-center">${priceNum}</td>
            <td class="border-all">${designation}</td>
            <td class="border-all text-center">${unit}</td>
            <td class="border-all text-center">${qty}</td>
            <td class="border-all text-right">${price.toFixed(2).replace('.', ',')}</td>
            <td class="border-all text-center">${rate}%</td>
            <td class="border-all text-right">${tvaVal.toFixed(2).replace('.', ',')}</td>
            <td class="border-all text-right">${totalHt.toFixed(2).replace('.', ',')}</td>
          </tr>
      `;
    });

    const minRows = 8;
    if (items.length < minRows) {
      for (let i = items.length; i < minRows; i++) {
        html += `
          <tr>
            <td class="border-all">&nbsp;</td>
            <td class="border-all">&nbsp;</td>
            <td class="border-all">&nbsp;</td>
            <td class="border-all">&nbsp;</td>
            <td class="border-all">&nbsp;</td>
            <td class="border-all">&nbsp;</td>
            <td class="border-all">&nbsp;</td>
            <td class="border-all">&nbsp;</td>
          </tr>
        `;
      }
    }

    html += `
          <!-- Totals Area -->
          <tr>
            <td colspan="6" rowspan="5" style="vertical-align: bottom; font-style: italic; color: #555;">
              Nous vous prions de bien vouloir exécuter la présente commande aux conditions ci-après.
            </td>
            <td class="border-all bg-grey bold">Total H.T</td>
            <td class="border-all text-right bold">${mHT.toFixed(2).replace('.', ',')} MAD</td>
          </tr>
          <tr>
            <td class="border-all bg-grey bold">TVA 9%</td>
            <td class="border-all text-right">${tva9.toFixed(2).replace('.', ',')} MAD</td>
          </tr>
          <tr>
            <td class="border-all bg-grey bold">TVA 10%</td>
            <td class="border-all text-right">${tva10.toFixed(2).replace('.', ',')} MAD</td>
          </tr>
          <tr>
            <td class="border-all bg-grey bold">TVA 20%</td>
            <td class="border-all text-right">${tva20.toFixed(2).replace('.', ',')} MAD</td>
          </tr>
          <tr>
            <td class="border-all bg-grey bold" style="font-size: 13px; color: #000;">Total T.T.C</td>
            <td class="border-all text-right bold" style="font-size: 13px; background-color: #f2f8ff; color: #0055cc;">${mTTC.toFixed(2).replace('.', ',')} MAD</td>
          </tr>
          
          <!-- Spacer -->
          <tr><td colspan="8">&nbsp;</td></tr>

          <!-- Signatures -->
          <tr>
            <td colspan="6"></td>
            <td colspan="2" class="text-center bold">
              Errachidia, le ${bc.dateEmission || '—'}<br><br>
              <span style="text-decoration: underline;">LE SOUS-ORDONNATEUR</span>
            </td>
          </tr>
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

  const handleExportBlToExcel = (bl) => {
    const filename = `${bl.numeroBL}.xls`;
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
        <div class="title">BON DE LIVRAISON : ${bl.numeroBL}</div>
        
        <table style="margin-bottom: 20px;">
          <tr>
            <td class="bold">Date de livraison:</td>
            <td>${bl.dateLivraison}</td>
            <td class="bold">BCs associés:</td>
            <td>${bl.referenceBCs?.join(', ') || '—'}</td>
          </tr>
          <tr>
            <td class="bold">Rubrique:</td>
            <td>${bl.rubrique || '—'}</td>
            <td class="bold">Statut:</td>
            <td>${bl.statut || 'En cours'}</td>
          </tr>
        </table>

        <h3>Liste des articles</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Désignation</th>
              <th>Unité</th>
              <th class="center">Quantité</th>
              <th class="right">Prix Unitaire HT (MAD)</th>
              <th class="right">Montant Total HT (MAD)</th>
            </tr>
          </thead>
          <tbody>
    `;

    const items = Array.isArray(bl.items) ? bl.items : [];
    items.forEach((item, idx) => {
      const designation = item.service_description || item.designation || '—';
      const unit = item.unit_of_measure || item.unit || '—';
      const qty = parseFloat(item.qty || 0);
      const price = parseFloat(item.unit_price_ht || item.price || 0);
      const total = qty * price;
      html += `
        <tr>
          <td class="center">${idx + 1}</td>
          <td>${designation}</td>
          <td class="center">${unit}</td>
          <td class="center">${qty}</td>
          <td class="right">${price.toFixed(2)}</td>
          <td class="right">${total.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>

        <table style="margin-top: 20px; float: right; width: 300px;">
          <tr>
            <td class="bold">Montant HT:</td>
            <td class="right">${parseFloat(bl.montantHT || 0).toFixed(2)} MAD</td>
          </tr>
          <tr>
            <td class="bold">Montant TVA (20%):</td>
            <td class="right">${parseFloat(bl.montantTVA || 0).toFixed(2)} MAD</td>
          </tr>
          <tr>
            <td class="bold">Montant TTC:</td>
            <td class="right bold" style="color: #0f766e;">${parseFloat(bl.montantTTC || 0).toFixed(2)} MAD</td>
          </tr>
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

  // --- BL Consolidator ---
  useEffect(() => {
    if (!showBlModal) return;
    const selectedBCs = bcs.filter(bc => newBlData.referenceBCs.includes(bc.numeroBC));

    // Merge all items from selected BCs, summing quantities for matching price numbers
    const mergedMap = {};
    selectedBCs.forEach(bc => {
      const bcItems = Array.isArray(bc.items) ? bc.items : [];
      bcItems.forEach(item => {
        const key = item.price_number || item.service_description || item.designation || '';
        if (!key) return;

        const qty = parseFloat(item.qty || item.quantity || 0);
        const pu = parseFloat(item.unit_price_ht || item.price || 0);
        const vatRate = parseFloat(item.vat_rate !== undefined ? item.vat_rate : 20);

        if (mergedMap[key]) {
          mergedMap[key].qty += qty;
          if (!mergedMap[key]._bcRefs.includes(bc.numeroBC)) {
            mergedMap[key]._bcRefs.push(bc.numeroBC);
          }
        } else {
          mergedMap[key] = {
            ...item,
            qty: qty,
            unit_price_ht: pu,
            vat_rate: vatRate,
            _bcRefs: [bc.numeroBC],
          };
        }
      });
    });

    const merged = Object.values(mergedMap).map(item => ({
      ...item,
      _bcRef: item._bcRefs.join(', ')
    }));

    let ht = 0, tva = 0;
    merged.forEach(item => {
      const lineHt = item.qty * item.unit_price_ht;
      const lineTva = lineHt * (item.vat_rate / 100);
      ht += lineHt;
      tva += lineTva;
    });

    setNewBlData(prev => ({
      ...prev,
      items: merged,
      montantHT: ht.toFixed(2),
      montantTVA: tva.toFixed(2),
      montantTTC: (ht + tva).toFixed(2)
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

  const handleSaveBl = (e) => {
    e.preventDefault();
    if (!newBlData.numeroBL || !newBlData.dateLivraison) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (editingBl) {
      setBls(bls.map(bl => bl.id === editingBl.id ? { ...bl, ...newBlData } : bl));
      setEditingBl(null);
    } else {
      const created = {
        ...newBlData,
        id: Date.now(),
        fournisseur_id: selectedMarche?.id_fournisseur?.toString() || ''
      };
      setBls([...bls, created]);
    }
    setShowBlModal(false);
  };

  const handleDeleteBl = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce bon de livraison ?")) {
      setBls(bls.filter(bl => bl.id !== id));
    }
  };

  // --- Factures Helper Functions ---
  const recalculateFactureTotals = (itemsList) => {
    let ht = 0;
    let tva = 0;
    itemsList.forEach(item => {
      const itemHt = (parseFloat(item.qte) || 0) * (parseFloat(item.pu_ht) || 0);
      const itemTva = itemHt * ((parseFloat(item.taux_tva) || 0) / 100);
      ht += itemHt;
      tva += itemTva;
    });
    const ttc = ht + tva;
    setNewFactureData(prev => ({
      ...prev,
      items: itemsList,
      montantHT: ht.toFixed(2),
      montantTVA: tva.toFixed(2),
      montantTTC: ttc.toFixed(2)
    }));
  };

  const handleAddProductToFacture = () => {
    if (!selectedBordereauItem) {
      alert("Veuillez sélectionner un produit.");
      return;
    }
    const qty = parseFloat(tempQty) || 0;
    if (qty <= 0) {
      alert("La quantité doit être supérieure à 0.");
      return;
    }
    const price = parseFloat(tempPrice) || 0;

    const newItem = {
      num_article: selectedBordereauItem.price_number,
      designation: selectedBordereauItem.service_description,
      unite: selectedBordereauItem.unit_of_measure,
      qte: qty,
      pu_ht: price,
      taux_tva: parseFloat(tempVat) || 20
    };

    const updatedItems = [...(newFactureData.items || []), newItem];
    recalculateFactureTotals(updatedItems);
    setProductSearch('');
    setSelectedBordereauItem(null);
    setTempQty(1);
    setTempPrice('');
  };

  const handleUpdateItemFacture = (index, field, value) => {
    const updated = [...(newFactureData.items || [])];
    updated[index] = { ...updated[index], [field]: value };
    recalculateFactureTotals(updated);
  };

  const handleRemoveProductFromFacture = (index) => {
    const updated = [...(newFactureData.items || [])];
    updated.splice(index, 1);
    recalculateFactureTotals(updated);
  };

  const handleSaveFacture = async (e) => {
    e.preventDefault();
    if (!newFactureData.numero_facture || !newFactureData.date_facture) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    // Check if duplicate numero_facture exists
    if (!editingFacture) {
        const isDuplicate = factures.some(f => f.numero_facture === newFactureData.numero_facture);
        if (isDuplicate) {
             alert("Ce numéro de facture existe déjà.");
             return;
        }
    }

    try {
      const payload = {
        numero_facture: newFactureData.numero_facture,
        date_facture: newFactureData.date_facture,
        client: newFactureData.client,
        reference_bl: newFactureData.reference_bl,
        conditions_generales: newFactureData.conditions_generales,
        conditions_particulieres: newFactureData.conditions_particulieres,
        total_ht: newFactureData.montantHT,
        tva: newFactureData.montantTVA,
        total_ttc: newFactureData.montantTTC,
        statut: newFactureData.statut,
        articles: newFactureData.items
      };

      if (editingFacture) {
        await api.put(`/factures/${editingFacture.id}`, payload);
      } else {
        await api.post('/factures', payload);
      }
      fetchFactures();
      setShowFactureModal(false);
    } catch (error) {
      console.error('Erreur save facture', error.response?.data || error);
      alert("Erreur lors de l'enregistrement de la facture: " + (error.response?.data?.message || ""));
    }
  };

  const handleDeleteFacture = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
      try {
        await api.delete(`/factures/${id}`);
        fetchFactures();
      } catch (error) {
        console.error('Erreur delete facture', error);
      }
    }
  };

  const handleExportFactureToExcel = (facture) => {
    // Basic export or api call if implemented on backend
    alert("Fonctionnalité d'export Excel de la facture " + facture.numero_facture + " en cours d'intégration.");
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
                        <td style={{ padding: '14px 8px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedBlForView(bl)}
                            title="Voir"
                            style={{
                              width: '32px', height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(15, 118, 110, 0.18)',
                              backgroundColor: 'rgba(15, 118, 110, 0.05)',
                              color: '#0f766e',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              outline: 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#0f766e';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(15, 118, 110, 0.05)';
                              e.currentTarget.style.color = '#0f766e';
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBl(bl.id)}
                            title="Supprimer"
                            style={{
                              width: '32px', height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(239, 68, 68, 0.18)',
                              backgroundColor: 'rgba(239, 68, 68, 0.05)',
                              color: '#ef4444',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              outline: 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                          >
                            <Trash2 size={15} />
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

    if (activeDocTab === 'facture') {
      const filteredFactures = factures.filter(f => f.client === 'OFPPT / ISTA Ouarzazate'); // Or any other filtering logic
      return (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#0f766e" /> Factures
            </h3>
            <button
              onClick={() => {
                setEditingFacture(null);
                setNewFactureData({
                  numero_facture: `FA-${new Date().getFullYear()}-00${factures.length + 1}`,
                  date_facture: new Date().toISOString().split('T')[0],
                  client: 'OFPPT / ISTA Ouarzazate',
                  reference_bl: '',
                  conditions_generales: 'Paiement à réception de la facture.',
                  conditions_particulieres: '',
                  montantHT: '0.00',
                  montantTVA: '0.00',
                  montantTTC: '0.00',
                  statut: 'En cours',
                  items: []
                });
                setShowFactureModal(true);
              }}
              className="btn-primary"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={15} /> Nouvelle Facture
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
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>CLIENT</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '140px' }}>N° DE FACTURE</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '120px' }}>DATE</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '130px', textAlign: 'right' }}>MONTANT TTC</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '110px', textAlign: 'center' }}>STATUT</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '130px', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {factures.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Aucune facture trouvée. Cliquez sur "Nouvelle Facture" pour en ajouter une.
                      </td>
                    </tr>
                  ) : (
                    factures.map((facture, idx) => (
                      <tr key={facture.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 8px', fontSize: '12px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                          <div>{facture.client || 'N/A'}</div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal', marginTop: '2px' }}>Réf BL: {facture.reference_bl || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '12px', fontWeight: '700', color: '#0f766e' }}>
                          <span style={{ backgroundColor: '#ecfdf5', color: '#0f766e', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                            {facture.numero_facture}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '12px', color: '#475569' }}>
                          {new Date(facture.date_facture).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>
                          {parseFloat(facture.total_ttc || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          <span style={{
                            backgroundColor: facture.statut === 'Payée' ? '#ecfdf5' : '#fef3c7',
                            color: facture.statut === 'Payée' ? '#0f766e' : '#d97706',
                            padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700'
                          }}>
                            {facture.statut || 'En cours'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedFactureForView(facture)}
                            title="Voir"
                            style={{
                              width: '32px', height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(15, 118, 110, 0.18)',
                              backgroundColor: 'rgba(15, 118, 110, 0.05)',
                              color: '#0f766e',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#0f766e';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(15, 118, 110, 0.05)';
                              e.currentTarget.style.color = '#0f766e';
                            }}
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingFacture(facture);
                              setNewFactureData({
                                numero_facture: facture.numero_facture,
                                date_facture: facture.date_facture ? facture.date_facture.split('T')[0] : '',
                                client: facture.client,
                                reference_bl: facture.reference_bl,
                                conditions_generales: facture.conditions_generales,
                                conditions_particulieres: facture.conditions_particulieres,
                                montantHT: facture.total_ht,
                                montantTVA: facture.tva,
                                montantTTC: facture.total_ttc,
                                statut: facture.statut,
                                items: facture.articles || []
                              });
                              setShowFactureModal(true);
                            }}
                            title="Modifier"
                            style={{
                              width: '32px', height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(59, 130, 246, 0.18)',
                              backgroundColor: 'rgba(59, 130, 246, 0.05)',
                              color: '#3b82f6',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                              e.currentTarget.style.color = '#3b82f6';
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteFacture(facture.id)}
                            title="Supprimer"
                            style={{
                              width: '32px', height: '32px',
                              borderRadius: '8px',
                              border: '1px solid rgba(239, 68, 68, 0.18)',
                              backgroundColor: 'rgba(239, 68, 68, 0.05)',
                              color: '#ef4444',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ef4444';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                          >
                            <Trash2 size={15} />
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
              { id: 'conformite', label: 'PV de conformité' },
              { id: 'facture', label: 'Facture' },
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

            <form onSubmit={handleSaveBc} style={{ display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto', overflowX: 'hidden', flex: 1, paddingRight: '12px' }}>
              {/* General Information Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
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
                    style={{ width: '90%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155' }}
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
                            Aucun produit ajouter; pour le moment.
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
                                      {item.unit_of_measure} | {parseFloat(item.unit_price_ht).toFixed(2)} MAD
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
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
                    style={{ width: '90%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', color: '#0f766e', backgroundColor: '#ecfdf5', fontWeight: '800' }}
                  />
                </div>
              </div>

              {/* Conditions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Conditions Générales</label>
                  <textarea
                    value={newBcData.conditionsGenerales}
                    onChange={(e) => setNewBcData({ ...newBcData, conditionsGenerales: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', minHeight: '80px', height: '80px', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Conditions Particulières</label>
                  <textarea
                    value={newBcData.conditionsParticulieres}
                    onChange={(e) => setNewBcData({ ...newBcData, conditionsParticulieres: e.target.value })}
                    style={{ width: '90%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', color: '#334155', minHeight: '80px', height: '80px', resize: 'vertical' }}
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
                {bcItems.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 8px', fontSize: '12px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{item.label}</td>
                    <td style={{ padding: '10px 8px', fontSize: '12px', color: '#475569' }}>{item.unit}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#0f172a', textAlign: 'center', fontWeight: '600' }}>{item.qty}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{parseFloat(item.price).toFixed(2)}</td>
                    <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>{(item.qty * item.price).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                  </tr>
                ))}
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
                onClick={() => setSelectedBcForView(null)}
                className="btn-primary"
                style={{ padding: '10px 20px', backgroundColor: '#0f766e', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

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
                                 <div style={{ fontWeight: '600', color: '#0f172a' }}>N° {item.price_number} - {item.service_description}</div>
                                 <div style={{ color: '#64748b' }}>Prix ref: {item.price} MAD</div>
                               </div>
                             ))
                           ) : (
                             <div style={{ padding: '8px 10px', fontSize: '11px', color: '#94a3b8' }}>Aucun résultat</div>
                           )}
                         </div>
                       )}
                     </div>
                     <input
                       type="text"
                       placeholder="N°"
                       value={selectedBordereauItem ? selectedBordereauItem.price_number : ''}
                       readOnly
                       title="Numéro d'article (Sélectionné automatiquement)"
                       style={{ width: '50px', padding: '6px', fontSize: '12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#64748b', textAlign: 'center', cursor: 'not-allowed' }}
                     />
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
                          const totalLineHt = (parseFloat(item.qte) || 0) * (parseFloat(item.pu_ht) || 0);
                          return (
                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f766e' }}>{item.num_article}</td>
                              <td style={{ padding: '10px 12px', color: '#334155' }}>
                                <div style={{ fontWeight: '600' }}>{item.designation}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Unit&eacute;: {item.unite}</div>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <input type="number" min="1" value={item.qte} onChange={(e) => handleUpdateItemFacture(index, 'qte', e.target.value)} style={{ width: '60px', padding: '4px', textAlign: 'center', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none' }} />
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

      {/* Modal View Facture details */}
      {selectedFactureForView && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '16px', width: '100%', maxWidth: '800px',
            padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
              <div>
                <span style={{ backgroundColor: '#ecfdf5', color: '#0f766e', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', marginRight: '8px' }}>
                  {selectedFactureForView.numero_facture}
                </span>
                <h2 style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
                  Facture Client
                </h2>
              </div>
              <button
                onClick={() => setSelectedFactureForView(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Date de facturation</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  {new Date(selectedFactureForView.date_facture).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Client</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  {selectedFactureForView.client || 'Non spécifié'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Réf. Bon de Livraison</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>{selectedFactureForView.reference_bl || 'Non spécifié'}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Statut</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>
                  <span style={{ backgroundColor: selectedFactureForView.statut === 'Payée' ? '#ecfdf5' : '#fef3c7', color: selectedFactureForView.statut === 'Payée' ? '#10b981' : '#d97706', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                    {selectedFactureForView.statut || 'En cours'}
                  </span>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Détail des articles</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '40px' }}>N°</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>DÉSIGNATION</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '60px', textAlign: 'center' }}>QTÉ</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '90px', textAlign: 'right' }}>PU HT</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '60px', textAlign: 'center' }}>TVA</th>
                  <th style={{ padding: '8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '100px', textAlign: 'right' }}>TOTAL HT</th>
                </tr>
              </thead>
              <tbody>
                {(!selectedFactureForView.articles || selectedFactureForView.articles.length === 0) ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                      Aucun article trouvé.
                    </td>
                  </tr>
                ) : (
                  selectedFactureForView.articles.map((item, idx) => (
                    <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#0f766e', fontWeight: '600' }}>{item.num_article}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                        {item.designation}
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'normal' }}>Unité: {item.unite}</div>
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', color: '#0f172a', textAlign: 'center', fontWeight: '600' }}>{item.qte}</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', color: '#475569', textAlign: 'right' }}>{parseFloat(item.pu_ht).toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', fontSize: '12px', color: '#475569', textAlign: 'center' }}>{parseFloat(item.taux_tva)}%</td>
                      <td style={{ padding: '10px 8px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right' }}>{((parseFloat(item.qte) || 0) * (parseFloat(item.pu_ht) || 0)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Calculations */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
              <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Total HT:</span>
                  <span style={{ fontWeight: '600', color: '#334155' }}>
                    {parseFloat(selectedFactureForView.total_ht || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
                  <span>Total TVA:</span>
                  <span style={{ fontWeight: '600', color: '#334155' }}>
                    {parseFloat(selectedFactureForView.tva || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', color: '#0f766e', borderTop: '1px double #cbd5e1', paddingTop: '8px', marginTop: '4px' }}>
                  <span>Montant TTC:</span>
                  <span>
                    {parseFloat(selectedFactureForView.total_ttc || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} MAD
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedFactureForView(null)}
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
