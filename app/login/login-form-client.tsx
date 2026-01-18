"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IoMailOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

interface LoginFormClientProps {
    action: (formData: FormData) => Promise<{ error?: string } | void>;
}

export default function LoginFormClient({ action }: LoginFormClientProps) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("[CLIENT] Form submit started");
        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        console.log("[CLIENT] FormData created, calling action...");

        const result = await action(formData);
        console.log("[CLIENT] Action returned:", result);

        if (result?.error) {
            console.log("[CLIENT] Error received:", result.error);
            setError(result.error);
            setLoading(false);
        } else {
            console.log("[CLIENT] No error, waiting for redirect...");
        }
        // Se não houver erro, o redirect acontece automaticamente via server action
    };

    return (
        <>
            <div className="bg-white dark:bg-(--color-ios-dark-gray-6) rounded-[10px] shadow-sm overflow-hidden mb-4">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="px-4 py-3 bg-(--color-ios-red)/10 border-b border-(--color-ios-separator) dark:border-(--color-ios-dark-separator)">
                            <p className="text-[13px] text-(--color-ios-red) text-center">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center px-4 py-3 border-b border-(--color-ios-separator) dark:border-(--color-ios-dark-separator)">
                        <IoMailOutline className="text-(--color-ios-secondary-label) dark:text-(--color-ios-dark-secondary-label) text-xl mr-3" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            required
                            autoComplete="email"
                            className="flex-1 bg-transparent text-[17px] text-(--color-ios-label) dark:text-white placeholder:text-(--color-ios-tertiary-label) dark:placeholder:text-(--color-ios-dark-tertiary-label) outline-none"
                        />
                    </div>

                    <div className="flex items-center px-4 py-3">
                        <IoLockClosedOutline className="text-(--color-ios-secondary-label) dark:text-(--color-ios-dark-secondary-label) text-xl mr-3" />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Senha"
                            required
                            autoComplete="current-password"
                            className="flex-1 bg-transparent text-[17px] text-(--color-ios-label) dark:text-white placeholder:text-(--color-ios-tertiary-label) dark:placeholder:text-(--color-ios-dark-tertiary-label) outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-(--color-ios-blue) p-1"
                        >
                            {showPassword ? <IoEyeOffOutline className="text-xl" /> : <IoEyeOutline className="text-xl" />}
                        </button>
                    </div>

                    <div className="px-4 py-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-(--color-ios-blue) text-white text-[17px] font-semibold py-3 rounded-[10px] active:opacity-80 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="text-center">
                <button
                    onClick={() => router.push("/register")}
                    className="text-[17px] text-(--color-ios-blue) active:opacity-70 transition-opacity"
                >
                    Não tem uma conta? Criar conta
                </button>
            </div>
        </>
    );
}
