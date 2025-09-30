import Swal from 'sweetalert2';

export async function withSwal<T>(message: string, fn: () => Promise<T>): Promise<T> {
  // show loading modal (prevent outside click)
  Swal.fire({
    title: message,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
    // optionally don't show confirm button on loading modal
    showConfirmButton: false,
  });

  try {
    const result = await fn();
    // close loading modal first
    Swal.close();
    // show success briefly (optional)
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      timer: 900,
      showConfirmButton: false,
    });
    return result;
  } catch (err: any) {
    // close loading modal (in case it is still open)
    Swal.close();
    // show error with message
    await Swal.fire({
      icon: 'error',
      title: 'Failed',
      text: err?.message ?? String(err) ?? 'An unknown error occurred',
    });
    // rethrow so the caller knows
    throw err;
  } finally {
    // ensure it's closed no matter what
    Swal.close();
  }
}
