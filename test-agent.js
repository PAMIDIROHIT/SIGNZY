import { generateConfigFromText } from './src/modules/agent/agent.service.js';

async function run() {
  try {
    const config = await generateConfigFromText("route to lowest latency vendor");
    console.log(config);
  } catch (err) {
    console.error(err);
  }
}
run();
