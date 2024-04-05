# ESP32 NTRIP Duo
This is modified version of ESP32 xbee.

ESP32 NTRIP Duo is made with [ESP-IDF](https://github.com/espressif/esp-idf). Its main function is to forward the UART of the ESP32 to a variety of protocols over WiFi.

In this version Installation is simplified, with just a single bin file. You can use ESPHome web flasher https://web.esphome.io/ just connect your ESP32 dev board to PC, select connect, chose correct COM port, connect and install. On popup chose bin file and click install.

This software can run on ESP32 WROOM type.

## Features
- WiFi Station
- WiFi Hotspot
- Web Interface
- UART configuration
- NTRIP Client/Server/


## Help
It can be compiled using ESP-IDF 4.1.

To install the latest firmware use ESPHome web Flasher https://web.esphome.io/

It is still work in progress!!!

## Pinout
By default it is set for UART0 gpio1, gpio3
