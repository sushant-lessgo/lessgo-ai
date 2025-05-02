type Props = {
  title: React.ReactNode
  subtitle: string
  align?: "left" | "center"
}

export default function PageIntro() {
  
  return (
    <div className={"text-center"}>
 <h1 className="text-2xl md:text-heading2 font-bold text-brand-logo mb-5 md:mb-3 leading-snug text-center">
  <span className="inline md:hidden">Build super high-converting landing page in minutes</span>
  <span className="hidden md:inline">
    Build super high-converting landing page <br /> with <span className="text-brand-accentPrimary">crystal&nbsp;clear&nbsp;copy</span> in minutes.
  </span>
</h1>
<p className="text-base md:text-xl text-brand-mutedText font-medium leading-relaxed text-center">
  <span className="inline md:hidden">
    Just describe your idea in one line...<br />we'll handle the rest
  </span>
  <span className="hidden md:inline">
    Just describe your idea in one line... we'll handle the rest
  </span>
</p>

</div>

  )
}
