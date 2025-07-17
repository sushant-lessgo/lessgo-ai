import Logo from "@/components/shared/Logo"

export default function Header() {
  return (
    <header className="w-full border-b px-6 py-4 bg-white flex justify-center shadow-sm z-20">
      <div className="flex flex-col items-center pb-10">
        <Logo size={240} />
      </div>
    </header>
  )
}
