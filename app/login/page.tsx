import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import LoginFormClient from "./login-form-client";

async function handleLogin(formData: FormData) {
  "use server";

  console.log("[SERVER] Login action called");
  console.log("[SERVER] Email:", formData.get("email"));

  try {
    console.log("[SERVER] Calling signIn with redirectTo...");
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/lists",
    });
    console.log("[SERVER] signIn completed - should have redirected");
  } catch (error) {
    console.error("[SERVER] Caught error:", error);
    console.error("[SERVER] Error type:", error?.constructor?.name);

    if (error instanceof AuthError) {
      console.log("[SERVER] Returning auth error");
      return { error: "Email ou senha inválidos" };
    }

    // NextAuth lança NEXT_REDIRECT para navegação
    throw error;
  }
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
