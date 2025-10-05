import React, { useState, useEffect, useMemo } from 'react';
import SearchBar from '../../../components/Page_Furniture/Search';
import { getAllDonations } from '../../../API_Handler/donations_donation_handler';
import { FilterModal } from '../../finance_admin/finance_management/FilterModal'; // Re-added the modal import
import { formatCurrency } from '../../helpers';
import './Donation.scss';

interface DonationItem {
    donation_id: string;
    frequency: string;
    status: string;
    funding_id?: { title: string };
    donor?: { donor_name: string };
    cash?: { amount: number; payment_method: string };
    inkind?: { item_description: string; estimated_value: number };
    donation_date: string;
}

// Define the shape of the date range filters from the modal
interface ApiFilters {
    from?: string;
    to?: string;
}

const DonationsRecord: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [allDonations, setAllDonations] = useState<DonationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for the modal and its date range filters
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [apiFilters, setApiFilters] = useState<ApiFilters>({});

    // State for local filtering and searching
    const [statusFilter, setStatusFilter] = useState<string>('All'); // 'All', 'Pending', 'Completed'
    const [searchTerm, setSearchTerm] = useState<string>('');

    // State for pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(25);

    // --- DATA FETCHING ---
    // This useEffect now runs when the component mounts AND when the date range (apiFilters) changes.
    useEffect(() => {
        const fetchDonationsWithFilters = async () => {
            setLoading(true);
            try {
                // Pass the date range filters to the API call
                const { donations: data } = await getAllDonations(
                    apiFilters.from,
                    apiFilters.to
                );
                setAllDonations(data);
            } catch (err) {
                setError('Failed to fetch donations');
            } finally {
                setLoading(false);
            }
        };

        fetchDonationsWithFilters();
    }, [apiFilters]); // Dependency array ensures this re-runs when apiFilters are applied

    // --- LOCAL FILTERING & SEARCHING ---
    // This logic remains the same, filtering the data fetched from the API locally.
    const filteredDonations = useMemo(() => {
        return allDonations
            .filter(donation => {
                if (statusFilter === 'All') return true;
                return donation.status.toLowerCase() === statusFilter.toLowerCase();
            })
            .filter(donation => {
                if (!searchTerm) return true;
                const donorName = donation.donor?.donor_name || '';
                return (
                    donation.donation_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    donorName.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
    }, [allDonations, statusFilter, searchTerm]);

    // --- PAGINATION LOGIC ---
    useEffect(() => {
        setPage(1);
    }, [statusFilter, searchTerm, apiFilters]);

    const totalPages = Math.ceil(filteredDonations.length / limit);
    const paginatedDonations = filteredDonations.slice((page - 1) * limit, page * limit);

    // Handler for applying date range filters from the modal
    const handleApplyApiFilters = (newFilters: ApiFilters) => {
        setApiFilters(newFilters);
        setFilterModalOpen(false);
    };

    return (
        <div className="donations-records">
            <h2 className='public-feed-title'>Track Donations</h2>

            {/* --- FILTER AND SEARCH CONTROLS --- */}
            <div className='settings-container'>
                <div className="search-and-filter">
                    <SearchBar
                        placeholder="Search by ID or Donor Name..."
                        classname="search-input"
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${statusFilter === 'All' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('All')}>
                            All
                        </button>
                        <button
                            className={`filter-btn ${statusFilter === 'Pending' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('Pending')}>
                            Pending
                        </button>
                        <button
                            className={`filter-btn ${statusFilter === 'Completed' ? 'active' : ''}`}
                            onClick={() => setStatusFilter('Completed')}>
                            Completed
                        </button>
                    </div>
                </div>
                {/* The original Filter button is back */}
                <button className="secondary-btn" onClick={() => setFilterModalOpen(true)}>
                    Filter by Date
                </button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && (
                <>
                    <div className="page-contorol">
                        <button
                            className="prev-page"
                            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span>Page {page} of {totalPages > 0 ? totalPages : 1}</span>
                        <button
                            className="next-page"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                        >
                            Next
                        </button>
                    </div>

                    <div className="donations-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Donation ID</th>
                                    <th>Donor Name</th>
                                    <th>Frequency</th>
                                    <th>Status</th>
                                    <th>Amount/Item</th>
                                    <th>Payment Method/Value</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedDonations.map((donation) => (
                                    <tr key={donation.donation_id}>
                                        <td>{donation.donation_id}</td>
                                        <td>{donation.donor?.donor_name || 'N/A'}</td>
                                        <td>{donation.frequency}</td>
                                        <td>
                                            <span className={`status-badge ${donation.status.toLowerCase()}`}>
                                                {donation.status}
                                            </span>
                                        </td>
                                        <td>
                                            {donation.cash ? formatCurrency(donation.cash.amount) : donation.inkind?.item_description || 'N/A'}
                                        </td>
                                        <td>
                                            {donation.cash ? donation.cash.payment_method : donation.inkind ? formatCurrency(donation.inkind.estimated_value) : 'N/A'}
                                        </td>
                                        <td>{new Date(donation.donation_date).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {paginatedDonations.length === 0 && <p className="no-results">No donations match the current filters.</p>}
                    </div>

                    <div className="page-contorol">
                        <button
                            className="prev-page"
                            onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span>Page {page} of {totalPages > 0 ? totalPages : 1}</span>
                        <button
                            className="next-page"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
                        >
                            Next
                        </button>
                    </div>
                </>
            )}

            {/* The modal component is back and wired up */}
            <FilterModal
                open={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                onApplyFilters={handleApplyApiFilters}
            />
        </div>
    );
};

export default DonationsRecord;