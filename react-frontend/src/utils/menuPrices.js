const PRICE_PATTERN = /(\d+(?:[.,]\d+)?)\s*(?:dh|dhs|mad)\b/i;
const PIPE_PRICE_PATTERN = /\|\s*(\d+(?:[.,]\d+)?)\s*(?:dh|dhs|mad)?/i;

export const MENU_PRICE_LIMIT_DH = 25;

export function extractPricesFromMealText(text) {
  if (!text) return [];

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line, index) => {
      const pipeMatch = line.match(PIPE_PRICE_PATTERN);
      if (pipeMatch) {
        return [{
          line: index + 1,
          label: line.split('|')[0].trim(),
          value: parseFloat(pipeMatch[1].replace(',', '.')),
        }];
      }

      const dhMatch = line.match(PRICE_PATTERN);
      if (dhMatch) {
        return [{
          line: index + 1,
          label: line.replace(dhMatch[0], '').trim() || line,
          value: parseFloat(dhMatch[1].replace(',', '.')),
        }];
      }

      return [];
    });
}

export function analyzeMenuBudget(formData) {
  const items = [
    ...extractPricesFromMealText(formData.petit_dejeuner),
    ...extractPricesFromMealText(formData.dejeuner),
    ...extractPricesFromMealText(formData.diner),
  ];

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const overItems = items.filter((item) => item.value > MENU_PRICE_LIMIT_DH);

  return {
    items,
    total,
    overItems,
    exceeds: overItems.length > 0 || total > MENU_PRICE_LIMIT_DH,
  };
}
