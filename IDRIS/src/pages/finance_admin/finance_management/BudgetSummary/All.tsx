import React from 'react';
import { FileText, Calendar, Filter, TrendingUp, TrendingDown, DollarSign, Clock, XCircle } from 'lucide-react';
import * as Chart from 'chart.js';

// Register Chart.js components
Chart.Chart.register(
  Chart.CategoryScale,
  Chart.LinearScale,
  Chart.BarElement,
  Chart.ArcElement,
  Chart.Title,
  Chart.Tooltip,
  Chart.Legend
);


// // KPI Card Component
// const KPICard = ({ title, value, icon: Icon, color = "blue" }) => {
//   const colorMap = {
//     blue: { bg: '#dbeafe', text: '#2563eb' },
//     green: { bg: '#dcfce7', text: '#16a34a' },
//     red: { bg: '#fee2e2', text: '#dc2626' },
//     yellow: { bg: '#fef3c7', text: '#d97706' },
//     orange: { bg: '#fed7aa', text: '#ea580c' }
//   };

//   const colors = colorMap[color];

//   return (
//     <div style={{
//       backgroundColor: '#ffffff',
//       borderRadius: '0.5rem',
//       border: '2px solid #e5e7eb',
//       padding: '1rem'
//     }}>
//       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//         <div>
//           <p style={{
//             fontSize: '0.75rem',
//             fontWeight: '500',
//             color: '#6b7280',
//             textTransform: 'uppercase',
//             letterSpacing: '0.05em'
//           }}>
//             {title}
//           </p>
//           <p style={{
//             fontSize: '1.125rem',
//             fontWeight: 'bold',
//             marginTop: '0.25rem',
//             color: colors.text
//           }}>
//             {value}
//           </p>
//         </div>
//         <div style={{
//           padding: '0.5rem',
//           borderRadius: '9999px',
//           backgroundColor: colors.bg
//         }}>
//           <Icon style={{ height: '1rem', width: '1rem', color: colors.text }} />
//         </div>
//       </div>
//     </div>
//   );
// };

// Bar Chart Component
// const BarChartComponent = ({ data, title }) => {
//   const canvasRef = React.useRef(null);
//   const chartRef = React.useRef(null);

//   React.useEffect(() => {
//     if (canvasRef.current) {
//       const ctx = canvasRef.current.getContext('2d');
      
//       // Destroy existing chart
//       if (chartRef.current) {
//         chartRef.current.destroy();
//       }

//       chartRef.current = new Chart.Chart(ctx, {
//         type: 'bar',
//         data: {
//           labels: data.map(item => item.name),
//           datasets: [
//             {
//               label: 'Inflow',
//               data: data.map(item => item.inflow),
//               backgroundColor: '#22c55e',
//               borderColor: '#16a34a',
//               borderWidth: 1
//             },
//             {
//               label: 'Outflow',
//               data: data.map(item => item.outflow),
//               backgroundColor: '#ef4444',
//               borderColor: '#dc2626',
//               borderWidth: 1
//             }
//           ]
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           plugins: {
//             legend: {
//               position: 'top',
//             },
//             tooltip: {
//               callbacks: {
//                 label: function(context) {
//                   return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
//                 }
//               }
//             }
//           },
//           scales: {
//             y: {
//               beginAtZero: true,
//               ticks: {
//                 callback: function(value) {
//                   return '$' + (value / 1000).toFixed(0) + 'K';
//                 }
//               }
//             }
//           }
//         }
//       });
//     }

//     return () => {
//       if (chartRef.current) {
//         chartRef.current.destroy();
//       }
//     };
//   }, [data]);

//   return (
//     <div style={styles.chartContainer}>
//       <h3 style={styles.chartTitle}>{title}</h3>
//       <div style={{ position: 'relative', height: '300px' }}>
//         <canvas ref={canvasRef} style={styles.canvas}></canvas>
//       </div>
//     </div>
//   );
// };

// // Pie Chart Component
// const PieChartComponent = ({ data, title }) => {
//   const canvasRef = React.useRef(null);
//   const chartRef = React.useRef(null);

//   const COLORS = ['#ef4444', '#22c55e', '#3b82f6'];

//   React.useEffect(() => {
//     if (canvasRef.current) {
//       const ctx = canvasRef.current.getContext('2d');
      
//       if (chartRef.current) {
//         chartRef.current.destroy();
//       }

//       chartRef.current = new Chart.Chart(ctx, {
//         type: 'pie',
//         data: {
//           labels: data.map(item => item.name),
//           datasets: [{
//             data: data.map(item => item.value),
//             backgroundColor: COLORS,
//             borderColor: COLORS.map(color => color),
//             borderWidth: 2
//           }]
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           plugins: {
//             legend: {
//               position: 'bottom',
//               labels: {
//                 padding: 20,
//                 usePointStyle: true
//               }
//             },
//             tooltip: {
//               callbacks: {
//                 label: function(context) {
//                   const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
//                   const percentage = ((context.parsed / total) * 100).toFixed(1);
//                   return context.label + ': $' + context.parsed.toLocaleString() + ' (' + percentage + '%)';
//                 }
//               }
//             }
//           }
//         }
//       });
//     }

//     return () => {
//       if (chartRef.current) {
//         chartRef.current.destroy();
//       }
//     };
//   }, [data]);

//   return (
//     <div style={styles.chartContainer}>
//       <h3 style={styles.chartTitle}>{title}</h3>
//       <div style={{ position: 'relative', height: '300px' }}>
//         <canvas ref={canvasRef}></canvas>
//       </div>
//     </div>
//   );
// };

// Pending Transactions Chart Component
// const PendingTransactionsChart = ({ data, title }) => {
//   const canvasRef = React.useRef(null);
//   const chartRef = React.useRef(null);

//   React.useEffect(() => {
//     if (canvasRef.current) {
//       const ctx = canvasRef.current.getContext('2d');
      
//       if (chartRef.current) {
//         chartRef.current.destroy();
//       }

//       chartRef.current = new Chart.Chart(ctx, {
//         type: 'bar',
//         data: {
//           labels: data.map(item => item.name),
//           datasets: [
//             {
//               label: 'Pending Inflow',
//               data: data.map(item => item.pending_inflow),
//               backgroundColor: '#fbbf24',
//               borderColor: '#f59e0b',
//               borderWidth: 1
//             },
//             {
//               label: 'Pending Outflow',
//               data: data.map(item => item.pending_outflow),
//               backgroundColor: '#f97316',
//               borderColor: '#ea580c',
//               borderWidth: 1
//             },
//             {
//               label: 'Denied',
//               data: data.map(item => item.denied),
//               backgroundColor: '#dc2626',
//               borderColor: '#b91c1c',
//               borderWidth: 1
//             }
//           ]
//         },
//         options: {
//           responsive: true,
//           maintainAspectRatio: false,
//           plugins: {
//             legend: {
//               position: 'top',
//             },
//             tooltip: {
//               callbacks: {
//                 label: function(context) {
//                   return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
//                 }
//               }
//             }
//           },
//           scales: {
//             y: {
//               beginAtZero: true,
//               ticks: {
//                 callback: function(value) {
//                   return '$' + (value / 1000).toFixed(0) + 'K';
//                 }
//               }
//             }
//           }
//         }
//       });
//     }

//     return () => {
//       if (chartRef.current) {
//         chartRef.current.destroy();
//       }
//     };
//   }, [data]);

//   return (
//     <div style={styles.chartContainer}>
//       <h3 style={styles.chartTitle}>{title}</h3>
//       <div style={{ position: 'relative', height: '300px' }}>
//         <canvas ref={canvasRef}></canvas>
//       </div>
//     </div>
//   );
// };

// Executive Summary Component
// const ExecutiveSummary = ({ kpis }) => {
//   const formatCurrency = (value) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(parseFloat(value));
//   };

//   return (
//     <section style={styles.section}>
//       <h2 style={styles.sectionTitle}>Executive Summary</h2>
//       <div style={styles.kpiGrid}>
//         <KPICard
//           title="Total Inflow"
//           value={formatCurrency(kpis.total_inflow)}
//           icon={TrendingUp}
//           color="green"
//         />
//         <KPICard
//           title="Total Outflow"
//           value={formatCurrency(kpis.total_outflow)}
//           icon={TrendingDown}
//           color="red"
//         />
//         <KPICard
//           title="Net Balance"
//           value={formatCurrency(kpis.net_balance)}
//           icon={DollarSign}
//           color="blue"
//         />
//         <KPICard
//           title="Pending Inflow"
//           value={formatCurrency(kpis.pending_inflow)}
//           icon={Clock}
//           color="yellow"
//         />
//         <KPICard
//           title="Pending Outflow"
//           value={formatCurrency(kpis.pending_outflow)}
//           icon={Clock}
//           color="orange"
//         />
//         <KPICard
//           title="Denied Total"
//           value={formatCurrency(kpis.denied_total)}
//           icon={XCircle}
//           color="red"
//         />
//       </div>

//       <div style={{
//         backgroundColor: '#f9fafb',
//         borderRadius: '0.5rem',
//         padding: '1.5rem',
//         border: '1px solid #e5e7eb'
//       }}>
//         <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
//           Key Performance Highlights
//         </h3>
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
//           <div>
//             <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem' }}>
//               <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
//                 <div style={{
//                   width: '8px',
//                   height: '8px',
//                   backgroundColor: '#22c55e',
//                   borderRadius: '50%',
//                   marginTop: '6px',
//                   marginRight: '12px',
//                   flexShrink: 0
//                 }}></div>
//                 <span><strong>Positive Net Balance:</strong> {formatCurrency(kpis.net_balance)} (26.8% of total inflow)</span>
//               </li>
//               <li style={{ display: 'flex', alignItems: 'flex-start' }}>
//                 <div style={{
//                   width: '8px',
//                   height: '8px',
//                   backgroundColor: '#3b82f6',
//                   borderRadius: '50%',
//                   marginTop: '6px',
//                   marginRight: '12px',
//                   flexShrink: 0
//                 }}></div>
//                 <span><strong>GENERAL allocation</strong> shows highest net balance at {formatCurrency(151500)}</span>
//               </li>
//             </ul>
//           </div>
//           <div>
//             <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem' }}>
//               <li style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
//                 <div style={{
//                   width: '8px',
//                   height: '8px',
//                   backgroundColor: '#eab308',
//                   borderRadius: '50%',
//                   marginTop: '6px',
//                   marginRight: '12px',
//                   flexShrink: 0
//                 }}></div>
//                 <span><strong>Pending Review:</strong> {formatCurrency(47000)} in pending transactions</span>
//               </li>
//               <li style={{ display: 'flex', alignItems: 'flex-start' }}>
//                 <div style={{
//                   width: '8px',
//                   height: '8px',
//                   backgroundColor: '#ef4444',
//                   borderRadius: '50%',
//                   marginTop: '6px',
//                   marginRight: '12px',
//                   flexShrink: 0
//                 }}></div>
//                 <span><strong>Denial Rate:</strong> 0.6% ({formatCurrency(kpis.denied_total)})</span>
//               </li>
//             </ul>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// // Data Table Component
// const DataTable = ({ data, kpis }) => {
//   const formatCurrency = (value) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(parseFloat(value));
//   };

//   return (
//     <section style={styles.section}>
//       <h2 style={styles.sectionTitle}>Detailed Allocation Breakdown</h2>
//       <div style={{ overflowX: 'auto' }}>
//         <table style={{
//           width: '100%',
//           backgroundColor: '#ffffff',
//           border: '1px solid #e5e7eb',
//           borderRadius: '0.5rem',
//           borderCollapse: 'collapse'
//         }}>
//           <thead style={{ backgroundColor: '#f9fafb' }}>
//             <tr>
//               {['Allocation', 'Inflow', 'Outflow', 'Net Balance', 'Pending In', 'Pending Out', 'Denied', 'Utilization'].map(header => (
//                 <th key={header} style={{
//                   padding: '12px 16px',
//                   textAlign: header === 'Allocation' ? 'left' : 'right',
//                   fontSize: '0.75rem',
//                   fontWeight: 'bold',
//                   color: '#374151',
//                   textTransform: 'uppercase',
//                   letterSpacing: '0.05em',
//                   borderBottom: '1px solid #e5e7eb'
//                 }}>
//                   {header}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {data.breakdown.allocation.map((item, index) => {
//               const utilization = (parseFloat(item.outflow) / parseFloat(item.inflow) * 100).toFixed(1);
//               return (
//                 <tr key={index} style={{
//                   backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
//                 }}>
//                   <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: '500' }}>
//                     {item.allocation.replace('_', ' ')}
//                   </td>
//                   <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#16a34a' }}>
//                     {formatCurrency(item.inflow)}
//                   </td>
//                   <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>
//                     {formatCurrency(item.outflow)}
//                   </td>
//                   <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', fontWeight: 'bold', color: '#2563eb' }}>
//                     {formatCurrency(item.net)}
//                   </td>
//                   <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', color: '#d97706' }}>
//                     {formatCurrency(item.pending_inflow)}
//                   </td>
//                   <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', color: '#ea580c' }}>
//                     {formatCurrency(item.pending_outflow)}
//                   </td>
//                   <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', color: '#dc2626' }}>
//                     {formatCurrency(item.denied)}
//                   </td>
//                   <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', fontWeight: '500' }}>
//                     {utilization}%
//                   </td>
//                 </tr>
//               );
//             })}
//             <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
//               <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 'bold' }}>TOTAL</td>
//               <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', color: '#16a34a' }}>{formatCurrency(kpis.total_inflow)}</td>
//               <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', color: '#dc2626' }}>{formatCurrency(kpis.total_outflow)}</td>
//               <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', color: '#2563eb' }}>{formatCurrency(kpis.net_balance)}</td>
//               <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', color: '#d97706' }}>{formatCurrency(kpis.pending_inflow)}</td>
//               <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', color: '#ea580c' }}>{formatCurrency(kpis.pending_outflow)}</td>
//               <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right', color: '#dc2626' }}>{formatCurrency(kpis.denied_total)}</td>
//               <td style={{ padding: '12px 16px', fontSize: '0.875rem', textAlign: 'right' }}>73.2%</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>
//     </section>
//   );
// };

// Main Dashboard Component
// const FinancialReportDashboard = () => {
//   const data = {
//     "filters": {
//       "date_from": "2025-01-01",
//       "date_to": "2025-09-30",
//       "group_by": "allocation",
//       "include_pending": true
//     },
//     "kpis": {
//       "total_inflow": "825000.00",
//       "total_outflow": "603500.00",
//       "net_balance": "221500.00",
//       "pending_inflow": "12000.00",
//       "pending_outflow": "35000.00",
//       "denied_total": "5000.00",
//       "last_updated": "2025-09-19T10:58:11"
//     },
//     "breakdown": {
//       "allocation": [
//         {"allocation":"EMERGENCY","inflow":"300000.00","outflow":"250000.00","net":"50000.00","pending_inflow":"0.00","pending_outflow":"10000.00","denied":"0.00"},
//         {"allocation":"FOOD_WATER","inflow":"200000.00","outflow":"180000.00","net":"20000.00","pending_inflow":"5000.00","pending_outflow":"0.00","denied":"0.00"},
//         {"allocation":"GENERAL","inflow":"325000.00","outflow":"173500.00","net":"151500.00","pending_inflow":"7000.00","pending_outflow":"25000.00","denied":"5000.00"}
//       ]
//     },
//     "diagnostics": {"records_considered": 412}
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const formatCurrency = (value) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(parseFloat(value));
//   };

//   // Prepare chart data
//   const chartData = data.breakdown.allocation.map(item => ({
//     name: item.allocation.replace('_', ' '),
//     inflow: parseFloat(item.inflow),
//     outflow: parseFloat(item.outflow),
//     net: parseFloat(item.net),
//     pending_inflow: parseFloat(item.pending_inflow),
//     pending_outflow: parseFloat(item.pending_outflow),
//     denied: parseFloat(item.denied)
//   }));

//   const pieData = chartData.map(item => ({
//     name: item.name,
//     value: item.net
//   }));

//   return (
//     <div style={styles.dashboard}>
//       <div style={styles.container}>
//         {/* Header */}
//         <div style={styles.header}>
//           <div style={styles.headerTop}>
//             <div style={styles.title}>
//               <FileText style={{ height: '2rem', width: '2rem', color: '#2563eb' }} />
//               <h1 style={styles.titleText}>Financial Report</h1>
//             </div>
//             <div style={styles.headerInfo}>
//               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '0.25rem' }}>
//                 <Calendar style={{ height: '1rem', width: '1rem', marginRight: '0.5rem' }} />
//                 <span>Generated: {formatDate(data.kpis.last_updated)}</span>
//               </div>
//               <div>Report ID: FR-{data.diagnostics.records_considered}</div>
//             </div>
//           </div>
          
//           <div style={styles.filters}>
//             <div style={styles.filterItem}>
//               <Filter style={{ height: '1rem', width: '1rem', marginRight: '0.5rem', color: '#6b7280' }} />
//               <span><strong>Period:</strong> {new Date(data.filters.date_from).toLocaleDateString()} - {new Date(data.filters.date_to).toLocaleDateString()}</span>
//             </div>
//             <div>
//               <span><strong>Grouped by:</strong> {data.filters.group_by}</span>
//             </div>
//             <div>
//               <span><strong>Records:</strong> {data.diagnostics.records_considered}</span>
//             </div>
//           </div>
//         </div>

//         {/* Executive Summary */}
//         <ExecutiveSummary kpis={data.kpis} />

//         {/* Financial Overview Charts */}
//         <section style={styles.section}>
//           <h2 style={styles.sectionTitle}>Financial Overview</h2>
//           <div style={styles.chartsGrid}>
//             <BarChartComponent 
//               data={chartData} 
//               title="Inflow vs Outflow by Allocation" 
//             />
//             <PieChartComponent 
//               data={pieData} 
//               title="Net Balance Distribution" 
//             />
//           </div>
//         </section>

//         {/* Detailed Breakdown */}
//         <DataTable data={data} kpis={data.kpis} />

//         {/* Pending Transactions Analysis */}
//         <section style={styles.section}>
//           <h2 style={styles.sectionTitle}>Pending Transactions Analysis</h2>
//           <div style={styles.chartsGrid}>
//             <PendingTransactionsChart 
//               data={chartData} 
//               title="Pending & Denied Transactions" 
//             />
            
//             <div style={styles.chartContainer}>
//               <h3 style={styles.chartTitle}>Transaction Status Summary</h3>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
//                   <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Total Pending Transactions</span>
//                   <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#d97706' }}>{formatCurrency(47000)}</span>
//                 </div>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
//                   <span style={{ fontSize: '0.875rem' }}>Pending Inflow</span>
//                   <span style={{ fontWeight: '600', color: '#d97706' }}>{formatCurrency(data.kpis.pending_inflow)}</span>
//                 </div>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
//                   <span style={{ fontSize: '0.875rem' }}>Pending Outflow</span>
//                   <span style={{ fontWeight: '600', color: '#ea580c' }}>{formatCurrency(data.kpis.pending_outflow)}</span>
//                 </div>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
//                   <span style={{ fontSize: '0.875rem' }}>Denied Transactions</span>
//                   <span style={{ fontWeight: '600', color: '#dc2626' }}>{formatCurrency(data.kpis.denied_total)}</span>
//                 </div>
//                 <div style={{ backgroundColor: '#dbeafe', padding: '0.75rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
//                   <p style={{ fontSize: '0.875rem', color: '#1e40af' }}>
//                     <strong>Action Required:</strong> {formatCurrency(35000)} in pending outflows require immediate review.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Report Footer */}
//         <footer style={{
//           borderTop: '2px solid #1f2937',
//           paddingTop: '1.5rem',
//           marginTop: '3rem'
//         }}>
//           <div style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
//             gap: '1.5rem',
//             fontSize: '0.75rem',
//             color: '#6b7280'
//           }}>
//             <div>
//               <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>Report Parameters</h4>
//               <p>Date Range: {new Date(data.filters.date_from).toLocaleDateString()} - {new Date(data.filters.date_to).toLocaleDateString()}</p>
//               <p>Group By: {data.filters.group_by}</p>
//               <p>Include Pending: {data.filters.include_pending ? 'Yes' : 'No'}</p>
//             </div>
//             <div>
//               <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>Data Summary</h4>
//               <p>Records Processed: {data.diagnostics.records_considered}</p>
//               <p>Allocation Categories: 3</p>
//               <p>Report Accuracy: 99.4%</p>
//             </div>
//             <div>
//               <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>Generated</h4>
//               <p>{formatDate(data.kpis.last_updated)}</p>
//               <p>Financial Reports System</p>
//               <p>Version 2.1</p>
//             </div>
//           </div>
//         </footer>

//       </div>
//     </div>
//   );
// };

// export default FinancialReportDashboard;