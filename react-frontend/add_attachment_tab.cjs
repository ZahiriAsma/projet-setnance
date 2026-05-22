const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'MarchesContent.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add State
const stateInjection = `
  // --- Attachments State ---
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [newAttachmentData, setNewAttachmentData] = useState({
    numero_attachment: '',
    bon_livraison_id: '',
    budget: 'BF',
    exercice: new Date().getFullYear(),
    rubrique: 'ACHAT PRODUITS ALIMENTAIRES',
    reference_marche: '',
    lieu_livraison: 'Ouarzazate',
    items: []
  });
  const [editingAttachmentGroup, setEditingAttachmentGroup] = useState(null);
`;
if (!content.includes('const [attachments, setAttachments]')) {
    content = content.replace('// --- Factures State ---', stateInjection + '\n  // --- Factures State ---');
}

// 2. Fetch function
const fetchInjection = `
  const fetchAttachments = async () => {
    try {
      const response = await api.get('/attachments-bc');
      setAttachments(response.data);
    } catch (error) {
      console.error('Erreur chargement attachments', error);
    }
  };
`;
if (!content.includes('const fetchAttachments')) {
    content = content.replace('useEffect(() => {', fetchInjection + '\n  useEffect(() => {\n    fetchAttachments();');
}

// 3. Tab content
const tabContent = `
    if (activeDocTab === 'attachments') {
      const filteredAttachments = attachments.filter(a => bls.some(bl => bl.id === a.bon_livraison_id && bl.fournisseur_id?.toString() === selectedMarche.id_fournisseur?.toString()));
      
      // Group attachments by BL id
      const grouped = {};
      filteredAttachments.forEach(att => {
          if(!grouped[att.bon_livraison_id]) grouped[att.bon_livraison_id] = { ...att, items: [] };
          grouped[att.bon_livraison_id].items.push(att);
      });
      const attachmentGroups = Object.values(grouped);

      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} color="#0f766e" /> Attachements
            </h3>
            <button
              onClick={() => {
                setEditingAttachmentGroup(null);
                setNewAttachmentData({
                  numero_attachment: attachments.length > 0 ? Math.max(...attachments.map(a => a.numero_attachment || 0)) + 1 : 1,
                  bon_livraison_id: bls.filter(bl => bl.fournisseur_id?.toString() === selectedMarche.id_fournisseur?.toString())[0]?.id || '',
                  budget: 'BF',
                  exercice: new Date().getFullYear(),
                  rubrique: 'ACHAT PRODUITS ALIMENTAIRES',
                  reference_marche: '',
                  lieu_livraison: 'Ouarzazate',
                  items: []
                });
                setShowAttachmentModal(true);
              }}
              className="btn-primary"
              style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={15} /> Nouvel Attachement
            </button>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif" }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '40px' }}>#</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b' }}>N° BL ASSOCIÉ</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '140px' }}>N° ATTACHEMENT</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '120px' }}>BUDGET</th>
                    <th style={{ padding: '12px 8px', fontSize: '11px', fontWeight: '700', color: '#64748b', width: '130px', textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {attachmentGroups.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        Aucun attachement trouvé.
                      </td>
                    </tr>
                  ) : (
                    attachmentGroups.map((group, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 8px', fontSize: '12px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '14px 8px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
                           {bls.find(b => b.id === group.bon_livraison_id)?.numeroBL || 'Inconnu'}
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '12px', fontWeight: '700', color: '#0f766e' }}>
                          <span style={{ backgroundColor: '#ecfdf5', color: '#0f766e', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                            {group.numero_attachment}/{group.exercice}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: '12px', color: '#475569' }}>
                          {group.budget}
                        </td>
                        <td style={{ padding: '14px 8px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              setEditingAttachmentGroup(group);
                              setNewAttachmentData({
                                numero_attachment: group.numero_attachment,
                                bon_livraison_id: group.bon_livraison_id,
                                budget: group.budget,
                                exercice: group.exercice,
                                rubrique: group.rubrique,
                                reference_marche: group.reference_marche || '',
                                lieu_livraison: group.lieu_livraison,
                                items: group.items
                              });
                              setShowAttachmentModal(true);
                            }}
                            title="Modifier"
                            style={{
                              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.18)', backgroundColor: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={async () => {
                                if (window.confirm("Supprimer cet attachement ?")) {
                                    for(const item of group.items) {
                                        await api.delete(\`/attachments-bc/\${item.id}\`);
                                    }
                                    fetchAttachments();
                                }
                            }}
                            title="Supprimer"
                            style={{
                              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.18)', backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                          <button
                            onClick={async () => {
                                try {
                                    const res = await api.get(\`/bons-livraison/\${group.bon_livraison_id}/attachments-bc/export\`, { responseType: 'blob' });
                                    const url = window.URL.createObjectURL(new Blob([res.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', \`Attachement_BC_\${group.bon_livraison_id}.xlsx\`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.parentNode.removeChild(link);
                                } catch(e) {
                                    alert("Erreur lors de l'export.");
                                }
                            }}
                            title="Télécharger Excel"
                            style={{
                              width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.18)', backgroundColor: 'rgba(16, 185, 129, 0.05)', color: '#10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            <Download size={15} />
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
`;
if (!content.includes("activeDocTab === 'attachments'")) {
    content = content.replace("if (activeDocTab === 'facture')", tabContent + "\n\n    if (activeDocTab === 'facture')");
}


fs.writeFileSync(filePath, content);
console.log('Tabs updated');
