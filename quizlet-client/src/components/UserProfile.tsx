import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import React from "react";
import { useAuth } from "../context/useAuth";

export default function UserProfile() {
  const { user, logout } = useAuth();
  return (
    <div className="text-right">
      <Menu>
        <MenuButton
          className={
            "px-4 py-3 font-mono text-xl font-bold text-blue-200 bg-blue-800 cursor-pointer hover:text-blue-800 hover:bg-yellow-500"
          }
        >
          profile
        </MenuButton>
        <MenuItems
          transition
          anchor="bottom end"
          className="my-4 font-mono text-l origin-top-right text-blue-800 border-white/5 bg-blue-100 shadow-lg transition duration-300 ease-out [--anchor-gap:var(--spacing-1)]"
        >
          <MenuItem>
            <a className="group flex w-full items-center gap-2 py-1.5 px-3 data-[focus]:bg-blue-200">
              <img
                src="https://randomuser.me/api/portraits/lego/1.jpg"
                alt="avatar"
                className="object-cover rounded-full size-8"
              />
              <span>{user?.username}</span>
            </a>
          </MenuItem>
          <div className="h-px my-1 bg-black/5" />

          <MenuItem>
            <a
              className="group flex w-full items-center gap-2 py-1.5 px-3 data-[focus]:bg-blue-200"
              href="/achievements"
            >
              achievements
            </a>
          </MenuItem>
          <MenuItem>
            <a
              className="group flex w-full items-center gap-2 py-1.5 px-3 data-[focus]:bg-blue-200"
              href="/history"
            >
              history
            </a>
          </MenuItem>

          <MenuItem>
            <a
              className="group flex w-full items-center gap-2 py-1.5 px-3 data-[focus]:bg-blue-200"
              href="/settings"
            >
              settings
            </a>
          </MenuItem>
          <MenuItem>
            <a
              className="group flex w-full items-center gap-2 py-1.5 px-3 data-[focus]:bg-blue-200"
              href="/darkmode"
            >
              darkmode
            </a>
          </MenuItem>
          <div className="h-px my-1 bg-black/5" />

          <MenuItem>
            <div
              className="group flex w-full items-center gap-2 py-1.5 px-3 data-[focus]:bg-blue-200"
              onClick={logout}
            >
              logout
            </div>
          </MenuItem>
        </MenuItems>
      </Menu>
    </div>
  );
}
