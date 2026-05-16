import mqtt from "mqtt";
import { client as mqttClient } from "./mqttClient.js";

function publishMqttMessage(topic, payload, options = {}) {
  return new Promise((resolve, reject) => {
    if (!mqttClient.connected)
      return reject(new Error("MQTT client not connected"));

    mqttClient.publish(topic, payload, options, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function publishCheckSensorMessage(roomId, deviceId) {
  const topic = `/room/${roomId}/device/${deviceId}/sensor/status/check`;
  const msg = JSON.stringify("check");
  publishMqttMessage(topic, msg, { qos: 1 });
}

export function publishConfigurationMessage(roomId, deviceId, configValues) {
  const topic = `/room/${roomId}/device/${deviceId}/configuration`;
  const { hb_rate: hbRate, sensor_rate: sensorRate } = configValues;
  const msg = { hb_rate: hbRate, sensor_rate: sensorRate };
  publishMqttMessage(topic, JSON.stringify(msg), { qos: 1 });
}
