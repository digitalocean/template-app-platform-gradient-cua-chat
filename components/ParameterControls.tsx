"use client";

interface ParameterControlsProps {
  temperature: number;
  topK: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  maxOutputTokens: number;
  maxSteps: number;
  onParameterChange: (param: string, value: number) => void;
}

const parameterInfo = {
  temperature: {
    label: "Temperature",
    description: "Controls randomness. Lower is more focused, higher is more creative.",
    min: 0,
    max: 2,
    step: 0.1,
  },
  topK: {
    label: "Top K",
    description: "Limits vocabulary to K most likely tokens.",
    min: 1,
    max: 100,
    step: 1,
  },
  topP: {
    label: "Top P",
    description: "Cumulative probability cutoff for token selection.",
    min: 0,
    max: 1,
    step: 0.05,
  },
  presencePenalty: {
    label: "Presence Penalty",
    description: "Reduces repetition of topics already mentioned.",
    min: -2,
    max: 2,
    step: 0.1,
  },
  frequencyPenalty: {
    label: "Frequency Penalty",
    description: "Reduces repetition of exact words and phrases.",
    min: -2,
    max: 2,
    step: 0.1,
  },
  maxOutputTokens: {
    label: "Max Tokens",
    description: "Maximum length of the response.",
    min: 1,
    max: 200000,
    step: 1000,
  },
  maxSteps: {
    label: "Max Steps",
    description: "Maximum tool-use iterations allowed.",
    min: 1,
    max: 50,
    step: 1,
  },
};

export default function ParameterControls({
  temperature,
  topK,
  topP,
  presencePenalty,
  frequencyPenalty,
  maxOutputTokens,
  maxSteps,
  onParameterChange,
}: ParameterControlsProps) {
  const parameters = [
    { key: "temperature", value: temperature },
    { key: "topK", value: topK },
    { key: "topP", value: topP },
    { key: "presencePenalty", value: presencePenalty },
    { key: "frequencyPenalty", value: frequencyPenalty },
    { key: "maxOutputTokens", value: maxOutputTokens },
    { key: "maxSteps", value: maxSteps },
  ];

  return (
    <div className="space-y-3">
      {parameters.map(({ key, value }) => {
        const info = parameterInfo[key as keyof typeof parameterInfo];
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor={key} className="text-sm font-medium text-gray-700">
                {info.label}
              </label>
              <input
                id={key}
                type="number"
                value={value}
                onChange={(e) => {
                  const newValue = key === "topK" || key === "maxOutputTokens" || key === "maxSteps"
                    ? parseInt(e.target.value)
                    : parseFloat(e.target.value);
                  onParameterChange(key, newValue);
                }}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                min={info.min}
                max={info.max}
                step={info.step}
              />
            </div>
            <p className="text-xs text-gray-500">{info.description}</p>
          </div>
        );
      })}
    </div>
  );
}