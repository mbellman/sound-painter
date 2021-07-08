import { clamp, isDecimal, lerp } from '../utilities';
import './Slider.scss';

/**
 * @internal
 */
interface Position {
  x: number;
  y: number;
}

/**
 * @internal
 */
interface SliderOptions {
  label: string;
  length: () => number;
  orientation: 'horizontal' | 'vertical';
  position: () => Position;
  range: [number, number];
  default: number;
};

/**
 * @internal
 */
type ChangeHandler = (value: number) => void;

export default class Slider {
  private element: HTMLElement;
  private $handle: HTMLElement;
  private $bar: HTMLElement;
  private changeHandler: ChangeHandler;
  private value: number = 0;

  constructor(options: SliderOptions) {
    this.element = document.createElement('div');

    this.element.innerHTML = `
      <div class="slider--label">
        ${options.label}
      </div>
      <div class="slider--bar">
        <div class="slider--handle"></div>
      </div>
    `;

    this.$bar = this.element.querySelector('.slider--bar');
    this.$handle = this.element.querySelector('.slider--handle');

    this.element.classList.add('slider');
    
    this.initialize(options);

    document.body.appendChild(this.element);
  }

  public getValue(): number {
    return this.value;
  }

  public onChange(change: ChangeHandler): void {
    this.changeHandler = change;
  }

  /**
   * @todo move elsewhere
   */
  private drag(element: HTMLElement, handler: (e: MouseEvent) => void): void {
    element.addEventListener('mousedown', () => {
      const onMouseMove = (e: MouseEvent) => {
        handler(e);

        e.preventDefault();
        e.stopPropagation();
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  private getBarHeight(): number {
    return parseInt(window.getComputedStyle(this.$bar).height);
  }

  private getBarLeft(): number {
    return this.$bar.getBoundingClientRect().left;
  }

  private getBarTop(): number {
    return this.$bar.getBoundingClientRect().top;
  }

  private getBarWidth(): number {
    return this.$bar.getBoundingClientRect().width;
  }

  private initialize(options: SliderOptions): void {
    this.element.classList.add(options.orientation);

    this.value = options.default;

    const defaultRatio = (options.default - options.range[0]) / (options.range[1] - options.range[0]);
    const isDecimalSlider = isDecimal(options.range[0]) || isDecimal(options.range[1]);

    if (options.orientation === 'vertical') {
      this.$handle.style.top = `${defaultRatio * 100}%`;
    } else {
      this.$handle.style.left = `${defaultRatio * 100}%`;
    }

    const updateDimensions = () => {
      const position = options.position();
      const length = options.length();

      this.element.style.top = `${position.y}px`;
      this.element.style.left = `${position.x}px`;
  
      if (options.orientation === 'vertical') {
        this.element.style.height = `${length}px`;
      } else {
        this.element.style.width = `${length}px`;
      }
    };

    const normalizeValue = value =>
      isDecimalSlider ? value : Math.round(value);

    updateDimensions();

    window.addEventListener('resize', updateDimensions);

    this.drag(this.$handle, e => {
      if (options.orientation === 'vertical') {
        const y = e.clientY;
        const clampedY = clamp(y, this.getBarTop(), this.getBarTop() + this.getBarHeight());
        const ratio = (clampedY - this.getBarTop()) / this.getBarHeight();

        this.value = normalizeValue(lerp(options.range[1], options.range[0], ratio));
        this.$handle.style.top = `${ratio * 100}%`;
      } else {
        const x = e.clientX;
        const clampedX = clamp(x, this.getBarLeft(), this.getBarLeft() + this.getBarWidth());
        const ratio = (clampedX - this.getBarLeft()) / this.getBarWidth();

        this.value = normalizeValue(lerp(options.range[0], options.range[1], ratio));
        this.$handle.style.left = `${ratio * 100}%`;
      }
    });
  }
}