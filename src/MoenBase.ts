import { BinarySensor, Online, ScryptedDeviceBase, Setting, SettingValue, Settings } from "@scrypted/sdk";
import { StorageSettings, StorageSettingsDevice } from "@scrypted/sdk/storage-settings";

export class MoenBase extends ScryptedDeviceBase implements Online, Settings, BinarySensor, StorageSettingsDevice {
    storageSettings = new StorageSettings(this, {
        exposeCriticalNotificationsToSecuritySystem: {
            title: "Expose Critical Notifications to Security System",
            type: "boolean",
            description: "Expose notifications as a BinarySensor for the Security System to alert on.",
            readonly: true
        },
        exposeWarningNotificationsToSecuritySystem: {
            title: "Expose Warning Notifications to Security System",
            type: "boolean",
            description: "Expose notifications as a BinarySensor for the Security System to alert on.",
            readonly: true
        }
    });

    constructor(nativeId?: string) {
        super(nativeId);
    }

    getSettings(): Promise<Setting[]> {
        return this.storageSettings.getSettings();
    }

    putSetting(key: string, value: SettingValue): Promise<void> {
        return this.storageSettings.putSetting(key, value);
    }

    refresh (data: any) {
        this.online = data.isConnected;

        let alarm: boolean = false;

        if (this.storageSettings.values.exposeCriticalNotificationsToSecuritySystem)
            alarm = data.notifications.criticalCount > 0;

        if (this.storageSettings.values.exposeWarningNotificationsToSecuritySystem)
            alarm = alarm || data.notifications.warningCount > 0;

        this.binaryState = alarm;
    }

    convertToCelsius (tempF: number) {
        return (tempF - 32) * 5/9;
    }
}