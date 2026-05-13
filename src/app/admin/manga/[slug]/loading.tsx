export default function AdminMangaDetailLoading() {
  return (
    <div className="animate-pulse p-6">
      <div className="h-8 w-48 bg-tertiary rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-tertiary rounded-lg" />
        ))}
      </div>
      <div className="h-32 bg-tertiary rounded-lg mt-6" />
    </div>
  );
}
