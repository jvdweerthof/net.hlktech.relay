# Hi-Link Relays

Adds support for the Hi-Link HLK-SW16 16 channel WiFi/Ethernet Relay.

# Setup

## Wi-Fi setup on Relay

1. Turn on the device by plugging in the power
2. Connect via Wi-Fi to the access point of the device, the name starts with "HI-LINK_"
3. Go to `http://192.168.16.254`, default username and password `admin`
4. In the menu, click `HLK-WR02` > `Serial2Net Settings`
5. Change `NetMode` to `WIFI(CLIENT)-SERIAL`
6. Enter the `SSID`, `Encrypt Type` and `Password` for your wireless network
7. Change `IP Type` to `STATIC`
8. Enter the `IP Address`, `Subnet Mask`, `Default Gateway` and `DNS Servers` for your local network
9. Click `Save`

## Adding the device to Homey
1. Install the app from the Homey app store: https://homey.app/a/net.hlktech.relay
2. Using the Homey app, add a new device choosing Hi-Link from the list of installed apps
4. Enter the IP Address and Port for your Relay. By default the port is 8080.
5. Select which channels of the relay you would like to add to your Homey. The channel order on the board is:
```
        2xEthernet
ch16                  ch15
ch14                  ch13
ch12                  ch11
ch10                   ch9
ch8                    ch7
ch6                    ch5
ch4                    ch3
ch2                    ch1
      Power + Serial
```
