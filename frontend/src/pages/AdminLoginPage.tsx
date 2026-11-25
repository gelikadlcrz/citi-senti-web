import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router";
import { IconifyIcon } from "../components/IconifyIcon";
import { PineLandscape } from "../components/PineLandscape";
import { signInAdmin } from "../services/adminAuth";

const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

const signInErrors = {
  "invalid-credentials":
    "Incorrect username or password. Check both fields and try again.",
  unavailable: "Sign-in is unavailable right now. Try again in a few minutes.",
} as const;

// TODO: replace with the admin dashboard path once that page is added to `paths`.
const ADMIN_HOME = "/admin/dashboard";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    const result = await signInAdmin(values);
    if (result.ok) {
      navigate(ADMIN_HOME, { replace: true });
      return;
    }
    setFormError(signInErrors[result.reason]);
  };

  return (
    <div className="admin-login">
      <aside className="admin-login-brand">
        <div className="admin-login-brand-copy">
          <Link
            to="/"
            className="admin-login-logo"
            aria-label="CITI-Senti home"
          >
            <img src="/citi-senti-mark.svg" alt="" width="76" height="76" />
            <span>
              <strong>CITI-Senti</strong>
              <small>Citizen Feedback Analysis</small>
            </span>
          </Link>
          <span className="admin-login-rule" aria-hidden="true" />
          <p className="admin-login-motto">Understand concerns.</p>
          <p className="admin-login-motto">Promote participation.</p>
          <p className="admin-login-about">
            A multilingual civic-feedback research platform developed to explore
            aspects and sentiments in Baguio City policy discussions.
          </p>
        </div>
        <PineLandscape className="admin-login-landscape" />
      </aside>

      <main className="admin-login-main" id="main-content">
        <Link to="/" className="admin-login-back">
          <IconifyIcon icon="lucide:arrow-left" size={22} />
          Back to Citizen Portal
        </Link>

        <div className="admin-login-content">
          <header className="admin-login-heading">
            <h1>Administrator Portal</h1>
            <p>
              Sign in to manage submissions, review analytics, and export
              reports.
            </p>
          </header>

          <section
            className="admin-login-card panel"
            aria-labelledby="admin-login-title"
          >
            <h2 id="admin-login-title">Administrator Login</h2>

            <form
              className="admin-login-form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {formError && (
                <div className="admin-login-alert" role="alert">
                  <IconifyIcon icon="lucide:badge-alert" size={18} />
                  <p>{formError}</p>
                </div>
              )}

              <div className="admin-field">
                <label htmlFor="admin-username">Username</label>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={errors.username ? true : undefined}
                  aria-describedby={
                    errors.username ? "admin-username-error" : undefined
                  }
                  {...register("username")}
                />
                {errors.username && (
                  <p className="admin-field-error" id="admin-username-error">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="admin-field">
                <label htmlFor="admin-password">Password</label>
                <div className="admin-password-wrap">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={
                      errors.password ? "admin-password-error" : undefined
                    }
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="admin-password-toggle"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    <IconifyIcon
                      icon={showPassword ? "lucide:eye" : "lucide:eye-closed"}
                      size={22}
                    />
                  </button>
                </div>
                {errors.password && (
                  <p className="admin-field-error" id="admin-password-error">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                className="admin-login-submit"
                type="submit"
                disabled={isSubmitting}
              >
                <IconifyIcon icon="lucide:arrow-right" size={18} />
                {isSubmitting ? "Logging in…" : "Log in"}
              </button>
            </form>

            <p className="admin-login-note">
              <IconifyIcon icon="lucide:info" size={20} />
              Authorized personnel only
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
