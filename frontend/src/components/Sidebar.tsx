import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { IconifyIcon } from './IconifyIcon'

export const paths = {
  analyze: '/analyze-feedback',
  contribute: '/contribute-feedback',
  insights: '/public-insights',
  aspects: '/explore/aspects',
  workflow: '/explore/how-it-works',
  about: '/explore/about',
  admin: '/admin/login',
} as const

const menu = [
  { text: 'Analyze Feedback', href: paths.analyze, icon: 'lucide:message-square-text' },
  { text: 'Contribute Feedback', href: paths.contribute, icon: 'lucide:send' },
  { text: 'Public Insights', href: paths.insights, icon: 'lucide:chart-no-axes-column-increasing' },
  { text: 'Explore CITI-Senti', href: paths.aspects, icon: 'lucide:book-open' },
] as const

export interface SidebarState {
  collapsed: boolean
  toggle: () => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export function useSidebarState(): SidebarState {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('citi-senti-sidebar-collapsed') === 'true' }
    catch { return false }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    try { localStorage.setItem('citi-senti-sidebar-collapsed', String(collapsed)) }
    catch { /* Local storage may be blocked; toggling still works. */ }
  }, [collapsed])
  useEffect(() => { setMobileOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!mobileOpen) return
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [mobileOpen])

  return {
    collapsed,
    toggle: () => setCollapsed((value) => !value),
    mobileOpen,
    setMobileOpen,
  }
}

export function Sidebar({ state }: { state: SidebarState }) {
  const location = useLocation()
  const isExplore = location.pathname.startsWith('/explore')

  return (
    <>
      {state.mobileOpen && (
        <button
          className="mobile-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => state.setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar${state.collapsed ? ' is-collapsed' : ''}${state.mobileOpen ? ' mobile-open' : ''}`} aria-label="Site navigation">
        <div className="sidebar-brand-row">
          <NavLink to={paths.aspects} className="brand-link" title="CITI-Senti — Explore" aria-label="CITI-Senti — Explore">
            <img className="brand-logo" src="/citi-senti-mark.svg" alt="" width="43" height="43" />
            <span className="brand-type">
              <strong>CITI-Senti</strong>
              <small>Citizen Feedback Analysis</small>
            </span>
          </NavLink>
          {/* On collapsed desktop sidebars, the logo itself is the expand control. */}
          <button
            className="brand-expand-button"
            type="button"
            title="Expand sidebar"
            aria-label="Expand sidebar"
            aria-expanded={!state.collapsed}
            onClick={state.toggle}
          >
            <img className="brand-expand-logo" src="/citi-senti-mark.svg" alt="" width="43" height="43" />
            <IconifyIcon icon="lucide:panel-left-open" size={27} />
          </button>
          <button
            className="sidebar-toggle icon-button"
            type="button"
            title={state.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={state.collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!state.collapsed}
            onClick={state.toggle}
          >
            <IconifyIcon icon={state.collapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'} size={24} />
          </button>
          <button
            className="mobile-close icon-button"
            type="button"
            title="Close navigation"
            aria-label="Close navigation"
            onClick={() => state.setMobileOpen(false)}
          >
            <IconifyIcon icon="lucide:x" size={23} />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Main menu">
          {menu.map((item) => {
            const active = item.href === paths.aspects ? isExplore : location.pathname === item.href
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={`sidebar-link${active ? ' is-active' : ''}`}
                title={state.collapsed ? item.text : undefined}
                aria-label={item.text}
                aria-current={active ? 'page' : undefined}
                onClick={() => state.setMobileOpen(false)}
              >
                <IconifyIcon icon={item.icon} size={22} />
                <span className="sidebar-label">{item.text}</span>
              </NavLink>
            )
          })}
        </nav>
        <div className="sidebar-bottom">
          <NavLink
            to={paths.admin}
            className={({ isActive }) => `sidebar-link admin-link${isActive ? ' is-active' : ''}`}
            aria-label="Admin Login"
            title={state.collapsed ? 'Admin Login' : undefined}
            onClick={() => state.setMobileOpen(false)}
          >
            <IconifyIcon icon="lucide:shield" size={22} />
            <span className="sidebar-label">Admin Login</span>
          </NavLink>
          <div className="sidebar-footer">
            <p>© 2026 CITI-Senti Research Team.</p>
            <p>Not affiliated with the City Government of Baguio.</p>
            <a href="https://github.com/gelikadlcrz/citi-senti-web" target="_blank" rel="noopener noreferrer">GitHub <IconifyIcon icon="lucide:external-link" size={13}/></a>
          </div>
        </div>
      </aside>
    </>
  )
}
