import {
  BookOpen, Refrigerator, Smartphone, Shirt, Lamp, Package,
} from 'lucide-react';
import type { Category } from '@/lib/types';

const categoryIconMap: Record<Category, typeof Package> = {
  Textbooks: BookOpen,
  Appliances: Refrigerator,
  'Electronics & Gadgets': Smartphone,
  'Clothing & Shoes': Shirt,
  'Room Decor & Furniture': Lamp,
  Other: Package,
};

export default function CategoryIcon({ category, className }: { category: Category; className?: string }) {
  const Icon = categoryIconMap[category] || Package;
  return <Icon className={className} />;
}
