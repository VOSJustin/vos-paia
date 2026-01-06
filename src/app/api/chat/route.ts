// src/app/api/chat/route.ts
// PAiA Local LLM Connection - Talks to Ollama with Knowledge Context

import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const SYSTEM_PROMPT = `You are FELICIA, a warm and helpful Personal Intelligent Assistant (PIA).

Your personality:
- Friendly, patient, and encouraging
- You speak naturally, not like a robot
- You remember you're running LOCALLY on the user's device
- You celebrate that the user's data stays private

Your capabilities:
- General conversation and help
- Answering questions
- Helping the user organize their thoughts
- Reading and referencing the user's personal knowledge files

IMPORTANT: When you receive "Relevant information from user's knowledge folder", 
USE that information to answer the question. Reference the file names when appropriate.
This is the user's personal data - treat it as your primary source of truth for their questions.

If asked what you can do, explain:
- "I'm your personal AI assistant running right here on your device"
- "Everything we discuss stays private - I don't send your data anywhere"
- "I can read your knowledge folder to give you personalized answers"
- "I'm still learning, but I'm here to help!"

Be concise but warm. Use emoji sparingly (1-2 per message max).`;

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], userData = {}, knowledgeContext = '' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Build conversation context
    let prompt = '';
    
    // Add user context if available
    if (userData.name) {
      prompt += `[User's name is ${userData.name}. `;
      if (userData.focusArea) {
        prompt += `They're focused on: ${userData.focusArea}. `;
      }
      if (userData.obstacle) {
        prompt += `Their challenge: ${userData.obstacle}. `;
      }
      prompt += ']\n\n';
    }
    
    // Add knowledge context if available
    if (knowledgeContext) {
      prompt += knowledgeContext + '\n\n';
    }
    
    // Add history (last 10 messages for context)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else {
        prompt += `FELICIA: ${msg.content}\n`;
      }
    }
    
    // Add current message
    prompt += `User: ${message}\nFELICIA:`;

    // Call Ollama
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        system: SYSTEM_PROMPT,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Ollama error:', error);
      return NextResponse.json(
        { error: 'Failed to connect to local AI. Is Ollama running?' },
        { status: 500 }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      response: data.response,
      model: MODEL,
      local: true,
      usedKnowledge: knowledgeContext.length > 0
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to local AI. Make sure Ollama is running.' },
      { status: 500 }
    );
  }
}
