type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

type PocketChatContext = {
  protein: string;
  targetId: string;
  selectedLigand: string;
  selectedResidue: string;
  selectedView: string;
  ligands: Array<{
    name: string;
    stage: string;
    tag: string;
    pocketFit: number;
    mutationCoverage: number;
    storyline: string;
    risk: string;
  }>;
  residues: Array<{
    label: string;
    aminoAcid: string;
    role: string;
    mutationPressure: number;
    conservation: number;
    note: string;
    ligandInsight: string;
  }>;
};

export async function askPocketCopilot(input: {
  messages: ChatMessage[];
  context: PocketChatContext;
  model?: string;
}): Promise<{ content: string; model: string }> {
  const response = await fetch('/api/gemini-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = (await response.json()) as {
    content?: string;
    error?: string;
    model?: string;
  };

  if (!response.ok || !payload.content) {
    throw new Error(payload.error || 'Gemini request failed.');
  }

  return {
    content: payload.content,
    model: payload.model || input.model || 'gemini-flash-3-preview',
  };
}
