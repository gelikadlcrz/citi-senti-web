import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { paths } from './components/Sidebar'
import { AspectCategoriesPage } from './pages/AspectCategoriesPage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { AboutPage } from './pages/AboutPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate replace to={paths.aspects}/>} />
          <Route path="/explore" element={<Navigate replace to={paths.aspects}/>} />
          <Route path={paths.aspects} element={<AspectCategoriesPage/>} />
          <Route path={paths.workflow} element={<HowItWorksPage/>} />
          <Route path={paths.about} element={<AboutPage/>} />
          {/* Temporary route placeholders: replace these when teammates add the actual pages. */}
          <Route path={paths.analyze} element={<PlaceholderPage title="Analyze Feedback"/>} />
          <Route path={paths.contribute} element={<PlaceholderPage title="Contribute Feedback"/>} />
          <Route path={paths.insights} element={<PlaceholderPage title="Public Insights"/>} />
          <Route path={paths.admin} element={<PlaceholderPage title="Admin Login"/>} />
          <Route path="*" element={<PlaceholderPage title="Page not found"/>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
