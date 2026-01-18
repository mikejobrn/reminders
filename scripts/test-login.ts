import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function testLogin() {
    const email = "teste@lembretes.app";
    const password = "123456";

    console.log("🔍 Testando login...");
    console.log(`Email: ${email}`);
    console.log(`Senha: ${password}`);
    console.log("");

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log("❌ Usuário não encontrado!");
        return;
    }

    console.log("✅ Usuário encontrado:");
    console.log(`  ID: ${user.id}`);
    console.log(`  Nome: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password hash: ${user.password?.substring(0, 20)}...`);
    console.log("");

    if (!user.password) {
        console.log("❌ Usuário não tem senha!");
        return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
        console.log("✅ Senha válida! Login deve funcionar.");
    } else {
        console.log("❌ Senha inválida!");
        console.log("");
        console.log("Testando criar novo hash...");
        const newHash = await bcrypt.hash(password, 10);
        console.log(`Novo hash: ${newHash}`);
    }

    await prisma.$disconnect();
}

testLogin().catch(console.error);
