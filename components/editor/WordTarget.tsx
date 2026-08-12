export function WordTarget({ wordCount, delta }: { wordCount: number; delta: number | null }) {
  return (
    <>
      <span>{wordCount} words</span>
      {delta !== null ? <span>{delta >= 0 ? `${delta} remaining` : `${Math.abs(delta)} over target`}</span> : <span>No target</span>}
    </>
  );
}
