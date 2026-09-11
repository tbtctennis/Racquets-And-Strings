export type DrawGenerationCandidate = {
  label: string;
  playerCount: number;
  generated: boolean;
  drawSize: number;
};

export type PopulatedDrawPreview = {
  label: string;
  playerCount: number;
  drawSize: number;
};

export type DrawGenerationResult = {
  label: string;
  ok: boolean;
  error?: string;
};

export type DrawGenerationSummary = {
  generated: string[];
  failed: DrawGenerationResult[];
  retryable: string[];
};

/** A draw is eligible when it has players and no generated matches yet. */
export const isEligiblePopulatedDraw = (draw: DrawGenerationCandidate): boolean =>
  draw.playerCount > 0 && !draw.generated;

export const previewPopulatedDraws = (draws: readonly DrawGenerationCandidate[]): PopulatedDrawPreview[] =>
  draws.filter(isEligiblePopulatedDraw).map((draw) => ({
    label: draw.label,
    playerCount: draw.playerCount,
    drawSize: draw.drawSize,
  }));

/** Generate each draw independently so one failure does not roll back the others. */
export const generateDrawsSequentially = async (
  labels: readonly string[],
  generateOne: (label: string) => Promise<void>,
): Promise<DrawGenerationResult[]> => {
  const results: DrawGenerationResult[] = [];
  for (const label of labels) {
    try {
      await generateOne(label);
      results.push({ label, ok: true });
    } catch (err) {
      results.push({
        label,
        ok: false,
        error: err instanceof Error ? err.message : 'Could not generate the draw.',
      });
    }
  }
  return results;
};

export const generationSummary = (results: readonly DrawGenerationResult[]): DrawGenerationSummary => {
  const generated = results.filter((result) => result.ok).map((result) => result.label);
  const failed = results.filter((result) => !result.ok);
  return { generated, failed, retryable: failed.map((result) => result.label) };
};

export const generationMessage = (summary: DrawGenerationSummary): { type: 'success' | 'error'; text: string } => {
  if (summary.failed.length === 0) {
    const n = summary.generated.length;
    return { type: 'success', text: n === 1 ? 'Generated 1 draw.' : `Generated ${n} draws.` };
  }
  const failed = summary.failed.map((result) => result.label).join(', ');
  if (summary.generated.length === 0) {
    return { type: 'error', text: `Could not generate: ${failed}. Retry from Manage Draw.` };
  }
  return {
    type: 'error',
    text: `Generated ${summary.generated.length}. Failed: ${failed}. Retry from Manage Draw.`,
  };
};
