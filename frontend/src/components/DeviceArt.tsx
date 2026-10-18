import { useState } from "react";
export function DeviceArt({
  device = "laptop",
  component = "",
  large = false,
}: {
  device?: string;
  component?: string;
  large?: boolean;
}) {
  const [hover, setHover] = useState("");
  const selected = hover || component;
  const fill = (key: string) => (selected === key ? "#61e8da" : "#253448");
  return (
    <div className={"device-art " + (large ? "art-large" : "")}>
      <svg
        viewBox="0 0 480 300"
        role="img"
        aria-label={`${device} component illustration`}
      >
        <defs>
          <linearGradient id={`screen-${device}`} x2="1" y2="1">
            <stop stopColor="#1b374b" />
            <stop offset="1" stopColor="#101a2b" />
          </linearGradient>
          <radialGradient id={`glow-${device}`}>
            <stop stopColor="#61e8da" stopOpacity=".15" />
            <stop offset="1" stopColor="#61e8da" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx="240"
          cy="167"
          rx="225"
          ry="130"
          fill={`url(#glow-${device})`}
        />
        {device === "laptop" ? (
          <g className="float-device">
            <path
              d="M97 54 Q97 43 109 43 H370 Q382 43 382 55 V220 H97Z"
              fill="#152132"
              stroke="#4c6073"
              strokeWidth="2"
            />
            <rect
              x="109"
              y="55"
              width="261"
              height="152"
              rx="4"
              fill={`url(#screen-${device})`}
              stroke={selected === "screen" ? "#61e8da" : "#243a50"}
              onMouseEnter={() => setHover("screen")}
              onMouseLeave={() => setHover("")}
            />
            <circle cx="240" cy="49" r="2" fill="#62758a" />
            <path
              d="M74 220 H406 L432 243 Q435 251 422 253 H61 Q48 251 53 243Z"
              fill="#253447"
              stroke="#586b80"
              strokeWidth="1.5"
            />
            <path
              d="M205 221 H276 L284 237 H198Z"
              fill={fill("battery")}
              onMouseEnter={() => setHover("battery")}
              onMouseLeave={() => setHover("")}
            />
            <rect
              x="76"
              y="230"
              width="17"
              height="6"
              rx="2"
              fill={fill("port")}
              onMouseEnter={() => setHover("port")}
              onMouseLeave={() => setHover("")}
            />
            <path
              d="M76 233 H45 Q32 233 32 218 V195"
              fill="none"
              stroke={fill("connector")}
              strokeWidth="4"
              onMouseEnter={() => setHover("connector")}
              onMouseLeave={() => setHover("")}
            />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect
                key={i}
                x={328 + i * 10}
                y="231"
                width="5"
                height="4"
                rx="1"
                fill={fill("vents")}
                onMouseEnter={() => setHover("vents")}
                onMouseLeave={() => setHover("")}
              />
            ))}
            <g transform="translate(165 95)">
              <path
                d="m20 44 17 17 40-45"
                fill="none"
                stroke="#61e8da"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle
                cx="48"
                cy="40"
                r="46"
                fill="none"
                stroke="#61e8da"
                opacity=".22"
                strokeWidth="1"
              />
            </g>
            <path
              d="M283 96h55M283 111h40M283 126h48"
              stroke="#33576b"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <g className="float-device">
            <path
              d="M138 166 116 55M338 166l25-111"
              stroke="#50627a"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M126 174 Q126 158 146 158 H334 Q354 158 354 174 L382 233 Q385 245 370 248 H106 Q92 245 97 233Z"
              fill="#243348"
              stroke="#586b80"
              strokeWidth="2"
            />
            <path d="M127 204h221" stroke="#34485e" />
            <rect
              x="134"
              y="222"
              width="15"
              height="12"
              rx="3"
              fill={fill("power")}
              onMouseEnter={() => setHover("power")}
              onMouseLeave={() => setHover("")}
            />
            <rect
              x="162"
              y="221"
              width="24"
              height="14"
              rx="2"
              fill={fill("wan")}
              onMouseEnter={() => setHover("wan")}
              onMouseLeave={() => setHover("")}
            />
            {[0, 1, 2].map((i) => (
              <rect
                key={i}
                x={198 + i * 33}
                y="221"
                width="25"
                height="14"
                rx="2"
                fill={fill("ethernet")}
                onMouseEnter={() => setHover("ethernet")}
                onMouseLeave={() => setHover("")}
              />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <circle
                key={i}
                cx={196 + i * 23}
                cy="186"
                r="3.5"
                fill={
                  selected === "status" || selected === "wifi"
                    ? "#61e8da"
                    : i < 3
                      ? "#61e8da"
                      : "#47576e"
                }
              />
            ))}
            <path
              d="M206 99q34-28 68 0m-55 15q21-18 42 0m-30 13q9-8 18 0"
              stroke={fill("wifi")}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              onMouseEnter={() => setHover("wifi")}
              onMouseLeave={() => setHover("")}
            />
          </g>
        )}
      </svg>
      <div className="art-tooltip">
        {selected
          ? `${selected.replace("_", " ")} · location guide only`
          : "External checks. Clearer next steps."}
      </div>
    </div>
  );
}
