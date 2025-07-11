// components/DownloadButton.tsx
import React from "react";
import { DownloadCloud } from "./Icons";
import styles from "./styles/downloadable.module.scss";

const backendUrl = "http://127.0.0.1:8000";

type DownloadableProps = {
  icon?: string;
  filename: string;
  fileUrl: string; // public URL or relative path
  className?: string;
};

const DownloadableFile: React.FC<DownloadableProps> = ({
  icon,
  filename,
  fileUrl,
  className = "downloadable-file-btn",
}) => {
  const handleDownload = async () => {
    console;
    try {
      const url = fileUrl.startsWith("http")
        ? fileUrl
        : `${backendUrl}/${fileUrl}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });

      if (!response.ok)
        throw new Error(`Failed to download: ${response.status}`);

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download file. Check backend or CORS settings.");
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={`${styles.downLoadFileBtn} ${className || ""}`}
    >
      <img src={icon} alt="file_logo" />
      <span>{filename}</span>
      <DownloadCloud className="download-icon" />
    </button>
  );
};

export default DownloadableFile;
