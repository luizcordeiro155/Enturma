export function Feedback({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  return (
    <>
      {error ? (
        <div className="feedback error" role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="feedback success" role="status">
          {success}
        </div>
      ) : null}
    </>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status" aria-live="polite">
      Carregando seu espaço…
    </div>
  );
}
