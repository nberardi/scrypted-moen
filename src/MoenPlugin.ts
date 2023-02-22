// build off the wonderful work of https://github.com/haywirecoder/homebridge-flobymoen

import sdk from '@scrypted/sdk'
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Device, DeviceDiscovery, DeviceProvider, ScryptedDeviceBase, ScryptedDeviceType, ScryptedInterface, Setting, Settings, SettingValue } from '@scrypted/sdk';
import { StorageSettings } from "@scrypted/sdk/storage-settings"
import { MoenBase } from './MoenBase';
import { MoenLeakSensor } from './MoenLeakSensor';

const agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15";
const baseUrlV1 = 'https://api.meetflo.com/api/v1';
const baseUrlV2 = 'https://api-gw.meetflo.com/api/v2';
const authUrl      = baseUrlV1 + '/users/auth';
const userTokenUrl = baseUrlV1 + '/usertokens/me';
const heartbeatUrl = baseUrlV2 + '/presence/me';

export class MoenPlugin extends ScryptedDeviceBase implements DeviceDiscovery, DeviceProvider, Settings {
    storageSettings = new StorageSettings(this, {
        email: {
            title: "Email",
            type: "string",
            description: "The email for your Moen account.",
        },
        password: {
            title: "Password",
            type: "password",
            description: "The password for your Moen account.",
            onPut: () => this.discoverDevices()
        },
        refreshInterval: {
            title: "Refresh Interval",
            type: "number",
            description: "The interval in seconds to refresh the device state."
        },
        exposeCriticalNotificationsToSecuritySystem: {
            title: "Expose Critical Notifications to Security System",
            type: "boolean",
            description: "Expose notifications as a BinarySensor for the Security System to alert on.",
            onPut: () => this.discoverDevices()
        },
        exposeWarningNotificationsToSecuritySystem: {
            title: "Expose Warning Notifications to Security System",
            type: "boolean",
            description: "Expose notifications as a BinarySensor for the Security System to alert on.",
            onPut: () => this.discoverDevices()
        },
        authToken: {
            hide: true,
            json: true
        }
    });

    locations: string[] = [];
    devices = new Map<string, MoenBase>();

    get loggedIn(): boolean {
        if (this.storageSettings.values.authToken === undefined)
            return false;

        const { token, expiry } = this.storageSettings.values.authToken;

        // determine time the elapse between now and token usage.
        let tokenExpiration = Math.floor(expiry - Date.now());
        return ((token != undefined) && (tokenExpiration > 0));
    }

    constructor(nativeId?: string) {
        super(nativeId);
        this.discoverDevices();
    }

    getSettings(): Promise<Setting[]> {
        return this.storageSettings.getSettings();
    }

    putSetting(key: string, value: SettingValue): Promise<void> {
        return this.storageSettings.putSetting(key, value);
    }

    private get requestConfig () {
        const { token } = this.storageSettings.values.authToken;

        return {
            headers: {
                'User-Agent': agent,
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept': 'application/json',
                'authorization': token
            }
        };
    }

    async refreshToken() : Promise<boolean> {
        
        try {
            this.console.group("Flo Status: Refreshing Token...");

            const response = await axios.post(authUrl, {
                'username': this.storageSettings.values.email,
                'password': this.storageSettings.values.password 
            });

            let authToken: any = {};

            // Successful login, store token and built transaction header data for future transactions
            authToken.token = response.data.token;
            authToken.userId = response.data.tokenPayload.user.user_id;

            // Calculated expiration time assume half life of token provided
            authToken.expiry = new Date(response.data.timeNow + response.data.tokenExpiration);

            // Store token for future use
            this.storageSettings.values.authToken = authToken;

            // Set timer to obtain new token
            var refreshTimeoutmillis = Math.floor(authToken.expiry - Date.now());

            // Display refreshing token information 
            this.console.info(`Flo Info: Token will refresh in ${Math.floor((refreshTimeoutmillis / (1000 * 60 * 60)) % 24)} hour(s) and ${Math.floor((refreshTimeoutmillis / (1000 * 60 )) % 60)} mins(s).`);
            return true;
        }
        catch(err) {
            this.console.error("Flo Error: Failed to refresh token: " + err);
            return false;
        } 
        finally {
            this.console.groupEnd();
        }
    };

    async lookupDevice(deviceId: string): Promise<any> {

         if (!this.loggedIn) {
            await this.refreshToken();
        }

        const url = baseUrlV2 + "/devices/" + deviceId;
                        
        try {
            const deviceResponse = await axios.get(url, this.requestConfig);

            if (!deviceResponse.data)
                return { error: new Error("Device not found.") };

            this.console.debug("Device Raw Data: ", deviceResponse.data);

            const d: Device = {
                providerNativeId: this.nativeId,
                name: deviceResponse.data.nickname,
                type: ScryptedDeviceType.Sensor,
                nativeId: deviceResponse.data.serialNumber,
                interfaces: [
                    ScryptedInterface.Online,
                    ScryptedInterface.Settings,
                    ScryptedInterface.BinarySensor
                ],
                info: {
                    model: deviceResponse.data.deviceModel,
                    manufacturer: 'Moen',
                    serialNumber: deviceResponse.data.serialNumber,
                    mac: deviceResponse.data.macAddress,
                    firmware: deviceResponse.data.fwVersion,
                    version: deviceResponse.data.fwVersion,
                    metadata: {
                        deviceType: deviceResponse.data.deviceType,
                        deviceId: deviceResponse.data.id,
                        locationId: deviceResponse.data.locationId
                    }
                }
            };

            switch (deviceResponse.data.deviceType) {
                case "puck_oem":
                    d.interfaces.push(ScryptedInterface.FloodSensor);
                    d.interfaces.push(ScryptedInterface.Battery);
                    d.interfaces.push(ScryptedInterface.Thermometer);
                    d.interfaces.push(ScryptedInterface.HumiditySensor);
                    d.type = ScryptedDeviceType.Sensor;
                    break;
            }

            if (this.storageSettings.values.exposeCriticalNotificationsToSecuritySystem || this.storageSettings.values.exposeWarningNotificationsToSecuritySystem) {
                d.interfaces.push(ScryptedInterface.BinarySensor);
            }

            await sdk.deviceManager.onDeviceDiscovered(d);

            const s = sdk.deviceManager.getDeviceStorage(d.nativeId);
            s.setItem("deviceId", deviceResponse.data.id);
            s.setItem("locationId", deviceResponse.data.location.id);
            s.setItem("exposeCriticalNotificationsToSecuritySystem", this.storage.getItem('exposeCriticalNotificationsToSecuritySystem'));
            s.setItem("exposeWarningNotificationsToSecuritySystem", this.storage.getItem('exposeWarningNotificationsToSecuritySystem'));

            const moen = new MoenLeakSensor(d.nativeId, deviceResponse.data);
            this.devices.set(d.nativeId, moen);

            return { nativeId: d.nativeId, device: d, moen: moen };
        } 
        catch(err) {
            return { error: err };
        }
    }

    async discoverDevices(duration?: number): Promise<void> {

         if (!this.loggedIn) {
            await this.refreshToken();
        }

        const { userId } = this.storageSettings.values.authToken;
        const requestConfig = this.requestConfig;

        // Create path for locations listing
        var url = baseUrlV2 + "/users/" + userId + "?expand=locations";
        
        try {
            // Get devices at location 
            const locationResponse = await axios.get(url, requestConfig);

            // Get each device at each location
            for (var i = 0; i < locationResponse.data.locations.length; i++) {

                this.locations[i] = locationResponse.data.locations[i].id;

                for (var z = 0; z < locationResponse.data.locations[i].devices.length; z++) {
                    const { error, nativeId, device, moen } = await this.lookupDevice(locationResponse.data.locations[i].devices[z].id);

                    if (error)
                        this.console.error("Flo Device Load Error: " + error.message);
                }
            }
        } catch(err) {
            this.console.error("Flo Location Load Error: " + err.message);
        }
    }

    async getDevice(nativeId: string): Promise<MoenBase> {

        if (this.devices.has(nativeId))
            return this.devices.get(nativeId);

        let s = sdk.deviceManager.getDeviceStorage(nativeId);
        if (s) {
            const deviceId = s.getItem("deviceId");

            const { error, nativeId, device, moen } = await this.lookupDevice(deviceId);

            if (error)
                this.console.error("Flo Device Get Error: " + error.message);

            return moen;
        }

        return undefined;
    }
}