// IDRIS/src/pages/lgu_profiling/LGUSeeMore.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/LGUSeeMore.css";

const API_URL =
  import.meta.env.VITE_API_URL || "https://idris-app.onrender.com";
const MAPOFCEBU_BASE = "/lgu_profiling/mapofcebu"; // ✅ same prefix as backend

// Keep your original shape if you want; this works fine.
// (You can later simplify arrays to string[] if you prefer.)
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

interface LGUInfo {
  id: number;
  name: string;
  classification: string;
  population: number;
  contact_info: string;
  risk_level: string;
  lgu_picture?: string | null;
  description?: string | null;

  resources?: JsonValue;
  players?: JsonValue;
  schools?: JsonValue;
  gyms?: JsonValue;
  local_suppliers?: JsonValue;
}

const LGUSeeMore: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // URL: /lgu_profiling/LGUSeeMore/:id
  const navigate = useNavigate();

  const [data, setData] = useState<LGUInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ensure absolute image URL
  const imageUrl = useMemo(() => {
    const raw = data?.lgu_picture?.trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("/")) return `${API_URL}${raw}`;
    return `${API_URL}/${raw}`;
  }, [data]);

  useEffect(() => {
    if (!id) return;

    axios
      // ✅ call the mapofcebu router mounted under /lgu_profiling
      .get(`${API_URL}${MAPOFCEBU_BASE}/lgu/${id}`)
      .then((res) => {
        // guard against 404 payloads like {"detail":"LGU not found"}
        if (!res.data || typeof res.data !== "object" || "detail" in res.data) {
          throw new Error(
            (res.data && (res.data as any).detail) || "Invalid LGU response",
          );
        }
        setData(res.data as LGUInfo);
      })
      .catch((e) => setError(e?.message || "Failed to load LGU"));
  }, [id]);

  const renderJson = (value?: JsonValue) => {
    if (value == null) return <span>-</span>;

    if (
      Array.isArray(value) &&
      value.every(
        (v) => ["string", "number", "boolean"].includes(typeof v) || v === null,
      )
    ) {
      const arr = value as (string | number | boolean | null)[];
      if (arr.length === 0) return <span>-</span>;
      return (
        <ul>
          {arr.map((v, i) => (
            <li key={i}>{String(v ?? "")}</li>
          ))}
        </ul>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span>-</span>;
      return (
        <ul>
          {value.map((item, i) => {
            if (item && typeof item === "object" && !Array.isArray(item)) {
              const obj = item as Record<string, JsonValue>;
              return (
                <li key={i}>
                  <div className="lgu-list-object">
                    {Object.entries(obj).map(([k, v]) => (
                      <div className="lgu-list-row" key={k}>
                        <span className="lgu-list-key">{k}:</span>{" "}
                        <span className="lgu-list-value">
                          {typeof v === "object"
                            ? JSON.stringify(v)
                            : String(v ?? "")}
                        </span>
                      </div>
                    ))}
                  </div>
                </li>
              );
            }
            return (
              <li key={i}>
                {typeof item === "object"
                  ? JSON.stringify(item)
                  : String(item ?? "")}
              </li>
            );
          })}
        </ul>
      );
    }

    if (typeof value === "object") {
      const obj = value as Record<string, JsonValue>;
      const keys = Object.keys(obj);
      if (keys.length === 0) return <span>-</span>;
      return (
        <div className="lgu-list-object">
          {keys.map((k) => (
            <div className="lgu-list-row" key={k}>
              <span className="lgu-list-key">{k}:</span>{" "}
              <span className="lgu-list-value">
                {typeof obj[k] === "object"
                  ? JSON.stringify(obj[k])
                  : String(obj[k] ?? "")}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  if (error) {
    return (
      <div className="lgu-error">
        <h2>LGU Not Found</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/lgu_profiling/map_of_cebu")}>
          Back to Map of Cebu
        </button>
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: 16 }}>Loading LGU details…</div>;
  }

  return (
    <div className="lgu-container">
      <button
        className="back-button"
        onClick={() => navigate("/lgu_profiling/map_of_cebu")}
      >
        ← Back
      </button>

      <h1 className="lgu-title">{data.name}</h1>

      {imageUrl && <img src={imageUrl} alt={data.name} className="lgu-image" />}

      <div className="lgu-grid">
        <div className="lgu-key">Classification:</div>
        <div className="lgu-value">{data.classification}</div>

        <div className="lgu-key">Population:</div>
        <div className="lgu-value">
          {data.population?.toLocaleString?.() ?? data.population}
        </div>

        <div className="lgu-key">Contact Info:</div>
        <div className="lgu-value">{data.contact_info}</div>

        <div className="lgu-key">Risk Level:</div>
        <div className="lgu-value">{data.risk_level}</div>

        {data.description && (
          <>
            <div className="lgu-key">Description:</div>
            <div className="lgu-value">{data.description}</div>
          </>
        )}

        <div className="lgu-section-title">Local Context</div>

        <div className="lgu-key">Resources:</div>
        <div className="lgu-value">{renderJson(data.resources)}</div>

        <div className="lgu-key">Players:</div>
        <div className="lgu-value">{renderJson(data.players)}</div>

        <div className="lgu-key">Schools:</div>
        <div className="lgu-value">{renderJson(data.schools)}</div>

        <div className="lgu-key">Gyms:</div>
        <div className="lgu-value">{renderJson(data.gyms)}</div>

        <div className="lgu-key">Local Suppliers:</div>
        <div className="lgu-value">{renderJson(data.local_suppliers)}</div>
      </div>
    </div>
  );
};

export default LGUSeeMore;
