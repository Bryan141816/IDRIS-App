import { createBrowserRouter, Navigate } from "react-router-dom";
import PageLayout from "./page_layout";
import PageLoader from "./components/Page_Furniture/Loader";
import { authLoader } from "./AuthLoader";

const UserNotAllowed = () =>
  import("./components/Page_Furniture/UserNotAllowed").then((module) => ({
    Component: module.default,
  }));

const ReportsGeneration = () =>
  import("./pages/reports_generation/reports_generation").then((module) => ({
    Component: module.default,
  }));

const DamageAssessment = () =>
  import("./pages/damage_assessment/damage_assessment").then((module) => ({
    Component: module.default,
  }));

const FinanceManagement = () =>
  import("./pages/finance&admin/finance_management/finance_management").then(
    (module) => ({
      Component: module.default,
    }),
  );

//Authentication
const Login = () =>
  import("./components/Page_Furniture/Login").then((module) => ({
    Component: module.default,
  }));
const Register = () =>
  import("./components/Page_Furniture/Register").then((module) => ({
    Component: module.default,
  }));

const Activate = () =>
  import("./components/Page_Furniture/ActivateAccount").then((module) => ({
    Component: module.default,
  }));
const ForgotPassword = () =>
  import("./components/Page_Furniture/ForgotPassword").then((module) => ({
    Component: module.default,
  }));
const ResetPassword = () =>
  import("./components/Page_Furniture/ResetPassword").then((module) => ({
    Component: module.default,
  }));
// LGU Profiling
const MapOfCebu = () =>
  import("./pages/lgu_profiling/map_of_cebu/MapOfCebu").then((module) => ({
    Component: module.default,
  }));
const EvacuationAndShelter = () =>
  import(
    "./pages/lgu_profiling/evacuationandshelter/manage_evacuation_and_shelter"
  ).then((module) => ({
    Component: module.default,
  }));
const LGU = () =>
  import("./pages/lgu_profiling/map_of_cebu/lgu").then((module) => ({
    Component: module.default,
  }));
const LGUSeeMore = () =>
  import("./pages/lgu_profiling/map_of_cebu/LGUSeeMore").then((module) => ({
    Component: module.default,
  }));
const ManageLGU = () =>
  import("./pages/lgu_profiling/LGUmanagement/manage_LGU").then((module) => ({
    Component: module.default,
  }));

//Volunteer Management
const TrackVolunteerApplication = () =>
  import(
    "./pages/volunteer_management/track_volunteer_application/TrackVolunteerApplication"
  ).then((module) => ({
    Component: module.default,
  }));
const ManageApplicant = () =>
  import("./pages/volunteer_management/manage_applicant/ManageApplicant").then(
    (module) => ({ Component: module.default }),
  );

const VolunteerDashboard = () =>
  import(
    "./pages/volunteer_management/volunteer_dashboard/VolunteerDashboard"
  ).then((module) => ({ Component: module.default }));

const VolunteerProfiles = () =>
  import(
    "./pages/volunteer_management/volunteer_profiles/VolunteerPofiles"
  ).then((module) => ({ Component: module.default }));

const OrganizationForm = () =>
  import("./pages/volunteer_management/volunteer_form/OrganizationForm").then(
    (module) => ({ Component: module.default }),
  );

const IndividualForm = () =>
  import("./pages/volunteer_management/volunteer_form/IndividualForm").then(
    (module) => ({ Component: module.default }),
  );

const VolunteerAssignment = () =>
  import(
    "./pages/volunteer_management/volunteer_assignment/volunteer_assignment"
  ).then((module) => ({ Component: module.default }));

const ManageVolunteer = () =>
  import("./pages/volunteer_management/manage_volunteers/ManageVolunteer").then(
    (module) => ({ Component: module.default }),
  );

// Donations Management
const DonationsDashboard = () =>
  import(
    "./pages/donations_management/donations_dashboard/Donations_Dashboard"
  ).then((module) => ({ Component: module.default }));
const ListOfRafiDonors = () =>
  import(
    "./pages/donations_management/list_of_rafi_donors/ListOfRAFIDonors"
  ).then((module) => ({ Component: module.default }));
const FundingProposals = () =>
  import(
    "./pages/donations_management/funding_proposals/FundingProposals"
  ).then((module) => ({ Component: module.default }));
const CreateFunding = () =>
  import("./pages/donations_management/funding_proposals/CreateFunding").then(
    (module) => ({ Component: module.default }),
  );
const UpdateFunding = () =>
  import("./pages/donations_management/funding_proposals/UpdateFunding").then(
    (module) => ({ Component: module.default }),
  );
const TransparencyReport = () =>
  import(
    "./pages/donations_management/transparency_report_management/TransparencyReport"
  ).then((module) => ({ Component: module.default }));

const FundingDonation = () =>
  import("./pages/donations_management/donations/FundingDonation").then(
    (module) => ({ Component: module.default }),
  );

const DonorProfile = () =>
  import("./pages/donations_management/donor/Donor_Profile").then((module) => ({
    Component: module.default,
  }));
// Response Dashboard

const ResponseDashboard = () =>
  import("./pages/response_dashboard/ResponseDashboard").then((module) => ({
    Component: module.default,
  }));
const ReportList = () =>
  import("./pages/response_dashboard/report_list/ReportList").then(
    (module) => ({
      Component: module.default,
    }),
  );
const DemandAndResponseMap = () =>
  import(
    "./pages/response_dashboard/demand_and_response_map/DemandAndResponseMap"
  ).then((module) => ({
    Component: module.default,
  }));
const DemandAndResponseList = () =>
  import(
    "./pages/response_dashboard/demand_and_response_map/DemandAndResponseList"
  ).then((module) => ({
    Component: module.default,
  }));
const ModalityDistribution = () =>
  import(
    "./pages/response_dashboard/modality_distribution/ModalityDistribution"
  ).then((module) => ({
    Component: module.default,
  }));
const InKindMonitoring = () =>
  import("./pages/response_dashboard/in_kind_monitoring/InKindMonitoring").then(
    (module) => ({
      Component: module.default,
    }),
  );
const BudgetRecord = () =>
  import("./pages/response_dashboard/budget_record/BudgetRecord").then(
    (module) => ({
      Component: module.default,
    }),
  );

// Procurement Inventory
const ProcurementInventory = () =>
  import(
    "./pages/procurement_inventory/procurement_inventory/procurement_inventory"
  ).then((module) => ({ Component: module.default }));

const DistributionPlanning = () =>
  import(
    "./pages/procurement_inventory/distribution_planning/distribution_planning_and_monitoring"
  ).then((module) => ({ Component: module.default }));

const ProcurementManagement = () =>
  import(
    "./pages/procurement_inventory/procurement_management/procurement_management"
  ).then((module) => ({ Component: module.default }));

export const router = createBrowserRouter([
  {
    path: "/",
    HydrateFallback: PageLoader,
    element: <PageLayout />,
    loader: authLoader,
    children: [
      {
        index: true,
        element: (
          <Navigate to="/donations_management/donations_dashboard" replace />
        ),
      },
      {
        path: "login",
        lazy: Login,
      },
      {
        path: "register",
        lazy: Register,
      },
      {
        path: "activate",
        lazy: Activate,
      },
      {
        path: "forgot_password",
        lazy: ForgotPassword,
      },
      {
        path: "reset_password",
        lazy: ResetPassword,
      },
      {
        path: "user_not_allowed",
        lazy: UserNotAllowed,
      },
      {
        path: "lgu_profiling",
        children: [
          {
            path: "map_of_cebu",
            lazy: MapOfCebu,
          },
          {
            path: "evacuationandshelter",
            lazy: EvacuationAndShelter,
          },
          {
            path: "LGU",
            lazy: LGU,
          },
          {
            path: "LGUmanagement",
            lazy: ManageLGU,
          },
          {
            path: "LGUSeeMore/:lguName",
            lazy: LGUSeeMore,
          },
        ],
      },
      {
        path: "volunteer_management",
        children: [
          {
            path: "track_volunteer_application",
            lazy: TrackVolunteerApplication,
          },
          {
            path: "volunteer_dashboard",
            lazy: VolunteerDashboard,
          },
          {
            path: "organization_form",
            lazy: OrganizationForm,
          },
          {
            path: "individual_form",
            lazy: IndividualForm,
          },
          {
            path: "volunteer_assignment",
            lazy: VolunteerAssignment,
          },
          {
            path: "manage_applicant",
            lazy: ManageApplicant,
          },
          {
            path: "volunteer_profiles",
            lazy: VolunteerProfiles,
          },
          {
            path: "manage_volunteers",
            lazy: ManageVolunteer,
          },
        ],
      },
      {
        path: "donations_management",
        children: [
          {
            path: "donations_dashboard",
            lazy: DonationsDashboard,
          },
          {
            path: "list_of_rafi_donors",
            lazy: ListOfRafiDonors,
          },
          {
            path: "funding_proposals",
            children: [
              {
                index: true,
                lazy: FundingProposals,
              },
              {
                path: "create",
                lazy: CreateFunding,
                handle: { allowedRoles: ["finance admin"] },
              },
              {
                path: "update",
                lazy: UpdateFunding,
                handle: { allowedRoles: ["finance admin"] },
              },
            ],
          },
          {
            path: "funding_donation",
            lazy: FundingDonation,
          },
        ],
      },
      {
        path: "transparency_report",
        lazy: TransparencyReport,
        handle: { allowedRoles: ["finance admin"] },
      },
      {
        path: "donor_profile",
        lazy: DonorProfile,
      },
      {
        path: "response_dashboard",
        children: [
          {
            index: true,
            lazy: ResponseDashboard,
          },
          {
            path: "report_list",
            lazy: ReportList,
            handle: { allowedRoles: ["operations admin"] },
          },
          {
            path: "demand_and_response_map",
            children: [
              {
                index: true,
                lazy: DemandAndResponseMap,
                handle: { allowedRoles: ["operations admin"] },
              },
              {
                path: "list_view",
                lazy: DemandAndResponseList,
                handle: { allowedRoles: ["operations admin"] },
              },
            ],
          },
          {
            path: "modality_distribution",
            lazy: ModalityDistribution,
            handle: { allowedRoles: ["operations admin"] },
          },
          {
            path: "in_kind_monitoring",
            lazy: InKindMonitoring,
            handle: { allowedRoles: ["operations admin"] },
          },
          {
            path: "budget_record",
            lazy: BudgetRecord,
            handle: { allowedRoles: ["operations admin"] },
          },
        ],
      },
      {
        path: "reports_generation",
        lazy: ReportsGeneration,
      },
      {
        path: "damange_assessment",
        lazy: DamageAssessment,
      },
      {
        path: "procurement_inventory",
        children: [
          {
            path: "procurement_inventory",
            lazy: ProcurementInventory,
          },
          {
            path: "distribution_planning",
            lazy: DistributionPlanning,
          },
          {
            path: "procurement_management",
            lazy: ProcurementManagement,
          },
        ],
      },
      {
        path: "finance&admin/finance_management",
        lazy: FinanceManagement,
      },
    ],
  },
]);
export const prefetchMap: Record<string, () => Promise<any>> = {
  "/login": Login,
  "/register": Register,

  "/lgu_profiling/map_of_cebu": MapOfCebu,
  "/lgu_profiling/evacuationandshelter": EvacuationAndShelter,
  "/lgu_profiling/LGU": LGU,
  "/lgu_profiling/LGUmanagement": ManageLGU,
  "/lgu_profiling/LGUSeeMore": LGUSeeMore, // dynamic segment ignored in key

  "/volunteer_management/track_volunteer_application":
    TrackVolunteerApplication,
  "/volunteer_management/volunteer_dashboard": VolunteerDashboard,
  "/volunteer_management/organization_form": OrganizationForm,
  "/volunteer_management/individual_form": IndividualForm,
  "/volunteer_management/volunteer_assignment": VolunteerAssignment,
  "/volunteer_management/manage_applicant": ManageApplicant,
  "/volunteer_management/volunteer_profiles": VolunteerProfiles,
  "/volunteer_management/manage_volunteers": ManageVolunteer,

  "/donations_management/donations_dashboard": DonationsDashboard,
  "/donations_management/list_of_rafi_donors": ListOfRafiDonors,
  "/donations_management/funding_proposals": FundingProposals,
  "/donations_management/funding_proposals/create": CreateFunding,
  "/donations_management/funding_proposals/update": UpdateFunding,

  "/transparency_report": TransparencyReport,
  "/donor_profile": DonorProfile,

  "/response_dashboard": ResponseDashboard,
  "/response_dashboard/report_list": ReportList,
  "/response_dashboard/demand_and_response_map": DemandAndResponseMap,
  "/response_dashboard/demand_and_response_map/list_view":
    DemandAndResponseList,
  "/response_dashboard/modality_distribution": ModalityDistribution,
  "/response_dashboard/in_kind_monitoring": InKindMonitoring,
  "/response_dashboard/budget_record": BudgetRecord,

  "/reports_generation": ReportsGeneration,
  "/damange_assessment": DamageAssessment,

  "/procurement_inventory/procurement_inventory": ProcurementInventory,
  "/procurement_inventory/distribution_planning": DistributionPlanning,
  "/procurement_inventory/procurement_management": ProcurementManagement,

  "/finance&admin/finance_management": FinanceManagement,
};
