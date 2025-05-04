export default function InstructionNote() {
    return (
      <div className="bg-brand-highlightBG text-brand-mutedText border-l-4 border-brand-accentPrimary p-4 text-sm rounded">
        <p className="mb-2 font-semibold text-brand-text">How this works</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            This landing page was generated from a single line of input. Every word is chosen to drive conversion.
          </li>
          <li>
            You can edit any text by double-clicking. (Customization options like fonts, colors, and layout are coming soon.)
          </li>
          <li>
            Download the HTML and make further edits—images, styles, anything you want.
          </li>
          <li>
            Upcoming features: login, dashboards, and one-click publish.
          </li>
          <li>
            Want to shape what we build next? Book a 15-minute call with the founder.
          </li>
        </ul>
      </div>
    )
  }
  