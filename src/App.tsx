import { useEffect, useRef, useState, type ReactNode } from 'react'

/* IntersectionObserver reveal. No scroll listeners anywhere on this page. */
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-visible')
          io.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/* The one light in the room.
   Every `.stage` on the page takes four numbers off a single rAF-throttled
   pointer read: --rx / --ry for the parallax rotation, --lx / --ly for where
   the light sits across the stage, and --ang for the terminator axis, which
   always points away from the light so the shadow side falls into the dark.
   Values land on the stage element and inherit down into every `.lit` face. */
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

function useStageLight() {
  useEffect(() => {
    const stages = Array.from(document.querySelectorAll<HTMLElement>('.stage'))
    if (!stages.length) return

    let frame = 0
    let pending: { x: number; y: number } | null = null

    const flush = () => {
      frame = 0
      const pt = pending
      pending = null
      if (!pt) return

      for (const stage of stages) {
        const box = stage.getBoundingClientRect()
        if (box.width < 2 || box.height < 2) continue

        const lx = clamp01((pt.x - box.left) / box.width)
        const ly = clamp01((pt.y - box.top) / box.height)

        stage.style.setProperty('--lx', lx.toFixed(4))
        stage.style.setProperty('--ly', ly.toFixed(4))
        stage.style.setProperty('--rx', (lx * 2 - 1).toFixed(4))
        stage.style.setProperty('--ry', (ly * 2 - 1).toFixed(4))
        /* Light bearing measured from straight up, clockwise, so the dark end
           of the terminator sits 180 degrees opposite the highlight. */
        const bearing = (Math.atan2(lx - 0.5, 0.5 - ly) * 180) / Math.PI
        stage.style.setProperty('--ang', `${bearing.toFixed(1)}deg`)

        /* The specular band sweeps the 104 degree gradient axis. Same pointer,
           different axis to the diffuse falloff, so the highlight and the
           ambient travel together but not in lockstep. */
        stage.style.setProperty('--sx', `${(18 + lx * 64 + ly * 18).toFixed(1)}%`)
      }
    }

    const onMove = (e: PointerEvent) => {
      pending = { x: e.clientX, y: e.clientY }
      if (!frame) frame = requestAnimationFrame(flush)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])
}

const CARS = [
  {
    name: 'Forge Sable',
    body: 'Fastback saloon, rear drive',
    img: 'https://picsum.photos/seed/forgemotors-sable-saloon-profile/900/620',
    alt: 'Dark saloon car in profile on an empty test road',
    accel: '3.4 s',
    range: '612 km',
    price: 'From GBP 58,400',
  },
  {
    name: 'Forge Torrent',
    body: 'Estate, rear drive',
    img: 'https://picsum.photos/seed/forgemotors-torrent-estate-rear/900/620',
    alt: 'Estate car rear three quarter view on wet tarmac',
    accel: '3.8 s',
    range: '578 km',
    price: 'From GBP 61,250',
  },
  {
    name: 'Forge Pike',
    body: 'Crossover, rear drive',
    img: 'https://picsum.photos/seed/forgemotors-pike-crossover-track/900/620',
    alt: 'Crossover car cornering on a closed circuit',
    accel: '4.6 s',
    range: '545 km',
    price: 'From GBP 54,900',
  },
  {
    name: 'Forge Ferrier',
    body: 'Track derivative, rear drive',
    img: 'https://picsum.photos/seed/forgemotors-ferrier-track-car/900/620',
    alt: 'Low track car photographed in a pit garage',
    accel: '2.9 s',
    range: '486 km',
    price: 'From GBP 94,750',
  },
]

const CHASSIS = [
  {
    k: 'Platform',
    v: '800 volt skateboard, rear drive on every car we build',
  },
  {
    k: 'Suspension',
    v: 'Double wishbone front, five link rear, adaptive dampers on Ferrier',
  },
  {
    k: 'Brakes',
    v: '420 mm ventilated discs front, 380 mm rear, carbon ceramic option',
  },
  {
    k: 'Thermal',
    v: 'Heat pump and liquid cooling, boost discharge held to 3.2 C',
  },
  {
    k: 'Homologation',
    v: 'WLTP cycle figures throughout, Euro 7 on the residual heat circuit',
  },
]

const TABS = [
  {
    id: 'ccs2',
    name: 'CCS2',
    where: 'United Kingdom and Europe, DC and AC on the same inlet',
    peak: '350 kW',
    window: '10 to 80 per cent in 18 minutes',
    note: 'Accepts a Type 2 cable at the same socket when the post has no DC pair.',
  },
  {
    id: 'nacs',
    name: 'NACS',
    where: 'North America, DC only',
    peak: '250 kW',
    window: '10 to 80 per cent in 21 minutes',
    note: 'Ships with the native inlet, no adapter in the boot and no lost boot volume.',
  },
  {
    id: 'type2',
    name: 'Type 2',
    where: 'Single phase AC, the overnight answer',
    peak: '22 kW',
    window: '0 to 100 per cent in 9 hours 40 minutes',
    note: 'Preconditioned to pack temperature overnight, so the last ten per cent is not a penalty.',
  },
]

function HeroScene() {
  return (
    <div className="stage" aria-hidden="true">
      <div className="scene">
        <div className="floor" />
        <div className="cast" />
        <div className="pack">
          <div className="plate plate-1 lit brushed" />
          <div className="plate plate-2 lit" />
          <div className="plate plate-3 lit" />
          <div className="plate plate-4 lit" />
          <div className="lid lit brushed">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="cap lit" style={{ left: `${2 + i * 15.6}%` }} />
            ))}
          </div>
        </div>
        <div className="spine">
          <span className="spine-bar" />
        </div>
        <div className="rotor">
          <div className="rotor-back lit brushed" />
          <div className="rotor-spin">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="blade lit"
                style={{ transform: `rotateZ(${i * 30}deg) rotateX(22deg) translateZ(${i % 2 ? -4 : 4}px)` }}
              />
            ))}
          </div>
          <div className="rotor-ring" />
          <div className="hub lit brushed">
            <span className="hub-core" />
          </div>
        </div>
      </div>
    </div>
  )
}

function RackScene() {
  return (
    <div className="stage" aria-hidden="true">
      <div className="scene scene-wide">
        <div className="floor" />
        <div className="cast" />
        <div className="rack">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="module"
              style={{
                /* Each module steps left, narrows, rises and recedes, so the
                   stack reads as five solids in depth rather than five equal
                   bars offset by a fixed amount. */
                left: `${i * 5.5}%`,
                width: `calc(100% - ${i * 11}%)`,
                top: `${i * 15.5}%`,
                transform: `translate3d(0, ${-i * 9}%, ${-i * 46}px)`,
              }}
            >
              <span className="module-lid lit brushed" />
              <span className="module-face lit" />
              <span className="module-edge" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuoteMark() {
  return (
    <svg width="34" height="26" viewBox="0 0 34 26" fill="none" aria-hidden="true">
      <path
        d="M0 26V14.6C0 6.2 4.4 1 12.4 0l1.4 4.2c-4.4 1.2-6.6 3.8-6.8 7.6h6.4V26H0zm20.2 0V14.6C20.2 6.2 24.6 1 32.6 0L34 4.2c-4.4 1.2-6.6 3.8-6.8 7.6h6.4V26H20.2z"
        fill="currentColor"
      />
    </svg>
  )
}

function ArrowGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path
        d="M2 11L11 2M11 2H4.2M11 2v6.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function App() {
  useStageLight()

  const [tab, setTab] = useState(TABS[0].id)
  const active = TABS.find((t) => t.id === tab) ?? TABS[0]

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [car, setCar] = useState('')
  const [error, setError] = useState('')
  const [bad, setBad] = useState<'' | 'name' | 'email' | 'car'>('')
  const [sent, setSent] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setSent(false)
    if (name.trim().length < 2) {
      setBad('name')
      setError('Add the name the booking should sit under.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setBad('email')
      setError('That email address will not reach you. Check it once more.')
      return
    }
    if (!car) {
      setBad('car')
      setError('Pick a car so we send the right one round the block.')
      return
    }
    setBad('')
    setError('')
    setSent(true)
  }

  return (
    <>
      <header className="panel sticky top-0 z-30">
        <div className="shell flex h-18 max-h-20 items-center justify-between py-3">
          <a href="#top" className="flex items-baseline gap-2.5">
            <span className="font-display text-[1.35rem] font-semibold tracking-[-0.03em]">
              Forge Motors
            </span>
          </a>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
            <a href="#range" className="link-underline text-sm text-haze hover:text-chalk">
              Range
            </a>
            <a href="#chassis" className="link-underline text-sm text-haze hover:text-chalk">
              Chassis
            </a>
            <a href="#charging" className="link-underline text-sm text-haze hover:text-chalk">
              Charging
            </a>
          </nav>
          <a href="#book" className="btn btn-primary !py-2 !text-sm">
            Book a test drive
          </a>
        </div>
      </header>

      <main id="top">
        {/* Hero. CSS 3D stage behind, copy in front. */}
        <section className="relative flex min-h-[100dvh] items-end overflow-hidden pt-24 pb-14 md:items-center md:pb-16">
          <HeroScene />
          <div className="shell relative z-10 w-full">
            <div className="max-w-[34rem]">
              <Reveal>
                <p className="micro mb-6">800 volt architecture</p>
                <h1 className="text-[clamp(2.3rem,4.5vw,3.85rem)] leading-[1.02] text-chalk">
                  Built for the run home, and back.
                </h1>
                <p className="mt-7 max-w-[46ch] text-[1.0625rem] leading-[1.65] text-haze">
                  Four performance cars on one platform, built and tested in Glasgow.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-3.5">
                  <a href="#book" className="btn btn-primary">
                    Book a test drive
                    <span className="btn-icon">
                      <ArrowGlyph />
                    </span>
                  </a>
                  <a href="#range" className="btn btn-ghost">
                    See the range
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Range: horizontal snap rail, four cars, collapses to a stack. */}
        <section id="range" className="shell py-24 md:py-32">
          <Reveal>
            <h2 className="max-w-[15ch] text-[clamp(2rem,3.9vw,3.1rem)] text-chalk">
              Four cars, one platform.
            </h2>
            <p className="mt-5 max-w-[58ch] text-haze">
              Same battery family, same motors, same charging curve. What changes is the body and
              how much of the platform it asks for.
            </p>
          </Reveal>

          <div className="mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-4">
            {CARS.map((c, i) => (
              <Reveal
                key={c.name}
                delay={i * 70}
                className="w-[82%] shrink-0 snap-start sm:w-[46%] md:w-auto"
              >
                <article className="panel flex h-full flex-col overflow-hidden">
                  <img
                    src={c.img}
                    alt={c.alt}
                    width={900}
                    height={620}
                    loading="lazy"
                    className="h-44 w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div>
                      <h3 className="text-xl text-chalk">{c.name}</h3>
                      <p className="mt-1.5 font-mono text-[0.8125rem] text-haze">{c.body}</p>
                    </div>
                    <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/10 pt-5">
                      <div>
                        <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-haze">
                          0 to 100
                        </dt>
                        <dd className="font-display text-lg text-volt">{c.accel}</dd>
                      </div>
                      <div>
                        <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-haze">
                          WLTP range
                        </dt>
                        <dd className="font-display text-lg text-chalk">{c.range}</dd>
                      </div>
                    </dl>
                    <p className="font-mono text-[0.8125rem] text-haze">{c.price}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Chassis: tall image left, stacked spec rows right. */}
        <section id="chassis" className="shell py-24 md:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <Reveal>
              <img
                src="https://picsum.photos/seed/forgemotors-underbody-chassis-check/1000/1200"
                alt="Bare car underbody on a workshop lift with the wheels removed"
                width={1000}
                height={1200}
                loading="lazy"
                className="h-80 w-full object-cover sm:h-[30rem] lg:h-full"
              />
            </Reveal>
            <Reveal delay={110} className="flex flex-col justify-center">
              <h2 className="max-w-[16ch] text-[clamp(2rem,3.9vw,3.1rem)] text-chalk">
                The parts you feel, and the ones you never notice.
              </h2>
              <p className="mt-6 max-w-[54ch] leading-[1.7] text-haze">
                Every car leaves Falkirk with the same subframe tolerances and the same torque
                check at the axle. The damper calibration is where they part company.
              </p>
              <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {CHASSIS.map((c) => (
                  <div key={c.k} className="border-t border-white/10 pt-4">
                    <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-volt">
                      {c.k}
                    </dt>
                    <dd className="mt-2 text-sm leading-[1.6] text-haze">{c.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* Battery: full width CSS 3D stage band. Five real planes in depth. */}
        <section id="battery" className="shell py-24 md:py-32">
          <Reveal>
            <p className="micro mb-6">Pack architecture</p>
            <h2 className="max-w-[20ch] text-[clamp(2rem,3.9vw,3.1rem)] text-chalk">
              Five modules on one spine, no fan on the fast path.
            </h2>
            <p className="mt-6 max-w-[58ch] leading-[1.7] text-haze">
              The pack is a structural member rather than a box in the floor. Modules sit on a
              common cooling spine, so boost discharge never has to wait on a radiator.
            </p>
          </Reveal>

          <Reveal delay={90} className="mt-12">
            <div className="relative h-[15rem] overflow-hidden border-y border-white/10 sm:h-[19rem] lg:h-[21rem]">
              <RackScene />
            </div>
            <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
              <div className="border-t border-white/10 pt-4">
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-volt">
                  Modules
                </dt>
                <dd className="mt-2 text-sm leading-[1.6] text-haze">
                  Five prismatic modules, 108 kWh usable on Sable and Torrent
                </dd>
              </div>
              <div className="border-t border-white/10 pt-4">
                <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-volt">
                  Recovery
                </dt>
                <dd className="mt-2 text-sm leading-[1.6] text-haze">
                  10 to 80 per cent on a 350 kW post, held across the full pack
                </dd>
              </div>
            </dl>
          </Reveal>
        </section>

        {/* Charging: tabbed standards panel. */}
        <section id="charging" className="shell py-24 md:py-32">
          <Reveal>
            <p className="micro mb-6">Inlets and curves</p>
            <h2 className="max-w-[17ch] text-[clamp(2rem,3.9vw,3.1rem)] text-chalk">
              Three sockets, one curve.
            </h2>
          </Reveal>

          <Reveal delay={90} className="mt-10">
            <div className="panel overflow-hidden">
              <div
                role="tablist"
                aria-label="Charging standard"
                className="flex flex-wrap border-b border-white/10"
              >
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={tab === t.id}
                    aria-controls={`panel-${t.id}`}
                    onClick={() => setTab(t.id)}
                    className={`px-6 py-4 font-mono text-[0.8125rem] uppercase tracking-[0.14em] transition-colors ${
                      tab === t.id
                        ? 'bg-volt text-void'
                        : 'text-haze hover:bg-white/5 hover:text-chalk'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <div
                role="tabpanel"
                id={`panel-${active.id}`}
                aria-labelledby={`tab-${active.id}`}
                className="grid gap-8 p-7 md:grid-cols-[1.1fr_1fr] md:gap-12 md:p-10"
              >
                <div>
                  <h3 className="text-[1.375rem] text-chalk">{active.where}</h3>
                  <p className="mt-4 max-w-[46ch] text-[0.9375rem] leading-[1.65] text-haze">
                    {active.note}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-6 self-center border-t border-white/10 pt-6 md:border-0 md:pt-0">
                  <div>
                    <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-haze">
                      Peak rate
                    </dt>
                    <dd className="mt-2 font-display text-2xl text-volt">{active.peak}</dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-haze">
                      Window
                    </dt>
                    <dd className="mt-2 text-sm leading-[1.5] text-chalk">{active.window}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Quote: full width band, one family used once. */}
        <section className="shell py-24 md:py-32">
          <Reveal>
            <figure className="panel px-7 py-14 md:px-16 md:py-20">
              <QuoteMark />
              <blockquote className="mt-8 max-w-[52ch] text-[clamp(1.5rem,2.7vw,2.15rem)] leading-[1.28] tracking-[-0.02em] text-chalk">
                Quick, and then quiet. I have owned fast cars that were never quiet.
              </blockquote>
              <figcaption className="mt-9 text-sm text-haze">
                Morag Donnelly, vehicle dynamics lead, Glasgow
              </figcaption>
            </figure>
          </Reveal>
        </section>

        {/* Booking: copy left, form right. Labels above inputs, inline error. */}
        <section id="book" className="shell pb-24 md:pb-32">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <Reveal>
              <h2 className="max-w-[13ch] text-[clamp(2rem,3.9vw,3.1rem)] text-chalk">
                Twenty minutes round the block.
              </h2>
              <p className="mt-6 max-w-[48ch] leading-[1.7] text-haze">
                One of our engineers rides along and talks you through the regen and the ride modes.
                No deposit, and no salesperson in the passenger seat.
              </p>
              <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-5">
                {[
                  ['Test route', 'Falkirk, A9 and the Causeway'],
                  ['Base', 'Unit 7, Falkirk, FK1'],
                  ['Weekdays', 'Tuesday to Saturday'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-haze">
                      {k}
                    </dt>
                    <dd className="mt-2 text-sm text-chalk">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={120}>
              <form className="panel flex flex-col gap-5 p-7 md:p-9" onSubmit={submit} noValidate>
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm text-chalk">
                    Name on the booking
                  </label>
                  <input
                    id="name"
                    name="name"
                    className={`field ${bad === 'name' ? 'field-invalid' : ''}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Morag Donnelly"
                    aria-describedby="name-hint"
                    aria-invalid={bad === 'name'}
                  />
                  <p id="name-hint" className="font-mono text-[0.6875rem] text-haze">
                    Used for the booking only
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm text-chalk">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    aria-describedby="email-hint"
                  />
                  <p id="email-hint" className="font-mono text-[0.6875rem] text-haze">
                    Route sheet and directions to the yard
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="car" className="text-sm text-chalk">
                    Which car
                  </label>
                  <select
                    id="car"
                    name="car"
                    className={`field appearance-none ${bad === 'car' ? 'field-invalid' : ''}`}
                    value={car}
                    onChange={(e) => setCar(e.target.value)}
                    aria-describedby="car-hint"
                  >
                    <option value="">Select a car</option>
                    {CARS.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p id="car-hint" className="font-mono text-[0.6875rem] text-haze">
                    We hold one of each on the road for the week
                  </p>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-[#e0705a]">
                    {error}
                  </p>
                )}

                {sent ? (
                  <div className="border border-volt/40 bg-volt/10 px-5 py-4 text-sm text-chalk" role="status">
                    Booked. We will email {email.trim()} with a slot near Falkirk.
                  </div>
                ) : (
                  <button type="submit" className="btn btn-primary self-start">
                    Book a test drive
                    <span className="btn-icon">
                      <ArrowGlyph />
                    </span>
                  </button>
                )}
              </form>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="panel">
        <div className="shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:py-16">
          <div>
            <p className="font-display text-lg text-chalk">Forge Motors</p>
            <p className="mt-3 max-w-[40ch] text-sm leading-[1.65] text-haze">
              Unit 7, Falkirk. Four cars on one 800 volt platform, and a test route that goes over
              the Causeway if the wind is behind you.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-3 text-sm">
            <a href="#range" className="link-underline text-haze hover:text-chalk">
              Range
            </a>
            <a href="#chassis" className="link-underline text-haze hover:text-chalk">
              Chassis
            </a>
            <a href="#charging" className="link-underline text-haze hover:text-chalk">
              Charging
            </a>
          </nav>
          <div className="text-sm text-haze">
            <p>Falkirk, Scotland</p>
            <p className="mt-1">FK1 1JQ</p>
            <a href="#book" className="link-underline mt-4 inline-block hover:text-chalk">
              Book a test drive
            </a>
          </div>
        </div>
        <div className="shell border-t border-white/10 py-7">
          <p className="font-mono text-[0.6875rem] text-haze">
            Developed by{' '}
            <a href="https://thediyadevelopers.com" className="link-underline text-chalk">
              Diya Developers
            </a>
          </p>
        </div>
      </footer>
    </>
  )
}