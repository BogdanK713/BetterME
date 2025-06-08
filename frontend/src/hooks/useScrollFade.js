import { useEffect } from "react";

export default function useScrollFade(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const container = el.parentElement;
    function check() {
      const atTop = el.scrollTop <= 2;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
      container.classList.toggle("scrolled-to-top", atTop);
      container.classList.toggle("scrolled-to-bottom", atBottom);
    }
    el.addEventListener("scroll", check);
    window.addEventListener("resize", check);
    setTimeout(check, 20);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [ref]);
}
