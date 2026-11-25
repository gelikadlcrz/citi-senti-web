import { ExploreTabs } from './ExploreTabs'

export function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="explore-intro">
      <div className="explore-heading-copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <ExploreTabs />
    </div>
  )
}
