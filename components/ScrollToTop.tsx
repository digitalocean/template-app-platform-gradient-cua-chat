'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // Find the main scrollable container
    const scrollContainer = document.querySelector('main');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
    // Also scroll window to top as fallback
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}