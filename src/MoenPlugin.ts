import sdk from '@scrypted/sdk'
import axios, { AxiosError, AxiosResponse } from 'axios';
import { Device, DeviceDiscovery, DeviceProvider, ScryptedDeviceBase, ScryptedDeviceType, ScryptedInterface, Setting, Settings, SettingValue } from '@scrypted/sdk';
import { StorageSettings } from "@scrypted/sdk/storage-settings"

const agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15";


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
        }
    });

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

    discoverDevices(duration?: number): Promise<void> {
        throw new Error('Method not implemented.');
    }
    getDevice(nativeId: string) {
        throw new Error('Method not implemented.');
    }
}