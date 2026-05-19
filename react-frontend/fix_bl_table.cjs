const fs = require('fs');
const path = 'src/components/MarchesContent.jsx';
let content = fs.readFileSync(path, 'utf8');

// Find the start of the BL modal
const startBlModal = content.indexOf('{/* Modal Add/Edit BL */}');
if (startBlModal === -1) {
  console.log('BL modal not found');
  process.exit(1);
}

// Find the end of the BL modal
const endBlModal = content.indexOf('{/* Modal View BL details */}');

// We will only operate on the BL modal portion
let blModalContent = content.substring(startBlModal, endBlModal);

// 1. Remove the "Ajouter un article" button
blModalContent = blModalContent.replace(
  /<button\s+type="button"\s+onClick=\{[^\}]+\}\s+className="btn-primary"[\s\S]*?<Plus size=\{12\} \/> Ajouter un article\s*<\/button>/g,
  ''
);

// 2. Replace the select box for price_number with a read-only input
const selectRegex = /<select\s+value=\{item\.price_number[\s\S]*?<\/select>/;
const readOnlyInput = `<input 
                            type="text"
                            value={item.price_number || ''}
                            readOnly disabled
                            className="form-input"
                            style={{ padding: '6px', fontSize: '12px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', width: '100%' }}
                          />`;
blModalContent = blModalContent.replace(selectRegex, readOnlyInput);

// Also remove "Aucun article sélectionné. Cliquez sur "Ajouter un article" pour commencer."
blModalContent = blModalContent.replace(
  /Aucun article sélectionné\. Cliquez sur "Ajouter un article" pour commencer\./g,
  'Aucun article. Veuillez sélectionner un ou plusieurs Bons de Commande ci-dessus.'
);

const newContent = content.substring(0, startBlModal) + blModalContent + content.substring(endBlModal);

fs.writeFileSync(path, newContent, 'utf8');
console.log('BL table fixed!');
