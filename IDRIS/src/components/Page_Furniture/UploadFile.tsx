// FileUploader.tsx
import './styles/uploadFile.scss';
import React, { useState, useEffect} from "react";
import { UploadArrow } from "./Icons";
import PDFimage from "./images/pdf-logo.png";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  showName?: boolean;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  accept = "*",
  showName = true,
  className = "",
}) => {
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>(PDFimage);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (filePreview && filePreview.startsWith("blob:")) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);

      if (selectedFile.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(selectedFile)); // Use this instead of FileReader
      } else {
        setFilePreview(PDFimage);
      }

      onFileSelect(selectedFile);
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
    setFile(null);
    setFilePreview(PDFimage);
    onFileSelect(null);
  };

  return (
    <div
      className={`file-uploader ${isDragging ? "drag-over" : ""} ${fileName ? "has-file" : ""} ${className}`}
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
          <img src={filePreview} alt="File Preview" />
          <p className="file-name">{fileName}</p>
        </div>
      }
      {!fileName && <p className="drag-instruction">Browse or Drop a File Here</p>}
    </div>
  );
};

export default FileUploader;
