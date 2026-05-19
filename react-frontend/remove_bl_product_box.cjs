const fs = require('fs');
const path = 'src/components/MarchesContent.jsx';
let content = fs.readFileSync(path, 'utf8');

// Find the start of the BL modal
const startBlModal = content.indexOf('{/* Modal Add/Edit BL */}');
if (startBlModal === -1) {
  console.log('BL modal not found');
  process.exit(1);
}

// Find the product selection box inside the BL modal
const searchBoxStartString = '{/* Product Selection from Bordereau */}';
const searchBoxStartIndex = content.indexOf(searchBoxStartString, startBlModal);

if (searchBoxStartIndex === -1) {
  console.log('Product selection box not found inside BL modal');
  process.exit(1);
}

// The product selection section ends right before "{/* Added Items Table */}"
const searchBoxEndString = '{/* Added Items Table */}';
const searchBoxEndIndex = content.indexOf(searchBoxEndString, searchBoxStartIndex);

if (searchBoxEndIndex === -1) {
  console.log('End of product selection box not found');
  process.exit(1);
}

// Remove the section
const newContent = content.substring(0, searchBoxStartIndex) + content.substring(searchBoxEndIndex);

fs.writeFileSync(path, newContent, 'utf8');
console.log('Removed product selection box from BL modal');
