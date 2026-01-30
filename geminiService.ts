
import { GoogleGenAI } from "@google/genai";
import { Habit, Task } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMotivationalCoach = async (habits: Habit[], tasks: Task[]) => {
  const completedTasks = tasks.filter(t => t.completed).length;
  const activeHabits = habits.length;
  
  const prompt = `
    You are a professional life coach. The user has ${activeHabits} active habits and has completed ${completedTasks} tasks today out of ${tasks.length}.
    Based on this progress, provide a short, 1-2 sentence punchy motivational insight or encouragement.
    Be inspiring but brief.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Keep pushing forward! Every small step counts towards your greater goal.";
  }
};
