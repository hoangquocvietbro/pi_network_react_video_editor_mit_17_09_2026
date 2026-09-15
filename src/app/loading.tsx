export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]">
            {/* App Logo or Spinner */}
            <div className="relative w-20 h-20 mb-8">
                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div className="flex flex-col items-center text-center px-4">
                <h2 className="text-xl font-semibold text-white mb-2">
                    Initializing Resources...
                </h2>
                <p className="text-gray-400 text-sm animate-pulse max-w-xs">
                    This may take a few moments depending on your connection speed.
                </p>
            </div>

            {/* Progress Bar (Gives feedback that the app hasn't crashed) */}
            <div className="mt-8 w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-progress"></div>
            </div>
        </div>
    );
}
