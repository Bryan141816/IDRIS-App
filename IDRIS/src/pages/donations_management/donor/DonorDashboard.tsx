import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  DatePicker,
  Select,
  Typography,
  Row,
  Col,
  Statistic,
  Tooltip,
  Divider,
  Empty,
  Skeleton,
  message,
  Drawer,
  Descriptions,
  Badge,
} from "antd";
import { DownloadOutlined, EyeOutlined, ReloadOutlined, FileTextOutlined } from "@ant-design/icons";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";

import {
  DonorAggregates, getDonorAggregates_legacy
} from '../../../API_Handler/donations_donation_handler';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/**
 * ------------------------------
 * Types
 * ------------------------------
 */

type DonationType = "CASH" | "INKIND";
type DonationStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
type DonationFrequency = "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "YEARLY";

interface DonationCash {
  cash_id: number;
  amount: string | number | null; // Numeric(10,2)
  payment_method?: string | null;
}

interface DonationInKind {
  inkind_id: number;
  item_description?: string | null;
  description?: string | null;
  quantity?: string | null;
  estimated_value?: string | number | null;
}

export interface DonationRow {
  donation_id: number;
  donor_id: number;
  proposal_id?: number | null;
  donation_date: string; // ISO string from API
  donation_type: DonationType;
  status: DonationStatus;
  frequency: DonationFrequency;
  next_donation_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
  cash?: DonationCash | null;
  inkind?: DonationInKind | null;
}

/**
 * ------------------------------
 * Utilities
 * ------------------------------
 */

const currency = (v?: number | string | null) => {
  if (v === undefined || v === null || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "PHP", maximumFractionDigits: 2 });
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");

const statusColor: Record<DonationStatus, string> = {
  PENDING: "processing",
  COMPLETED: "success",
  FAILED: "error",
  CANCELLED: "default",
};

const typeColor: Record<DonationType, string> = {
  CASH: "blue",
  INKIND: "gold",
};

/**
 * ------------------------------
 * API layer (replace endpoints to match your backend)
 * ------------------------------
 */

interface FetchParams {
  userId?: number; // inferred from session; optional here
  from?: string; // ISO
  to?: string; // ISO
  status?: DonationStatus | "ALL";
  type?: DonationType | "ALL";
}

async function fetchMyDonations(params: FetchParams): Promise<DonationRow[]> {
  // ⚠️ Replace the URL to match your backend. Example endpoints:
  // GET /donations/me?from=...&to=...&status=...&type=...
  // or GET /donation_records/user/:userId
  const query = new URLSearchParams();
  if (params.from) query.append("from", params.from);
  if (params.to) query.append("to", params.to);
  if (params.status && params.status !== "ALL") query.append("status", params.status);
  if (params.type && params.type !== "ALL") query.append("type", params.type);

  const url = `/api/donations/me?${query.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch donations (${res.status})`);
  return res.json();
}

async function downloadDonationReceipt(donationId: number) {
  // ⚠️ Replace with your receipt endpoint
  const url = `/api/donations/${donationId}/receipt`; // returns application/pdf
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Could not fetch receipt");
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `donation-${donationId}-receipt.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

/**
 * ------------------------------
 * DonorDashboard Component
 * ------------------------------
 */

const DonorDashboard: React.FC = () => {
  // Filters
  const _date = new Date();
  const [date_from, setDateFrom] = useState<string | null>(new Date(_date.getFullYear(), 0, 1).toISOString());
  const [date_to, setDateTo] = useState<string | null>(_date.toDateString());
  const [status, setStatus] = useState<DonationStatus | "ALL">("ALL");
  const [dtype, setDtype] = useState<DonationType | "ALL">("ALL");

  // Data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<DonationRow[]>([]);

  // Drawer state
  const [active, setActive] = useState<DonationRow | null>(null);

  // DONOR DATAS
  const [donorData, setDonorData] = useState<DonorAggregates>();

  const toISO = (d?: string | Date | null) => {
    if (!d) return undefined;
    if (d instanceof Date) return d.toISOString();
    // string
    return d.includes("T") ? d : new Date(d).toISOString();
  };

  const reload = async () => {
    try {
      
      const startISO = toISO(date_from) ?? new Date(new Date().getFullYear(), 0, 1).toISOString();

      const endISO =
        toISO(date_to) ?? new Date().toISOString(); // default to NOW

      const data = await getDonorAggregates_legacy(
        startISO, endISO
      );
      console.log(data);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, dtype, date_from, date_to]);

  // Aggregations / Impact
  const totals = useMemo(() => {
    let totalCash = 0;
    let totalInKind = 0;
    let recActive = 0;
    let completed = 0;

    rows.forEach((r) => {
      if (r.status === "COMPLETED") completed += 1;
      if (r.frequency !== "ONE_TIME" && r.is_active) recActive += 1;

      if (r.donation_type === "CASH" && r.cash?.amount) {
        const amt = Number(r.cash.amount);
        if (!Number.isNaN(amt)) totalCash += amt;
      }
      if (r.donation_type === "INKIND" && r.inkind?.estimated_value) {
        const val = Number(r.inkind.estimated_value);
        if (!Number.isNaN(val)) totalInKind += val;
      }
    });

    return { totalCash, totalInKind, recActive, completed };
  }, [rows]);

  const chartData = useMemo(() => {
    // Monthly aggregation (YYYY-MM)
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const key = new Date(r.donation_date);
      if (Number.isNaN(key.getTime())) return;
      const ym = `${key.getFullYear()}-${String(key.getMonth() + 1).padStart(2, "0")}`;

      let val = 0;
      if (r.donation_type === "CASH" && r.cash?.amount) val = Number(r.cash.amount) || 0;
      if (r.donation_type === "INKIND" && r.inkind?.estimated_value) val = Number(r.inkind.estimated_value) || 0;

      map.set(ym, (map.get(ym) || 0) + val);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, value]) => ({ month, value }));
  }, [rows]);

  const columns = [
    {
      title: "Date",
      dataIndex: "donation_date",
      key: "donation_date",
      render: (v: string) => fmtDate(v),
      sorter: (a: DonationRow, b: DonationRow) => new Date(a.donation_date).getTime() - new Date(b.donation_date).getTime(),
      defaultSortOrder: "descend" as const,
    },
    {
      title: "Type",
      dataIndex: "donation_type",
      key: "donation_type",
      render: (t: DonationType) => <Tag color={typeColor[t]}>{t === "CASH" ? "Cash" : "In-kind"}</Tag>,
      filters: [
        { text: "Cash", value: "CASH" },
        { text: "In-kind", value: "INKIND" },
      ],
      onFilter: (val: any, r: DonationRow) => r.donation_type === val,
    },
    {
      title: "Amount / Value",
      key: "amount",
      render: (_: any, r: DonationRow) => {
        const amt = r.donation_type === "CASH" ? r.cash?.amount : r.inkind?.estimated_value;
        return <span style={{ fontVariantNumeric: "tabular-nums" }}>{currency(amt)}</span>;
      },
      sorter: (a: DonationRow, b: DonationRow) => {
        const av = a.donation_type === "CASH" ? Number(a.cash?.amount || 0) : Number(a.inkind?.estimated_value || 0);
        const bv = b.donation_type === "CASH" ? Number(b.cash?.amount || 0) : Number(b.inkind?.estimated_value || 0);
        return av - bv;
      },
      align: "right" as const,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: DonationStatus) => <Tag color={statusColor[s]}>{s}</Tag>,
      filters: [
        { text: "Pending", value: "PENDING" },
        { text: "Completed", value: "COMPLETED" },
        { text: "Failed", value: "FAILED" },
        { text: "Cancelled", value: "CANCELLED" },
      ],
      onFilter: (val: any, r: DonationRow) => r.status === val,
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      key: "frequency",
      render: (f: DonationFrequency) => (f === "ONE_TIME" ? "One-time" : f.charAt(0) + f.slice(1).toLowerCase()),
    },
    {
      title: "Proposal",
      dataIndex: "proposal_id",
      key: "proposal_id",
      render: (p: number | null) => (p ? <a href={`/proposals/${p}`} onClick={(e) => e.stopPropagation()}>FP-{p}</a> : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, r: DonationRow) => (
        <Space>
          <Tooltip title="View details">
            <Button icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); setActive(r); }} />
          </Tooltip>
          <Tooltip title="Download receipt (PDF)">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              disabled={r.status !== "COMPLETED"}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await downloadDonationReceipt(r.donation_id);
                  message.success("Receipt downloaded");
                } catch (err: any) {
                  console.error(err);
                  message.error("Unable to download receipt");
                }
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const onExportCsv = () => {
    const headers = ["Donation ID","Date","Type","Amount/Value","Status","Frequency","Proposal ID"]; 
    const body = rows.map((r) => [
      r.donation_id,
      new Date(r.donation_date).toISOString(),
      r.donation_type,
      r.donation_type === "CASH" ? r.cash?.amount ?? "" : r.inkind?.estimated_value ?? "",
      r.status,
      r.frequency,
      r.proposal_id ?? "",
    ]);

    const csv = [headers, ...body].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `donations.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  const tableHeader = (
    <Row gutter={[12, 12]} align="middle" justify="space-between">
      <Col xs={24} md={12}>
        <Space wrap>
          <RangePicker 
            onChange={(vals) => {
              const from = vals?.[0]?.toDate().toISOString();
              const to = vals?.[1]?.toDate().toISOString();
              // setDateFrom(from);
              // setDateTo(to);
            }}
            allowEmpty={[true, true]}
          />
          <Select
            value={status}
            onChange={(v) => setStatus(v as any)}
            style={{ minWidth: 160 }}
            options={[
              { value: "ALL", label: "All statuses" },
              { value: "PENDING", label: "Pending" },
              { value: "COMPLETED", label: "Completed" },
              { value: "FAILED", label: "Failed" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
          <Select
            value={dtype}
            onChange={(v) => setDtype(v as any)}
            style={{ minWidth: 160 }}
            options={[
              { value: "ALL", label: "All types" },
              { value: "CASH", label: "Cash" },
              { value: "INKIND", label: "In-kind" },
            ]}
          />
        </Space>
      </Col>
      <Col xs={24} md={12} style={{ textAlign: "right" }}>
        <Space>
          <Button icon={<FileTextOutlined />} onClick={onExportCsv}>Export CSV</Button>
          <Button icon={<ReloadOutlined />} onClick={() => reload()}>Refresh</Button>
        </Space>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: 16 }}>
      <Title level={2} style={{ marginBottom: 4 }}>Donor Dashboard</Title>
      <Text type="secondary">Track your donations, view impact, and download your receipts.</Text>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Total Cash Donated" value={totals.totalCash} prefix="₱" precision={2} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="In‑kind (est. value)" value={totals.totalInKind} prefix="₱" precision={2} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Completed Donations" value={totals.completed} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="Active Recurring" value={totals.recActive} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={9}>
          <Card title="Giving Over Time">
            {rows.length === 0 ? (
              <Empty description="No data" />
            ) : (
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RTooltip formatter={(v: any) => currency(v as number)} labelFormatter={(l) => `Month: ${l}`} />
                    <Line type="monotone" dataKey="value" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </Col>
        {/* <Col xs={24} lg={15}>
          <Card title={tableHeader} bodyStyle={{ paddingTop: 0 }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : error ? (
              <Empty description={error} />
            ) : (
              <Table<DonationRow>
                rowKey={(r) => r.donation_id}
                columns={columns as any}
                dataSource={rows}
                pagination={{ pageSize: 8, showSizeChanger: true }}
                onRow={(r) => ({ onClick: () => setActive(r) })}
              />
            )}
          </Card>
        </Col> */}
      </Row>

    </div>
  );
};

export default DonorDashboard