const fileUpload = document.getElementById("file-upload");
const playlist = document.getElementById("playlist");
const audio = new Audio();
const uploadText = document.getElementById("upload-text");
let tracks = [];

fileUpload.addEventListener("change", (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    uploadText.textContent = files
      .map((file) => file.name.replace(/\.(mp3|m4a)$/i, ""))
      .join(", ");
  } else {
    uploadText.textContent = "Choose Files";
  }
  files.forEach((file, index) => {
    const listItem = document.createElement("li");
    listItem.classList.add("playlist-item");
    listItem.textContent = file.name.replace(/\.(mp3|m4a)$/i, ""); // removes file extension shit like mp3 mp4a
    listItem.addEventListener("click", () => playTrack(index));
    playlist.appendChild(listItem);

    tracks.push({
      name: file.name.replace(/\.(mp3|m4a)$/i, ""),
      file: URL.createObjectURL(file),
    });
  });
});

function playTrack(index) {
  const track = tracks[index];
  if (track) {
    audio.src = track.file;
    audio.play();
    updateNowPlaying(track.name);
  }
}

function updateNowPlaying(trackName) {
  const trackTitle = document.getElementById("track-title");
  const trackArtist = document.getElementById("track-artist");
  trackTitle.textContent = trackName;
  trackArtist.textContent = "Uploaded Track";
}
