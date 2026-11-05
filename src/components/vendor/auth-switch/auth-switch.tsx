"use client";

/**
 * Auth Switch
 * Author: Masdouk Adelakoun (@appvibed01) on 21st.dev
 * Source: https://21st.dev/r/appvibed01/auth-switch
 * Date Added: 2026-10-31
 * Description: Animated authentication component with Sign In and Sign Up forms and smooth sliding panels.
 * Themed to KalExamHai Claude-Azure design tokens (azure-strong, surface, ink).
 */

import React, { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, GraduationCap, Loader2, Mail, Lock, User, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isDisposableEmail } from "@/lib/auth/disposable-domains";

export type UserRole = "student" | "tutor";

interface AuthSwitchProps {
  initialMode?: "signin" | "signup";
  initialRole?: UserRole;
  redirectTo?: string;
}

export function AuthSwitchComponent({
  initialMode = "signin",
  initialRole = "student",
  redirectTo = "",
}: AuthSwitchProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [role, setRole] = useState<UserRole>(initialRole);

  // Guarantee light theme on auth screens
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Form states
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [awaitingVerificationEmail, setAwaitingVerificationEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isDisposableEmail(signInEmail)) {
      setErrorMessage(
        "Disposable email addresses are not permitted. Please use your personal (Gmail, Outlook) or college email, or continue with Google."
      );
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) throw error;

      const user = data.user;
      const isAdmin = user?.email?.toLowerCase() === "rehxnnn0@gmail.com";
      const userRole = user?.user_metadata?.role || role;

      if (redirectTo) {
        router.push(redirectTo);
      } else if (isAdmin || userRole === "tutor") {
        router.push("/tutor");
      } else {
        router.push("/student");
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Check your credentials.";
      if (msg.toLowerCase().includes("email not confirmed")) {
        setErrorMessage("Please check your email and click the confirmation link before signing in.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isDisposableEmail(signUpEmail)) {
      setErrorMessage(
        "Disposable email addresses are not permitted. Please use your personal (Gmail, Outlook) or college email, or continue with Google."
      );
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            role,
            full_name: signUpName.trim() || signUpEmail.split("@")[0],
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTo || (role === "tutor" ? "/tutor" : "/student")
          )}&intended_role=${role}`,
        },
      });

      if (error) throw error;

      if (data.session) {
        if (redirectTo) {
          router.push(redirectTo);
        } else if (role === "tutor") {
          router.push("/tutor");
        } else {
          router.push("/student");
        }
        router.refresh();
      } else {
        setAwaitingVerificationEmail(signUpEmail);
        setSuccessMessage("Confirmation link sent! Please check your email inbox to verify your account.");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create account."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!awaitingVerificationEmail) return;
    setIsResending(true);
    setResendMessage(null);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: awaitingVerificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTo || (role === "tutor" ? "/tutor" : "/student")
          )}&intended_role=${role}`,
        },
      });
      if (error) throw error;
      setResendMessage("Confirmation email resent! Please check your spam folder too.");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to resend confirmation email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            redirectTo || (role === "tutor" ? "/tutor" : "/student")
          )}&intended_role=${role}`,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Google authentication failed.");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-switch">
      <style>{`
        .auth-switch,
        .auth-switch * {
          box-sizing: border-box;
        }

        .auth-switch {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #F9F9F6;
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          position: relative;
        }

        .container {
          position: relative;
          width: 100%;
          max-width: 960px;
          height: 600px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid #E7E5E0;
          overflow: hidden;
        }

        .forms-container {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
        }

        .signin-signup {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          left: 75%;
          width: 50%;
          transition: 0.9s 0.6s ease-in-out;
          display: grid;
          grid-template-columns: 1fr;
          z-index: 5;
        }

        form {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 0 4rem;
          transition: all 0.2s 0.6s;
          overflow: hidden;
          grid-column: 1 / 2;
          grid-row: 1 / 2;
          width: 100%;
        }

        form.sign-up-form {
          opacity: 0;
          z-index: 1;
        }

        form.sign-in-form {
          z-index: 2;
        }

        .title {
          font-size: 1.85rem;
          color: #1F2937;
          margin-bottom: 6px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .role-selector-bar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          padding: 3px;
          border-radius: 8px;
          width: 100%;
          max-width: 380px;
          margin-bottom: 12px;
        }

        .role-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: transparent;
          color: #6B7280;
          transition: 0.2s;
        }

        .role-btn.active {
          background: #ffffff;
          color: #1F2937;
          font-weight: 600;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .feedback-banner {
          width: 100%;
          max-width: 380px;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.78rem;
          margin-bottom: 10px;
          line-height: 1.35;
          text-align: center;
        }

        .feedback-banner.error {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #B91C1C;
        }

        .feedback-banner.success {
          background: #F0FDF4;
          border: 1px solid #86EFAC;
          color: #15803D;
        }

        .input-field {
          max-width: 380px;
          width: 100%;
          background-color: #F9FAFB;
          margin: 6px 0;
          height: 48px;
          border-radius: 8px;
          border: 1px solid #D1D5DB;
          display: grid;
          grid-template-columns: 14% 86%;
          padding: 0 0.5rem;
          position: relative;
          transition: 0.2s;
        }

        .input-field:focus-within {
          background-color: #ffffff;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }

        .input-field i {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6B7280;
          font-size: 0.95rem;
        }

        .input-field input {
          background: none;
          outline: none;
          border: none;
          line-height: 1;
          font-weight: 400;
          font-size: 0.88rem;
          color: #1F2937;
          width: 100%;
        }

        .input-field input::placeholder {
          color: #9CA3AF;
        }

        .btn {
          width: 100%;
          max-width: 380px;
          background-color: #2563EB;
          border: none;
          outline: none;
          height: 44px;
          border-radius: 8px;
          color: #fff;
          font-weight: 600;
          margin-top: 10px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
        }

        .btn:hover {
          background-color: #1D4ED8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn:disabled {
          opacity: 0.65;
          pointer-events: none;
        }

        .google-btn {
          width: 100%;
          max-width: 380px;
          background-color: #ffffff;
          border: 1.5px solid #E5E7EB;
          height: 44px;
          border-radius: 8px;
          color: #1F2937;
          font-weight: 600;
          margin-top: 4px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .google-btn:hover {
          background-color: #F9FAFB;
          border-color: #D1D5DB;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
        }

        .google-btn:active {
          transform: translateY(0);
        }

        .google-btn:disabled {
          opacity: 0.65;
          pointer-events: none;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 380px;
          margin: 6px 0 8px 0;
          color: #9CA3AF;
          font-size: 0.72rem;
          font-weight: 500;
        }

        .auth-divider::before,
        .auth-divider::after {
          content: "";
          flex: 1;
          border-bottom: 1px solid #E5E7EB;
        }

        .auth-divider span {
          padding: 0 10px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .panels-container {
          position: absolute;
          height: 100%;
          width: 100%;
          top: 0;
          left: 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
        }

        .panel {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-around;
          text-align: center;
          z-index: 6;
        }

        .left-panel {
          pointer-events: all;
          padding: 3rem 16% 2rem 10%;
        }

        .right-panel {
          pointer-events: none;
          padding: 3rem 10% 2rem 16%;
        }

        .panel .content {
          color: #fff;
          transition: transform 0.8s ease-in-out;
          transition-delay: 0.5s;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .panel h3 {
          font-weight: 700;
          line-height: 1.2;
          font-size: 1.55rem;
          margin-bottom: 8px;
        }

        .panel p {
          font-size: 0.88rem;
          padding: 0.5rem 0 1.2rem;
          line-height: 1.5;
          opacity: 0.95;
          max-width: 280px;
        }

        .btn.transparent {
          margin: 0;
          background: rgba(255, 255, 255, 0.12);
          border: 1.5px solid rgba(255, 255, 255, 0.85);
          width: 140px;
          height: 40px;
          font-weight: 600;
          font-size: 0.82rem;
          border-radius: 8px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn.transparent:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .right-panel .content {
          transform: translateX(800px);
        }

        .container.sign-up-mode:before {
          transform: translate(100%, -50%);
          right: 52%;
        }

        .container.sign-up-mode .left-panel .content {
          transform: translateX(-800px);
        }

        .container.sign-up-mode .signin-signup {
          left: 25%;
        }

        .container.sign-up-mode form.sign-up-form {
          opacity: 1;
          z-index: 2;
        }

        .container.sign-up-mode form.sign-in-form {
          opacity: 0;
          z-index: 1;
        }

        .container.sign-up-mode .right-panel .content {
          transform: translateX(0%);
        }

        .container.sign-up-mode .left-panel {
          pointer-events: none;
        }

        .container.sign-up-mode .right-panel {
          pointer-events: all;
        }

        .container:before {
          content: "";
          position: absolute;
          height: 2200px;
          width: 2200px;
          top: -10%;
          right: 48%;
          transform: translateY(-50%);
          background: linear-gradient(135deg, #1E40AF 0%, #2563EB 55%, #3B82F6 100%);
          transition: 1.6s ease-in-out;
          border-radius: 50%;
          z-index: 6;
        }

        .social-text {
          padding: 0.5rem 0 0.3rem;
          font-size: 0.78rem;
          color: #6B7280;
        }

        .social-media {
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .social-icon {
          height: 40px;
          width: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          background: #ffffff;
          transition: all 0.2s;
          cursor: pointer;
        }

        .social-icon:hover {
          border-color: #2563EB;
          transform: translateY(-2px);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.06);
        }

        @media (max-width: 870px) {
          .container {
            min-height: 740px;
            height: auto;
            max-width: 440px;
          }
          .signin-signup {
            width: 100%;
            top: 92%;
            transform: translate(-50%, -100%);
            transition: 0.9s 0.7s ease-in-out;
          }
          .signin-signup,
          .container.sign-up-mode .signin-signup {
            left: 50%;
          }
          .panels-container {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 2fr 1fr;
          }
          .panel {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            padding: 1.8rem 6%;
            grid-column: 1 / 2;
          }
          .right-panel {
            grid-row: 3 / 4;
          }
          .left-panel {
            grid-row: 1 / 2;
          }
          .panel .content {
            padding-right: 0;
            transition: transform 0.8s ease-in-out;
            transition-delay: 0.6s;
          }
          .panel h3 {
            font-size: 1.15rem;
          }
          .panel p {
            font-size: 0.72rem;
            padding: 0.2rem 0;
            max-width: 220px;
          }
          .btn.transparent {
            width: 110px;
            height: 34px;
            font-size: 0.75rem;
          }
          .container:before {
            width: 1500px;
            height: 1500px;
            transform: translateX(-50%);
            left: 30%;
            bottom: 68%;
            right: initial;
            top: initial;
            transition: 1.8s ease-in-out;
          }
          .container.sign-up-mode:before {
            transform: translate(-50%, 100%);
            bottom: 32%;
            right: initial;
          }
          .container.sign-up-mode .left-panel .content {
            transform: translateY(-280px);
          }
          .container.sign-up-mode .right-panel .content {
            transform: translateY(0px);
          }
          .right-panel .content {
            transform: translateY(280px);
          }
          .container.sign-up-mode .signin-signup {
            top: 8%;
            transform: translate(-50%, 0);
          }
        }

        @media (max-width: 570px) {
          form {
            padding: 0 1.2rem;
          }
        }
      `}</style>

      {/* Top Brand Link */}
      <div className="mb-4">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/keh-logo.svg"
            alt="KalExamHai Logo"
            width={100}
            height={40}
            className="w-auto h-7 object-contain"
            priority
          />
        </Link>
      </div>

      <div className={isSignUp ? "container sign-up-mode" : "container"}>
        <div className="forms-container">
          <div className="signin-signup">
            {/* 1. Sign In Form */}
            <form className="sign-in-form" onSubmit={handleSignIn}>
              <h2 className="title">Sign in</h2>

              {/* Role Selector */}
              <div className="role-selector-bar">
                <button
                  type="button"
                  className={`role-btn ${role === "student" ? "active" : ""}`}
                  onClick={() => setRole("student")}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === "tutor" ? "active" : ""}`}
                  onClick={() => setRole("tutor")}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Faculty / Tutor</span>
                </button>
              </div>

              {/* Primary 1-Click Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="google-btn"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>

              <div className="auth-divider">
                <span>or sign in with email</span>
              </div>

              {errorMessage && (
                <div className="feedback-banner error">{errorMessage}</div>
              )}
              {successMessage && (
                <div className="feedback-banner success">{successMessage}</div>
              )}

              <div className="input-field">
                <i>
                  <Mail className="w-4 h-4 text-[#9CA3AF]" />
                </i>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                />
              </div>
              <div className="input-field">
                <i>
                  <Lock className="w-4 h-4 text-[#9CA3AF]" />
                </i>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                />
              </div>

              <button type="submit" disabled={isLoading} className="btn">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in as {role === "tutor" ? "Faculty" : "Student"}</span>
                )}
              </button>
            </form>

            {/* 2. Sign Up Form */}
            <form className="sign-up-form" onSubmit={handleSignUp}>
              {awaitingVerificationEmail ? (
                <div className="flex flex-col items-center text-center p-2 max-w-sm w-full">
                  <div className="w-12 h-12 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] rounded-md flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <h2 className="title text-xl mb-1">Check your inbox</h2>
                  <p className="text-xs text-[#6B7280] mb-3 leading-relaxed">
                    We sent a verification link to:
                    <br />
                    <span className="font-semibold text-[#1F2937] text-sm break-all">
                      {awaitingVerificationEmail}
                    </span>
                    <br />
                    Please click the link in your email to activate your account and start generating papers.
                  </p>

                  {resendMessage && (
                    <div className="feedback-banner success mb-2">{resendMessage}</div>
                  )}
                  {errorMessage && (
                    <div className="feedback-banner error mb-2">{errorMessage}</div>
                  )}

                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="btn"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending link...</span>
                      </>
                    ) : (
                      <span>Resend verification link</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingVerificationEmail(null);
                      setIsSignUp(false);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-[#2563EB] hover:underline mt-2 font-medium cursor-pointer"
                  >
                    &larr; Return to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="title">Create account</h2>

                  {/* Role Selector */}
                  <div className="role-selector-bar">
                    <button
                      type="button"
                      className={`role-btn ${role === "student" ? "active" : ""}`}
                      onClick={() => setRole("student")}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      className={`role-btn ${role === "tutor" ? "active" : ""}`}
                      onClick={() => setRole("tutor")}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Faculty (2 Free Credits)</span>
                    </button>
                  </div>

                  {/* Primary 1-Click Google Sign Up */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="google-btn"
                  >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                  </button>

                  <div className="auth-divider">
                    <span>or register with email</span>
                  </div>

                  {errorMessage && (
                    <div className="feedback-banner error">{errorMessage}</div>
                  )}
                  {successMessage && (
                    <div className="feedback-banner success">{successMessage}</div>
                  )}

                  <div className="input-field">
                    <i>
                      <User className="w-4 h-4 text-[#9CA3AF]" />
                    </i>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                    />
                  </div>
                  <div className="input-field">
                    <i>
                      <Mail className="w-4 h-4 text-[#9CA3AF]" />
                    </i>
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                    />
                  </div>
                  <div className="input-field">
                    <i>
                      <Lock className="w-4 h-4 text-[#9CA3AF]" />
                    </i>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Password (min 6 chars)"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                    />
                  </div>

                  <button type="submit" disabled={isLoading} className="btn">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <span>
                        Register as {role === "tutor" ? "Faculty" : "Student"}
                      </span>
                    )}
                  </button>
                </>
              )}
            </form>
          </div>
        </div>

        {/* Sliding Side Panels */}
        <div className="panels-container">
          <div className="panel left-panel">
            <div className="content">
              <h3>New here?</h3>
              <p>
                Get instant access to verified Mumbai University NEP-2020 question papers &amp; exam cram kits.
              </p>
              <button
                type="button"
                className="btn transparent"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage(null);
                }}
              >
                Sign up
              </button>
            </div>
          </div>

          <div className="panel right-panel">
            <div className="content">
              <h3>Already registered?</h3>
              <p>Welcome back! Sign in to continue preparing or generating question papers.</p>
              <button
                type="button"
                className="btn transparent"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage(null);
                }}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/"
          className="text-xs text-[#6B7280] hover:text-[#2563EB] transition-colors"
        >
          &larr; Return to main entrance
        </Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
