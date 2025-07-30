"use client";

import { useState, useEffect } from "react";

interface Model {
  id: string;
  name: string;
  maxTokens?: number;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string, maxTokens?: number) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

   
  useEffect(() => {
    fetch("/api/gradient-models")
      .then((res) => res.json())
      .then((data) => {
        const loadedModels: Model[] = data.models || [];
        setModels(loadedModels);
        setLoading(false);
        
        // Set maxTokens for the initially selected model only once
        if (!hasInitialized) {
          const initialModel = loadedModels.find((m: Model) => m.id === selectedModel);
          if (initialModel?.maxTokens) {
            onModelChange(selectedModel, initialModel.maxTokens);
          }
          setHasInitialized(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load models:", err);
        setLoading(false);
      });
  }, [hasInitialized, onModelChange, selectedModel]); // Dependencies for the effect

  return (
    <select
      id="model-select"
      value={selectedModel}
      onChange={(e) => {
        const model = models.find((m: Model) => m.id === e.target.value);
        onModelChange(e.target.value, model?.maxTokens);
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
      disabled={loading}
    >
      {loading ? (
        <option>Loading models...</option>
      ) : (
        models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))
      )}
    </select>
  );
}