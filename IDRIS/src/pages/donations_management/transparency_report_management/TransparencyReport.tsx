import { useState, useRef, useEffect } from "react";
import SearchBar from "../../../components/Page_Furniture/Search";
import SortingBar from "../../../components/Page_Furniture/Filter";
import UploadFile from "../../../components/Page_Furniture/UploadFile";
import { PlusCircle } from "../../../components/Page_Furniture/Icons";
import { Modal } from "../../../components/Page_Furniture/Modals";
import { TransparencyReportTable } from "./Transparency_table";
import "./transparency_report.scss";
import { useUserContext } from "../../../UserContext";
import { useUserRoleContext } from "../../../UserRoleContext";
import {
  createTransparencyReport,
  getTransparencyReports,
  getTransparencyReportById,
  updateTransparencyReport,
} from "../../../API_Handler/donations_transparency_report";

interface ReportTypeShema {
  transparency_id: number;
  file_name: string;
  file: string;
  date_uploaded: string;
}

const TransparencyReport = () => {
  const { userType } = useUserContext();
  const { userRoles } = useUserRoleContext();
  const [activeModal, setActiveModal] = useState<string>("");
  const closeModal = () => {
    setActiveModal("");
  };

  // REQUEST TRANSPARENCY REPORTS
  const sortingItems = ["Ascending", "Descending"];
  const [searchedReport, setSearchedReport] = useState("");
  const [sorting, setSelectedSorting] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [reports, setReports] = useState<ReportTypeShema[]>([]);
  const [page, setPage] = useState<number>(1);
  const limit = 10;
  const [loading, setLoading] = useState(true);

  // FORM VALUES - CREATE TRANSPARENCY REPORT
  const [createFileName, setCreateFileName] = useState("");
  const [createDateReport, setCreateDateReport] = useState("");
  const [createselectedFile, setCreateSelectedFile] = useState<File | null>(
    null,
  );
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // FORM VALUES - UPDATE TRANSPARENCY REPORT
  const [updateSelectedId, setUpdateSelectedId] = useState<number | null>(null);
  const [updatefileName, setUpdateFileName] = useState("");
  const [updateDateReport, setUpdateDateReport] = useState("");
  const [updateSelectedFile, setUpdateSelectedFile] = useState<File | null>(
    null,
  );
  const [updateFilePreview, setUpdateFilePreview] = useState<string | null>(
    null,
  );
  const UpdateFileInputRef = useRef<HTMLInputElement>(null);

  type ActionType = "create" | "update" | null;
  // File Selection Control
  const handleFileSelect = (file: File | null, action: ActionType) => {
    if (action == "create") {
      setCreateSelectedFile(file);
    } else if (action == "update") {
      setUpdateSelectedFile(file);
    }

    const inputRef =
      action == "create" ? createFileInputRef : UpdateFileInputRef;
    if (inputRef.current) {
      const dataTransfer = new DataTransfer();
      if (file) dataTransfer.items.add(file);
      inputRef.current.files = dataTransfer.files;
    }
  };

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await getTransparencyReports(
          searchedReport,
          dateFilter,
          page,
          limit,
        );

        setReports(response.data);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [page, searchedReport, dateFilter]);

  if (loading) return <p>Loading...</p>;

  const getReportById = async function (id: number) {
    try {
      const report = await getTransparencyReportById(id);
      setUpdateSelectedId(report.data.transparency_id);
      setUpdateFileName(report.data.file_name);
      setUpdateFilePreview(report.data.file_name);
      const formattedDate = report.data.date_issued.split("T")[0];
      setUpdateDateReport(formattedDate);
      handleFileSelect(report.data.file, "update");
      // You can set it to state here
      return report;
    } catch (error) {
      // Optional: show error message to user
      return null;
    }
  };

  const ShowUpdateModal = (id: number) => {
    getReportById(id);
    setActiveModal("update-transparency-report");
  };

  // SENDING THE FORM
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createselectedFile || !createFileName || !createDateReport) {
      alert("All fields are required.");
      return;
    }

    const formData = new FormData();
    formData.append("file", createselectedFile);
    formData.append("file_name", createFileName);
    formData.append("date_issued", createDateReport);

    try {
      const response = await createTransparencyReport(formData);
      alert("Report uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed.");
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatefileName || !updateSelectedFile || !updateDateReport) {
      alert("All fields are required.");
      return;
    }

    const formData = new FormData();
    formData.append("file", updateSelectedFile);
    formData.append("file_name", updatefileName);
    formData.append("date_issued", updateDateReport);

    try {
      if (updateSelectedId !== null) {
        const response = await updateTransparencyReport(
          updateSelectedId,
          formData,
        );
      } else {
        console.error("Update ID is null. Cannot update transparency report.");
        alert("Update failed: Invalid report ID.");
      }

      alert("Report uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed.");
    }
  };

  return (
    <div id="transparency_report">
      <div className={""}>
        <div id="settings-container">
          <SearchBar
            placeholder="Search Donor"
            value={searchedReport}
            onChange={setSearchedReport}
          />
          <SortingBar
            items={sortingItems}
            value={sorting}
            onChange={setSelectedSorting}
          />
          <input
            className="date-filter no-icon"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          {userRoles.includes("finance admin") && (
            <>
              <button
                type="button"
                className={
                  "settings-button" + (userType === "admin" ? "" : " hidden")
                }
                onClick={() => setActiveModal("create-transparency-report")}
              >
                Add Report
                <PlusCircle width={24} height={24} className="add_report" />
              </button>
            </>
          )}
        </div>

        <h1>Transparency Report</h1>
        <TransparencyReportTable
          reports={reports}
          updateFunction={async (id: number) => {
            ShowUpdateModal(id);
          }}
        />
      </div>
      <Modal
        isOpen={activeModal === "create-transparency-report"}
        onClose={closeModal}
      >
        <h3 className="modal-title">New Transparency Report</h3>
        <form
          action=""
          id="new-transparency-report-form"
          onSubmit={handleCreateSubmit}
        >
          <UploadFile
            accept="application/pdf"
            showName={true}
            action="create"
            onFileSelect={(file, action) => handleFileSelect(file, action)}
          />
          <div className="text-entry">
            <input
              type="text"
              name="fileName"
              placeholder=" "
              value={createFileName}
              onChange={(e) => setCreateFileName(e.target.value)}
              className="entry"
              required
            />
            <label htmlFor="fileName" className="entry-label">
              FileName:{" "}
            </label>
          </div>
          <div className="text-entry date-input">
            <input
              type="date"
              name="dateIssued"
              placeholder=" "
              value={createDateReport}
              onChange={(e) => setCreateDateReport(e.target.value)}
              className="entry date-filter no-icon"
              required
            />
            <label htmlFor="dateIssued" className="entry-label">
              Date Issued:{" "}
            </label>
          </div>
          <div className="modal-button-container">
            <button type="submit" className="green-modal-button">
              Save
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={activeModal === "update-transparency-report"}
        onClose={closeModal}
      >
        <h3>Update Transparency Report</h3>
        <form
          action=""
          id="new-transparency-report-form"
          onSubmit={handleUpdateSubmit}
        >
          <UploadFile
            accept="application/pdf"
            showName={true}
            action="update"
            onFileSelect={(file, action) => handleFileSelect(file, action)}
            defaultImage={updateFilePreview ?? undefined}
          />
          <div className="text-entry">
            <input
              type="text"
              name="fileName"
              placeholder=" "
              value={updatefileName}
              onChange={(e) => setUpdateFileName(e.target.value)}
              className="entry"
              required
            />
            <label htmlFor="fileName" className="entry-label">
              FileName:{" "}
            </label>
          </div>
          <div className="text-entry date-input">
            <input
              type="date"
              name="dateIssued"
              placeholder=" "
              value={updateDateReport}
              onChange={(e) => setUpdateDateReport(e.target.value)}
              className="entry date-filter no-icon"
              required
            />
            <label htmlFor="dateIssued" className="entry-label">
              Date Issued:{" "}
            </label>
          </div>
          <div className="modal-button-container">
            <button type="submit" className="green-modal-button">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransparencyReport;
