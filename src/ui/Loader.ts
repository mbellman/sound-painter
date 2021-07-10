import Widget from './Widget';
import './Loader.scss';

export default class Loader extends Widget {
  public hide(): void {
    this.element.classList.add('hidden');
  }

  public show(): void {
    this.element.classList.remove('hidden');
  }

  protected initialize(): void {
    this.hide();
  }

  protected template(): string {
    return `
      <div class="loader">
        <div class="loader--spinner"></div>
      </div>
    `;
  }
}