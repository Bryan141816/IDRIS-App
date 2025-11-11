import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import PageLayout from "./page_layout";
import PageLoader from "./components/Page_Furniture/Loader";
import { authLoader } from "./AuthLoader";
import { buildFinanceReportPDFBlob } from "./pages/finance_admin/finance_management/FinanceReport";

// ✅ Dynamic Imports (Lazy Loaded Components)
const UserNotAllowed = () =>
  import("./components/Page_Furniture/UserNotAllowed").then((m) => ({
    Component: m.default,
  }));

const NotificationPage = () =>
  import("./components/Page_Furniture/NotificationPage").then((m) => ({
    Component: m.default,
  }));

const ReportsGeneration = () =>
  import("./pages/reports_generation/reports_generation").then((m) => ({
    Component: m.default,
  }));

const DamageAssessment = () =>
  import("./pages/damage_assessment/damage_assessment").then((m) => ({
    Component: m.default,
  }));

// Finance Management
const FinanceManagement = () =>
  import("./pages/finance_admin/finance_management/FinanceManagement").then(
    (m) => ({ Component: m.default }),
  );

const FinancePrintPage = () =>
  import("./pages/finance_admin/finance_management/FinanceReportPDF").then(
    (m) => ({ Component: m.default }),
  );

const FinanceBudgetSummary = () =>
  import(
    "./pages/finance_admin/finance_management/BudgetSummary/MainPage"
  ).then((m) => ({ Component: m.default }));

// Authentication
const Login = () =>
  import("./components/Page_Furniture/Login").then((m) => ({
    Component: m.default,
  }));

const Register = () =>
  import("./components/Page_Furniture/Register").then((m) => ({
    Component: m.default,
  }));

const Activate = () =>
  import("./components/Page_Furniture/ActivateAccount").then((m) => ({
    Component: m.default,
  }));

const AdminActivate = () =>
  import("./components/Page_Furniture/ActivateAccountAdmin").then((m) => ({
    Component: m.default,
  }));

const ForgotPassword = () =>
  import("./components/Page_Furniture/ForgotPassword").then((m) => ({
    Component: m.default,
  }));

const ResetPassword = () =>
  import("./components/Page_Furniture/ResetPassword").then((m) => ({
    Component: m.default,
  }));

const OauthCallback = () =>
  import("./components/Page_Furniture/OauthCallback").then((m) => ({
    Component: m.default,
  }));

// User Management
const UserManagement = () =>
  import("./pages/manage_users/ManageUsers").then((m) => ({
    Component: m.default,
  }));
// LGU Profiling
const LGUofficermanagement = () =>
  import("./pages/lgu_profiling/LGUofficer/LGUofficer").then((m) => ({
    Component: m.default,
  }));
const LGUofficerSuperAdmin = () =>
  import(
    "./pages/lgu_profiling/LGUofficerSuperAdmin/LGUofficerSuperAdmin"
  ).then((m) => ({ Component: m.default }));

const MapOfCebu = () =>
  import("./pages/lgu_profiling/map_of_cebu/MapOfCebu").then((m) => ({
    Component: m.default,
  }));

const EvacuationAndShelter = () =>
  import(
    "./pages/lgu_profiling/evacuationandshelter/manage_evacuation_and_shelter"
  ).then((m) => ({ Component: m.default }));

const ShelterReportDashboard = () =>
  import(
    "./pages/lgu_profiling/evacuationandshelter/ShelterReportDashboard"
  ).then((m) => ({ Component: m.default }));

const LGU = () =>
  import("./pages/lgu_profiling/map_of_cebu/lgu").then((m) => ({
    Component: m.default,
  }));

const LGUSeeMore = () =>
  import("./pages/lgu_profiling/map_of_cebu/LGUSeeMore").then((m) => ({
    Component: m.default,
  }));

const ManageLGU = () =>
  import("./pages/lgu_profiling/LGUmanagement/manage_LGU").then((m) => ({
    Component: m.default,
  }));

// Volunteer Management
const TrackVolunteerApplication = () =>
  import(
    "./pages/volunteer_management/track_volunteer_application/TrackVolunteerApplication"
  ).then((m) => ({ Component: m.default }));

const ManageApplicant = () =>
  import("./pages/volunteer_management/manage_applicant/ManageApplicant").then(
    (m) => ({ Component: m.default }),
  );

const VolunteerDashboard = () =>
  import(
    "./pages/volunteer_management/volunteer_dashboard/VolunteerDashboard"
  ).then((m) => ({ Component: m.default }));

const VolunteerProfiles = () =>
  import(
    "./pages/volunteer_management/volunteer_profiles/VolunteerPofiles"
  ).then((m) => ({ Component: m.default }));

const OrganizationForm = () =>
  import("./pages/volunteer_management/volunteer_form/OrganizationForm").then(
    (m) => ({ Component: m.default }),
  );

const IndividualForm = () =>
  import("./pages/volunteer_management/volunteer_form/IndividualForm").then(
    (m) => ({ Component: m.default }),
  );

const VolunteerAssignment = () =>
  import(
    "./pages/volunteer_management/volunteer_assignment/volunteer_assignment"
  ).then((m) => ({ Component: m.default }));

const ManageVolunteer = () =>
  import("./pages/volunteer_management/manage_volunteers/ManageVolunteer").then(
    (m) => ({ Component: m.default }),
  );

const VolunteerReports = () =>
  import(
    "./pages/volunteer_management/volunteer_dashboard/VolunteerReports"
  ).then((m) => ({ Component: m.default }));

const ProgramsReports = () =>
  import(
    "./pages/volunteer_management/volunteer_dashboard/ProgramsReports"
  ).then((m) => ({ Component: m.default }));

// Donations Management
const DonationsDashboard = () =>
  import(
    "./pages/donations_management/donations_dashboard/DonationsDashboard"
  ).then((m) => ({ Component: m.default }));

const ListOfRafiDonors = () =>
  import(
    "./pages/donations_management/list_of_rafi_donors/ListOfRAFIDonors"
  ).then((m) => ({ Component: m.default }));

const FundingProposals = () =>
  import(
    "./pages/donations_management/funding_proposals/FundingProposals"
  ).then((m) => ({ Component: m.default }));

const CreateFunding = () =>
  import("./pages/donations_management/funding_proposals/CreateFunding").then(
    (m) => ({ Component: m.default }),
  );

const UpdateFunding = () =>
  import("./pages/donations_management/funding_proposals/UpdateFunding").then(
    (m) => ({ Component: m.default }),
  );

const DonationsReport = () =>
  import(
    "./pages/donations_management/donations_dashboard/DonationReport"
  ).then((m) => ({ Component: m.default }));

const FundingDonation = () =>
  import("./pages/donations_management/donate/FundingDonation").then((m) => ({
    Component: m.default,
  }));

const DonorProfile = () =>
  import("./pages/donations_management/donor/DonorProfile").then((m) => ({
    Component: m.default,
  }));

const DonationStatus = () =>
  import("./pages/donations_management/donate/DonationStatus").then((m) => ({
    Component: m.default,
  }));

const DonationRecords = () =>
  import("./pages/donations_management/donation_records/Donation").then(
    (m) => ({ Component: m.default }),
  );

const DonationReceipt = () =>
  import("./pages/donations_management/donor/DonationReceipt").then((m) => ({
    Component: m.default,
  }));

const FinanceReceipt = () =>
  import("./pages/finance_admin/finance_management/FinanceReceipt").then(
    (m) => ({ Component: m.default }),
  );

// Response Dashboard
const ResponseDashboard = () =>
  import("./pages/response_dashboard/ResponseDashboard").then((m) => ({
    Component: m.default,
  }));

const EmegencyReport = () =>
  import("./pages/response_dashboard/EmergencyReponseReport").then((m) => ({
    Component: m.default,
  }));

const ReportList = () =>
  import("./pages/response_dashboard/report_list/ReportList").then((m) => ({
    Component: m.default,
  }));

const DemandAndResponseMap = () =>
  import(
    "./pages/response_dashboard/demand_and_response_map/DemandAndResponseMap"
  ).then((m) => ({ Component: m.default }));

const DemandAndResponseList = () =>
  import(
    "./pages/response_dashboard/demand_and_response_map/DemandAndResponseList"
  ).then((m) => ({ Component: m.default }));

const ModalityDistribution = () =>
  import(
    "./pages/response_dashboard/modality_distribution/ModalityDistribution"
  ).then((m) => ({ Component: m.default }));

const InKindMonitoring = () =>
  import("./pages/response_dashboard/in_kind_monitoring/InKindMonitoring").then(
    (m) => ({ Component: m.default }),
  );

const BudgetRecord = () =>
  import("./pages/response_dashboard/budget_record/BudgetRecord").then((m) => ({
    Component: m.default,
  }));

// Procurement Inventory
const ProcurementInventory = () =>
  import(
    "./pages/procurement_inventory/procurement_inventory/procurement_inventory"
  ).then((m) => ({ Component: m.default }));

const DistributionPlanning = () =>
  import(
    "./pages/procurement_inventory/distribution_planning/distribution_planning_and_monitoring"
  ).then((m) => ({ Component: m.default }));

const ProcurementManagement = () =>
  import(
    "./pages/procurement_inventory/procurement_management/procurement_management"
  ).then((m) => ({ Component: m.default }));

const RequestProcurement = () =>
  import(
    "./pages/procurement_inventory/request_procurement/request_prcurement"
  ).then((m) => ({ Component: m.default }));
const DistributionReport = () =>
  import(
    "./pages/procurement_inventory/distribution_planning/Tabs/DistributionReport"
  ).then((m) => ({ Component: m.default }));
// ✅ Router Definition (clean + merged)
export const router = createBrowserRouter([
  {
    path: "/complete-admin-profile",
    lazy: Activate,
  },
  {
    path: "adminactivate",
    lazy: AdminActivate,
  },
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
      { path: "login", lazy: Login },
      { path: "register", lazy: Register },
      { path: "activate", lazy: Activate },
      { path: "forgot_password", lazy: ForgotPassword },
      { path: "reset_password", lazy: ResetPassword },
      { path: "user_not_allowed", lazy: UserNotAllowed },
      { path: "manage_users", lazy: UserManagement },
      { path: "notifications", lazy: NotificationPage },
      { path: "oauth_callback", lazy: OauthCallback },
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
            path: "shelter_report_dashboard",
            lazy: ShelterReportDashboard,
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
            path: "LGUofficermanagement",
            lazy: LGUofficermanagement,
          },
          {
            path: "LGUofficerSuperAdmin",
            lazy: LGUofficerSuperAdmin,
          },

          {
            path: "LGUSeeMore/:id",
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
          { path: "volunteer_dashboard", lazy: VolunteerDashboard },
          { path: "organization_form", lazy: OrganizationForm },
          { path: "individual_form", lazy: IndividualForm },
          { path: "volunteer_assignment", lazy: VolunteerAssignment },
          { path: "manage_applicant", lazy: ManageApplicant },
          { path: "volunteer_profiles", lazy: VolunteerProfiles },
          { path: "manage_volunteers", lazy: ManageVolunteer },
          { path: "VolunteerReports", lazy: VolunteerReports },
          { path: "ProgramsReports", lazy: ProgramsReports },
        ],
      },
      {
        path: "donations_management",
        children: [
          { path: "donations_dashboard", lazy: DonationsDashboard },
          {
            path: "list_of_rafi_donors",
            lazy: ListOfRafiDonors,
            handle: { allowedRoles: ["operations admin", "superadmin"] },
          },
          {
            path: "funding_proposals",
            children: [
              { index: true, lazy: FundingProposals },
              {
                path: "create",
                lazy: CreateFunding,
                handle: {
                  allowedRoles: [
                    "finance admin",
                    "operations admin",
                    "superadmin",
                  ],
                },
              },
              {
                path: "update",
                lazy: UpdateFunding,
                handle: {
                  allowedRoles: [
                    "finance admin",
                    "operations admin",
                    "superadmin",
                  ],
                },
              },
            ],
          },
          { path: "funding_donation", lazy: FundingDonation },
          { path: "donation_status", lazy: DonationStatus },
          {
            path: "donation_records",
            lazy: DonationRecords,
            handle: {
              allowedRoles: ["finance admin", "operations admin", "superadmin"],
            },
          },
          { path: "donor_profile", lazy: DonorProfile },
        ],
      },
      {
        path: "donation_report",
        lazy: DonationsReport,
        handle: {
          allowedRoles: ["finance admin", "operations admin", "superadmin"],
        },
      },
      {
        path: "response_dashboard",
        children: [
          { index: true, lazy: ResponseDashboard },
          { path: "emergency_report", lazy: EmegencyReport },
          {
            path: "report_list",
            lazy: ReportList,
            handle: {
              allowedRoles: ["superadmin", "lgu officer", "logistics admin"],
            },
          },
          {
            path: "demand_and_response_map",
            children: [
              {
                index: true,
                lazy: DemandAndResponseMap,
                handle: {
                  allowedRoles: [
                    "superadmin",
                    "lgu officer",
                    "logistics admin",
                  ],
                },
              },
              {
                path: "list_view",
                lazy: DemandAndResponseList,
                handle: {
                  allowedRoles: [
                    "superadmin",
                    "lgu officer",
                    "logistics admin",
                  ],
                },
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
      { path: "reports_generation", lazy: ReportsGeneration },
      { path: "damange_assessment", lazy: DamageAssessment },
      {
        path: "procurement_inventory",
        children: [
          {
            path: "procurement_inventory",
            children: [
              { path: ":tab", lazy: ProcurementInventory },
              {
                index: true,
                loader: () =>
                  redirect(
                    "/procurement_inventory/procurement_inventory/dashboard",
                  ),
              },
            ],
          },
          { path: "distribution_report", lazy: DistributionReport },
          {
            path: "distribution_planning",
            children: [
              { path: ":tab", lazy: DistributionPlanning },
              {
                index: true,
                loader: () =>
                  redirect(
                    "/procurement_inventory/distribution_planning/dashboard",
                  ),
              },
            ],
          },
          {
            path: "procurement_management",
            children: [
              { path: ":tab", lazy: ProcurementManagement },
              {
                index: true,
                loader: () =>
                  redirect(
                    "/procurement_inventory/procurement_management/dashboard",
                  ),
              },
            ],
          },
        ],
      },
      { path: "request_procurement", lazy: RequestProcurement },
      {
        path: "finance&admin/finance_management",
        lazy: FinanceManagement,
        handle: {
          allowedRoles: ["operations admin", "superadmin", "finance admin"],
        },
      },
      {
        path: "/finance_printable",
        lazy: FinancePrintPage,
        handle: {
          allowedRoles: ["operations admin", "superadmin", "finance admin"],
        },
      },
      {
        path: "/finance&admin/finance_management/budget_summary",
        lazy: FinanceBudgetSummary,
        handle: {
          allowedRoles: ["operations admin", "superadmin", "finance admin"],
        },
      },
    ],
  },
  {
    path: "/donation/receipt/:donationId",
    lazy: DonationReceipt,
  },
  {
    path: "/finance/receipt/:financeId",
    lazy: FinanceReceipt,
  },
]);

export const prefetchMap: Record<string, () => Promise<any>> = {
  "/login": Login,
  "/register": Register,
  "/lgu_profiling/map_of_cebu": MapOfCebu,
  "/lgu_profiling/evacuationandshelter": EvacuationAndShelter,
  "/lgu_profiling/shelter_report_dashboard": ShelterReportDashboard,
  "/lgu_profiling/LGU": LGU,
  "/lgu_profiling/LGUmanagement": ManageLGU,
  "/lgu_profiling/LGUofficerSuperAdmin": LGUofficerSuperAdmin,
  "/lgu_profiling/LGUSeeMore": LGUSeeMore,
  "/volunteer_management/track_volunteer_application":
    TrackVolunteerApplication,
  "/volunteer_management/volunteer_dashboard": VolunteerDashboard,
  "/volunteer_management/organization_form": OrganizationForm,
  "/volunteer_management/individual_form": IndividualForm,
  "/volunteer_management/volunteer_assignment": VolunteerAssignment,
  "/volunteer_management/manage_applicant": ManageApplicant,
  "/volunteer_management/volunteer_profiles": VolunteerProfiles,
  "/volunteer_management/manage_volunteers": ManageVolunteer,
  "/volunteer_management/VolunteerReports": VolunteerReports,
  "/volunteer_management/ProgramsReports": ProgramsReports,
  "/donations_management/donations_dashboard": DonationsDashboard,
  "/donations_management/list_of_rafi_donors": ListOfRafiDonors,
  "/donations_management/funding_proposals": FundingProposals,
  "/donations_management/funding_proposals/create": CreateFunding,
  "/donations_management/funding_proposals/update": UpdateFunding,
  "/donation_report": DonationsReport,
  "/donations_management/donor_profile": DonorProfile,
  "/donation_status": DonationStatus,
  "/donations_management/donation_records": DonationRecords,
  "/response_dashboard": ResponseDashboard,
  "/response_dashboard/emergency_report": EmegencyReport,
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
  "/procurement_inventory/distribution_planning/dashboard":
    DistributionPlanning,
  "/procurement_inventory/procurement_management": ProcurementManagement,
  "/finance&admin/finance_management": FinanceManagement,
  "/finance_printable": FinancePrintPage,
  "/finance&admin/finance_management/budget_summary": FinanceBudgetSummary,
};
