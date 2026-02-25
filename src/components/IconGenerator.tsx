import { GoogleGenAI } from "@google/genai";
import React, { useState } from "react";

export const IconGenerator: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateIcon = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            {
              text: "A modern, minimalist app icon for 'VIRAL ROAD'. The design should feature a stylized lightning bolt integrated with a road or a growth curve, symbolizing AI-powered content strategy and viral growth. Color palette: vibrant yellow (#FFC700) and deep charcoal black. High-tech, premium aesthetic, clean lines, suitable for a mobile app icon.",
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      const candidate = response.candidates?.[0];
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            setImageUrl(`data:image/png;base64,${base64EncodeString}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error generating icon:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 flex flex-col items-center gap-6">
      <button
        onClick={generateIcon}
        disabled={loading}
        className="px-6 py-3 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-500 disabled:opacity-50"
      >
        {loading ? "Gerando..." : "Gerar Ícone Viral Road"}
      </button>
      {imageUrl && (
        <div className="mt-10 p-4 bg-zinc-900 rounded-[3rem] border border-zinc-800 shadow-2xl">
          <img
            src={imageUrl}
            alt="Viral Road Icon"
            className="w-64 h-64 rounded-[2.5rem]"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};
