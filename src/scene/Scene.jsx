export default function Scene({ scenario, aiResponse }) {
  return (
    <div className="w-full h-64 bg-amber-100 rounded-md flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl">🧍‍♂️</div>
        <p className="mt-2 text-gray-700 text-sm">
          {aiResponse
            ? aiResponse
            : scenario
            ? "Hello, I'm your virtual client. Tell me what's going on."
            : "Waiting for session..."}
        </p>
      </div>
    </div>
  );
}
