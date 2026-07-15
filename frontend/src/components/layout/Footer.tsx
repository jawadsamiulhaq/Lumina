import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-100 bg-ink-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 text-lg font-black text-ink-900">
            <span className="grid size-8 place-items-center rounded-xl bg-brand-600 text-white">L</span>
            Lumina
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-500">
            Thoughtfully designed products for everyday life. Fast shipping, easy returns.
          </p>
        </div>
        <FooterCol title="Shop" links={[['All products', '/products'], ['Featured', '/products?featured=true']]} />
        <FooterCol title="Account" links={[['Sign in', '/login'], ['My orders', '/account/orders']]} />
        <FooterCol title="Company" links={[['About', '/products'], ['Contact', '/products']]} />
      </div>
      <div className="border-t border-ink-100 py-6 text-center text-xs text-ink-400">
        © {new Date().getFullYear()} Lumina. Demo store — payments run in Stripe test mode.
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-ink-500 transition hover:text-ink-900">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
