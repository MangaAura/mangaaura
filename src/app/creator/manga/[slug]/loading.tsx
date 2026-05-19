export default function CreatorMangaDetailLoading() {
  return (
    <div role="status" className="p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-8 w-48 bg-tertiary rounded-lg mb-8" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-48 h-72 bg-tertiary rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="h-10 w-3/4 bg-tertiary rounded-lg" />
          <div className="h-4 w-1/2 bg-tertiary rounded-lg" />
          <div className="h-20 w-full bg-tertiary rounded-lg" />
        </div>
      </div>
    </div>
  );
}
