export default function ReaderLoading() {
  return (
    <main id="main-content" className="flex items-center justify-center min-h-screen bg-black">
      <div role="status" className="animate-spin rounded-full h-8 w-8 border-b-2 border-white">
        <span className="sr-only">Cargando lector...</span>
      </div>
    </main>
  );
}
