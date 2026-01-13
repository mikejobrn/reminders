"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoPersonCircleOutline, IoMailOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não correspondem");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-ios-system-gray-6] dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[--color-ios-blue] mb-4">
            <IoPersonCircleOutline className="text-white text-5xl" />
          </div>
          <h1 className="text-[34px] font-bold text-[--color-ios-label] dark:text-white mb-2">
            Criar Conta
          </h1>
          <p className="text-[17px] text-[--color-ios-secondary-label] dark:text-[--color-ios-dark-secondary-label]">
            Gerencie seus lembretes em qualquer lugar
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
              <IoPersonCircleOutline className="text-[--color-ios-secondary-label] dark:text-[--color-ios-dark-secondary-label] text-xl mr-3" />
              <input
                type="text"
                placeholder="Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="flex-1 bg-transparent text-[17px] text-[--color-ios-label] dark:text-white placeholder:text-[--color-ios-tertiary-label] dark:placeholder:text-[--color-ios-dark-tertiary-label] outline-none"
              />
            </div>

            <div className="flex items-center px-4 py-3 border-b border-[--color-ios-separator] dark:border-[--color-ios-dark-separator]">
              <IoMailOutline className="text-[--color-ios-secondary-label] dark:text-[--color-ios-dark-secondary-label] text-xl mr-3" />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="flex-1 bg-transparent text-[17px] text-[--color-ios-label] dark:text-white placeholder:text-[--color-ios-tertiary-label] dark:placeholder:text-[--color-ios-dark-tertiary-label] outline-none"
              />
            </div>

            <div className="flex items-center px-4 py-3 border-b border-[--color-ios-separator] dark:border-[--color-ios-dark-separator]">
              <IoLockClosedOutline className="text-[--color-ios-secondary-label] dark:text-[--color-ios-dark-secondary-label] text-xl mr-3" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
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

            <div className="flex items-center px-4 py-3">
              <IoLockClosedOutline className="text-[--color-ios-secondary-label] dark:text-[--color-ios-dark-secondary-label] text-xl mr-3" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar Senha"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="flex-1 bg-transparent text-[17px] text-[--color-ios-label] dark:text-white placeholder:text-[--color-ios-tertiary-label] dark:placeholder:text-[--color-ios-dark-tertiary-label] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-[--color-ios-blue] p-1"
              >
                {showConfirmPassword ? <IoEyeOffOutline className="text-xl" /> : <IoEyeOutline className="text-xl" />}
              </button>
            </div>

            <div className="px-4 py-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[--color-ios-blue] text-white text-[17px] font-semibold py-3 rounded-[10px] active:opacity-80 disabled:opacity-50 transition-opacity"
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-[17px] text-[--color-ios-blue] active:opacity-70 transition-opacity"
          >
            Já tem uma conta? Entrar
          </button>
        </div>
      </div>
    </div>
  );
}
