import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Activate() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleActivate = async () => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      await axios.get(`http://localhost:8000/auth/activate/${token}`);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <div style={{ display: "flex" }}></div>
    </div>
  );
}
