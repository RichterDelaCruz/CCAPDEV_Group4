// Click event function for the pin image
function pinOnClickFunction() {
    const pinImage = document.getElementById('pinImage');
    // Toggle between fitting the screen and original size
    if (pinImage.style.width === '100%' && pinImage.style.height === '100%') {
        // If the image is already scaled, reset to original size
        pinImage.style.width = '';
        pinImage.style.height = '';
    } else {
        // If the image is not scaled, fit it to the screen
        pinImage.style.width = '100%';
        pinImage.style.height = '100%';
    }
}

// Click event function for the profile image
function profileOnClickFunction(pinOwnerId) {
    // Redirect to the profile page of the owner of the pin
    window.location.href = `/user/${pinOwnerId}/posts`;
}