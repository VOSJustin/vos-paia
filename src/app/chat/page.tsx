"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Onboarding flow steps
const ONBOARDING_STEPS = [
  {
    trigger: "START",
    message: "Welcome! I am FELICIA, your Personal AI Assistant.\n\nBefore we begin, I would like to get to know you a little. This helps me become truly YOUR assistant, not just a generic chatbot.\n\nShall we begin?",
    expectsResponse: true,
  },
  {
    trigger: "NAME",
    message: "Wonderful! Let us start simple.\n\nWhat should I call you?",
    expectsResponse: true,
    saveAs: "userName",
  },
  {
    trigger: "AREA",
    message: "Nice to meet you, {userName}!\n\nHere is an important question:\n\nIf I could genuinely help you with ONE area of your life over the next year - really make a difference - what would that area be?\n\nDo not overthink it. Just whatever comes to mind first.",
    expectsResponse: true,
    saveAs: "focusArea",
  },
  {
    trigger: "OBSTACLE",
    message: "That makes a lot of sense.\n\nWhen it comes to {focusArea}, what usually gets in your way?\n\nI do not mean external stuff like time or money. I mean internally. What is the pattern that trips you up?",
    expectsResponse: true,
    saveAs: "obstacle",
  },
  {
    trigger: "KNOWLEDGE",
    message: "I hear you, {userName}. That is real, and I appreciate you sharing it.\n\nNow, here is where I become different from other AI:\n\nI can learn from YOUR documents - your notes, files, anything you want me to know about. This stays 100% private on YOUR computer.\n\nWould you like to connect a knowledge folder?\n\n(Type YES to set it up, or SKIP to do it later)",
    expectsResponse: true,
  },
  {
    trigger: "FOLDER_SETUP",
    message: "Great choice!\n\nTo connect your knowledge folder:\n\n1. Download the FELICIA Bridge app (I will give you the link)\n2. Create a folder anywhere on your computer\n3. Tell me the path (e.g., ~/Documents/Felicia-Knowledge)\n\nWhat folder path would you like to use?",
    expectsResponse: true,
    saveAs: "knowledgePath",
  },
  {
    trigger: "COMPLETE",
    message: "Perfect! I have saved your knowledge folder as:\n{knowledgePath}\n\nOnce you run the FELICIA Bridge, I will be able to read any documents you put there.\n\n---\n\nSetup complete, {userName}!\n\nI am now YOUR personal AI. I know your focus is {focusArea}, and I understand the challenges you face.\n\nHow can I help you today?",
    expectsResponse: false,
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [userData, setUserData] = useState<Record<string, string>>({});
  const chatRef = useRef<HTMLDivElement>(null);

  // Start onboarding on mount
  useEffect(() => {
    const saved = localStorage.getItem("paia-onboarding-complete");
    if (saved) {
      const savedData = JSON.parse(localStorage.getItem("paia-user-data") || "{}");
      setUserData(savedData);
      setMessages([{
        role: "assistant",
        content: `Welcome back, ${savedData.userName || "friend"}! How can I help you today?`
      }]);
      setOnboardingStep(-1); // Skip onboarding
    } else {
      // Start onboarding
      const firstStep = ONBOARDING_STEPS[0];
      setMessages([{ role: "assistant", content: firstStep.message }]);
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const processOnboarding = (userInput: string) => {
    const currentStep = ONBOARDING_STEPS[onboardingStep];
    const nextStepIndex = onboardingStep + 1;
    
    // Save data if needed
    let newUserData = { ...userData };
    if (currentStep?.saveAs) {
      newUserData[currentStep.saveAs] = userInput;
      setUserData(newUserData);
    }

    // Handle special cases
    if (onboardingStep === 4) { // Knowledge folder question
      if (userInput.toLowerCase() === "skip") {
        // Skip to complete
        const completeStep = ONBOARDING_STEPS[6];
        let msg = completeStep.message;
        Object.entries(newUserData).forEach(([key, value]) => {
          msg = msg.replace(new RegExp(`{${key}}`, "g"), value);
        });
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        localStorage.setItem("paia-onboarding-complete", "true");
        localStorage.setItem("paia-user-data", JSON.stringify(newUserData));
        setOnboardingStep(-1);
        return;
      }
    }

    // Move to next step
    if (nextStepIndex < ONBOARDING_STEPS.length) {
      const nextStep = ONBOARDING_STEPS[nextStepIndex];
      let msg = nextStep.message;
      
      // Replace placeholders
      Object.entries(newUserData).forEach(([key, value]) => {
        msg = msg.replace(new RegExp(`{${key}}`, "g"), value);
      });

      setTimeout(() => {
        setMessages(prev => [...prev, { role: "assistant", content: msg }]);
        setOnboardingStep(nextStepIndex);
        
        // Check if onboarding complete
        if (nextStep.trigger === "COMPLETE") {
          localStorage.setItem("paia-onboarding-complete", "true");
          localStorage.setItem("paia-user-data", JSON.stringify(newUserData));
          setOnboardingStep(-1);
        }
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    // If still onboarding
    if (onboardingStep >= 0) {
      processOnboarding(userMessage);
      return;
    }

    // Regular chat - TODO: Connect to local Ollama via bridge
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I am not yet connected to your local AI. Please run the FELICIA Bridge on your computer to enable local AI responses.\n\nIn the meantime, I can help you with the setup!"
      }]);
      setIsLoading(false);
    }, 1000);
  };

  const resetOnboarding = () => {
    localStorage.removeItem("paia-onboarding-complete");
    localStorage.removeItem("paia-user-data");
    setUserData({});
    setOnboardingStep(0);
    const firstStep = ONBOARDING_STEPS[0];
    setMessages([{ role: "assistant", content: firstStep.message }]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌸</span>
          <div>
            <h1 className="font-semibold">FELICIA</h1>
            <p className="text-xs text-slate-400">Personal AI Assistant</p>
          </div>
        </div>
        <button
          onClick={resetOnboarding}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Reset
        </button>
      </header>

      {/* Chat Area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 rounded-br-md"
                  : "bg-slate-800 rounded-bl-md"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-4 rounded-2xl rounded-bl-md">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-800 border border-slate-600 rounded-full px-6 py-3 focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-6 py-3 rounded-full font-medium disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
