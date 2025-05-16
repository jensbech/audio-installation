# Audio layering repeater

Record audio segments and plays them back in a loop, building layers over time.

```bash
sudo apt install alsa-utils
```

## Running as a Service

```bash
sudo nano /etc/systemd/system/audio-layering-repeater.service
```

```
[Unit]
Description=audio-layering-repeater
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/audio-layering-repeater
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable audio-layering-repeater
sudo systemctl start audio-layering-repeater
```

## Misc

* `arecord -l` list recording devices
* `aplay -l` list playback devices
* Test mic 5 sec `arecord -d 5 -f cd test.wav`
* Test playback `aplay test.wav`
* `sudo usermod -a -G audio $USER`
