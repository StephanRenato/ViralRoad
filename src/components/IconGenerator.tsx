import React, { useState } from "react";

export const IconGenerator: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateIcon = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ia-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "dall-e-3",
          contents: "A modern, minimalist app icon for 'VIRAL ROAD'. The design should feature a stylized lightning bolt integrated with a road or a growth curve, symbolizing AI-powered content strategy and viral growth. Color palette: vibrant yellow (#FFC700) and deep charcoal black. High-tech, premium aesthetic, clean lines, suitable for a mobile app icon.",
          config: {
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || "Erro ao gerar ícone");
      }

      const data = await response.json();
      if (data.image) {
        setImageUrl(`data:${data.image.mimeType};base64,${data.image.data}`);
      } else {
        console.error("No image data in response", data);
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
