import { useState, useEffect, useRef, useMemo } from "react";
import SearchBar from "../../../components/Page_Furniture/Search";
import FilterBar from "../../../components/Page_Furniture/Filter";
import UploadFile from "../../../components/Page_Furniture/UploadFile";
import { PlusCircle, Gift } from "../../../components/Page_Furniture/Icons";
import "./ListOfRAFIDonors.scss";
import { DonorTable, TableResponse } from "./TableComponent";
import { useUserContext } from "../../../UserContext";
import { useUserRoleContext } from "../../../UserRoleContext";
import { getDonorsList } from "../../../API_Handler/donations_donors_handler";
import Profile1 from "../../donations_management/test_images/profile1.png";
import Profile2 from "../../donations_management/test_images/profile2.png";
import Profile3 from "../../donations_management/test_images/profile3.png";
import { Modal } from "../../../components/Page_Furniture/Modals";

import {
  createNewDonor,
  searchDonorUsers,
} from "../../../API_Handler/donations_donors_handler";

// ✅ SweetAlert2
import Swal from "sweetalert2";

interface DonorData {
  donorId: number;
  donor_name: string;
  organization_name: string;
  total_donation: number;
  date_joined?: Date | string;
}

interface DonorsApiResponse {
  donors: DonorData[];
  total: number;
  skip: number;
  limit: number;
  max_page?: number;
}

interface SearchedDonors {
  user_id: number;
  username: string;
  email?: string;
}

interface SearchedDonorsAPIResponse {
  donors: SearchedDonors[];
  search: string;
}

/** ---------- DUMMY DONORS (used if API returns empty or fails) ---------- */
const dummyDonors: DonorData[] = [
  {
    donorId: 0,
    donor_name: "Donor Name",
    organization_name: "",
    total_donation: 0,
    date_joined: new Date().toISOString(),
  },
  {
    donorId: 0,
    donor_name: "",
    organization_name: "Donor Name",
    total_donation: 0,
    date_joined: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    donorId: 0,
    donor_name: "Donor Name",
    organization_name: "",
    total_donation: 0,
    date_joined: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    donorId: 0,
    donor_name: "",
    organization_name: "Donor Name",
    total_donation: 0,
    date_joined: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
  {
    donorId: 0,
    donor_name: "Donor Name",
    organization_name: "",
    total_donation: 0,
    date_joined: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
];

const ListOfRAFIDonors = () => {
  // User view Options
  const { userType } = useUserContext();
  const { userRoles } = useUserRoleContext();
  const adminRoleAccess =
    userRoles.includes("finance admin") || userRoles.includes("operations admin");
  const donorSearchRef = useRef<HTMLDivElement>(null);
  const donorGiftRef = useRef<HTMLDivElement>(null);

  // Preset Variables
  const dateToday = new Date().toISOString().split("T")[0];
  const [dateJoined, setDateJoined] = useState<string>(dateToday);

  // Donors Lists
  const [donors, setDonors] = useState<DonorData[]>([]);

  // Filter Options
  const donorPerPage = 25;
  const [page, setPage] = useState<number>(1);
  const [maxPage, setMaxPage] = useState<number>(1);
  const sortingItems = ["Ascending", "Descending"];
  const [sorting, setSelectedSorting] = useState<string>("");
  const [searched, searchState] = useState("");

  type DirectType = "prev" | "next";
  const handleTablePageControl = (direct: DirectType) => {
    setPage((prevPage) => {
      if (direct === "prev") return Math.max(prevPage - 1, 1);
      return Math.min(prevPage + 1, maxPage);
    });
  };

  // ------------- MODAL THINGS ----------------
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [noResults, setNoResults] = useState(false);

  // Get List of Donors (with dummy fallback)
  useEffect(() => {
    async function fetchDonors() {
      setIsLoading(true);
      try {
        const response = await getDonorsList(searched, page, donorPerPage);

        let records: DonorData[] = [];
        let max_page = 1;

        if (Array.isArray(response)) {
          records = response;
        } else if (response && typeof response === "object") {
          const obj = response as DonorsApiResponse;
          records = Array.isArray(obj.donors) ? obj.donors : [];
          max_page = typeof obj.max_page === "number" ? obj.max_page : 1;
        }

        setDonors(records);
        setMaxPage(Math.max(max_page, 1));
        setNoResults(records.length === 0);
      } catch (error) {
        console.error("Error fetching donors:", error);
        setDonors([]);          // nothing to show
        setMaxPage(1);
        setNoResults(true);     // show “no donors” message
      } finally {
        setIsLoading(false);
      }
    }
    fetchDonors();
  }, [searched, page]);

  // Create filtered and sorted donors
  const filteredDonors = useMemo(() => {
    let sortedDonors = [...donors];

    if (sorting === "Ascending") {
      sortedDonors.sort((a, b) => {
        const nameA = (a.organization_name || a.donor_name || "").toLowerCase();
        const nameB = (b.organization_name || b.donor_name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sorting === "Descending") {
      sortedDonors.sort((a, b) => {
        const nameA = (a.organization_name || a.donor_name || "").toLowerCase();
        const nameB = (b.organization_name || b.donor_name || "").toLowerCase();
        return nameB.localeCompare(nameA);
      });
    }

    return sortedDonors;
  }, [donors, sorting]);

  const currency = (n: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(n || 0);

  const tableData: TableResponse = {
    table_head: [
      { text: "Rank", width: "10%" },
      { text: "Avatar", width: "15%" },
      { text: "Name", width: "25%" },
      { text: "Total Donation", width: "25%" },
      { text: "Date Joined", width: "25%" },
    ],
    table_datas: filteredDonors.map((donor, index) => ({
      data: [
        { type: "Text", text: (index + 1).toString(), font_weight: 600 },
        {
          type: "Image",
          text: index % 3 === 0 ? Profile1 : index % 3 === 1 ? Profile2 : Profile3,
          font_weight: 400,
          width: "40px",
        },
        {
          type: "Text",
          text:
            (donor.organization_name && donor.organization_name.trim() !== ""
              ? donor.organization_name
              : donor.donor_name) || "Anonymous Donor",
          font_weight: 500,
        },
        {
          type: "Text",
          text: currency(donor.total_donation),
          font_weight: 400,
        },
        {
          type: "Date",
          text: donor.date_joined
            ? new Date(donor.date_joined).toLocaleDateString()
            : "N/A",
          font_weight: 400,
        },
      ],
    })),
  };

  const toggleModal = (navId: string) => {
    setActiveModal((prev) => (prev === navId ? null : navId));
  };
  const closeModal = () => setActiveModal(null);

  // Add New Donor
  const [newDonorProfile, setNewDonorProfile] = useState<string>(Profile1);
  const [addDonorSearch, setAddDonorSearch] = useState("");
  const [newDonorSearchedItems, setNewDonorSearchedItems] = useState<SearchedDonors[] | null>(null);

  const handleAddDonorSearch = async () => {
    try {
      const response = await searchDonorUsers(addDonorSearch);
      if (Array.isArray(response)) {
        setNewDonorSearchedItems(response);
      } else if (response && typeof response === "object" && "donors" in response) {
        const filtered = (response as SearchedDonorsAPIResponse).donors.filter((d) =>
          d.username.toLowerCase().includes(addDonorSearch.toLowerCase())
        );
        setNewDonorSearchedItems(
          filtered.map((d) => ({ user_id: d.user_id, username: d.username, email: d.email }))
        );
      } else {
        setNewDonorSearchedItems([]);
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
      setNewDonorSearchedItems([]);
    }
  };

  useEffect(() => {
    if (addDonorSearch.trim() !== "") handleAddDonorSearch();
    else setNewDonorSearchedItems(null);
  }, [addDonorSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (donorSearchRef.current && !donorSearchRef.current.contains(event.target as Node)) {
        setNewDonorSearchedItems(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  const [newUserId, setNewUserId] = useState<number | null>(null);
  const [newDonorName, setNewDonorName] = useState<string>("sample@gmail.com");
  const [isOrganization, setIsOrganization] = useState<boolean>(false);

  const setSelectedNewDonorProfile = (donor: SearchedDonors) => {
    setNewUserId(donor.user_id);
    setNewDonorName(donor.username);
    setNewDonorSearchedItems(null);
  };

  const setOrganizationDonorType = (is_organization: boolean) => {
    setIsOrganization(is_organization);
    setActiveModal("new-donor-form-create");
  };

  // ✅ SweetAlert2 version (replaces window.alert)
  const handleNewDonorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserId === null) {
      await Swal.fire({
        icon: "warning",
        title: "Select a user first",
        text: "Please search and pick a user to add as donor.",
        confirmButtonText: "OK",
      });
      return;
    }

    const donor_type = isOrganization ? "Organization" : "Individual";
    const dateJoinedInput = (document.getElementById("date-joined") as HTMLInputElement).value;
    const formData = new FormData();

    formData.append("user_id", newUserId.toString());
    if (isOrganization) {
      const orgName = (document.getElementById("organization-name") as HTMLInputElement).value;
      formData.append("organization_name", orgName);
    }
    formData.append("donor_type", donor_type);
    formData.append("date_joined", dateJoinedInput);

    try {
      // Optional loading popup
      Swal.fire({
        title: "Creating donor…",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await createNewDonor(formData);

      await Swal.fire({
        icon: "success",
        title: "Donor created",
        text: "The donor has been added successfully.",
        confirmButtonText: "Great!",
      });

      setActiveModal("donor-saved");
    } catch (error: any) {
      console.error("Error:", error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "An unexpected error occurred while creating the donor.";

      await Swal.fire({
        icon: "error",
        title: "Failed to create donor",
        text: message,
        confirmButtonText: "OK",
      });
    } finally {
      Swal.close(); // close loading if still open
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      if (file) dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  // Gift Donor
  const [giftDonorSearchName, setGiftDonorSearchName] = useState<string>("");
  const [giftDonorSearchedNames, setGiftDonorSearchedNames] = useState<SearchedDonors[] | null>(null);
  const [giftDonorName, setGiftDonorName] = useState("User Profile");
  const [giftDonorEmail, setGiftDonorEmail] = useState<string>("sample-email@gmail.com");

  const handleGiftDonorSearch = async () => {
    try {
      const response = await searchDonorUsers(giftDonorSearchName);
      if (Array.isArray(response)) {
        setGiftDonorSearchedNames(response);
      } else if (response && typeof response === "object" && "donors" in response) {
        const filtered = (response as SearchedDonorsAPIResponse).donors.filter((d) =>
          d.username.toLowerCase().includes(giftDonorSearchName.toLowerCase())
        );
        setGiftDonorSearchedNames(
          filtered.map((d) => ({ user_id: d.user_id, username: d.username, email: d.email }))
        );
      } else {
        setGiftDonorSearchedNames([]);
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
      setGiftDonorSearchedNames([]);
    }
  };

  useEffect(() => {
    if (giftDonorSearchName.trim() !== "") handleGiftDonorSearch();
    else setGiftDonorSearchedNames(null);
  }, [giftDonorSearchName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (donorGiftRef.current && !donorGiftRef.current.contains(event.target as Node)) {
        setGiftDonorSearchedNames(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  const setSelectedGiftDonor = (donor: SearchedDonors) => {
    setGiftDonorName(donor.username);
    setGiftDonorEmail(donor.email || "No email provided");
    setGiftDonorSearchedNames(null);
  };

  return (
    <div id="donors">
      <h3 className="public-feed-title">LIST OF RAFI DONORS</h3>

      <div id="settings-container">
        <SearchBar
          placeholder="Search Donor"
          classname="search-bar"
          value={searched}
          onChange={searchState}
        />
        <FilterBar items={sortingItems} value={sorting} onChange={setSelectedSorting} />

        {adminRoleAccess && (
          <>
            <button
              type="button"
              className={"settings-button" + (userType === "admin" ? "" : " hidden")}
              onClick={() => toggleModal("new-donor-type-selection")}
            >
              Add Donor
              <PlusCircle width={24} height={24} className="add_donor" />
            </button>
            <button
              type="button"
              className={"settings-button" + (userType === "admin" ? "" : " hidden")}
              onClick={() => toggleModal("gift-donor")}
            >
              Gift Donor
              <Gift width={24} height={24} />
            </button>
          </>
        )}
      </div>

      {/* <div id="page-body"> */}
      {!noResults && (
        <div id="table-page-control" className="page-contorol">
          <button
            className="prev-page"
            onClick={() => handleTablePageControl("prev")}
            disabled={page <= 1 || maxPage <= 1}
          >
            Previous
          </button>
          <p>Page: {Math.min(page, maxPage)}/{maxPage}</p>
          <button
            className="next-page"
            onClick={() => handleTablePageControl("next")}
            disabled={page >= maxPage || maxPage <= 1}
          >
            Next
          </button>
        </div>
      )}

      {isLoading ? (
        <p id="loading">Loading…</p>
      ) : filteredDonors.length > 0 ? (
        <DonorTable tableData={tableData} />
      ) : (
        <p id="no-donor">
          {searched.trim()
            ? `No donors match “${searched}”`
            : "No donors found"}
        </p>
      )}

      {!noResults && (
        <div id="table-page-control" className="page-contorol">
          <button
            className="prev-page"
            onClick={() => handleTablePageControl("prev")}
            disabled={page <= 1 || maxPage <= 1}
          >
            Previous
          </button>
          <p>Page: {Math.min(page, maxPage)}/{maxPage}</p>
          <button
            className="next-page"
            onClick={() => handleTablePageControl("next")}
            disabled={page >= maxPage || maxPage <= 1}
          >
            Next
          </button>
        </div>
      )}
      {/* </div> */}

      {/* Modals... (unchanged except for SweetAlert usage in handlers) */}
      <Modal
        isOpen={activeModal === "new-donor-type-selection"}
        onClose={closeModal}
      >
        <h3 className="modal-title">Select Type of New Donor</h3>
        <div className="modal-buttons-container">
          <button
            type="button"
            className={
              "settings-button" + (userType === "admin" ? "" : " hidden")
            }
            onClick={() => setOrganizationDonorType(false)}
          >
            Individual
          </button>
          <button
            type="button"
            className={
              "settings-button" + (userType === "admin" ? "" : " hidden")
            }
            onClick={() => setOrganizationDonorType(true)}
          >
            Organization
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "new-donor-form-create"}
        onClose={closeModal}
      >
        <h3 className="modal-title">Add New Donor</h3>
        <div id="modal-common-container">
          <div className="search-container" ref={donorSearchRef}>
            <SearchBar
              placeholder="Search Donor"
              value={addDonorSearch}
              onChange={setAddDonorSearch}
              onSearch={() => handleAddDonorSearch()}
            />
            {newDonorSearchedItems != null && (
              <ul className="searched-list">
                {newDonorSearchedItems === null ? (
                  <li>Loading or no results yet...</li>
                ) : newDonorSearchedItems.length === 0 ? (
                  <li>No donors found.</li>
                ) : (
                  newDonorSearchedItems.map((donor, index) => (
                    <li
                      key={index}
                      onClick={() => setSelectedNewDonorProfile(donor)}
                    >
                      {donor.username}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <div id="donor-profile-container">
            <img src={newDonorProfile} alt="userProfile" id="new-donor-profile" />
            <p id="new-donor-text">{newDonorName}</p>
          </div>
          <form id="new-donor-form-contianer" onSubmit={handleNewDonorSubmit}>
            {isOrganization == true && (
              <div className="text-entry">
                <input
                  type="text"
                  id="organization-name"
                  className="entry"
                  placeholder=" "
                />
                <label htmlFor="organization-name" className="entry-label">
                  Organization Name
                </label>
              </div>
            )}
            <div className="text-entry">
              <input
                type="date"
                id="date-joined"
                className="entry no-icon"
                placeholder=" "
                value={dateJoined}
                onChange={(e) => setDateJoined(e.target.value)}
              />
              <label htmlFor="date-joined" className="entry-label">
                Date Joined
              </label>
            </div>
            <button type="submit" className="green-modal-button">
              Add Donor
            </button>
          </form>
        </div>
      </Modal>

      <Modal isOpen={activeModal === "gift-donor"} onClose={closeModal}>
        <h3 className="modal-title">Gift Donor</h3>
        <p className="modal-instruction">
          Gift a donor with thank you message, greeting, special information, or
          updates in a file format.
        </p>
        <div id="modal-common-container">
          <div className="search-container" ref={donorGiftRef}>
            <SearchBar
              placeholder="Search Donor"
              value={giftDonorSearchName}
              onChange={setGiftDonorSearchName}
              onSearch={() => handleGiftDonorSearch()}
            />
            {giftDonorSearchedNames != null && (
              <ul className="searched-list">
                {giftDonorSearchedNames === null ? (
                  <li>Loading or no results yet...</li>
                ) : giftDonorSearchedNames.length === 0 ? (
                  <li>No donors found.</li>
                ) : (
                  giftDonorSearchedNames.map((donor, index) => (
                    <li
                      key={index}
                      onClick={() => setSelectedGiftDonor(donor)}
                    >
                      {donor.username}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <div id="gift-donor-profile-container">
            <img
              src={newDonorProfile}
              alt="userProfile"
              id="gift-donor-profile"
            />
            <p id="gift-donor-text">{giftDonorName}</p>
            <p id="gift-donor-email">{giftDonorEmail}</p>
          </div>
          <form id="gift-donor-form">
            <input
              type="file"
              name="giftFile"
              accept="application/pdf"
              ref={fileInputRef}
              className="hidden"
            />
            <div id="gift-dimension-control">
              <UploadFile
                accept="application/pdf"
                showName={true}
                onFileSelect={handleFileSelect}
                className="gift-content"
              />
            </div>
            <button
              type="button"
              className="green-modal-button"
              onClick={async () => {
                // ✅ Optional SweetAlert confirm before sending
                const res = await Swal.fire({
                  icon: "question",
                  title: "Send gift?",
                  text: "This will send the selected file to the donor.",
                  showCancelButton: true,
                  confirmButtonText: "Send",
                  cancelButtonText: "Cancel",
                });
                if (res.isConfirmed) {
                  // TODO: call your real API to send the gift file here
                  await Swal.fire({
                    icon: "success",
                    title: "Gift sent!",
                    timer: 1500,
                    showConfirmButton: false,
                  });
                  setActiveModal("gift-sent");
                }
              }}
            >
              Send Gift
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default ListOfRAFIDonors;
