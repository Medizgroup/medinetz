import prisma from "../prisma";

const THREE_WEEKS_MS = 1000 * 60 * 60 * 24 * 21;

export async function getNews() {
  const news = await prisma.news.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const threshold = new Date(Date.now() - THREE_WEEKS_MS);
  const recentCount = news.filter((n) => n.createdAt >= threshold).length;

  return { news, recentCount };
}
