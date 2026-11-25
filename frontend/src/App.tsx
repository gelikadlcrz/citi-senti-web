import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { paths } from "./components/Sidebar";
import { AspectCategoriesPage } from "./pages/AspectCategoriesPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { AboutPage } from "./pages/AboutPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { PublicInsightsPage } from "./pages/PublicInsightsPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The admin login is a full-screen page, so it renders without the citizen sidebar layout. */}
        <Route path={paths.admin} element={<AdminLoginPage />} />
        <Route
          element={
            <Layout>
              <Outlet />
            </Layout>
          }
        >
          <Route path="/" element={<Navigate replace to={paths.aspects} />} />
          <Route
            path="/explore"
            element={<Navigate replace to={paths.aspects} />}
          />
          <Route path={paths.aspects} element={<AspectCategoriesPage />} />
          <Route path={paths.workflow} element={<HowItWorksPage />} />
          <Route path={paths.about} element={<AboutPage />} />
          {/* Temporary route placeholders: replace these when teammates add the actual pages. */}
          <Route
            path={paths.analyze}
            element={<PlaceholderPage title="Analyze Feedback" />}
          />
          <Route
            path={paths.contribute}
            element={<PlaceholderPage title="Contribute Feedback" />}
          />
          <Route path={paths.insights} element={<PublicInsightsPage />} />
          <Route
            path="*"
            element={<PlaceholderPage title="Page not found" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
