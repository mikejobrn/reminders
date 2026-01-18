import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import LoginFormClient from "./login-form-client";

async function handleLogin(formData: FormData) {
  "use server";
  
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("[LOGIN] Server action called", { email });

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    
    console.log("[LOGIN] Sign in successful");
  } catch (error) {
    console.error("[LOGIN] Sign in error:", error);
    
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos" };
    }
    throw error;
  }
  
  // Se chegou aqui, login foi bem sucedido
  redirect("/lists");
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-ios-gray-6) dark:bg-black px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-(--color-ios-blue) mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-[34px] font-bold text-(--color-ios-label) dark:text-white mb-2">
            Lembretes
          </h1>
          <p className="text-[17px] text-(--color-ios-secondary-label) dark:text-(--color-ios-dark-secondary-label)">
            Bem-vindo de volta!
          </p>
        </div>

        <LoginFormClient action={handleLogin} />
      </div>
    </div>
  );
}
