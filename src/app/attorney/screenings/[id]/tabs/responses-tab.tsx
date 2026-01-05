interface Response {
  question: string;
  answer: string;
}

interface ResponsesTabProps {
  responses: Response[];
}

export function ResponsesTab({ responses }: ResponsesTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Screening Responses</h3>
      <div className="space-y-4">
        {responses.map((response, idx) => (
          <div key={idx} className="p-4 bg-gray-50 rounded-lg space-y-2">
            <p className="font-medium text-gray-900">
              Q{idx + 1}: {response.question}
            </p>
            <p className="text-gray-700 pl-4 border-l-2 border-blue-200">
              {response.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
