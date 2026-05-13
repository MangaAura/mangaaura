export default function UserProfileLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Cargando perfil">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Cargando perfil...</p>
      </div>
    </div>
  );
}
