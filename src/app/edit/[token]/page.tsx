"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { EditProvider } from "@/components/EditProvider";
import { EditLayout } from "./components/layout/EditLayout";
import { EditLayoutErrorBoundary } from "@/app/edit/[token]/components/layout/EditLayoutErrorBoundary";


export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenId = params?.token as string;
  
  if (!tokenId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid URL</h2>
          <p className="text-gray-600 mb-6">No token provided in URL</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <EditProvider 
      tokenId={tokenId}
      options={{
        showLoadingState: true,
        showErrorBoundary: true,
        resetOnTokenChange: true,
      }}
    >
      <EditLayoutErrorBoundary tokenId={tokenId}>
        <EditPageContent tokenId={tokenId} />
      </EditLayoutErrorBoundary>
    </EditProvider>
  );
}

// Separate component for the actual page logic
function EditPageContent({ tokenId }: { tokenId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Check if this is a migration from generate page
  const isMigrated = searchParams.get('migrated') === 'true';

  // The EditProvider handles store initialization, so we just need to handle migration logic
  useEffect(() => {
    // If coming from migration, we're already set up by the provider
    if (isMigrated) {
      console.log('🔄 Edit page initialized from migration');
    }
    setLoadingState('success');
  }, [isMigrated]);

  // The EditProvider handles loading and error states, so we just render the layout
  return <EditLayout tokenId={tokenId} />;
}