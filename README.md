# ESP32 NTRIP Duo
This is modified version of ESP32 xbee.

Main difference is that this have two NTRIP servers that can be running at the same time to be able to feed Onocoy and RTK Direct!!!

ESP32 NTRIP Duo is made with [ESP-IDF](https://github.com/espressif/esp-idf). Its main function is to forward the UART of the ESP32 to a variety of protocols over WiFi.

In this version Installation is simplified, with just a single bin file. You can use ESPHome web flasher https://web.esphome.io/ just connect your ESP32 dev board to PC, select connect, chose correct COM port, connect and install. On popup chose bin file and click install.

This software can run on ESP32 WROOM type.

## Features
- WiFi Station
- WiFi Hotspot
- Web Interface
- UART configuration
- Two NTRIP Servers


## Help
Now It can be compiled using ESP-IDF 5.4. (with some depreciation comments)

To install the latest firmware use ESPHome web Flasher https://web.esphome.io/

Here is installation video https://youtu.be/33Mu5EV7fOE?si=J6kwCt6bbmIu7HnS

It is still work in progress!!!

## Pinout
By default it is set for UART0 TX gpio1, RX gpio3

LED with common positive output:

gpio21 Red

gpio22 Green

gpio23 Blue
![IMG_20250212_000825](https://github.com/user-attachments/assets/f17d28dc-4bc7-4647-8311-7a1c44526d17)
