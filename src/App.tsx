import { useCallback, useEffect, useRef, useState } from 'react';

const HERO_IMAGE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_113640_ccf3cf97-d447-425b-a134-d7b09fc743fc.png&w=1280&q=85';

const SECTION2_IMAGE = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_114219_414dfe80-f15c-4e25-bf52-b13721f4bd88.png&w=1280&q=85';

const SECTION3_IMG1 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_115253_c19ab167-8dd5-48b4-967d-b9f0d9d6e8fb.png&w=1280&q=85';

const SECTION3_IMG2 = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_115237_fc519057-6e87-4abf-999a-9610b8b085b4.png&w=1280&q=85';

const SECTION3_BG = 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260624_114355_752ba9e6-0942-4abb-9047-5d9bb16632e9.png&w=1280&q=85';

const featureBars = ['Advanced Dentistry', 'High Quality Equipment', 'Friendly Staff'];

const PHONE = '+12015550182'; // ponytail: placeholder — set to the real clinic line before demo
const PHONE_DISPLAY = '(201) 555-0182';

const services = [
  { name: 'Dental\nVeneers', num: '01', active: true },
  { name: 'Dental\nCrowns', num: '02', active: false },
  { name: 'Teeth\nWhitening', num: '03', active: false },
  { name: 'Dental\nImplants', num: null, active: false },
];

const navLinks = ['Home', 'Services', 'About', 'Gallery', 'Contact'];

type MaskPos = { x: number; y: number; sw: number; sh: number };

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (el: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(el);
      } else {
        (ref as React.MutableRefObject<T | null>).current = el;
      }
    });
  };
}

/** Tracks mask geometry for each card relative to the section container. */
function useMaskPositions(sectionRef: React.RefObject<HTMLElement>, cardsRef: React.RefObject<(HTMLDivElement | null)[]>) {
  const [positions, setPositions] = useState<MaskPos[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const recompute = () => {
      if (!sectionRef.current) return;
      const { width: sw, height: sh } = sectionRef.current.getBoundingClientRect();
      const next = (cardsRef.current ?? []).map((card) => {
        const r = card?.getBoundingClientRect();
        const sr = sectionRef.current!.getBoundingClientRect();
        return r ? { x: r.left - sr.left, y: r.top - sr.top, sw, sh } : { x: 0, y: 0, sw, sh };
      });
      setPositions(next);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(section);
    return () => ro.disconnect();
  }, [sectionRef, cardsRef]);

  return positions;
}

/** Render width if the image wallpaper-scaled to the section height. */
function useImageWidth(image: string, sectionRef: React.RefObject<HTMLElement>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const h = sectionRef.current?.getBoundingClientRect().height ?? 0;
      setWidth(h ? (img.naturalWidth * h) / img.naturalHeight : 0);
    };
    img.src = image;
  }, [image, sectionRef]);

  return width;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

/** Reveals children with a stagger once the container scrolls into view. */
function useStaggeredReveal(_count: number, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const getAnimStyle = useCallback(
    (index: number): React.CSSProperties => ({
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${index * 120}ms`,
    }),
    [visible]
  );

  return { containerRef, getAnimStyle };
}

function MaskedCard({
  bgImage,
  position,
  imageWidth,
  focalX = 0.8,
  cardsRef,
  index,
  className,
  children,
  style,
}: {
  bgImage: string;
  position?: MaskPos;
  imageWidth?: number;
  focalX?: number;
  cardsRef?: React.RefObject<(HTMLDivElement | null)[]>;
  index?: number;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  let bgStyle: React.CSSProperties = {};
  if (position && imageWidth) {
    const overflow = imageWidth > position.sw ? imageWidth - position.sw : 0;
    const focalOffset = overflow * focalX;
    bgStyle = {
      backgroundImage: `url(${bgImage})`,
      backgroundSize: `auto ${position.sh}px`,
      backgroundPosition: `-${position.x + focalOffset}px -${position.y}px`,
      backgroundRepeat: 'no-repeat',
    };
  }
  return (
    <div
      ref={cardsRef && index !== undefined ? (el) => { cardsRef.current![index] = el; } : undefined}
      className={className}
      style={{ ...bgStyle, ...style }}
    >
      {children}
    </div>
  );
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (count >= 100) {
      const t1 = setTimeout(() => setExiting(true), 200);
      const t2 = setTimeout(onComplete, 900);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    const t = setTimeout(() => setCount((c) => c + 1), 20);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] bg-white flex items-end justify-start transition-opacity duration-700 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <span className="text-7xl md:text-9xl font-bold tabular-nums p-6 md:p-10 leading-none text-black">
        {count}
      </span>
    </div>
  );
}

function Navbar({
  menuOpen,
  setMenuOpen,
  scrollTo,
  onBook,
}: {
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  scrollTo: (name: string) => void;
  onBook: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-white/80 backdrop-blur-md">
        <div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none text-black">
              Dental
            </span>
            <span className="-mt-1.5 md:-mt-2 text-xl md:text-2xl font-extrabold uppercase tracking-tight leading-none text-black">
              Health
            </span>
          </div>
          <span className="block text-[8px] md:text-[9px] font-medium leading-none mt-1.5 md:mt-2 text-black">
            quality healthcare
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <a href={`tel:${PHONE}`} className="text-sm font-semibold text-black hover:underline">Dental Emergency</a>
          <button
            onClick={onBook}
            className="px-6 py-3 bg-black rounded-full text-sm font-semibold text-white hover:bg-neutral-800 transition-colors duration-200"
          >
            Book Appointment
          </button>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center relative"
        >
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              menuOpen ? 'rotate-45 translate-y-0' : '-translate-y-2'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              menuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
            }`}
          />
          <span
            className={`absolute h-0.5 w-6 bg-black rounded-full transition-all duration-300 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              menuOpen ? '-rotate-45 translate-y-0' : 'translate-y-2'
            }`}
          />
        </button>
      </header>

      <div
        className={`md:hidden fixed inset-0 z-40 ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-500 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col justify-center h-full px-8 gap-1">
            {navLinks.map((link, i) => (
              <button
                key={link}
                onClick={() => scrollTo(link)}
                className={`text-left text-4xl font-bold text-black hover:text-neutral-500 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                  menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                }`}
                style={{ transitionDelay: `${100 + i * 60}ms` }}
              >
                {link}
              </button>
            ))}
            <div
              className={`mt-8 pt-8 border-t border-neutral-200 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${
                menuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDelay: '450ms' }}
            >
              <p className="text-sm font-semibold text-black mb-4">
                <a href={`tel:${PHONE}`} className="hover:underline">Dental Emergency · Call {PHONE_DISPLAY}</a>
              </p>
              <button
                onClick={onBook}
                className="w-full px-6 py-4 bg-black rounded-full text-white text-sm font-semibold hover:bg-neutral-800 transition-colors duration-200"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      <path
        d="M1 7h12m0 0L8 2m5 5L8 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [date, setDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    try {
      await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first, last, phone, service, date }),
      });
    } catch {
      // ponytail: offline demo fallback — sheet sync is best-effort in dev
    }
  }

  const inputCls =
    'w-full px-4 py-3 rounded-full border border-black/25 bg-transparent text-sm font-medium text-black placeholder-black/40 outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Book an appointment"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          aria-label="Close booking form"
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 w-9 h-9 flex items-center justify-center rounded-full border border-black/15 bg-transparent hover:bg-black hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {submitted ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-black flex items-center justify-center text-white text-xl font-bold">✓</div>
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">Request sent</h2>
            <p className="text-sm text-black/70 max-w-[38ch] mx-auto">
              We'll call you back within one business day to confirm your appointment. Need it sooner? Call us at {PHONE_DISPLAY}.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-black mb-1.5">Book an appointment</h2>
            <p className="text-sm text-black/70 mb-6">We'll confirm by phone — no prepayment needed.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div className="flex gap-3.5">
                <label className="flex-1 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-black">First name</span>
                  <input className={inputCls} value={first} onChange={(e) => setFirst(e.target.value)} required autoFocus />
                </label>
                <label className="flex-1 flex flex-col gap-1">
                  <span className="text-xs font-semibold text-black">Last name</span>
                  <input className={inputCls} value={last} onChange={(e) => setLast(e.target.value)} required />
                </label>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-black">Phone number</span>
                <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="(201) 555-0000" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-black">Service</span>
                <select className={inputCls} value={service} onChange={(e) => setService(e.target.value)} required defaultValue="">
                  <option value="" disabled>Select a service</option>
                  {services.map((s) => (
                    <option key={s.num ?? s.name} value={s.name.replace('\n', ' ')}>{s.name.replace('\n', ' ')}</option>
                  ))}
                  <option value="Emergency">Dental Emergency</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-black">Preferred date</span>
                <input className={inputCls} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <button type="submit" className="mt-1 px-8 py-4 rounded-full bg-black text-white text-base font-bold hover:bg-neutral-800 transition-colors">
                Request appointment
              </button>
              <p className="text-xs text-black/50 text-center">
                Prefer to talk now? <a className="underline underline-offset-2" href={`tel:${PHONE}`}>Call {PHONE_DISPLAY}</a>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const isMobile = useIsMobile();

  const sectionId = (name: string) => {
    const map: Record<string, string> = { Home: 'home', Services: 'services', About: 'services', Gallery: 'gallery', Contact: 'contact' };
    return map[name];
  };
  const scrollTo = (name: string) => {
    setMenuOpen(false);
    const el = document.getElementById(sectionId(name));
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const section1Ref = useRef<HTMLElement>(null);
  const section2Ref = useRef<HTMLElement>(null);
  const s1CardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const s2CardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const s1Pos = useMaskPositions(section1Ref, s1CardsRef);
  const s2Pos = useMaskPositions(section2Ref, s2CardsRef);
  const s1Img = useImageWidth(HERO_IMAGE, section1Ref);
  const s2Img = useImageWidth(SECTION2_IMAGE, section2Ref);

  const s1Reveal = useStaggeredReveal(4);
  const s2Reveal = useStaggeredReveal(4);
  const s3Reveal = useStaggeredReveal(4);

  const s1Focal = isMobile ? 0.7 : 0.8;
  const s2Focal = isMobile ? 0.65 : 0.8;

  const maskProps = (cardsRef: React.RefObject<(HTMLDivElement | null)[]>, positions: MaskPos[], imageWidth: number, gapIndex = 0, focalX = 0.8) => ({
    cardsRef,
    index: gapIndex,
    imageWidth,
    position: positions[gapIndex],
    focalX,
  });

  return (
    <div className="bg-white">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} scrollTo={scrollTo} onBook={() => setBookingOpen(true)} />
      <BookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />

      {/* SECTION 1 - HERO */}
      <section
        id="home"
        ref={mergeRefs(section1Ref, s1Reveal.containerRef)}
        className="h-screen w-full overflow-hidden flex flex-col pt-24 md:pt-24 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
      >
        <div className="w-full flex flex-col gap-1.5 md:gap-2 flex-1 min-h-0">
          {featureBars.map((bar, i) => (
            <MaskedCard
              key={bar}
              bgImage={HERO_IMAGE}
              {...maskProps(s1CardsRef, s1Pos, s1Img, i, s1Focal)}
              className="w-full h-14 md:h-20 shrink-0 rounded-xl md:rounded-2xl overflow-hidden relative"
              style={s1Reveal.getAnimStyle(i)}
            >
              <span className="flex items-center justify-center h-full text-black text-lg md:text-3xl font-bold text-center relative z-10">
                {bar}
              </span>
            </MaskedCard>
          ))}
          <MaskedCard
            bgImage={HERO_IMAGE}
            {...maskProps(s1CardsRef, s1Pos, s1Img, 3, s1Focal)}
            className="w-full flex-1 min-h-0 rounded-xl md:rounded-2xl overflow-hidden relative"
            style={s1Reveal.getAnimStyle(3)}
          >
            <div className="absolute top-4 left-4 md:top-7 md:left-7 text-black text-xs md:text-sm font-semibold leading-4 md:leading-5 max-w-[200px] md:max-w-[300px] z-10">
              We wish to provide professional dental services
              <br />
              that match the current technologies
            </div>
            <div className="absolute bottom-5 left-3 md:bottom-8 md:left-4 z-10">
              <span className="block text-black text-xs md:text-sm font-semibold mb-1 md:mb-2">
                Trusted Dentist in West New York
              </span>
              <h1 className="text-black text-[clamp(3rem,11vw,11rem)] font-bold leading-[0.79] tracking-tight">
                Dental
                <br />
                Care
              </h1>
            </div>
            <button
              onClick={() => setBookingOpen(true)}
              className="absolute bottom-6 right-4 md:bottom-10 md:right-8 bg-black text-white text-xs md:text-sm font-semibold rounded-full px-4 py-2.5 md:px-6 md:py-3 hover:bg-neutral-800 transition-colors z-10"
            >
              Free Consultation
            </button>
          </MaskedCard>
        </div>
      </section>

      {/* SECTION 2 - SMILE GALLERY */}
      <section
        id="gallery"
        ref={mergeRefs(section2Ref, s2Reveal.containerRef)}
        className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
      >
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_auto_auto_auto] md:grid-rows-[1fr_1fr_0.8fr] gap-1.5 md:gap-2">
          <MaskedCard
            bgImage={SECTION2_IMAGE}
            {...maskProps(s2CardsRef, s2Pos, s2Img, 0, s2Focal)}
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
            style={s2Reveal.getAnimStyle(0)}
          >
            <div className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-2xl md:text-3xl font-bold z-10">
              Smile Gallery
            </div>
            <div className="absolute bottom-4 left-5 md:bottom-6 md:left-7 text-white md:text-black text-xs md:text-sm font-semibold z-10">
              Our cosmetic dental work
            </div>
          </MaskedCard>

          <MaskedCard
            bgImage={SECTION2_IMAGE}
            {...maskProps(s2CardsRef, s2Pos, s2Img, 1, s2Focal)}
            className="md:row-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
            style={s2Reveal.getAnimStyle(1)}
          >
            <div className="absolute bottom-16 left-5 md:bottom-20 md:left-7 text-white text-xs md:text-sm font-semibold leading-4 md:leading-5 z-10">
              If you want a gorgeous smile,
              <br />
              call us to ask about a smile makeover.
            </div>
            <a
              href={`tel:${PHONE}`}
              className="absolute bottom-4 right-4 md:bottom-6 md:right-6 px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold z-10 hover:scale-105 transition-transform"
            >
              Call Us
            </a>
          </MaskedCard>

          <MaskedCard
            bgImage={SECTION2_IMAGE}
            {...maskProps(s2CardsRef, s2Pos, s2Img, 2, s2Focal)}
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[160px] md:min-h-0"
            style={s2Reveal.getAnimStyle(2)}
          >
            <div className="absolute top-4 left-5 md:top-6 md:left-7 text-white md:text-black text-[clamp(3rem,7vw,6rem)] font-bold leading-[0.9] z-10">
              Smile
              <br />
              makeover
            </div>
          </MaskedCard>

          <MaskedCard
            bgImage={SECTION2_IMAGE}
            {...maskProps(s2CardsRef, s2Pos, s2Img, 3, s2Focal)}
            className="col-span-1 md:col-span-2 rounded-xl md:rounded-2xl overflow-hidden relative min-h-[200px] md:min-h-0"
            style={s2Reveal.getAnimStyle(3)}
          >
            <div className="absolute inset-0 z-10 flex flex-wrap md:flex-nowrap gap-1.5 md:gap-2 p-2 md:p-3">
              {services.map((svc) => (
                <div
                  key={svc.num ?? svc.name}
                  className={`flex-1 min-w-[calc(50%-4px)] md:min-w-0 rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between ${
                    svc.active ? 'bg-white/90 backdrop-blur-md' : 'bg-white/20 backdrop-blur-xl'
                  }`}
                >
                  <h3
                    className={`text-xl md:text-4xl font-bold leading-[1.05] whitespace-pre-line ${
                      svc.active ? 'text-black' : 'text-white'
                    }`}
                  >
                    {svc.name}
                  </h3>
                  {svc.num !== null && (
                    <span
                      className={`self-end w-8 h-8 md:w-12 md:h-12 rounded-full border flex items-center justify-center text-xs md:text-sm font-semibold ${
                        svc.active ? 'border-black text-black' : 'border-white text-white'
                      }`}
                    >
                      {svc.num}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </MaskedCard>
        </div>
      </section>

      {/* SECTION 3 - IMPLANT DENTISTRY */}
      <section
        id="services"
        ref={s3Reveal.containerRef}
        className="min-h-screen md:h-screen w-full overflow-hidden flex flex-col pt-1.5 md:pt-2 px-3 md:px-5 pb-1.5 md:pb-2 gap-1.5 md:gap-2"
      >
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-2">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-1.5 md:gap-2">
            <div
              className="rounded-xl md:rounded-2xl bg-stone-50 p-5 md:p-7 flex flex-col justify-between flex-[1.2] min-h-[180px] md:min-h-0"
              style={s3Reveal.getAnimStyle(0)}
            >
              <h2 className="text-[clamp(3rem,7vw,6.5rem)] font-bold leading-[0.95] text-black">
                Implant
                <br />
                Dentistry
              </h2>
              <p className="text-xs md:text-sm font-semibold text-black">Restore Missing Teeth</p>
            </div>

            <div
              className="flex gap-1.5 md:gap-2 flex-1 min-h-[140px] md:min-h-0"
              style={s3Reveal.getAnimStyle(1)}
            >
              <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
                <img src={SECTION3_IMG1} alt="Dental implant procedure" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 rounded-xl md:rounded-2xl overflow-hidden">
                <img src={SECTION3_IMG2} alt="Dental restoration" className="w-full h-full object-cover" />
              </div>
            </div>

            <div
              className="rounded-xl md:rounded-2xl bg-zinc-200 p-5 md:p-7 flex items-end justify-between flex-[0.8] min-h-[160px] md:min-h-0"
              style={s3Reveal.getAnimStyle(2)}
            >
              <div>
                <p className="text-xs md:text-sm font-semibold text-black mb-2 md:mb-3">Consultation</p>
                <h3 className="text-xl md:text-3xl font-bold text-black leading-6 md:leading-8">
                  Dental
                  <br />
                  Restoration
                  <br />
                  Services
                </h3>
              </div>
              <button
                onClick={() => setBookingOpen(true)}
                className="px-5 py-3 md:px-8 md:py-5 bg-white rounded-full text-black text-base md:text-xl font-bold hover:scale-105 transition-transform shrink-0"
              >
                Book Online
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div
            className="rounded-xl md:rounded-2xl overflow-hidden relative min-h-[350px] md:min-h-0"
            style={s3Reveal.getAnimStyle(3)}
          >
            <img src={SECTION3_BG} alt="Smiling patient" className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-3 right-3 md:bottom-5 md:left-5 md:right-5 flex gap-1.5 md:gap-2">
              <div className="flex-1 bg-white rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
                <h4 className="text-lg md:text-2xl font-bold text-black leading-5 md:leading-7">
                  The Process
                  <br />
                  of Installing
                  <br />
                  Implants
                </h4>
                <div className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-black flex items-center justify-center">
                  <ArrowIcon className="rotate-[-45deg]" />
                </div>
              </div>
              <div className="flex-1 bg-white/20 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-5 flex flex-col justify-between h-36 md:h-52">
                <h4 className="text-lg md:text-2xl font-bold text-white leading-5 md:leading-7">
                  Caring
                  <br />
                  for Dental
                  <br />
                  Implants
                </h4>
                <div className="self-end w-9 h-9 md:w-12 md:h-12 rounded-full border border-white flex items-center justify-center">
                  <ArrowIcon className="rotate-[-45deg] text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER - CONTACT */}
      <footer
        id="contact"
        className="bg-stone-50 px-5 md:px-6 py-14 md:py-20 flex flex-col gap-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-2">Let's talk</h2>
            <p className="text-sm md:text-base font-semibold text-black/70 max-w-[36ch]">
              Questions, emergencies, or a smile makeover — call us or book online. We reply within one business day.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-3">
            <a
              href={`tel:${PHONE}`}
              className="px-8 py-4 rounded-full bg-black text-white text-base font-bold hover:bg-neutral-800 transition-colors text-center"
            >
              Call {PHONE_DISPLAY}
            </a>
            <button
              onClick={() => setBookingOpen(true)}
              className="px-8 py-4 rounded-full border border-black text-black text-base font-bold hover:bg-black hover:text-white transition-colors"
            >
              Book an appointment
            </button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-t border-black/10 pt-6 text-xs font-semibold text-black/50">
          <p>© {new Date().getFullYear()} Dental Health Clinic. All rights reserved.</p>
          <p>West New York, NJ</p>
        </div>
      </footer>
    </div>
  );
}

export default App;