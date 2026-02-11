export class Langfuse {
  trace() {
    return {
      generation: () => ({
        end: () => undefined,
      }),
      update: () => undefined,
    };
  }

  async flushAsync() {
    return;
  }
}
