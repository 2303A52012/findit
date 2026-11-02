import {
  Laptop,
  FileText,
  KeyRound,
  Briefcase,
  Shirt,
  Gem,
  Package,
  HelpCircle
} from 'lucide-react';

export const CATEGORY_ICONS = {
  Electronics: Laptop,
  Documents: FileText,
  Keys: KeyRound,
  Bags: Briefcase,
  Clothing: Shirt,
  Jewelry: Gem,
  Other: Package
};

export default function CategoryIcon({ category, size = 20, className = '' }) {
  const IconComponent = CATEGORY_ICONS[category] || Package;
  return <IconComponent size={size} className={className} />;
}

