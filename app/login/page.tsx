"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { IoMailOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
        return;
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/lists";
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-ios-system-gray-6] dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[--color-ios-blue] mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-[34px] font-bold text-[--color-ios-label] dark:text-white mb-2">
            Lembretes
          </h1>
          <p className="text-[17px] text-[--color-ios-secondary-label] dark:text-[--color-ios-dark-secondary-label]">
            Bem-vindo de volta!
          </p>
        </div>

        <div className="bg-white dark:bg-[--color-ios-dark-gray-6] rounded-[10px] shadow-sm overflow-hidden mb-4">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="px-4 py-3 bg-[--color-ios-red]/10 border-b border-[--color-ios-separator] dark:border-[--color-ios-dark-separator]">
                <p className="text-[13px] text-[--color-ios-red] text-center">{error}</p>
              </div>
            )}

            <div className="flex items-center px-4 py-3 border-b border-[--color-ios-separator] dark:border-[--color-ios-dark-separator]">
              <IoMailOutline className="text-[--color-ios-secondary-label] dark:text-[--color-ios-dark-secondary-label] text-xl mr-3" />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
                className="flex-1 bg-transparent text-[17px] text-[--color-ios-label] dark:text-white placeholder:text-[--color-ios-tertiary-label] dark:placeholder:text-[--color-ios-dark-tertiary-label] outline-none"
              />
            </div>

            <div className="flex items-center px-4 py-3">
              <IoLockClosedOutline className="text-[--color-ios-secondary-label] dark:text-[--color-ios-dark-secondary-label] text-xl mr-3" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete="current-password"
                className="flex-1 bg-transparent text-[17px] text-[--color-ios-label] dark:text-white placeholder:text-[--color-ios-tertiary-label] dark:placeholder:text-[--color-ios-dark-tertiary-label] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[--color-ios-blue] p-1"
              >
                {showPassword ? <IoEyeOffOutline className="text-xl" /> : <IoEyeOutline className="text-xl" />}
              </button>
            </div>

            <div className="px-4 py-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[--color-ios-blue] text-white text-[17px] font-semibold py-3 rounded-[10px] active:opacity-80 disabled:opacity-50 transition-opacity"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push("/register")}
            className="text-[17px] text-[--color-ios-blue] active:opacity-70 transition-opacity"
          >
            Não tem uma conta? Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}
