const fs = require('fs');

const path = 'src/components/MarchesContent.jsx';
let content = fs.readFileSync(path, 'utf8');

// Find the start of the BC Modal
const startBcModal = content.indexOf('{/* Modal Add/Edit BC */}');
// Find the end of the selectedBcForView Modal
const endBcModal = content.indexOf('export default MarchesContent;');

if (startBcModal === -1 || endBcModal === -1) {
  console.log('Could not find modal blocks');
  process.exit(1);
}

// Extract the whole BC modals section
const bcModalsCode = content.substring(startBcModal, endBcModal);

// Replace variables to make it BL
let blModalsCode = bcModalsCode
  .replace(/\{(\/\*.*?)BC(.*?)\*\/\}/g, '{$1BL$2}')
  .replace(/Bc/g, 'Bl')
  .replace(/BC/g, 'BL')
  .replace(/bc/g, 'bl')
  .replace(/bon de commande/g, 'bon de livraison')
  .replace(/Bon de Commande/g, 'Bon de Livraison')
  .replace(/Bons de commande/g, 'Bons de livraison')
  .replace(/Date d'émission/g, 'Date de livraison')
  .replace(/dateEmission/g, 'dateLivraison')
  .replace(/referenceMarcheCadre/g, 'referenceBC')
  .replace(/Réf. Marché/g, 'Réf. BC');

// Insert the new BL modals right after the BC modals
const newContent = content.substring(0, endBcModal) + '\n      ' + blModalsCode + '\n' + content.substring(endBcModal);

fs.writeFileSync(path, newContent, 'utf8');
console.log('Successfully injected BL modals');
