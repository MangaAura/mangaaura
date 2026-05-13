export default function ChapterReaderLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="h-14 bg-tertiary" />
      <div className="h-1 bg-tertiary" />
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)]">
        <div className="w-48 h-72 bg-tertiary rounded-lg" />
      </div>
    </div>
  );
}
