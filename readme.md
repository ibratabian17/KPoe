# KaraokePoe

KaraokePoe is a work-in-progress karaoke player (counted as game), built using the Electron framework. This project aims to create a free karaoke application (excluding song list).

## How to Use

1. Clone the repository:
   ```bash
   git clone https://github.com/ibratabian17/KPoe.git
   ```

2. Install dependencies:
   ```bash
   cd KPoe
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

## Features (Work in Progress)

- Working Lyrics System
- Easy to Use for Song Makers
- Gamepad Support (Button Only)
- Video & Audio Support
- Custom Lyrics Styles:
  - `"normal"`: 2-line scrolling system
  - `"apple"`: Apple Music-like style
  - `"two-line"`: 2 lines located on the left and right
  - `"one-line"`: Displays only 1 line with fade
- Mobile Friendly

## Notes

- The song list is not included in this application. You can add your own songs as needed.
- The lyrics format used is similar to Just Dance Now but has been modified to fit this application.
- You can use [KpoeTools](https://github.com/ibratabian17/KPoeTools) to convert eLRC or Apple's TTML into KPoe Format
- Or you can use [Kmake](https://github.com/ecnivtwelve/kmake/) by [ecnivtwelve](https://github.com/ecnivtwelve)

## License

This project is licensed under the [MIT License](LICENSE).

## Example Files:

- Songdb: [songdb-example.json](https://ibratabian17.prjktla.workers.dev/songdb-example.json)
- LyricsData: [Magnetic.json](https://ibratabian17.prjktla.workers.dev/Maps/Magnetic/Magnetic.json)