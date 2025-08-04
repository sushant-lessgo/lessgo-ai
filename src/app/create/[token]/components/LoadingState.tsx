"use client";

import { useEffect, useState } from "react";

interface LoadingStateProps {
  messages?: string[];
  duration?: number; // Duration for each message in ms
}

export default function LoadingState({ 
  messages = [
    "Analyzing your startup idea...",
    "Identifying market category...",
    "Understanding your target audience...",
    "Inferring key details..."
  ],
  duration = 800 
}: LoadingStateProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, duration);

    return () => clearInterval(interval);
  }, [messages.length, duration]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Progress message */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-brand-accentPrimary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700 animate-pulse">
            {messages[currentMessageIndex]}
          </p>
        </div>
      </div>

      {/* Skeleton loaders for field cards */}
      <div className="space-y-4">
        {[1, 2, 3].map((index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-6 bg-gray-200 rounded-full w-24"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="flex gap-3 mt-4">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Additional loading indicator */}
      <div className="mt-8 text-center">
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="w-2 h-2 bg-brand-accentPrimary rounded-full animate-bounce"
              style={{ animationDelay: `${index * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}