import { renderToStaticMarkup } from "react-dom/server";
import LandingPagePreview from "@/components/generatedLanding/LandingPagePreview";
import { compiledTailwindCSS } from "@/utils/compiledTailwind";



export function cleanAndDownloadHTML(data: any) {
  // Define the desired fixed desktop width (e.g., Tailwind's 'xl' breakpoint)
  

  // Step 1: Render app preview to raw markup
  const rawMarkup = renderToStaticMarkup(
    // Pass a prop to indicate rendering for static export if needed
    // e.g., <LandingPagePreview data={data} dispatch={() => {}} isStaticExport={true} />
    // This allows LandingPagePreview or its children to omit editor-specific wrappers/styles
    <LandingPagePreview data={data} dispatch={() => {}} />
  );

  // Step 2: Clean contentEditable + editing classes (if still needed after potential isStaticExport prop)
  const doc = new DOMParser().parseFromString(rawMarkup, "text/html");
  const editableEls = doc.querySelectorAll("[contenteditable]");

  editableEls.forEach((el) => {
    el.removeAttribute("contenteditable");
    // Remove any other temporary editing-related classes/attributes
    el.classList.remove(
      "outline-none",
      "cursor-text",
      "focus:ring-2",
      "focus:ring-blue-500"
      // Add any other classes specific to your editor state
    );
  });

  // It might be cleaner to get the direct children of body if LandingPagePreview renders a single root div
  // Or adjust based on the actual structure rendered by LandingPagePreview
  const cleanedMarkup = doc.body.innerHTML
  
  .trim();

  
  
  const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Landing Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
  ${compiledTailwindCSS}
  
</style>

  <style>
    body { margin: 0; }
    body > div { width: 100%; }
  </style>
</head>
<body>
  ${cleanedMarkup}
</body>
</html>
`.trim();


  // Step 5: Trigger download (remains the same)
  const blob = new Blob([fullHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "landing-page.html";
  document.body.appendChild(a); // Required for Firefox
  a.click();
  document.body.removeChild(a); // Clean up
  URL.revokeObjectURL(url);
}