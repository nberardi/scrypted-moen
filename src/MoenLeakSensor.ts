import { Battery, FloodSensor, HumiditySensor, Online, ScryptedDeviceBase, TemperatureUnit, Thermometer } from "@scrypted/sdk";
import { MoenBase } from "./MoenBase";

export class MoenLeakSensor extends MoenBase implements Battery, Thermometer, HumiditySensor, FloodSensor {
    constructor(nativeId?: string, data?: any) {
        super(nativeId);

        this.refresh(data);
    }

    refresh (data: any) {
        super.refresh(data);

        this.temperature = this.convertToCelsius(data.fwProperties.telemetry_temperature);
        this.humidity = data.fwProperties.telemetry_humidity;
        this.batteryLevel = data.fwProperties.telemetry_battery_percent;
        this.flooded = data.fwProperties.telemetry_water;
    }

    setTemperatureUnit(temperatureUnit: TemperatureUnit): Promise<void> {
        throw new Error("Method not implemented.");
    }
}