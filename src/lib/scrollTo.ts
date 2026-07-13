export function scrollToHash(hash: string) {
  const id = hash.replace('#', '');
  if (!id) return;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function handleNavClick(e: React.MouseEvent, path: string) {
  const hashIndex = path.indexOf('#');
  if (hashIndex >= 0 && (path.startsWith('/#') || path.startsWith('#'))) {
    const hash = path.substring(hashIndex);
    const route = path.substring(0, hashIndex) || '/';
    if (window.location.pathname === route || route === '/') {
      e.preventDefault();
      scrollToHash(hash);
      return true;
    }
  }
  return false;
}
