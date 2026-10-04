"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Users, MapPin, Minus, ChevronUp, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useRideUpdates } from "@/lib/use-ride-updates";
import type { Ride, Match } from "@/lib/ride-types";
import { NotificationsProvider } from "./notifications";
import { RideMatchCelebration } from "./ride-match-celebration";

type Search = {
  id: string;
  title: string;
  area: string;
  departure: string;
  incoming: boolean;
  offer: boolean;
};
const SearchContext = createContext<{ searches: Search[]; live: boolean }>({
  searches: [],
  live: false,
});

export function RideActivity({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const privatePage =
    /^\/(home|portfolio|subjects|learn|profile|settings|friends|notebooks|rooms|caronas|forum|onboarding|admin)(\/|$)/.test(
      path,
    );
  return privatePage ? (
    <ActivityProvider>{children}</ActivityProvider>
  ) : (
    children
  );
}

function ActivityProvider({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [data, setData] = useState<{
    rides: Ride[];
    matches: Match[];
    me: string;
    seen: string[];
  }>({ rides: [], matches: [], me: "", seen: [] });
  const [minimized, setMinimized] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const live = useRideUpdates(async () => {
    const [rides, matches, me] = await Promise.all([
      api<Ride[]>("/rides/mine"),
      api<Match[]>("/matches"),
      api<{ id: string }>("/users/me"),
    ]);
    let seen: string[] = [];
    try {
      const saved = JSON.parse(
        localStorage.getItem(`enturma-ride-matches:${me.id}`) || "[]",
      );
      if (Array.isArray(saved))
        seen = saved.filter((x) => typeof x === "string");
    } catch {}
    setData({ rides, matches, me: me.id, seen });
  });
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    const sync = (e: StorageEvent) => {
      if (e.key?.startsWith("enturma-ride-matches:")) {
        try {
          const seen = JSON.parse(e.newValue || "[]");
          if (Array.isArray(seen)) setData((old) => ({ ...old, seen }));
        } catch {}
      }
    };
    window.addEventListener("storage", sync);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const searches: Search[] = data.rides
    .filter(
      (r) =>
        r.status === "OPEN" &&
        Date.parse(r.departureAt) > now &&
        data.matches.filter((m) => m.rideId === r.id && m.status === "ACCEPTED")
          .length < r.seats,
    )
    .map((r) => ({
      id: r.id,
      title: r.type === "OFFER" ? "Procurando passageiro" : "Procurando carona",
      area: r.originArea,
      departure: r.departureAt,
      offer: r.type === "OFFER",
      incoming: data.matches.some(
        (m) => m.rideId === r.id && m.status === "PENDING",
      ),
    }));
  searches.push(
    ...data.matches
      .filter(
        (m) =>
          m.userId === data.me &&
          m.status === "PENDING" &&
          m.rideStatus === "OPEN" &&
          Date.parse(m.departureAt) > now,
      )
      .map((m) => ({
        id: m.id,
        title: "Aguardando aceite",
        area: m.originArea,
        departure: m.departureAt,
        incoming: false,
        offer: false,
      })),
  );
  const celebration = data.matches.find(
    (m) =>
      m.status === "ACCEPTED" &&
      m.rideStatus === "OPEN" &&
      !m.closedAt &&
      !m.deletedAt &&
      !data.seen.includes(m.id),
  );
  function dismiss(id: string) {
    const seen = [...data.seen, id].slice(-100);
    setData((old) => ({ ...old, seen }));
    try {
      localStorage.setItem(
        `enturma-ride-matches:${data.me}`,
        JSON.stringify(seen),
      );
    } catch {}
  }
  const primary = searches.find((s) => s.incoming) ?? searches[0];
  return (
    <SearchContext.Provider value={{ searches, live }}>
      <NotificationsProvider>{children}</NotificationsProvider>
      {primary && !path.startsWith("/caronas") ? (
        <aside
          className={`ride-search-dock ${minimized ? "is-minimized" : ""}`}
          aria-label="Sua busca de carona"
        >
          <Link href="/caronas/matches" className="ride-dock-link">
            <SearchRadar compact offer={primary.offer} />
            <span>
              <strong>
                {primary.incoming ? "Pedido de carona recebido" : primary.title}
              </strong>
              {!minimized ? (
                <small>
                  {primary.area}
                  {searches.length > 1
                    ? ` · +${searches.length - 1} buscas`
                    : ""}
                </small>
              ) : null}
            </span>
            <ArrowRight size={17} />
          </Link>
          <button
            className="secondary"
            onClick={() => setMinimized((v) => !v)}
            aria-label={
              minimized
                ? "Expandir busca de carona"
                : "Minimizar busca de carona"
            }
          >
            {minimized ? <ChevronUp size={17} /> : <Minus size={17} />}
          </button>
          {!minimized ? (
            <small className="ride-dock-caption">
              {live
                ? "Pode navegar. Avisaremos quando der match."
                : "Reconectando · verificando novas respostas"}
            </small>
          ) : null}
        </aside>
      ) : null}
      {celebration ? (
        <RideMatchCelebration
          key={celebration.id}
          owner={{ id: celebration.ownerId, name: celebration.ownerName }}
          passenger={{
            id: celebration.userId,
            name: celebration.passengerName,
          }}
          area={celebration.originArea}
          onClose={() => dismiss(celebration.id)}
          onChat={() => {
            dismiss(celebration.id);
            router.push(`/caronas/matches?match=${celebration.id}`);
          }}
        />
      ) : null}
    </SearchContext.Provider>
  );
}

export function RideSearchPanel() {
  const { searches, live } = useContext(SearchContext);
  if (!searches.length) return null;
  return (
    <section
      className="ride-search-panel"
      aria-label="Buscas de carona em andamento"
    >
      {searches.map((search) => (
        <article className="ride-search-card" key={search.id}>
          <SearchRadar offer={search.offer} />
          <div className="ride-search-copy">
            <span className="eyebrow">
              {search.incoming
                ? "Tem companhia a caminho"
                : "Seu trajeto está publicado"}
            </span>
            <h2>
              {search.incoming ? "Alguém quer combinar a carona" : search.title}
              <span aria-hidden="true" className="ride-search-dots">
                …
              </span>
            </h2>
            <p>
              <MapPin size={16} />
              {search.area} ·{" "}
              {new Date(search.departure).toLocaleString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              {search.incoming
                ? "Confira o pedido abaixo e aceite para combinar o encontro."
                : "Você pode continuar usando o Enturma. Assim que houver aceite, vamos avisar por aqui."}
            </p>
            <small>
              {live
                ? "Acompanhando respostas em tempo real"
                : "Reconectando · atualização automática ativa"}{" "}
              · O aceite é feito pelos participantes.
            </small>
            <div className="actions">
              <Link href="/caronas/matches">Ver pedidos</Link>
              <Link href="/caronas">Gerenciar caronas e cancelamentos</Link>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function SearchRadar({
  compact = false,
  offer,
}: {
  compact?: boolean;
  offer: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let animations: Animation[] = [];
    function play() {
      animations.forEach((a) => a.cancel());
      animations = [];
      if (
        document.hidden ||
        media.matches ||
        document.documentElement.dataset.reducedMotion === "true"
      )
        return;
      root.querySelectorAll(".ride-radar-ring").forEach((ring, i) =>
        animations.push(
          ring.animate(
            [
              { transform: "scale(.3)", opacity: 0 },
              { opacity: 0.65, offset: 0.2 },
              { transform: "scale(1)", opacity: 0 },
            ],
            {
              duration: 3200,
              delay: i * 1000,
              iterations: Infinity,
              easing: "ease-out",
            },
          ),
        ),
      );
      root.querySelectorAll(".ride-radar-pin").forEach((pin, i) =>
        animations.push(
          pin.animate(
            [
              { transform: "translateY(0)", opacity: 0.5 },
              { transform: "translateY(-6px)", opacity: 1 },
              { transform: "translateY(0)", opacity: 0.5 },
            ],
            {
              duration: 2200,
              delay: i * 700,
              iterations: Infinity,
              easing: "ease-in-out",
            },
          ),
        ),
      );
    }
    play();
    media.addEventListener("change", play);
    window.addEventListener("enturma-motion", play);
    document.addEventListener("visibilitychange", play);
    return () => {
      animations.forEach((a) => a.cancel());
      media.removeEventListener("change", play);
      window.removeEventListener("enturma-motion", play);
      document.removeEventListener("visibilitychange", play);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={`ride-radar ${compact ? "compact" : ""}`}
      aria-hidden="true"
    >
      <div className="ride-radar-map" />
      {[0, 1, 2].map((i) => (
        <i key={i} className="ride-radar-ring" />
      ))}
      <span className="ride-radar-center">{offer ? <Users /> : <Car />}</span>
      {!compact ? (
        <>
          <span className="ride-radar-pin pin-a">
            <MapPin size={20} />
          </span>
          <span className="ride-radar-pin pin-b">
            <Car size={20} />
          </span>
          <span className="ride-radar-pin pin-c">
            <Users size={20} />
          </span>
        </>
      ) : null}
    </div>
  );
}
