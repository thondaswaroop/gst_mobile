const showToast = (type: any, toast: any, message: string) => {
  toast.show(message, {
    type: type,
    placement: 'bottom',
    duration: 2000,
    animationType: 'slide-in',
    style: {width: '85%'},
  });
};

export {showToast};
