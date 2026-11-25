import { Link } from 'react-router'
import { IconifyIcon } from '../components/IconifyIcon'
import { paths } from '../components/Sidebar'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="placeholder-panel panel">
      <span className="icon-frame"><IconifyIcon icon="lucide:file-text" size={31}/></span>
      <h1>{title}</h1>
      <p>This route is reserved for the corresponding website feature. Its page will be connected when that part of the project is implemented.</p>
      <Link to={paths.aspects} className="external-button"><IconifyIcon icon="lucide:arrow-left" size={18}/> Return to Explore CITI-Senti</Link>
    </section>
  )
}
