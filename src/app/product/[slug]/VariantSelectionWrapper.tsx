"use client";
import { useState, useMemo } from 'react';
import AddToCartButton from './AddToCartButton';
// useTranslation is not available; fallback to i18n.t
import i18n from '../../../i18n';

export default function VariantSelectionWrapper({ product, config, onAddToCartSuccess }: { product: any, config: any, onAddToCartSuccess?: () => void }) {
  // Extract variant data
  const colors = product.colors_formatted || [];
  const choiceOptions = product.choice_options || [];
  const variations = product.variation || [];

  // State for selections (no default selection)
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedColorCode, setSelectedColorCode] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [showError, setShowError] = useState(false);

  // Find the selected variant
  const selectedVariant = useMemo(() => {
    let typeParts = [];
    if (colors.length > 0 && selectedColor) typeParts.push(selectedColor);
    choiceOptions.forEach((opt: any) => {
      if (selectedOptions[opt.title]) typeParts.push(selectedOptions[opt.title]);
    });
    const typeStr = typeParts.join('-').replace(/ /g, '');
    const found = variations.find((v: any) => v.type.replace(/ /g, '') === typeStr) || null;
    if (found && colors.length > 0 && selectedColor) {
      found.color_code = selectedColorCode;
    }
    return found;
  }, [selectedColor, selectedColorCode, selectedOptions, colors, choiceOptions, variations]);

  const handleColorSelect = (color: any) => {
    setSelectedColor(color.name);
    setSelectedColorCode(color.code);
    setShowError(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('product-color-select', { detail: { colorCode: color.code } }));
    }
  };

  const handleOptionSelect = (title: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [title]: value }));
    setShowError(false);
  };

  // Check if all required selections are made
  const allSelected =
    (colors.length === 0 || !!selectedColor) &&
    choiceOptions.every((opt: any) => !!selectedOptions[opt.title]);

  // Render color buttons and dropdowns
  return (
    <div className="space-y-4 mb-6">
      {colors.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Color:</label>
          <div className="flex space-x-2">
            {colors.map((color: any) => (
              <button
                key={color.name}
                type="button"
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${selectedColor === color.name ? 'border-blue-600' : 'border-gray-300'}`}
                style={{ backgroundColor: color.code }}
                onClick={() => handleColorSelect(color)}
                aria-label={color.name}
              >
                {selectedColor === color.name && (
                  <span className="inline-block w-4 h-4 bg-white rounded-full border border-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      {choiceOptions.map((opt: any) => (
        <div key={opt.title}>
          <label className="block text-sm font-medium mb-1">{opt.title}:</label>
          <select
            className="border rounded px-2 py-1"
            value={selectedOptions[opt.title] || ''}
            onChange={e => handleOptionSelect(opt.title, e.target.value)}
          >
            <option value="">Select {opt.title}</option>
            {opt.options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      ))}
      {showError && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 text-sm font-medium flex items-center gap-2 animate-pulse">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {i18n.t('select_required_options_error')}
        </div>
      )}
      <AddToCartButton
        product={product}
        config={config}
        selectedColor={selectedColorCode}
        selectedOptions={selectedOptions}
        selectedVariant={selectedVariant}
        allSelected={allSelected}
        onSelectionError={() => setShowError(true)}
        onAddToCartSuccess={onAddToCartSuccess}
      />
    </div>
  );
} 