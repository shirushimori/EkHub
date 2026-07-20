import { useState, useCallback } from "react";
import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileDrawer } from "./MobileDrawer";
import { SearchModal } from "./SearchModal";

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar onMenuToggle={toggleMenu} onSearchOpen={openSearch} />
      <Sidebar />
      <MobileDrawer open={mobileMenuOpen} onClose={closeMenu} onSearchOpen={openSearch} />
      <SearchModal open={searchOpen} onClose={closeSearch} />

      <main className="pt-14 pb-20 lg:ml-56 lg:pb-0">
        <Outlet />
      </main>

      <BottomNav onSearchOpen={openSearch} />
    </div>
  );
}
