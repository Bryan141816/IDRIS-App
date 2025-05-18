// FileUploader.tsx
import './styles/uploadFile.scss';
import React, { useState } from "react";
import { UploadArrow } from "../../components/Icons";
import PDFimage from "./images/pdf-logo.png";
interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  showName?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  accept = "*",
  showName = true,
}) => {
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleFile = (file: File | null) => {
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    if (
      file &&
      (accept === "*" ||
        file.type.includes(accept) ||
        file.name.endsWith(accept.replace("application/", ".")))
    ) {
      handleFile(file);
    }
  };

  const openFilePicker = () => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = accept;
    picker.onchange = (e: any) => {
      const file = e.target.files?.[0] || null;
      handleFile(file);
    };
    picker.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFileName("");
    onFileSelect(null);
  };

  return (
    <div
      className={`file-uploader ${isDragging ? "drag-over" : ""} ${fileName ? "has-file" : ""}`}
      onClick={openFilePicker}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
    >
      <button
        type="button"
        onClick={handleClear}
        className={`remove-button ${fileName ? "" : "hidden"}`}
      >
        X
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openFilePicker();
        }}
        className={`upload-button ${fileName ? "hidden" : ""}`}
      >
        <UploadArrow width={50} height={50} className="upload-icon" />
      </button>

      {showName && fileName && 
      <div id="pdf-show-icon">
        <img src={PDFimage} alt="" />
        <p className="file-name">{fileName}</p>
      </div>
      }
      {!fileName && <p className="drag-instruction">Browse or Drop a File Here</p>}
    </div>
  );
};

export default FileUploader;
