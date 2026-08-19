import {
  ShoppingCart,
  Utensils,
  Car,
  Plane,
  Hotel,
  Smartphone,
  Stethoscope,
  Briefcase,
  GraduationCap,
  Gift,
  FolderOpen,
} from 'lucide-react'

// Category enum used across the Receipt Box feature.
// Keep these identifiers stable — they are stored as-is in the `receipts.category` column.
export const RECEIPT_CATEGORIES = [
  { id: 'food',       label: '餐饮 Food',        icon: Utensils,      color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { id: 'transport',  label: '交通 Transport',   icon: Car,           color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { id: 'travel',     label: '差旅 Travel',      icon: Plane,         color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  { id: 'hotel',      label: '住宿 Hotel',       icon: Hotel,         color: 'text-purple-600 bg-purple-50 border-purple-100' },
  { id: 'shopping',   label: '采购 Shopping',    icon: ShoppingCart,  color: 'text-pink-600 bg-pink-50 border-pink-100' },
  { id: 'office',     label: '办公 Office',      icon: Smartphone,    color: 'text-slate-600 bg-slate-50 border-slate-200' },
  { id: 'medical',    label: '医疗 Medical',     icon: Stethoscope,   color: 'text-red-600 bg-red-50 border-red-100' },
  { id: 'business',   label: '商务 Business',    icon: Briefcase,     color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { id: 'education',  label: '教育 Education',   icon: GraduationCap, color: 'text-yellow-700 bg-yellow-50 border-yellow-100' },
  { id: 'gift',       label: '礼品 Gift',        icon: Gift,          color: 'text-rose-600 bg-rose-50 border-rose-100' },
  { id: 'other',      label: '其他 Other',       icon: FolderOpen,    color: 'text-slate-600 bg-slate-50 border-slate-200' },
]

export const DEFAULT_CATEGORY_ID = 'other'

export function getCategory(id) {
  return RECEIPT_CATEGORIES.find((c) => c.id === id) ?? RECEIPT_CATEGORIES.at(-1)
}
