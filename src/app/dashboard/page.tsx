import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import Header from '@/components/dashboard/Header';
import Footer from '@/components/shared/Footer';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EmptyState from '@/components/dashboard/EmptyState';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      projects: {
        include: {
    token: true,
  },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  const projects = user?.projects ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-text font-body">
      <Header />
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-8">
        <DashboardHeader />

        {projects.length > 0 ? (
          <section className="space-y-4 mt-4">
            <h2 className="text-sm uppercase text-brand-mutedText tracking-wide">
              Recent Projects
            </h2>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={{
                  id: project.id,
                  name: project.title || 'Untitled Project',
                  status: project.status === 'published' ? 'Published' : 'Draft',
                  updatedAt: project.updatedAt.toISOString(),
                   tokenId: project.token.value,
                }}
              />
            ))}
          </section>
        ) : (
          <EmptyState />
        )}
      </main>
      <Footer />
    </div>
  );
}
