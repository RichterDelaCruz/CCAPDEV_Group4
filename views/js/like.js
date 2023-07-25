// like.js
function toggleLike(postId) {
  // Fetch the current like count
  const likesCountElement = document.getElementById('likesCount');
  const currentLikes = parseInt(likesCountElement.innerText);

  // Make a POST request to the server to toggle the like
  fetch('/toggle-like', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ postId }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Update the like count on the page
      likesCountElement.innerText = data.likesCount;
      // Toggle the text of the button between "Like" and "Unlike"
      const likeButton = document.getElementById('likeButton');
      likeButton.innerText = data.isLiked ? 'Unlike' : 'Like';
    })
    .catch((error) => {
      console.error('Error toggling like:', error);
    });
}
