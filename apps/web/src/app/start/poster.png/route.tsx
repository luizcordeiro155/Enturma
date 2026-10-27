import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Local, versioned artwork: crawlers never depend on a third-party image host. */
export async function GET() {
  const [art, font] = await Promise.all([
    readFile(join(process.cwd(), "public/start/book-world-share.jpg")),
    readFile(
      join(process.cwd(), "public/intro/comic/ArchivoBlack-Regular.ttf"),
    ),
  ]);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#f8f9f3",
        color: "#173f35",
        position: "relative",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 680,
          top: 0,
          width: 520,
          height: 630,
          background: "#173f35",
          overflow: "hidden",
        }}
      >
        {/* ImageResponse renders an embedded image, not a browser image element. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/jpeg;base64,${art.toString("base64")}`}
          width={520}
          height={650}
          alt=""
          style={{
            position: "absolute",
            top: -10,
            left: 0,
            objectFit: "cover",
          }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 32,
            top: 34,
            fontFamily: "Enturma Display",
            fontSize: 24,
            color: "#f3f8e8",
          }}
        >
          enturma.
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 520,
            padding: "24px 32px",
            background: "#173f35",
            color: "#d8ef79",
            fontSize: 20,
          }}
        >
          Aprender é melhor junto.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 680,
          padding: "42px 56px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            fontSize: 32,
            fontFamily: "Enturma Display",
            letterSpacing: -1,
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#173f35"
            strokeWidth="1.7"
          >
            <path d="M12 7c-2-3-7-3-10-2v15c4-1 7-1 10 1 3-2 6-2 10-1V5c-3-1-8-1-10 2Zm0 0v14" />
          </svg>
          enturma.
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "Enturma Display",
            fontSize: 59,
            lineHeight: 1.1,
            marginTop: 64,
            letterSpacing: -1.8,
          }}
        >
          <span>Sua faculdade.</span>
          <span>Muito mais</span>
          <span style={{ color: "#4f6c20" }}>em companhia.</span>
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#4c6258",
            marginTop: 28,
            lineHeight: 1.5,
            maxWidth: 520,
          }}
        >
          Sua turma, seus estudos e suas próximas descobertas. Tudo no Enturma.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 34,
          }}
        >
          <div
            style={{
              display: "flex",
              background: "#d8ef79",
              padding: "15px 20px",
              borderRadius: 10,
              fontSize: 19,
              fontWeight: 700,
            }}
          >
            Estude em companhia.
          </div>
          <svg
            width="27"
            height="27"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#173f35"
            strokeWidth="1.7"
          >
            <path d="M4 12h16m-6-6 6 6-6 6" />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 17,
            color: "#53675c",
          }}
        >
          Salas de estudo · Cadernos IA · Caronas
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Enturma Display",
          data: font.buffer.slice(
            font.byteOffset,
            font.byteOffset + font.byteLength,
          ) as ArrayBuffer,
          weight: 400,
          style: "normal",
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    },
  );
}
