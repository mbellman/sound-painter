import { clamp, isDecimal, lerp, sort } from '../utilities';
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
  default: number | number[];
};

/**
 * @internal
 */
type ChangeHandler = (value: number) => void;

/**
 * @todo extends Widget
 */
export default class Slider {
  private element: HTMLElement;
  private $handles: HTMLElement[] = [];
  private $bar: HTMLElement;
  private values: number[] = [ 0 ];

  constructor(options: SliderOptions) {
    this.element = document.createElement('div');

    this.element.innerHTML = `
      <div class="slider--label">
        ${options.label}
      </div>
      <div class="slider--bar">
        ${Array.isArray(options.default)
          ? options.default.map(() => '<div class="slider--handle"></div>').join('')
          : '<div class="slider--handle"></div>'
        }
      </div>
    `;

    this.$bar = this.element.querySelector('.slider--bar');
    this.$handles = [].slice.call(this.element.querySelectorAll('.slider--handle'));

    this.element.classList.add('slider');
    
    this.initialize(options);

    document.body.appendChild(this.element);
  }

  public getValue(): number {
    return this.values[0];
  }

  public getValues(): number[] {
    return this.values;
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

    this.values = Array.isArray(options.default) ? options.default : [ options.default ];

    const isDecimalSlider = isDecimal(options.range[0]) || isDecimal(options.range[1]);

    const valueRatio = value =>
      (value - options.range[0]) / (options.range[1] - options.range[0]);

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

    const updateBarColor = () => {
      if (this.values.length > 1) {
        // @todo graph the emphasis distribution instead of using
        // a linear gradient, which doesn't correctly represent
        // the sum at each point
        const stops = sort(this.values)
          .reverse()
          .map(value => 100 - Math.round(valueRatio(value) * 100))
          .map((percent, index, percentages) => {
            const nextPercent = percentages[index + 1] || 100;
            const nextMidStop = (percent + nextPercent) / 2;

            return `#05a ${percent}%, #012 ${nextMidStop}%`;
          })
          .join(', ');

        this.$bar.style.background = `linear-gradient(#012 0%, ${stops})`;
      } else {
        const valuePercent = Math.round(valueRatio(this.values[0]) * 100);

        this.$bar.style.background = `linear-gradient(to right, #05a 0%, #05a ${valuePercent}%, #333 ${valuePercent + 1}%, #333 100%)`;
      }
    };

    const normalizeValue = value =>
      isDecimalSlider ? value : Math.round(value);

    this.values.forEach((value, index) => {
      const offsetProperty = options.orientation === 'vertical' ? 'top' : 'left';

      const offset = options.orientation === 'vertical'
        ? 100 - valueRatio(value) * 100
        : valueRatio(value) * 100;

      this.$handles[index].style[offsetProperty] = `${offset}%`;
    });

    updateDimensions();
    updateBarColor();

    window.addEventListener('resize', updateDimensions);

    this.$handles.forEach(($handle, index) => {
      this.drag($handle, e => {
        if (options.orientation === 'vertical') {
          const y = e.clientY;
          const clampedY = clamp(y, this.getBarTop(), this.getBarTop() + this.getBarHeight());
          const ratio = (clampedY - this.getBarTop()) / this.getBarHeight();
  
          this.values[index] = normalizeValue(lerp(options.range[1], options.range[0], ratio));
          this.$handles[index].style.top = `${ratio * 100}%`;
        } else {
          const x = e.clientX;
          const clampedX = clamp(x, this.getBarLeft(), this.getBarLeft() + this.getBarWidth());
          const ratio = (clampedX - this.getBarLeft()) / this.getBarWidth();
  
          this.values[index] = normalizeValue(lerp(options.range[0], options.range[1], ratio));
          this.$handles[index].style.left = `${ratio * 100}%`;
        }

        updateBarColor();
      });
    });
  }
}