import toast from 'react-hot-toast';

const useToast = () => {
  function showToast(reason, reasonType, id) {
    var toastId;
    switch (reasonType) {
      case 'SUCCESS':
        toastId = toast.success(reason, {
          duration: 4000,
          id: id || new Date().valueOf(),
        });
        break;
      case 'ERROR':
        toastId = toast.error(reason, {
          duration: 4000,
          id: id || new Date().valueOf(),
        });
        break;
    }
    return toastId;
  }

  function dismissToast(toastId) {
    if (toastId) toast.dismiss(toastId);
    else toast.dismiss();
  }

  function removeToast(toastId) {
    if (toastId) toast.remove(toastId);
    else toast.remove();
  }

  return { showToast, dismissToast, removeToast };
};

export default useToast;
