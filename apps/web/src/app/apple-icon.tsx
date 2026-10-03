import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
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
          borderRadius: 38,
        }}
      >
        <div
          style={{
            width: 126,
            height: 126,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "7px solid #eef5f2",
            borderRadius: 32,
            color: "#eef5f2",
            fontSize: 86,
            fontWeight: 800,
            letterSpacing: -10,
            lineHeight: 1,
            paddingRight: 6,
          }}
        >
          e<span style={{ color: "#ddf280" }}>.</span>
        </div>
      </div>
    ),
    size,
  );
}
