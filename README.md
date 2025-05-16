# Audio Layering Installation

Record  audio segments and plays them back in a loop, building layers of audio over time.

```bash
sudo apt-get update
sudo apt-get install alsa-utils
```

## Running as a Service

1. Create service file:

```bash
sudo nano /etc/systemd/system/audio-installation.service
```

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

```bash
sudo systemctl enable audio-installation
sudo systemctl start audio-installation
```

## Troubleshooting

* `arecord -l` list recording devices
* `aplay -l` list playback devices
* Test mic 5 sec `arecord -d 5 -f cd test.wav`
* Test playback `aplay test.wav`
* `sudo usermod -a -G audio $USER`
