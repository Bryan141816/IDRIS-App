import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export const DonationStatus: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');

    if (status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'Donation Successful!',
        text: 'Thank you for your generous donation.',
      }).then(() => {
        navigate('/donations');
      });
    } else if (status === 'failed') {
      Swal.fire({
        icon: 'error',
        title: 'Donation Failed',
        text: 'Something went wrong with your donation. Please try again.',
      }).then(() => {
        navigate('/donations');
      });
    }
  }, [location, navigate]);

  return (
    <>
    </>
  );
};

export default DonationStatus