# My Music Vault

A modern, interactive web-based music player application that provides a seamless music listening experience with a clean interface and powerful features.

## Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Audio Files](#audio-files)
- [Cover Images](#cover-images)
- [License](#license)

## Features

### Core Player Functionality
- 🎵 Music playback with play/pause, next/previous track controls
- 🔊 Volume control with mute functionality
- ⏱️ Progress bar with time display
- 📱 Mini-player that stays accessible across the website

### Advanced Features
- 🔄 Multiple playback modes: normal, shuffle, and repeat (single track or entire playlist)
- 📋 Accessible playlist panel
- ❤️ Favorite songs functionality
- 🎨 Visual feedback with album cover animations
- 💾 Playback state persistence using localStorage

### User Experience
- 📱 Responsive design for various screen sizes
- 🎨 Modern and clean user interface
- 🔄 Smooth transitions and animations
- 🎯 Intuitive controls and navigation

## Project Structure

```
My-Project/
├── css/                # Stylesheets
│   ├── components.css  # Reusable UI components
│   ├── mini-player.css # Mini-player specific styles
│   └── style.css       # Main stylesheet
├── data/
│   └── tracks.json     # Music track metadata
├── images/             # Image assets
│   ├── default-cover.png # Default album cover
│   └── various cover images
├── js/                 # JavaScript files
│   ├── app.js          # Main application logic
│   ├── data-loader.js  # Data loading utilities
│   ├── mini-player.js  # Mini-player implementation
│   ├── player.js       # Main player functionality
│   └── volume-control.js # Volume control module
├── mp3/                # Audio files
├── index.html          # Main page
├── favorites.html      # Favorite tracks page
├── recent.html         # Recently played tracks page
└── recommendations.html # Recommended tracks page
```

## Technologies Used

- **Frontend Framework**: Pure JavaScript (No framework dependency)
- **HTML5**: Modern markup for semantic structure
- **CSS3**: Styling with animations and transitions
- **JavaScript**: Interactive functionality and player logic
- **Web Audio API**: Audio playback and control
- **LocalStorage**: State persistence
- **JSON**: Data storage format for track information

## Getting Started

To run this project locally:

1. Clone or download the repository to your local machine
2. Ensure you have a web server running (can use simple servers like Python's http.server or VSCode Live Server)
3. Open the project directory in your web server
4. Navigate to `index.html` in your browser

### Using Python's built-in server (for quick testing)

```bash
cd My-Project
python -m http.server 8000
```

Then open your browser and go to `http://localhost:8000`

## Usage

### Basic Controls
- **Play/Pause**: Click the play button to start or pause playback
- **Next/Previous**: Navigate between tracks
- **Progress Bar**: Click anywhere on the progress bar to seek to that position in the track
- **Volume Control**: Adjust volume using the slider or mute button

### Advanced Usage
- **Playback Modes**: Toggle between normal, shuffle, and repeat modes
- **Playlist**: Open the playlist panel to see all available tracks
- **Favorites**: Mark tracks as favorites to access them quickly
- **Navigation**: Use the menu to access different sections (Favorites, Recent, Recommendations)

## Audio Files

The application uses audio files stored in the `mp3/` directory. Track information is stored in `data/tracks.json` with the following structure:

```json
{
  "id": "t01",
  "title": "Song Title",
  "artist": "Artist Name",
  "album": "Album Name",
  "duration": 240,
  "coverImagePath": "images/cover1.png",
  "audioPath": "mp3/song.mp3",
  "tags": ["pop", "rock"]
}
```

## Cover Images

Album cover images are stored in the `images/` directory. A default cover image (`default-cover.png`) is used when no specific cover is available.

## License

This project is intended for educational purposes. Feel free to modify and use the code as needed for your own projects.

---

Created with ❤️ for music lovers everywhere!