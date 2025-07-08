// FileUploader.tsx
import style from './styles/uploadFile.module.scss';
import React, { useState, useEffect} from "react";
import { UploadArrow } from "./Icons";
import PDFimage from "./images/pdf-logo.png";

interface FileUploaderProps {
  onFileSelect: (file: File | null, action: "create" | "update" | null) => void;
  action?: "create" | "update" | null;
  accept?: string;
  showName?: boolean;
  className?: string;
  defaultImage?: string | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  action = null,
  accept = "*",
  showName = true,
  className = "",
  defaultImage = "",
}) => {
  const [fileName, setFileName] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>(PDFimage);

  // Initialize with default image when component mounts or defaultImage changes
  useEffect(() => {
    if (defaultImage && !file) {
      const isPdf = accept?.includes("pdf");
  
      // Always use PDF icon if accept indicates PDF
      setFilePreview(isPdf ? PDFimage : defaultImage);
  
      // Extract filename from URL or show fallback name
      const name = defaultImage.split("/").pop() || "Current File";
      setFileName(name);
    }
  }, [defaultImage, accept]);
  
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
        // Clean up previous blob URL if it exists
        if (filePreview && filePreview.startsWith("blob:")) {
          URL.revokeObjectURL(filePreview);
        }
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        setFilePreview(PDFimage);
      }

      onFileSelect(selectedFile, action);
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
    // Reset to default image if available, otherwise use PDF placeholder
    setFilePreview(defaultImage || PDFimage);
    onFileSelect(null, action);
  };

  // Check if we should show content (either file selected or default image)
  const hasContent = !!file || !!defaultImage;

  return (
    <div
      className={`${style.fileUploader} ${isDragging ? style.dragOver : ""} ${hasContent ? style.hasFile : ""} ${className}`}
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
        className={`${style.removeButton} ${hasContent ? "" : style.hidden}`}
      >
        X
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openFilePicker();
        }}
        className={`${style.uploadButton} ${hasContent ? style.hidden : ""}`}
      >
        <UploadArrow width={50} height={50} className={style.uploadIcon} />
      </button>

      {showName && hasContent &&
        <div id={style.pdfFileIcon}>
          <img src={filePreview} alt="File Preview" />
          <p className={style.fileName}>{fileName || "Default Image"}</p>
        </div>
      }
      {!hasContent && <p className={style.dragInstruction}>Browse or Drop a File Here</p>}
    </div>
  );
};

export default FileUploader;