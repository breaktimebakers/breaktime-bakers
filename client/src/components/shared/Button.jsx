export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const variants = {
    primary: 'bg-oven-amber text-espresso hover:bg-oven-amber/90 shadow-bakery',
    secondary: 'bg-proof-cream text-espresso border border-espresso/15 hover:bg-sourdough/40',
    danger: 'bg-cherry-compote text-crust hover:bg-cherry-compote/90 shadow-bakery',
    ghost: 'text-espresso/70 hover:text-espresso hover:bg-espresso/5',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-bakery font-medium transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
