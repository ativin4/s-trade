const INR  = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const DATE = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })

export const fmtINR       = (n: number) => '₹' + INR.format(n)
export const fmtChangeINR = (n: number) => (n >= 0 ? '+' : '') + fmtINR(n)
export const fmtDate      = (d: Date | string) => DATE.format(new Date(d))
