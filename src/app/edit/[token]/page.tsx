"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditProvider, useEditStoreContext } from "@/components/EditProvider";
import { EditLayout } from "./components/layout/EditLayout";
import PageRevealAnimation from "@/components/reveal/PageRevealAnimation";
import { EditLayoutErrorBoundary } from "@/app/edit/[token]/components/layout/EditLayoutErrorBoundary";
import { ToastProvider } from "./components/ui/ToastProvider";
import { DialogHost } from "@/components/ui/ConfirmDialog";
// billing-beta phase 4: without this host, a credit-blocked AI op in the editor
// emits on creditsBlockedBus with nobody listening — i.e. fails silently, the
// exact bug the slice exists to kill. e2e/billing-beta.spec.ts pins the mount.
import { CreditsBlockedHost } from "@/components/billing/CreditsBlockedHost";


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
        <ToastProvider>
          <EditPageContent tokenId={tokenId} />
          <DialogHost />
          <CreditsBlockedHost />
        </ToastProvider>
      </EditLayoutErrorBoundary>
    </EditProvider>
  );
}

// Separate component for the actual page logic
function EditPageContent({ tokenId }: { tokenId: string }) {
  const router = useRouter();
  const { store, sections } = useEditStoreContext();

  // ── Reveal fold (editor-route-consolidation phase 5) ──────────────────────
  // The work journey used to reveal the finished site in a journey STEP 06
  // (`/preview?chrome=0` iframe). That folded onto the editor: StepBuilding /
  // resume now `router.push('/edit/{token}?reveal=1')`, and here we consume it.
  //
  // ⚠️ SUSPENSE TRAP: this codebase's `next build` HARD-FAILS with
  // `missing-suspense-with-csr-bailout` if `useSearchParams` is used without a
  // <Suspense> boundary. We deliberately read `window.location.search` in a
  // mount effect instead — no Suspense needed, and this subtree is already
  // '"use client"' + client-only (behind EditProvider's hydration gate).
  const [revealing, setRevealing] = useState(false);
  const revealHandled = useRef(false);

  useEffect(() => {
    if (revealHandled.current) return; // once per mount (StrictMode double-invoke safe)
    revealHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('reveal') !== '1') return;
    // Reveal = the clean site first (preview mode); the header segmented control
    // is the "go edit" affordance. loadFromDraft never touches `mode`, so this
    // survives the async draft load.
    store?.getState().setMode('preview');
    setRevealing(true);
    // Strip the param so a refresh / back-navigation never re-animates.
    router.replace(`/edit/${tokenId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The EditProvider handles loading and error states; we just render the layout,
  // wrapped in the reveal animation for the one first-load reveal paint.
  if (revealing) {
    return (
      <PageRevealAnimation sectionsCount={sections.length}>
        <EditLayout tokenId={tokenId} />
      </PageRevealAnimation>
    );
  }
  return <EditLayout tokenId={tokenId} />;
}