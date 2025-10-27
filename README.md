# Fast Reader - Chrome Extension

A modern, professional Chrome extension that helps you read text faster using the RSVP (Rapid Serial Visual Presentation) technique. Select any text on a webpage or enter custom text to read it word-by-word in an immersive fullscreen HUD interface.

## 🚀 Features

- **Text Selection**: Select any text on any webpage to quickly start reading
- **Popup Interface**: Enter custom text directly through the popup interface
- **Fullscreen HUD**: Immersive dark-themed interface with minimal distractions
- **Adjustable Speed**: Control reading speed from 100-1000 words per minute
- **Smart Word Highlighting**: Automatically highlights the center character of each word for optimal focus
- **Keyboard Shortcuts**: 
  - `Space` - Play/Pause
  - `R` - Reset
  - `Esc` - Close
- **Real-time Progress**: Visual progress bar and word counter
- **Context Preview**: Shows previous and next words for better comprehension
- **Auto-save**: Automatically saves text input for convenience
- **Modern UI**: Beautiful dark theme with orange accents and glassmorphism effects

## 📦 Installation

### From Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store soon.

### Manual Installation
1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked" and select the project folder
5. The Fast Reader icon will appear in your extensions toolbar

## 📖 Usage

### Method 1: Text Selection
1. Select any text on a webpage (minimum 10 characters)
2. Click the Fast Reader icon that appears
3. The HUD interface will open in fullscreen mode
4. Use `Space` to start/pause reading

### Method 2: Popup Interface
1. Click the Fast Reader extension icon in the toolbar
2. Enter or paste your text in the textarea
3. Click "Start" (or press `Ctrl+Enter`)
4. The HUD interface will open with your text

### Controls
- **Speed Slider**: Adjust reading speed in real-time
- **Start Button**: Begin reading
- **Pause Button**: Pause/resume reading
- **Reset Button**: Start over from the beginning
- **Close Button**: Exit the HUD interface

## 🏗️ Development

### Project Structure
```
fast-reader-extension/
├── manifest.json              # Extension manifest configuration
├── README.md                  # This file
├── src/
│   ├── content/              # Content script for text selection
│   │   └── content.js
│   ├── popup/                # Popup interface
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── hud/                  # HUD (Heads-Up Display) interface
│   │   ├── hud.html
│   │   └── hud.js
│   └── styles/               # Shared stylesheets
│       └── styles.css
└── assets/
    └── icons/                # Extension icons
        ├── icon.png
        └── ef.png
```

### Key Components

- **Content Script** (`src/content/content.js`): Monitors text selection and displays the Fast Reader icon
- **Popup** (`src/popup/`): User interface for entering custom text
- **HUD** (`src/hud/`): Fullscreen word-by-word reading interface
- **Styles** (`src/styles/styles.css`): Shared styling for icon, iframe, and HUD components

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/fast-reader-extension.git
   cd fast-reader-extension
   ```

2. **Load the extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

3. **Make changes**:
   - Edit files in the `src/` directory
   - After making changes, click the refresh icon on the extension card
   - Test your changes

### Browser Compatibility
- Chrome (Manifest V3)
- Chromium-based browsers (Edge, Brave, Opera, etc.)

## 🎨 Design Philosophy

Fast Reader follows modern UI/UX principles:
- **Dark Theme**: Reduces eye strain during extended reading
- **Minimal Distractions**: Clean interface focused on reading
- **Smooth Animations**: Fluid transitions and interactions
- **Accessibility**: Keyboard shortcuts and focus states
- **Responsive Design**: Works on different screen sizes
- **Glassmorphism**: Modern blur effects for depth

## 🔮 Future Improvements

- [ ] Multiple reading modes (word-by-word, sentence-by-sentence)
- [ ] Customizable color themes
- [ ] Reading statistics and analytics
- [ ] Bookmark and sync text inputs
- [ ] Voice reading option
- [ ] Export reading history
- [ ] Integration with popular reading services
- [ ] Mobile browser support
- [ ] Translation feature
- [ ] Custom focus point adjustments

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Ergül Ferik**
- Portfolio: [https://ergulferik.github.io/Portfolio-Website/](https://ergulferik.github.io/Portfolio-Website/)
- GitHub: [@ergulferik](https://github.com/ergulferik)

## 🙏 Acknowledgments

- Inter font family by Google Fonts
- Inspired by RSVP reading techniques
- Built with modern web technologies

## 📊 Version History

- **v2.0** (Current)
  - Added popup interface
  - Restructured project architecture
  - Improved UI/UX
  - Added keyboard shortcuts
  - Enhanced error handling
  
- **v1.0**
  - Initial release
  - Text selection feature
  - Basic HUD interface

---

Made with ❤️ by Ergül Ferik

