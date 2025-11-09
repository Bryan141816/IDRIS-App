import React, { useState, useEffect } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import Swal from "sweetalert2";

import { TeamMember } from "../../RoutesAndPlanning";
interface ReAssignVolunteersProps {
  onClose: () => void;
  refreshData: () => void;
  team_members: TeamMember[];
  team_id: number;
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
  email: string;
  phone_number: string;
  middle_name: string;
};
export const ReAssignVolunteers: React.FC<ReAssignVolunteersProps> = ({
  onClose,
  refreshData,
  team_members,
  team_id,
}) => {
  type Additional = {
    reassign_type: string;
  };
  const [formTeam, setFormTeam] = useState<(TeamMember & Additional)[]>(
    team_members.map((member) => ({
      ...member,
      reassign_type: "",
    })),
  );
  const [openSelector, setOpenSelector] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const handleSelect = (volunteers: Volunteer) => {
    const new_volunteer = {
      volunteer_id: volunteers.volunteer_id,
      first_name: volunteers.first_name,
      middle_name: volunteers.middle_name,
      last_name: volunteers.last_name,
      full_name: `${volunteers.first_name} ${volunteers.middle_name} ${volunteers.last_name}`,
      email: volunteers.email,
      phone_number: volunteers.phone_number,
      address: volunteers.address,
      gender: volunteers.gender,
      age: volunteers.age,
    };
    setFormTeam((prev) =>
      prev.map((m, i) =>
        i === selectedIndex
          ? {
              ...m,
              reassign_type: "change",
              volunteer: new_volunteer,
            }
          : m,
      ),
    );
  };
  const handleSubmit = () => {
    const normalizedData = formTeam.map((item) => ({
      member_id: item.members_id,
      volunteer_id: item.volunteer.volunteer_id,
      role: item.role,
      reassign_type: item.reassign_type,
      team_id: team_id,
    }));
    const submit = async () => {
      try {
        const response = await API.post(
          "/distributionAndplanning/reassigned_volunteers",
          normalizedData,
        );
        Swal.fire({
          icon: "success",
          title: "Success",
          timer: 900,
          showConfirmButton: false,
        });
        refreshData();
        onClose();
      } catch (e: any) {
        console.error("Error reassigning volunteers");
      }
    };
    submit();
  };
  return (
    <>
      {openSelector && (
        <SelectVolunteer
          onClose={() => setOpenSelector(false)}
          handleSelect={handleSelect}
        ></SelectVolunteer>
      )}
      <div className="modal-overlay" style={{ zIndex: 900 }}>
        <div className="modal" style={{ minWidth: "65vw" }}>
          <div className="modal-header">
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-content">
            <h3>ReassignVolunteers</h3>

            <div style={{ width: "100%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead
                  style={{
                    backgroundColor: "#749ab6",
                    color: "white",
                    textAlign: "left",
                  }}
                >
                  <tr>
                    <th style={{ padding: "10px" }}>Name</th>
                    <th style={{ padding: "10px" }}>Role</th>
                    <th style={{ padding: "10px" }}>Modification Type</th>
                    <th style={{ padding: "10px" }}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {formTeam
                    .filter((member) => member.status === "rejected")
                    .map((member, index) => (
                      <tr key={member.members_id}>
                        {/* Name */}
                        <td style={{ padding: "8px" }}>
                          {member.volunteer.full_name}
                        </td>

                        {/* Role Selector */}
                        <td style={{ padding: "8px" }}>
                          <select
                            value={member.role || ""}
                            onChange={(e) => {
                              const { value } = e.target;
                              setFormTeam((prev) =>
                                prev.map((m, i) =>
                                  i === index ? { ...m, role: value } : m,
                                ),
                              );
                            }}
                          >
                            <option value="team leader">Team Leader</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="volunteer">Volunteer</option>
                            <option value="driver">Driver</option>
                          </select>
                        </td>
                        <td style={{ padding: "8px" }}>
                          {member.reassign_type}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "8px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              className="action-btn"
                              onClick={() => {
                                if (member.reassign_type === "change") {
                                  const prev_data = team_members[index];
                                  setFormTeam((prev) =>
                                    prev.map((m, i) =>
                                      i === index
                                        ? {
                                            ...prev_data,
                                            reassign_type: "retry",
                                          }
                                        : m,
                                    ),
                                  );
                                } else {
                                  setFormTeam((prev) =>
                                    prev.map((m, i) =>
                                      i === index
                                        ? { ...m, reassign_type: "retry" }
                                        : m,
                                    ),
                                  );
                                }
                              }}
                            >
                              Retry
                            </button>

                            <button
                              className="action-btn"
                              onClick={() => {
                                if (member.reassign_type === "change") {
                                  const prev_data = team_members[index];
                                  setFormTeam((prev) =>
                                    prev.map((m, i) =>
                                      i === index
                                        ? {
                                            ...prev_data,
                                            reassign_type: "remove",
                                          }
                                        : m,
                                    ),
                                  );
                                } else {
                                  setFormTeam((prev) =>
                                    prev.map((m, i) =>
                                      i === index
                                        ? { ...m, reassign_type: "remove" }
                                        : m,
                                    ),
                                  );
                                }
                              }}
                            >
                              Remove
                            </button>

                            <button
                              className="action-btn"
                              onClick={() => {
                                setOpenSelector(true);
                                setSelectedIndex(index);
                              }}
                            >
                              Change
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {/* Optional fallback if no rejected members */}
                  {formTeam.filter((m) => m.status === "rejected").length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={3}
                        style={{
                          padding: "10px",
                          textAlign: "center",
                          color: "#777",
                        }}
                      >
                        No rejected members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
        </div>
      </div>
    </>
  );
};

interface SelectVolunteerProp {
  onClose: () => void;
  handleSelect: (volunteers: Volunteer) => void;
}

const SelectVolunteer: React.FC<SelectVolunteerProp> = ({
  onClose,
  handleSelect,
}) => {
  const [volunteersData, setVolunteersData] = useState<Volunteer[]>([]);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
  const handleSelectEvent = () => {
    if (selectedIndex !== null) {
      const selected = volunteersData[selectedIndex];
      handleSelect(selected);
      onClose();
    }
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
                  {volunteersData.map((volunteer, index) => (
                    <tr>
                      <td style={{ textAlign: "start", padding: "10px" }}>
                        <input
                          type="checkbox"
                          checked={selectedIndex === index}
                          onChange={(e) => {
                            const { checked } = e.target;
                            if (checked) {
                              setSelectedIndex(index);
                            } else {
                              setSelectedIndex(null);
                            }
                          }}
                        />
                      </td>
                      <td style={{ textAlign: "start", padding: "10px" }}>
                        {volunteer.first_name} {volunteer.last_name}
                      </td>
                      <td style={{ textAlign: "start", padding: "10px" }}>
                        {volunteer.address}
                      </td>
                      <td style={{ textAlign: "start", padding: "10px" }}>
                        {volunteer.age}{" "}
                      </td>
                      <td style={{ textAlign: "start", padding: "10px" }}>
                        {volunteer.gender}{" "}
                      </td>
                      <td style={{ textAlign: "start", padding: "10px" }}>
                        {volunteer.skills}{" "}
                      </td>
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
          <button className="primary-btn" onClick={handleSelectEvent}>
            Select
          </button>
        </div>
      </div>
    </div>
  );
};
