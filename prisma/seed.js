import "dotenv/config";
import prisma from "../src/lib/prisma.js";

async function main() {
    await prisma.role.upsert({
        where: { roleid: 1 },
        update: { rolename: "customer" },
        create: {
            roleid: 1,
            rolename: "customer",
        },
    });

    await prisma.memberShip.upsert({
        where: { mid: 1 },
        update: {
            mname: "Basic",
            score: 0,
        },
        create: {
            mid: 1,
            mname: "Basic",
            score: 0,
        },
    });

    console.log("Default role and membership created.");
}

main()
    .catch((error) => {
        console.error("Seed error:", error);
        process.exitCode = 1;
    })
    .finally(async() => {
        await prisma.$disconnect();
    });