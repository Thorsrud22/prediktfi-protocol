import { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'System Status • Predikt',
  description: 'Current system status and build information.',
};

export default async function StatusPage() {
  const headersList = await headers();
  const plan = headersList.get('x-plan') || 'free';
  
  // Get build info from Vercel environment variables
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown';
  const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || 'unknown';
  const commitAuthor = process.env.VERCEL_GIT_COMMIT_AUTHOR_LOGIN || 'unknown';
  const buildTime = process.env.BUILD_TIME || new Date().toISOString();
  const nodeEnv = process.env.NODE_ENV || 'development';
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'development';
  const githubRepo = process.env.GITHUB_REPOSITORY || process.env.VERCEL_GIT_REPO_SLUG;

  return (
    <div className="min-h-screen bg-[--background]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[--text] mb-2">System Status</h1>
          <p className="text-[--muted]">Current system information and health status</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Plan Status */}
          <div className="bg-[--surface] border border-[--border] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Plan Status</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                plan === 'pro' 
                  ? 'bg-gradient-to-r from-[#FF6B35] to-[#F7931E] text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {plan.toUpperCase()}
              </span>
              <span className="text-sm text-[--muted]">
                Current user plan
              </span>
            </div>
          </div>

          {/* Health Status */}
          <div className="bg-[--surface] border border-[--border] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[--text] mb-4">Health Status</h2>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-[--text]">System Operational</span>
            </div>
            <div className="mt-2">
              <Link 
                href="/api/_internal/health"
                className="text-sm text-[--accent] hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Check Health Endpoint →
              </Link>
            </div>
          </div>
        </div>

        {/* Build Information */}
        <div className="bg-[--surface] border border-[--border] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[--text] mb-4">Build Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-[--text]">Environment:</span>
              <span className="ml-2 text-[--muted]">{appEnv}</span>
            </div>
            <div>
              <span className="font-medium text-[--text]">Node ENV:</span>
              <span className="ml-2 text-[--muted]">{nodeEnv}</span>
            </div>
            <div>
              <span className="font-medium text-[--text]">Commit SHA:</span>
              {commitSha !== 'unknown' && githubRepo ? (
                <a 
                  href={`https://github.com/${githubRepo}/commit/${commitSha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 font-mono text-[--accent] hover:underline"
                >
                  {commitSha.slice(0, 8)}
                </a>
              ) : (
                <span className="ml-2 font-mono text-[--muted]">{commitSha.slice(0, 8)}</span>
              )}
            </div>
            <div>
              <span className="font-medium text-[--text]">Build Time:</span>
              <span className="ml-2 text-[--muted]">{buildTime}</span>
            </div>
            {commitMessage !== 'unknown' && (
              <div className="md:col-span-2">
                <span className="font-medium text-[--text]">Last Commit:</span>
                <span className="ml-2 text-[--muted]">{commitMessage}</span>
              </div>
            )}
            {commitAuthor !== 'unknown' && (
              <div>
                <span className="font-medium text-[--text]">Author:</span>
                <span className="ml-2 text-[--muted]">{commitAuthor}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/" className="text-[--accent] hover:underline">Home</Link>
            <Link href="/account" className="text-[--accent] hover:underline">Account</Link>
            <Link href="/pricing" className="text-[--accent] hover:underline">Pricing</Link>
            <Link href="/api/_internal/health" className="text-[--accent] hover:underline">Health API</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
