import './Loader.scss';

export default class Loader {
  private element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');

    this.element.innerHTML = `
      <div class="loader hidden">
        <div class="loader--spinner"></div>
      </div>
    `;

    document.body.appendChild(this.element);
  }

  public hide(): void {
    this.element.querySelector('.loader').classList.add('hidden');
  }

  public show(): void {
    this.element.querySelector('.loader').classList.remove('hidden');
  }
}