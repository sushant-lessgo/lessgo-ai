import Logo from "@/components/shared/Logo"

export default function Header() {
  return (
    <header className="w-full border-b px-4 bg-white flex justify-center">
      <div className="flex flex-col items-center pb-10">
        <Logo size={240} />
        {/* <div className="mt-1 text-sm text-gray-700 font-medium tracking-wide text-center">
          Pretty doesn’t sell
        </div> */}
      </div>
    </header>
  )
}
