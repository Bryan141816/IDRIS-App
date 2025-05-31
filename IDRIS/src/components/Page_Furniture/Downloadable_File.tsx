// components/DownloadButton.tsx
import React from "react";
import {DownloadCloud} from './Icons';
import styles from './styles/downloadable.module.scss';

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
  className = 'downloadable-file-btn',
}) => {
  const handleDownload = async () => {
    const response = await fetch(fileUrl);
    const blob = await response.blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleDownload}
      className={`${styles.downLoadFileBtn} ${className || ""}`}
    >
      <img src={icon} alt="file_logo" />
      <span>{filename}</span>
      <DownloadCloud className="download-icon"/>
    </button>
  );
};

export default DownloadableFile;
