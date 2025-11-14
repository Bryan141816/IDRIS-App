import React, { useState, useEffect } from "react";
import { MapViewWithSearch } from "../../../../procurement_inventory/Tabs/MapViewWithSearch";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import Swal from "sweetalert2";
import { DistributionRouteDTO } from "../../RoutesAndPlanning";
import { RequestItemsHandler } from "../../../../procurement_management/Tabs/Modals/RequestModals/ViewDetailsRequest";

type requestItemsType = {
  item_id: number;
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
};
type StorageInfo = {
  assigned_id: number;
  inventory_name: string;
  warehouse_name: string;
  quantity_assigned: number;
};

interface FinalizeRouteSetupProp {
  onClose: () => void;
  refreshData: () => void;
  route_id: number;
  selectedRoute: DistributionRouteDTO;
}
type Volunteer = {
  volunteer_id: number;
  first_name: string;
  last_name: string;
  age: number;
  skills: string;
  gender: string;
  address: string;
  role?: string;
  availability_status?: string;
};

export const FinalizeRouteSetup: React.FC<FinalizeRouteSetupProp> = ({
  onClose,
  refreshData,
  route_id,
  selectedRoute,
}) => {
  type formDataType = {
    gathering_area_name: string;
    gathering_area_lat: number;
    gathering_area_lng: number;
  };
  const defaultFormData = {
    gathering_area_name: "",
    gathering_area_lat: -1000000,
    gathering_area_lng: -1000000,
  };

  const [formData, setFormData] = useState<formDataType>(defaultFormData);

  const [openMapViewSelect, setOpenMapViewSelect] = useState(false);

  const [isEditMember, setIsEditMember] = useState(false);
  const [teamMember, setTeamMember] = useState<Volunteer[]>([]);
  const [requestList, setRequestList] = useState<
    (requestItemsType & StorageInfo)[]
  >([]);

  useEffect(() => {
    if (selectedRoute.request?.request_type === "relief") {
      const mapped = selectedRoute.request.relief_items.map((item) => ({
        item_id: item.item_id,
        name: item.item_name,
        category: item.category,
        quantity: item.quantity,
        assigned_id: -1,
        inventory_name: "",
        warehouse_name: "",
        quantity_assigned: -1,
      }));
      setRequestList(mapped);
    }
  }, []);
  const handleSelect = (volunteers: Volunteer[]) => {
    const merged = volunteers.map((v) => {
      const existing = teamMember.find(
        (tm) => tm.volunteer_id === v.volunteer_id,
      );
      return existing ? existing : { ...v, role: "" };
    });
    setTeamMember(merged);
  };

  const handleRoleChange = (volunteer_id: number, role: string) => {
    setTeamMember((prev) =>
      prev.map((member) =>
        member.volunteer_id === volunteer_id ? { ...member, role } : member,
      ),
    );
  };
  const handleMapSubmit = (address: string, coordinates: [number, number]) => {
    setFormData((prev) => ({
      ...prev,
      gathering_area_name: address,
      gathering_area_lat: coordinates[0],
      gathering_area_lng: coordinates[1],
    }));
  };
  const handleSubmit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      const form = e.currentTarget.closest("form") as HTMLFormElement;
      if (!form.checkValidity()) {
        form.reportValidity(); // shows native browser validation
        return;
      } else {
        e.preventDefault();
      }
    }
    const cleaned_items = requestList
      ?.filter((item) => item.assigned_id !== -1) // keep only those with assigned_id not -1
      .map(({ item_id, assigned_id, quantity_assigned }) => ({
        item_id,
        assigned_id,
        quantity_assigned,
      }));

    const cleaned_team = teamMember.map(({ volunteer_id, role }) => ({
      volunteer_id,
      role,
    }));
    const formatted = {
      ...formData,
      route_id: route_id,
      team_members: cleaned_team,
      inventory: cleaned_items,
    };
    const submit = async () => {
      try {
        const response = await API.post(
          "/distribution_planning/finalize_route",
          formatted,
        );
        Swal.fire({
          title: "Route has been finalized",
          icon: "success",
        });
        refreshData();
        onClose();
      } catch (e: any) {
        console.error("Error finalizing route: " + e.message);
      }
    };
    submit();
  };

  return (
    <>
      {isEditMember && (
        <SelectVolunteer
          onClose={() => setIsEditMember(false)}
          handleSelect={handleSelect}
          teamMember={teamMember}
        ></SelectVolunteer>
      )}
      {openMapViewSelect && (
        <MapViewWithSearch
          onClose={() => setOpenMapViewSelect(false)}
          onSubmit={handleMapSubmit}
          defaultValue={{
            address: formData.gathering_area_name,
            coordinates: [
              formData.gathering_area_lat,
              formData.gathering_area_lng,
            ],
          }}
        ></MapViewWithSearch>
      )}
      <div className="modal-overlay" style={{ zIndex: 900 }}>
        <form className="modal" style={{ minWidth: "65vw" }}>
          <div className="modal-header">
            <h3>Finalize Route</h3>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-content">
            <div className="form-group">
              <label>Gathering Area:</label>
              <input
                type="text"
                value={formData.gathering_area_name}
                placeholder="Please select a gathering area"
                required
              />
              <button
                className="secondary-btn"
                style={{ width: "100%" }}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  setOpenMapViewSelect(true);
                }}
              >
                Select Location
              </button>
            </div>
            {selectedRoute.request?.request_type === "relief" && (
              <div className="form-group" style={{ position: "relative" }}>
                <label>Pick from Inventory</label>
                <RequestItemsHandler
                  requestItems={requestList}
                  setRequestListState={setRequestList}
                  status={selectedRoute.status}
                  type="picking"
                ></RequestItemsHandler>
                {requestList.filter((item) => item.inventory_name.trim() !== "")
                  .length === 0 && (
                  <input
                    type="text"
                    id="name"
                    required
                    onInvalid={(e) =>
                      e.currentTarget.setCustomValidity(
                        "Assign item at least one item!",
                      )
                    }
                    style={{
                      height: "0px",
                      width: "0px",
                      opacity: 0,
                      position: "absolute",
                      left: "50%",
                    }}
                    onInput={(e) => e.currentTarget.setCustomValidity("")}
                  />
                )}
              </div>
            )}
            <div className="form-group">
              <label>Team Members</label>
              <button
                style={{
                  width: "100%",
                  textAlign: "center",
                  border: "1px solid gray",
                  padding: "10px",
                  borderRadius: "5px",
                }}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  setIsEditMember(true);
                }}
              >
                Edit Members
              </button>

              <div style={{ width: "100%", marginTop: "5px" }}>
                <table style={{ width: "100%" }}>
                  <thead
                    style={{
                      textAlign: "start",
                      padding: "10px",
                      backgroundColor: "#749ab6 ",
                      color: "white",
                    }}
                  >
                    <tr>
                      <th style={{ textAlign: "start", padding: "10px" }}>
                        Name
                      </th>
                      <th style={{ textAlign: "start", padding: "10px" }}>
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMember.length === 0 && (
                      <input
                        type="text"
                        id="name"
                        required
                        onInvalid={(e) =>
                          e.currentTarget.setCustomValidity("Pick a volunteer!")
                        }
                        style={{
                          height: "0px",
                          width: "0px",
                          opacity: 0,
                          position: "absolute",
                          left: "50%",
                        }}
                        onInput={(e) => e.currentTarget.setCustomValidity("")}
                      />
                    )}

                    {teamMember.map((volunteer) => (
                      <tr key={volunteer.volunteer_id}>
                        <td style={{ padding: "10px" }}>
                          {volunteer.first_name} {volunteer.last_name}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <select
                            value={volunteer.role || ""}
                            onChange={(e) =>
                              handleRoleChange(
                                volunteer.volunteer_id,
                                e.target.value,
                              )
                            }
                            required
                          >
                            <option value="">Select Role</option>
                            <option value="team leader">Team Leader</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="volunteer">Volunteer</option>
                            <option value="driver">Driver</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-btn" onClick={handleSubmit}>
              Submit
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

interface SelectVolunteerProp {
  onClose: () => void;
  handleSelect: (volunteers: Volunteer[]) => void;
  teamMember: Volunteer[];
}

export const SelectVolunteer: React.FC<SelectVolunteerProp> = ({
  onClose,
  handleSelect,
  teamMember,
}) => {
  const [volunteersData, setVolunteersData] = useState<Volunteer[]>([]);
  const [selectedVolunteers, setSelectedVolunteers] =
    useState<Volunteer[]>(teamMember);

  const fetchData = async () => {
    try {
      const response = await API.get("/distribution_planning/get_volunteers");
      const availableVolunteers = response.data.filter(
        (volunteer: Volunteer) => volunteer.availability_status !== "assigned",
      );
      setVolunteersData(availableVolunteers);
    } catch (e: any) {
      console.error("error fetching volunteer: " + e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckboxChange = (volunteer: Volunteer, checked: boolean) => {
    if (checked) {
      setSelectedVolunteers((prev) => [...prev, volunteer]);
    } else {
      setSelectedVolunteers((prev) =>
        prev.filter((v) => v.volunteer_id !== volunteer.volunteer_id),
      );
    }
  };

  const handleSelectClick = () => {
    handleSelect(selectedVolunteers);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal"
        style={{
          zIndex: 990,
          width: "60%",
          maxWidth: "1000px",
        }}
      >
        <div className="modal-header">
          <h3>Select Members</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {volunteersData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#666",
                fontSize: "16px",
              }}
            >
              <p>No volunteers available</p>
            </div>
          ) : (
            <div style={{ width: "100%" }}>
              <table style={{ width: "100%" }}>
                <thead
                  style={{
                    textAlign: "start",
                    padding: "10px",
                    backgroundColor: "#749ab6",
                    color: "white",
                  }}
                >
                  <tr>
                    <th>{"  "}</th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Name
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Address
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>Age</th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Gender
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Skills
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {volunteersData.map((volunteer) => (
                    <tr key={volunteer.volunteer_id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedVolunteers.some(
                            (v) => v.volunteer_id === volunteer.volunteer_id,
                          )}
                          onChange={(e) =>
                            handleCheckboxChange(volunteer, e.target.checked)
                          }
                        />
                      </td>
                      <td style={{ padding: "10px" }}>
                        {volunteer.first_name} {volunteer.last_name}
                      </td>
                      <td style={{ padding: "10px" }}>{volunteer.address}</td>
                      <td style={{ padding: "10px" }}>{volunteer.age}</td>
                      <td style={{ padding: "10px" }}>{volunteer.gender}</td>
                      <td style={{ padding: "10px" }}>{volunteer.skills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSelectClick}>
            Select
          </button>
        </div>
      </div>
    </div>
  );
};
