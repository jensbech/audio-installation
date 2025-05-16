# Audio Layering Installation

An audio art installation designed for Raspberry Pi that records 30-minute audio segments and plays them back, building layers of audio over time.

## Prerequisites

* Raspberry Pi (any model with audio input/output)
* External microphone
* Speaker
* Node.js (v14 or higher)
* PNPM package manager

## Hardware Setup

1. Connect an external microphone to your Raspberry Pi (via USB or the audio jack)
2. Connect speakers to your Raspberry Pi (via the 3.5mm audio jack, HDMI, or USB)

## Software Dependencies

This project requires `arecord` and `aplay` utilities to be installed on your Raspberry Pi:

```bash
sudo apt-get update
sudo apt-get install alsa-utils
```

## Installation

1. Clone this repository:

```bash
git clone <repository-url>
cd audio-installation
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the application:

```bash
pnpm build
```

## Configuration

You can adjust settings in `src/config.ts` :

* Recording duration (default: 30 minutes)
* Recording quality (sample rate, channels)
* Playback volume
* Number of recordings to keep

## Usage

Start the installation:

```bash
pnpm start
```

The installation will:
1. Record audio for 30 minutes
2. Play back the recording
3. Start recording the next 30 minutes
4. Over time, build layers of audio as the environment changes

## Running as a Service

To run this application automatically when your Raspberry Pi starts up, you can create a systemd service:

1. Create a service file:

```bash
sudo nano /etc/systemd/system/audio-installation.service
```

2. Add this content:

```
[Unit]
Description=Audio Layering Art Installation
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/audio-installation
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl enable audio-installation
sudo systemctl start audio-installation
```

## Troubleshooting

### Audio Issues

* Run `arecord -l` to list recording devices
* Run `aplay -l` to list playback devices
* Test microphone: `arecord -d 5 -f cd test.wav` (records 5 seconds)
* Test playback: `aplay test.wav`

### Permission Issues

* Ensure your user has access to audio devices: `sudo usermod -a -G audio $USER`

## License

MIT
