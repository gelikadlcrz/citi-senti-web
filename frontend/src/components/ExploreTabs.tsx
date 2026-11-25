import { NavLink } from 'react-router'
import { paths } from './Sidebar'

const tabs = [
  { label: 'Aspect Categories', href: paths.aspects },
  { label: 'How it works', href: paths.workflow },
  { label: 'About CITI-Senti', href: paths.about },
]

export function ExploreTabs() {
  return (
    <nav className="explore-tabs" aria-label="Explore CITI-Senti sections">
      {tabs.map((tab) => (
        <NavLink
          key={tab.href}
          to={tab.href}
          className={({ isActive }) => `explore-tab${isActive ? ' active' : ''}`}
          end
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
