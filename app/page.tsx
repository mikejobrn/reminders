"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/lists");
  }, [router]);

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="text-[--color-ios-gray-1] dark:text-[--color-ios-dark-gray-1]">
        Carregando...
      </div>
    </div>
  );
}
