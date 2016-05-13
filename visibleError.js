export default class VisibleError extends Error {
  constructor(code, name) {
    super(name);
    this.code = code;
  }
  visible() { return true; }
  toJSON() {
    return {error: this.message, code: this.code};
  }
}
