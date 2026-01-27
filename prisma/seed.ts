import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await prisma.user.upsert({
    where: { email: "teste@lembretes.app" },
    update: {},
    create: {
      email: "teste@lembretes.app",
      name: "Usuário Teste",
      password: hashedPassword,
      timezone: "America/Sao_Paulo",
    },
  });

  console.log("✅ Usuário de teste criado:", {
    email: user.email,
    name: user.name,
  });

  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      completedPosition: "MOVE_TO_BOTTOM",
      completedVisibility: "SHOW_TODAY_ONLY",
      undoTimeoutSeconds: 5,
      confirmBeforeDelete: true,
    },
  });

  console.log("✅ Preferências padrão criadas para o usuário de teste");

  const lists = await prisma.list.createMany({
    data: [
      {
        name: "Lembretes",
        color: "blue",
        icon: "list",
        userId: user.id,
        order: 0,
      },
      {
        name: "Pessoal",
        color: "purple",
        icon: "person",
        userId: user.id,
        order: 1,
      },
      {
        name: "Trabalho",
        color: "orange",
        icon: "briefcase",
        userId: user.id,
        order: 2,
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ ${lists.count} listas criadas`);

  const lembretesListId = await prisma.list.findFirst({
    where: { userId: user.id, name: "Lembretes" },
    select: { id: true },
  });

  if (lembretesListId) {
    await prisma.reminder.createMany({
      data: [
        {
          title: "Bem-vindo ao Lembretes!",
          notes: "Este é um lembrete de exemplo. Você pode editá-lo ou excluí-lo.",
          listId: lembretesListId.id,
          completed: false,
          priority: "NONE",
        },
        {
          title: "Testar dark mode",
          notes: "Clique no ícone de lua/sol para alternar entre os temas",
          listId: lembretesListId.id,
          completed: false,
          priority: "LOW",
        },
        {
          title: "Criar uma nova lista",
          notes: "Clique em 'Adicionar Lista' para organizar seus lembretes",
          listId: lembretesListId.id,
          completed: true,
          priority: "NONE",
        },
      ],
      skipDuplicates: true,
    });

    console.log("✅ Lembretes de exemplo criados");
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("\n📧 Login de teste:");
  console.log("   Email: teste@lembretes.app");
  console.log("   Senha: 123456");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
