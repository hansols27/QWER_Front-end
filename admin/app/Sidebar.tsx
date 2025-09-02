"use client"

import Link from "next/link"
import { routes } from '@/app/routes'

export default function Sidebar() {
  return (
    <aside className="w-60 min-h-screen border-r border-gray-200 bg-white">
      <div className="p-4 flex items-center justify-center">
        <img src="/logo.svg" alt="Logo" className="w-32" />
      </div>
      <nav>
        <ul>
          {routes.map((route) => (
            <li key={route.title} className="p-3 hover:bg-gray-100 flex items-center gap-2">
              {route.icon}
              <Link href={route.href}>{route.title}</Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
