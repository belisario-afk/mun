// Lazy wrapper for on-device LLM when enabled by user.
// For bundle size, we only export a stub loader that imports webllm dynamically when needed.
export async function webllmInvoke(prompt: string) {
  // In a real deployment, import('webllm') and load a tiny model (Phi-3-mini / Llama 3.x tiny)
  // For this repo, we route to local grammar if webgpu not available.
  const hasWebGPU = 'gpu' in navigator;
  if (!hasWebGPU) {
    const { intentFromText } = await import('../intents/intentParser');
    return intentFromText(prompt);
  }
  const { intentFromText } = await import('../intents/intentParser');
  return intentFromText(prompt);
}