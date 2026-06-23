export default function Scene({ scenario }) {
  return (
    <div className="w-full h-64 bg-amber-100 rounded-md flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl">🧍‍♂️</div>
        <p className="mt-2 text-gray-700 text-sm">
          {scenario ? "Client is ready" : "Waiting for session..."}
        </p>
      </div>
    </div>
  );
}
