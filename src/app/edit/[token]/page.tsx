"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditProvider } from "@/components/EditProvider";
import { EditLayout } from "./components/layout/EditLayout";
import { EditLayoutErrorBoundary } from "@/app/edit/[token]/components/layout/EditLayoutErrorBoundary";


export default function EditPage() {
  const params = useParams();
  const router = useRouter();
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
  
  const [loadingState, setLoadingState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // The EditProvider handles store initialization
  useEffect(() => {
    setLoadingState('success');
  }, []);

  // The EditProvider handles loading and error states, so we just render the layout
  return <EditLayout tokenId={tokenId} />;
}