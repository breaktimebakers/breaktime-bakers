import {
  Zap, Droplet, Flame, Building2, Wifi, Sparkles, Wrench, Fuel, Package,
  Printer, Laptop, Megaphone, Landmark, Building, Briefcase, Shield,
  HeartHandshake, Gift, Plane, TriangleAlert, MoreHorizontal,
} from 'lucide-react'

const iconMap = {
  Zap, Droplet, Flame, Building2, Wifi, Sparkles, Wrench, Fuel, Package,
  Printer, Laptop, Megaphone, Landmark, Building, Briefcase, Shield,
  HeartHandshake, Gift, Plane, TriangleAlert, MoreHorizontal,
}

export function getCategoryIcon(iconName) {
  return iconMap[iconName] || MoreHorizontal
}

export function CategoryPill({ category, icon }) {
  const Icon = getCategoryIcon(icon)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-espresso/15 bg-crust/30 px-2.5 py-1 text-xs font-medium text-espresso/70">
      <Icon className="h-3.5 w-3.5" />
      {category}
    </span>
  )
}
