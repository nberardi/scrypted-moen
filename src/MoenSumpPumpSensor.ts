import { Battery, FloodSensor, HumiditySensor, Online, ScryptedDeviceBase, TemperatureUnit, Thermometer } from "@scrypted/sdk";
import { MoenBase } from "./MoenBase";

export class MoenSumpPumpSensor extends MoenBase implements Battery, Thermometer, HumiditySensor, FloodSensor {
    constructor(nativeId?: string) {
        super(nativeId);
    }
    setTemperatureUnit(temperatureUnit: TemperatureUnit): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
