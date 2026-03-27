import mqtt from "mqtt";

const MQTT_BROKER_URL = "mqtt://localhost:1883";
const TOPIC_RECEIVE = "/test/backend";
const TOPIC_PUBLISH1 = "/test/mosquitto";
const TOPIC_PUBLISH2 = "/test/esp32";

const TAG = "[MQTT Client]";

var retry = 0;

export const client = mqtt.connect(MQTT_BROKER_URL);

client.on("connect", () => {
  console.log(`${TAG} connected to broker at ` + MQTT_BROKER_URL);

  client.subscribe(TOPIC_RECEIVE, (err) => {});

  // client.publish(
  //   TOPIC_PUBLISH1,
  //   "backend MQTT client ready to receive on " + TOPIC_RECEIVE,
  // );
  // client.publish(
  //   TOPIC_PUBLISH2,
  //   "backend MQTT client ready to receive on " + TOPIC_RECEIVE,
  // );
});

client.on("message", (topic, message) => {
  console.log(`${TAG} received message:`, `(${topic})`, message.toString());
});

client.on("offline", () => {
  console.log(`${TAG} client disconnected`);
});

export function publishMessage(topic, payload, options = {}) {
  return new Promise((resolve, reject) => {
    if (!client.connected)
      return reject(new Error("MQTT client not connected"));
    client.publish(topic, payload, options, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
