/**
 * @internal
 */
interface WidgetElementHelpers {
  css(property: string, value: string): void;
}

export type WidgetElement = HTMLElement & WidgetElementHelpers;

export default abstract class Widget<T = any> {
  protected element: WidgetElement;
  protected options: T;

  constructor(options?: T) {
    this.options = options;

    let root: HTMLElement = document.createElement('div');

    root.innerHTML = this.template().trim();
    root = root.firstChild as HTMLElement;
    
    document.body.appendChild(root);

    this.element = this.getAsWidgetElement(root);

    this.initialize();
  }

  protected $(selector: string): WidgetElement {
    return this.getAsWidgetElement(this.element.querySelector(selector) || null);
  }

  protected $$(selector: string): WidgetElement[] {
    return [].slice.call(this.element.querySelectorAll(selector) || [])
      .map(element => this.getAsWidgetElement(element));
  }

  protected draggable(element: WidgetElement, handler: (e: MouseEvent) => void): void {
    element.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();

      element.classList.add('mousedown');

      const onMouseMove = (e: MouseEvent) => {
        handler(e);

        e.preventDefault();
        e.stopPropagation();
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        element.classList.remove('mousedown');
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  protected abstract initialize(): void;
  protected abstract template(): string;

  private getAsWidgetElement(element: HTMLElement): WidgetElement {
    if (!element) {
      return null;
    }

    const widgetElement = element as WidgetElement;

    widgetElement.css = (property, value) => element.style[property] = value;

    return widgetElement;
  }
}