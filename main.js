// Audio Context for visualizer

let audioContext;
let analyser;
let source;

// Demo playlist data
const demoPlaylist = [
  {
    id: 1,
    title: "Song 1",
    artist: "Artist 1",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    artwork: "https://placehold.co/300x300/1976d2/ffffff?text=Song+1"
  },
  {
    id: 2,
    title: "Song 2",
    artist: "Artist 2",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    artwork: "https://placehold.co/300x300/2196f3/ffffff?text=Song+2"
  },
  {
    id: 3,
    title: "Song 3",
    artist: "Artist 3",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    artwork: "https://placehold.co/300x300/64b5f6/ffffff?text=Song+3"
  }
];

class MusicPlayer {
  constructor() {
    this.audio = new Audio();
    this.playlist = [];
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.isShuffled = false;
    this.repeatMode = 'none'; // none, one, all
  }

  initializePlayer() {
    // Initialize audio context for visualizer
    this.initializeAudioContext();
    
    // Load playlist from localStorage or use demo playlist
    this.loadPlaylist();
    
    // Initialize UI elements
    this.initializeUI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize visualizer
    this.setupVisualizer();
  }

  initializeAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    source = audioContext.createMediaElementSource(this.audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  }

  loadPlaylist() {
    const savedPlaylist = localStorage.getItem('musicPlayerPlaylist');
    this.playlist = savedPlaylist ? JSON.parse(savedPlaylist) : demoPlaylist;
    this.renderPlaylist();
  }

  initializeUI() {
    // Get UI elements
    this.elements = {
      playBtn: document.getElementById('play'),
      prevBtn: document.getElementById('prev'),
      nextBtn: document.getElementById('next'),
      shuffleBtn: document.getElementById('shuffle'),
      repeatBtn: document.getElementById('repeat'),
      muteBtn: document.getElementById('mute'),
      progress: document.getElementById('progress'),
      progressContainer: document.querySelector('.progress-bar'),
      volumeBar: document.querySelector('.volume-bar'),
      volumeProgress: document.querySelector('.volume-progress'),
      currentTime: document.getElementById('current-time'),
      duration: document.getElementById('duration'),
      albumArt: document.getElementById('album-art'),
      trackTitle: document.getElementById('track-title'),
      trackArtist: document.getElementById('track-artist'),
      playlistContainer: document.getElementById('playlist'),
      visualizer: document.getElementById('visualizer')
    };
  }

  setupEventListeners() {
    // Playback controls
    this.elements.playBtn.addEventListener('click', () => this.togglePlay());
    this.elements.prevBtn.addEventListener('click', () => this.prevTrack());
    this.elements.nextBtn.addEventListener('click', () => this.nextTrack());
    this.elements.shuffleBtn.addEventListener('click', () => this.toggleShuffle());
    this.elements.repeatBtn.addEventListener('click', () => this.toggleRepeat());
    this.elements.muteBtn.addEventListener('click', () => this.toggleMute());

    // Progress bar
    this.elements.progressContainer.addEventListener('click', (e) => this.setProgress(e));
    
    // Volume control
    this.elements.volumeBar.addEventListener('click', (e) => this.setVolume(e));

    // Audio events
    this.audio.addEventListener('timeupdate', () => this.updateProgress());
    this.audio.addEventListener('ended', () => this.handleTrackEnd());
    this.audio.addEventListener('loadedmetadata', () => this.updateDuration());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  setupVisualizer() {
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = this.elements.visualizer;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;

      requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(18, 18, 18)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      const barWidth = (WIDTH / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for(let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        ctx.fillStyle = `rgb(33, 150, 243)`;
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }

  loadTrack(index) {
    if (index < 0) index = this.playlist.length - 1;
    if (index >= this.playlist.length) index = 0;

    this.currentTrackIndex = index;
    const track = this.playlist[index];

    this.audio.src = track.url;
    this.elements.albumArt.src = track.artwork;
    this.elements.trackTitle.textContent = track.title;
    this.elements.trackArtist.textContent = track.artist;

    this.updatePlaylistUI();

    if (this.isPlaying) {
      this.audio.play();
    }
  }

  togglePlay() {
    if (this.audio.paused) {
      this.audio.play();
      this.isPlaying = true;
      this.elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      this.audio.pause();
      this.isPlaying = false;
      this.elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  }

  prevTrack() {
    this.loadTrack(this.currentTrackIndex - 1);
  }

  nextTrack() {
    this.loadTrack(this.currentTrackIndex + 1);
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    this.elements.shuffleBtn.classList.toggle('active');
  }

  toggleRepeat() {
    const modes = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(this.repeatMode);
    this.repeatMode = modes[(currentIndex + 1) % modes.length];
    
    // Update UI
    const icon = this.elements.repeatBtn.querySelector('i');
    icon.className = 'fas fa-redo';
    if (this.repeatMode === 'one') {
      icon.className = 'fas fa-redo-alt';
    }
    this.elements.repeatBtn.classList.toggle('active', this.repeatMode !== 'none');
  }

  toggleMute() {
    this.audio.muted = !this.audio.muted;
    const icon = this.elements.muteBtn.querySelector('i');
    icon.className = this.audio.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  }

  setProgress(e) {
    const width = this.elements.progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = this.audio.duration;
    this.audio.currentTime = (clickX / width) * duration;
  }

  setVolume(e) {
    const width = this.elements.volumeBar.clientWidth;
    const clickX = e.offsetX;
    const volume = clickX / width;
    this.audio.volume = Math.max(0, Math.min(1, volume));
    this.elements.volumeProgress.style.width = `${volume * 100}%`;
  }

  updateProgress() {
    const { currentTime, duration } = this.audio;
    const progressPercent = (currentTime / duration) * 100;
    this.elements.progress.style.width = `${progressPercent}%`;
    this.elements.currentTime.textContent = this.formatTime(currentTime);
  }

  updateDuration() {
    this.elements.duration.textContent = this.formatTime(this.audio.duration);
  }

  handleTrackEnd() {
    if (this.repeatMode === 'one') {
      this.audio.play();
    } else if (this.repeatMode === 'all') {
      this.nextTrack();
    } else if (this.currentTrackIndex < this.playlist.length - 1) {
      this.nextTrack();
    }
  }

  handleKeyboard(e) {
    // Space: Play/Pause
    if (e.code === 'Space') {
      e.preventDefault();
      this.togglePlay();
    }
    // Left Arrow: Previous Track
    else if (e.code === 'ArrowLeft') {
      this.prevTrack();
    }
    // Right Arrow: Next Track
    else if (e.code === 'ArrowRight') {
      this.nextTrack();
    }
    // M: Mute/Unmute
    else if (e.code === 'KeyM') {
      this.toggleMute();
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  renderPlaylist() {
    this.elements.playlistContainer.innerHTML = this.playlist
      .map((track, index) => `
        <li class="playlist-item ${index === this.currentTrackIndex ? 'active' : ''}"
            onclick="player.loadTrack(${index})">
          <div>
            <div class="playlist-item-title">${track.title}</div>
            <div class="playlist-item-artist">${track.artist}</div>
          </div>
        </li>
      `).join('');
  }

  updatePlaylistUI() {
    const items = this.elements.playlistContainer.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === this.currentTrackIndex);
    });
  }
}

// Wait for DOM to be fully loaded before initializing the player
document.addEventListener('DOMContentLoaded', () => {
  // Initialize player
  window.player = new MusicPlayer();
  player.initializePlayer();
  
  // Load first track
  player.loadTrack(0);
});