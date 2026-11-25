import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AnalysisFlowContext } from "./AnalysisFlowContext";
import { useLocation } from "react-router";
import { Sidebar, useSidebarState } from "./Sidebar";
import { IconifyIcon } from "./IconifyIcon";

export function Layout({ children }: { children: ReactNode }) {
  const sidebar = useSidebarState();
  const location = useLocation();
  const [resultsVisible, setResultsVisible] = useState(false);
  const [contributionDraft, setContributionDraft] = useState<string | null>(null);
  useEffect(() => {
    if (location.pathname !== "/contribute-feedback") setContributionDraft(null);
  }, [location.pathname]);
  const showingResults = location.pathname === "/analyze-feedback" && resultsVisible;
  const explore =
    location.pathname.startsWith("/explore") || location.pathname === "/";
  const placeholderHeading: Record<string, string> = {
    "/analyze-feedback": "Analyze Citizen Feedback",
    "/contribute-feedback": "Contribute Feedback",
    "/public-insights": "Public Insights",
    "/admin/login": "Admin Login",
  };
  const heading = showingResults ? "Analysis Results" : explore
    ? "Explore CITI-Senti"
    : (placeholderHeading[location.pathname] ?? "CITI-Senti");
  const pageSubheading: Record<string, string> = {
    "/analyze-feedback": "Try the multilingual aspect-based sentiment analyzer.",
    "/public-insights":
      "Privacy-safe, aggregated statistics from eligible approved feedback.",
  };
  const subheading = showingResults ? "Aspect and sentiment predictions for your submitted comment." : explore
    ? "Learn about the research, model, and its policy-related aspect taxonomy."
    : (pageSubheading[location.pathname] ??
      "This section will be connected to the corresponding website feature.");
  return (
    <div
      className={`app-shell${sidebar.collapsed ? " sidebar-collapsed" : ""}`}
    >
      <Sidebar state={sidebar} />
      <div className="page-shell">
        <header className="topbar">
          <button
            className="mobile-menu-button icon-button"
            type="button"
            aria-label="Open navigation"
            onClick={() => sidebar.setMobileOpen(true)}
          >
            <IconifyIcon icon="lucide:menu" size={23} />
          </button>
          <div className="topbar-title">
            <div className="topbar-heading">{heading}</div>
            <p>{subheading}</p>
          </div>
        </header>
        <main className="page-main" id="main-content">
          <AnalysisFlowContext.Provider value={{
            setResultsVisible,
            contributionDraft: location.pathname === "/contribute-feedback" ? contributionDraft : null,
            setContributionDraft,
          }}>
            {children}
          </AnalysisFlowContext.Provider>
        </main>
      </div>
    </div>
  );
}
