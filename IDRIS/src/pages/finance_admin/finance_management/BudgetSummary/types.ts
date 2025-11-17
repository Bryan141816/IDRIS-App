export type NestedAllocationItem = {
  budget_for: string;
  inflow_total: number | string;
  outflow_total: number | string;
  net_total: number | string;
  percentage_spent: number | string;
  children?: NestedAllocationItem[];
};
