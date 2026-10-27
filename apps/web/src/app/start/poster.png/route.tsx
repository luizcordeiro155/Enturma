import { ImageResponse } from "next/og";

/** Public, deterministic presentation image for unfurling and slide software. */
export async function GET() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f8f9f3",
        color: "#173f35",
        padding: 64,
        position: "relative",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", width: 660 }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            fontSize: 36,
            fontWeight: 800,
          }}
        >
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#173f35"
            strokeWidth="1.8"
          >
            <path d="M12 7c-2-3-7-3-10-2v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-3-1-8-1-10 2Zm0 0v14" />
          </svg>
          enturma.
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 66,
            fontWeight: 800,
            lineHeight: 1.07,
            marginTop: 56,
            letterSpacing: -2,
          }}
        >
          <span>Sua faculdade.</span>
          <span>Muito mais</span>
          <span style={{ color: "#4f6c20" }}>em companhia.</span>
        </div>
        <div
          style={{
            fontSize: 23,
            color: "#53675c",
            marginTop: 24,
            maxWidth: 560,
          }}
        >
          Sua turma, seus estudos e suas próximas descobertas. Tudo no Enturma.
        </div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 18 }}>
          enturma-flax.vercel.app/start
        </div>
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 58,
          top: 132,
          width: 360,
          height: 380,
          borderRadius: 24,
          background: "#173f35",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          transform: "rotate(5deg)",
        }}
      >
        <svg
          width="204"
          height="172"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d8ef79"
          strokeWidth=".9"
        >
          <path d="M12 7c-2-3-7-3-10-2v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-3-1-8-1-10 2Zm0 0v14" />
        </svg>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            color: "#f3f8e8",
            marginTop: 24,
          }}
        >
          Aprender é melhor junto.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 18,
            color: "#d8ef79",
            marginTop: 14,
          }}
        >
          Salas · Cadernos IA · Caronas
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    },
  );
}
