const setStreamFn = videoElement => stream => {
	videoElement.srcObject = stream;
};