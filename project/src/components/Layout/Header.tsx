import React from 'react'
import { Menu } from 'lucide-react'

interface HeaderProps {
  onMenuToggle: () => void
  title: string
}

export function Header({ onMenuToggle, title }: HeaderProps) {
  return (
    <header className="bg-[#003366] text-white shadow-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md hover:bg-[#004080] transition-colors lg:hidden"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold">Kampanjkompanjonen</h1>
          </div>
        </div>
      </div>
    </header>
  )
}