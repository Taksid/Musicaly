import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.list();
    for await (const model of response) {
      if (model.name.includes('lyria') || model.name.includes('audio') || model.name.includes('video') || model.name.includes('omni') || model.name.includes('omni')) {
        console.log(model.name);
      }
    }
    console.log("Done");
  } catch (err) {
    console.error(err);
  }
}
test();
