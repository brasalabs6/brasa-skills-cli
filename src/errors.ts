export class BrasaSkillsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrasaSkillsError";
  }
}
