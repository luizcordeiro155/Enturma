import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f1917",
          borderRadius: 108,
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "18px solid #eef5f2",
            borderRadius: 92,
            color: "#eef5f2",
            fontSize: 244,
            fontWeight: 800,
            letterSpacing: -28,
            lineHeight: 1,
            paddingRight: 18,
          }}
        >
          e<span style={{ color: "#ddf280" }}>.</span>
        </div>
      </div>
    ),
    size,
  );
}
